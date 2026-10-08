import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { buildTestPlan } from "./openapi.js";
import { writeGeneratedTests, writePlan } from "./generator.js";
import { redactSensitiveText } from "./redaction.js";
import { assertSafeOperationCount, assertSafeSpecDocument, assertSafeSpecSize, SPEC_LIMITS } from "./spec-safety.js";
import { approvePlan, createGuidedSession, generateApprovedPlan, recordWorkflowCancellation, revisePlanSelection, type WorkflowEvent } from "./guided-workflow.js";

const sampleSpec = resolve("examples/petstore/openapi.yaml");

test("builds a plan for a generic OpenAPI document", async () => {
  const plan = await buildTestPlan(sampleSpec);
  assert.equal(plan.specVersion, "3.0.0");
  assert.equal(plan.operations.length, 3);
  assert.equal(plan.operations.find(operation => operation.id === "listPets")?.successStatuses[0], 200);
  const listCase = plan.operations.find(operation => operation.id === "listPets")?.testCases[0];
  assert.equal(listCase?.id, "TC-LISTPETS-POS-200");
  assert.ok(listCase?.steps.some(step => step.kind === "assert-status" && step.expectedResult === "HTTP 200."));
  assert.equal(plan.operations.find(operation => operation.id === "listPets")?.parameters[0]?.valueSource, "schema-derived numeric sample");
  const notFoundCase = plan.operations.find(operation => operation.id === "showPetById")?.testCases.find(item => item.expectedStatus === 404);
  assert.equal(notFoundCase?.caseType, "negative");
  assert.equal(notFoundCase?.execution, "manual-review");
  assert.deepEqual(notFoundCase?.responseExpectation?.requiredProperties, ["code", "message"]);
  assert.ok(notFoundCase?.steps.some(step => step.expectedResult.includes('contains "message"')));
  assert.ok(notFoundCase?.steps.length);
});

test("writes a plan and keeps mutating cases opted out by default", async () => {
  const directory = await mkdtemp(join(tmpdir(), "openapi-agent-"));
  try {
    const plan = await buildTestPlan(sampleSpec);
    const planPath = join(directory, "plan.md");
    const testPath = join(directory, "api.spec.ts");
    await writePlan(plan, planPath);
    await writeGeneratedTests(plan, testPath, false);
    assert.match(await readFile(planPath, "utf8"), /POST \S+/);
    assert.match(await readFile(testPath, "utf8"), /Mutating operation excluded/);
    const generated = await readFile(testPath, "utf8");
    assert.match(generated, /test\.step/);
    assert.match(generated, /expect\(response\.status\(\)\)\.toBe\(testCase\.expectedStatus\)/);
    assert.match(generated, /api-run-diagnostic\.json/);
    assert.match(generated, /actualStatus/);
    assert.match(generated, /manual-review/);
    assert.match(await readFile(planPath, "utf8"), /Test steps/);
    assert.match(await readFile(planPath, "utf8"), /source: schema-derived numeric sample/);
    assert.match(await readFile(planPath, "utf8"), /Specification evidence:\*\* fingerprint/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("accepts Swagger 2.0 and OpenAPI 3.1 inputs", async () => {
  const directory = await mkdtemp(join(tmpdir(), "openapi-versions-"));
  try {
    const swaggerPath = join(directory, "swagger.yaml");
    const openApi31Path = join(directory, "openapi-31.yaml");
    await writeFile(swaggerPath, `swagger: "2.0"
info:
  title: Legacy API
  version: "1.0"
host: api.example.test
schemes:
  - https
basePath: /v2
paths:
  /health:
    get:
      responses:
        "200":
          description: Healthy
`);
    await writeFile(openApi31Path, `openapi: 3.1.0
info:
  title: Modern API
  version: "1.0"
paths:
  /health:
    get:
      responses:
        "200":
          description: Healthy
          content:
            application/json:
              schema:
                type: [string, "null"]
    `);

    const swaggerPlan = await buildTestPlan(swaggerPath);
    const openApi31Plan = await buildTestPlan(openApi31Path);
    assert.equal(swaggerPlan.specVersion, "2.0");
    assert.equal(swaggerPlan.baseUrl, "https://api.example.test/v2");
    assert.equal(openApi31Plan.specVersion, "3.1.0");
    assert.equal(openApi31Plan.operations.length, 1);
    assert.deepEqual(openApi31Plan.operations[0]?.responseExpectations[0]?.schema?.type, ["string", "null"]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("uses OpenAPI defaults, enums, named examples, and request-body examples", async () => {
  const directory = await mkdtemp(join(tmpdir(), "openapi-samples-"));
  try {
    const specPath = join(directory, "samples.yaml");
    await writeFile(specPath, `openapi: 3.0.3
info:
  title: Sample precedence API
  version: "1.0"
servers:
  - url: https://api.example.test/v1
paths:
  /records/{recordId}:
    post:
      operationId: updateRecord
      parameters:
        - name: recordId
          in: path
          required: true
          schema:
            type: string
            default: record-default
        - name: state
          in: query
          schema:
            type: string
            enum: [ready, pending]
        - name: trace
          in: header
          examples:
            sample:
              value: trace-example
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            examples:
              update:
                value:
                  displayName: named-example
      responses:
        "200":
          description: Updated
        "204":
          description: Updated without a body
        "422":
          description: Invalid entity
          content:
            application/json:
              schema:
                type: object
                required: [code]
                properties:
                  code:
                    type: integer
`);

    const plan = await buildTestPlan(specPath);
    const operation = plan.operations[0];
    assert.ok(operation);
    assert.equal(operation.parameters[0]?.value, "record-default");
    assert.equal(operation.parameters[0]?.valueSource, "schema default");
    assert.equal(operation.parameters[1]?.value, "ready");
    assert.equal(operation.parameters[1]?.valueSource, "first schema enum value");
    assert.equal(operation.parameters[2]?.value, "trace-example");
    assert.equal(operation.parameters[2]?.valueSource, "first named parameter example");
    assert.deepEqual(operation.body, { displayName: "named-example" });
    assert.equal(operation.bodySource, "first named request media example");
    assert.deepEqual(operation.successStatuses, [200, 204]);
    assert.deepEqual(operation.documentedErrorResponses.map(response => response.status), [422]);
    assert.deepEqual(operation.testCases.map(testCase => testCase.expectedStatus), [200, 204, 422]);
    assert.equal(operation.testCases[2]?.responseExpectation?.requiredProperties[0], "code");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("surfaces unsupported complex parameter serialization and supported API-key configuration", async () => {
  const directory = await mkdtemp(join(tmpdir(), "openapi-review-"));
  try {
    const specPath = join(directory, "review.yaml");
    await writeFile(specPath, `openapi: 3.0.3
info:
  title: Review API
  version: "1.0"
servers:
  - url: https://api.example.test
security:
  - clientKey: []
paths:
  /search:
    get:
      operationId: searchRecords
      parameters:
        - name: filters
          in: query
          style: deepObject
          explode: true
          schema:
            type: array
            items:
              type: string
              enum: [active, archived]
        - name: session
          in: cookie
          schema:
            type: string
            example: session-value
        - name: reserved
          in: query
          allowReserved: true
          schema:
            type: string
            example: "a/b"
      responses:
        "200":
          description: Search results
  /health:
    get:
      operationId: getHealth
      responses:
        "200":
          description: Healthy
components:
  securitySchemes:
    clientKey:
      type: apiKey
      in: header
      name: X-Client-Key
`);

    const plan = await buildTestPlan(specPath);
    const operation = plan.operations[0];
    assert.ok(operation);
    assert.equal(operation.security[0]?.type, "apiKey");
    assert.equal(operation.security[0]?.name, "clientKey");
    assert.ok(operation.warnings.some(warning => warning.includes("unsupported query serialization")));
    assert.equal(operation.parameters[0]?.serializationSupported, false);
    assert.ok(operation.warnings.some(warning => warning.includes("Cookie parameter")));
    assert.equal(operation.parameters[2]?.serializationSupported, false);

    const generatedPath = join(directory, "generated.spec.ts");
    await writeGeneratedTests(plan, generatedPath, false);
    const generated = await readFile(generatedPath, "utf8");
    assert.match(generated, /API_KEY_\$\{suffix\}/);
    assert.match(generated, /X-Client-Key/);
    assert.match(generated, /test\.skip\(testCase\.warnings\.length > 0/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("serializes supported OpenAPI query, path, and header parameter shapes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "openapi-serialization-"));
  try {
    const specPath = join(directory, "serialization.yaml");
    await writeFile(specPath, `openapi: 3.0.3
info:
  title: Serialization API
  version: "1.0"
servers:
  - url: https://api.example.test
paths:
  /records/{recordId}:
    get:
      operationId: getRecord
      parameters:
        - name: recordId
          in: path
          required: true
          schema:
            type: string
            example: record-1
        - name: labels
          in: query
          schema:
            type: array
            items:
              type: string
              enum: [red, blue]
        - name: filter
          in: query
          style: deepObject
          explode: true
          schema:
            type: object
            properties:
              active:
                type: boolean
                example: true
        - name: X-Fields
          in: header
          schema:
            type: array
            items:
              type: string
              enum: [id, name]
      responses:
        "200":
          description: Found
`);

    const plan = await buildTestPlan(specPath);
    const operation = plan.operations[0];
    assert.ok(operation);
    assert.deepEqual(operation.warnings, []);
    assert.deepEqual(operation.parameters.map(parameter => [parameter.name, parameter.style, parameter.explode, parameter.serializationSupported]), [
      ["recordId", "simple", false, true],
      ["labels", "form", true, true],
      ["filter", "deepObject", true, true],
      ["X-Fields", "simple", false, true]
    ]);
    const outputPath = join(directory, "serialization.spec.ts");
    await writeGeneratedTests(plan, outputPath, false);
    const generated = await readFile(outputPath, "utf8");
    assert.match(generated, /return value\.map\(item => \[parameter\.name, String\(item\)\]\)/);
    assert.match(generated, /`\$\{parameter\.name\}\[\$\{key\}\]`/);
    assert.match(generated, /value\.map\(String\)\.join\(","\)/);
    assert.match(generated, /serializeHeaderValue\(parameter\)/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("plans nested response type, enum, range, length, and array-item assertions", async () => {
  const directory = await mkdtemp(join(tmpdir(), "openapi-schema-"));
  try {
    const specPath = join(directory, "schema.yaml");
    await writeFile(specPath, `openapi: 3.0.3
info:
  title: Nested schema API
  version: "1.0"
paths:
  /items:
    get:
      operationId: listItems
      responses:
        "200":
          description: Items
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  required: [id, detail]
                  properties:
                    id:
                      type: integer
                      minimum: 1
                      maximum: 10
                    detail:
                      type: object
                      required: [state, label]
                      properties:
                        state:
                          type: string
                          enum: [ready, pending]
                        label:
                          type: string
                          minLength: 2
                          maxLength: 8
`);

    const plan = await buildTestPlan(specPath);
    const expectation = plan.operations[0]?.responseExpectations[0];
    assert.equal(expectation?.schema?.type, "array");
    assert.equal(expectation?.schema?.items?.type, "object");
    assert.deepEqual(expectation?.schema?.items?.requiredProperties.map(property => property.name), ["id", "detail"]);
    assert.deepEqual(expectation?.schema?.items?.requiredProperties[1]?.schema?.requiredProperties[0]?.schema?.enum, ["ready", "pending"]);
    assert.equal(expectation?.schema?.items?.requiredProperties[1]?.schema?.requiredProperties[1]?.schema?.minLength, 2);

    const outputPath = join(directory, "schema.spec.ts");
    await writeGeneratedTests(plan, outputPath, false);
    const generated = await readFile(outputPath, "utf8");
    assert.match(generated, /Number\.isInteger\(value\)/);
    assert.match(generated, /toBeGreaterThanOrEqual\(schema\.minimum\)/);
    assert.match(generated, /toBeLessThanOrEqual\(schema\.maxLength\)/);
    assert.match(generated, /expect\(schema\.enum, location\)\.toContainEqual\(value\)/);
    assert.match(generated, /assertResponseSchema\(item, itemSchema/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("rejects external references and enforces specification resource limits", async () => {
  const directory = await mkdtemp(join(tmpdir(), "openapi-safety-"));
  try {
    const remoteSpecPath = join(directory, "remote-ref.yaml");
    const localSpecPath = join(directory, "local-ref.yaml");
    const baseSpec = `openapi: 3.0.3
info:
  title: External reference API
  version: "1.0"
paths:
  /health:
    get:
      responses:
        "200":
          $ref: REFERENCE
`;
    await writeFile(remoteSpecPath, baseSpec.replace("REFERENCE", "https://example.test/response.yaml"));
    await writeFile(localSpecPath, baseSpec.replace("REFERENCE", "./response.yaml"));
    await assert.rejects(buildTestPlan(remoteSpecPath), /External \$ref values are disabled/);
    await assert.rejects(buildTestPlan(localSpecPath), /External \$ref values are disabled/);
    assert.doesNotThrow(() => assertSafeSpecSize(SPEC_LIMITS.bytes));
    assert.throws(() => assertSafeSpecSize(SPEC_LIMITS.bytes + 1), /input limit/);

    const depthBoundary: Record<string, unknown> = {};
    let boundaryCursor = depthBoundary;
    for (let index = 0; index < SPEC_LIMITS.depth; index += 1) {
      const child: Record<string, unknown> = {};
      boundaryCursor.child = child;
      boundaryCursor = child;
    }
    assert.doesNotThrow(() => assertSafeSpecDocument(depthBoundary));
    const deeplyNested: Record<string, unknown> = {};
    let current = deeplyNested;
    for (let index = 0; index < SPEC_LIMITS.depth + 1; index += 1) {
      const child: Record<string, unknown> = {};
      current.child = child;
      current = child;
    }
    assert.throws(() => assertSafeSpecDocument(deeplyNested), /nesting limit/);

    const referenceBoundary = Array.from({ length: SPEC_LIMITS.references }, () => ({ $ref: "#/components/schemas/Item" }));
    assert.doesNotThrow(() => assertSafeSpecDocument(referenceBoundary));
    referenceBoundary.push({ $ref: "#/components/schemas/Overflow" });
    assert.throws(() => assertSafeSpecDocument(referenceBoundary), /reference-count limit/);

    assert.doesNotThrow(() => assertSafeSpecDocument(Array(SPEC_LIMITS.documentNodes - 1).fill(null)));
    assert.throws(() => assertSafeSpecDocument(Array(SPEC_LIMITS.documentNodes).fill(null)), /complexity limit/);
    assert.doesNotThrow(() => assertSafeOperationCount(SPEC_LIMITS.operations));
    assert.throws(() => assertSafeOperationCount(SPEC_LIMITS.operations + 1), /operation limit/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("redacts configured credentials and credential-shaped values", () => {
  assert.equal(
    redactSensitiveText("Authorization: Bearer abc123 api_key=xyz987", ["abc123"]),
    "Authorization: [REDACTED] [REDACTED] api_key=[REDACTED]"
  );
  assert.equal(redactSensitiveText("failed value", ["failed"]), "[REDACTED] value");
});

test("guided plan approval is revision-bound and generation includes only selected cases", async () => {
  const directory = await mkdtemp(join(tmpdir(), "openapi-guided-"));
  const events: WorkflowEvent[] = [];
  try {
    const session = await createGuidedSession(sampleSpec, "Review read-only operations", async event => {
      events.push(event);
    });
    const cases = session.plan.operations.flatMap(operation => operation.testCases);
    const firstCase = cases[0];
    const secondCase = cases[1];
    assert.ok(firstCase);
    assert.ok(secondCase);
    assert.equal(firstCase.evidence[0]?.specFingerprint, session.plan.specFingerprint);
    assert.equal(firstCase.evidence[1]?.pointer, "/paths/~1pets/get/responses/200");
    await assert.rejects(revisePlanSelection(session, 0, [firstCase.id]), /Stale plan revision/);
    await assert.rejects(revisePlanSelection(session, 1, ["unknown-case"]), /Unknown case ID/);
    await assert.rejects(revisePlanSelection(session, 1, [firstCase.id, firstCase.id]), /duplicate/);

    const revision = await revisePlanSelection(session, 1, [firstCase.id]);
    assert.equal(revision, 2);
    await assert.rejects(approvePlan(session, 1, [firstCase.id]), /stale plan revision/);
    const approval = await approvePlan(session, revision, [firstCase.id]);
    const changedRevision = await revisePlanSelection(session, revision, [secondCase.id]);
    assert.equal(changedRevision, 3);
    await assert.rejects(generateApprovedPlan(session, approval.token, join(directory, "stale.spec.ts")), /approval/);
    await assert.rejects(approvePlan(session, changedRevision, []), /at least one case/);

    const currentApproval = await approvePlan(session, changedRevision, [secondCase.id]);
    const outputPath = join(directory, "approved.spec.ts");
    const generated = await generateApprovedPlan(session, currentApproval.token, outputPath);
    const source = await readFile(outputPath, "utf8");
    assert.deepEqual(generated.caseIds, [secondCase.id]);
    assert.match(source, new RegExp(secondCase.id));
    assert.doesNotMatch(source, new RegExp(firstCase.id));
    const blockedOutputPath = join(directory, "blocked-output");
    await mkdir(blockedOutputPath);
    await assert.rejects(generateApprovedPlan(session, currentApproval.token, blockedOutputPath));
    const eventNames = events.map(event => event.event);
    assert.deepEqual(eventNames, [
      "spec_inspected",
      "plan_prepared",
      "tool_failed",
      "tool_failed",
      "tool_failed",
      "case_selection_changed",
      "tool_failed",
      "plan_approved",
      "approval_invalidated",
      "case_selection_changed",
      "tool_failed",
      "tool_failed",
      "plan_approved",
      "tests_generated",
      "tool_failed"
    ]);
    assert.ok(events.every(event => event.outcome === "success" || event.outcome === "failed"));
    assert.ok(!JSON.stringify(events).includes(currentApproval.token), "audit events must not contain the approval token");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("guided workflow surfaces audit sink failures", async () => {
  await assert.rejects(
    createGuidedSession(sampleSpec, undefined, async () => {
      throw new Error("audit sink unavailable");
    }),
    /audit sink unavailable/
  );
});

test("guided CLI generates only explicitly approved cases and audits cancellation", async () => {
  const directory = await mkdtemp(join(tmpdir(), "openapi-guided-cli-"));
  try {
    const outputPath = join(directory, "approved.spec.ts");
    const auditPath = join(directory, "guided.jsonl");
    const cases = (await buildTestPlan(sampleSpec)).operations.flatMap(operation => operation.testCases);
    const selectedCase = cases[0];
    assert.ok(selectedCase);
    const result = await runGuidedCli([
      "--spec", sampleSpec,
      "--objective", "Review one candidate",
      "--out", outputPath,
      "--audit", auditPath
    ], `${selectedCase.id}\nAPPROVE\n`);
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /No API requests were sent/);
    const generatedSource = await readFile(outputPath, "utf8");
    assert.match(generatedSource, new RegExp(selectedCase.id));
    for (const testCase of cases.filter(item => item.id !== selectedCase.id)) {
      assert.doesNotMatch(generatedSource, new RegExp(testCase.id));
    }
    const events = (await readFile(auditPath, "utf8")).trim().split("\n").map(line => JSON.parse(line) as WorkflowEvent);
    assert.ok(events.some(event => event.event === "plan_approved" && event.planRevision === 2));
    assert.ok(events.some(event => event.event === "tests_generated" && event.caseIds?.length === 1));
    assert.ok(events.every(event => !JSON.stringify(event).includes("approvalToken")));

    const eofOutputPath = join(directory, "eof.spec.ts");
    const eofAuditPath = join(directory, "eof.jsonl");
    const eofResult = await runGuidedCli([
      "--spec", sampleSpec,
      "--out", eofOutputPath,
      "--audit", eofAuditPath
    ], "\n");
    assert.equal(eofResult.code, 0, eofResult.stderr);
    assert.match(eofResult.stdout, /Review cancelled/);
    await assert.rejects(readFile(eofOutputPath, "utf8"), { code: "ENOENT" });
    const eofEvents = (await readFile(eofAuditPath, "utf8")).trim().split("\n")
      .map(line => JSON.parse(line) as WorkflowEvent);
    assert.equal(eofEvents.at(-1)?.event, "cancelled");

    const cancellationEvents: WorkflowEvent[] = [];
    const session = await createGuidedSession(sampleSpec, undefined, async event => {
      cancellationEvents.push(event);
    });
    await recordWorkflowCancellation(session);
    assert.equal(cancellationEvents.at(-1)?.event, "cancelled");
    assert.equal(session.approval, undefined);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

function runGuidedCli(args: string[], input: string): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, [resolve("node_modules/tsx/dist/cli.mjs"), "src/cli.ts", "guide", ...args], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", chunk => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", chunk => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", code => resolveRun({ code, stdout, stderr }));
    child.stdin.end(input);
  });
}
