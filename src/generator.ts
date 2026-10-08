import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { TestPlan } from "./model.js";

function testSource(plan: TestPlan, includeMutating: boolean): string {
  const serialized = JSON.stringify(plan.operations.flatMap(operation => operation.testCases), null, 2);
  const baseUrl = plan.baseUrl ? JSON.stringify(plan.baseUrl) : "undefined";
  return `import { test, expect } from "@playwright/test";
import type { APIResponse, TestInfo } from "@playwright/test";

type GeneratedCase = {
  id: string;
  title: string;
  caseType: "positive" | "negative" | "manual-review";
  execution: "automated" | "manual-review";
  mutating: boolean;
  method: string;
  path: string;
  summary: string;
  preconditions: string[];
  parameters: Array<{
    name: string;
    in: string;
    value: unknown;
    required: boolean;
    valueSource: string;
    style: string;
    explode: boolean;
    serializationSupported: boolean;
  }>;
  body?: unknown;
  bodyContentType?: string;
  expectedStatus?: number;
  responseExpectation?: {
    status: number;
    contentType?: string;
    requiredProperties: string[];
    arrayItemRequiredProperties: string[];
    schema?: SchemaExpectation;
  };
  security: Array<
    | { name: string; type: "bearer" | "basic" | "oauth2" }
    | { name: string; type: "apiKey"; parameterName: string; parameterIn: "header" | "query" | "cookie" }
  >;
  steps: Array<{
    kind: string;
    action: string;
    expectedResult: string;
  }>;
  warnings: string[];
};

type SchemaExpectation = {
  type?: string | string[];
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  requiredProperties: Array<{ name: string; schema?: SchemaExpectation }>;
  items?: SchemaExpectation;
};

const cases = ${serialized} as GeneratedCase[];
const defaultBaseUrl: string | undefined = ${baseUrl};
const includeMutating = ${includeMutating} && process.env.INCLUDE_MUTATING === "true";

function resolvePath(path: string, parameters: readonly { name: string; in: string; value: unknown }[]): string {
  let resolved = path;
  for (const parameter of parameters) {
    if (parameter.in === "path") {
      const value = Array.isArray(parameter.value)
        ? parameter.value.map(item => encodeURIComponent(String(item))).join(",")
        : encodeURIComponent(String(parameter.value));
      resolved = resolved.replace(\`{\${parameter.name}}\`, value);
    }
  }
  return resolved;
}

function serializeQueryParameter(parameter: GeneratedCase["parameters"][number]): Array<[string, string]> {
  const value = parameter.value;
  if (Array.isArray(value)) {
    if (parameter.style === "form" && parameter.explode) {
      return value.map(item => [parameter.name, String(item)]);
    }
    const delimiter = parameter.style === "spaceDelimited" ? " " : parameter.style === "pipeDelimited" ? "|" : ",";
    return [[parameter.name, value.map(String).join(delimiter)]];
  }
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (parameter.style === "deepObject") {
      return entries.map(([key, item]) => [\`\${parameter.name}[\${key}]\`, String(item)]);
    }
    if (parameter.style === "form" && parameter.explode) {
      return entries.map(([key, item]) => [key, String(item)]);
    }
    return [[parameter.name, entries.flatMap(([key, item]) => [key, String(item)]).join(",")]];
  }
  return [[parameter.name, String(value)]];
}

function serializeHeaderValue(parameter: GeneratedCase["parameters"][number]): string {
  const value = parameter.value;
  if (Array.isArray(value)) return value.map(String).join(",");
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);
    return parameter.explode
      ? entries.map(([key, item]) => \`\${key}=\${String(item)}\`).join(",")
      : entries.flatMap(([key, item]) => [key, String(item)]).join(",");
  }
  return String(value);
}

function matchesSchemaType(value: unknown, type: string): boolean {
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  if (type === "array") return Array.isArray(value);
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "null") return value === null;
  return typeof value === type;
}

function assertResponseSchema(value: unknown, schema: SchemaExpectation, location = "response"): void {
  const types = schema.type === undefined ? [] : Array.isArray(schema.type) ? schema.type : [schema.type];
  if (types.length > 0) expect(types.some(type => matchesSchemaType(value, type)), location).toBe(true);
  if (schema.enum) expect(schema.enum, location).toContainEqual(value);
  if (value === null) return;
  if (typeof value === "number") {
    if (schema.minimum !== undefined) expect(value, location).toBeGreaterThanOrEqual(schema.minimum);
    if (schema.maximum !== undefined) expect(value, location).toBeLessThanOrEqual(schema.maximum);
  }
  if (typeof value === "string") {
    if (schema.minLength !== undefined) expect(value.length, location).toBeGreaterThanOrEqual(schema.minLength);
    if (schema.maxLength !== undefined) expect(value.length, location).toBeLessThanOrEqual(schema.maxLength);
  }
  for (const property of schema.requiredProperties) {
    expect(value, location).toHaveProperty(property.name);
    if (property.schema && value !== null && typeof value === "object") {
      assertResponseSchema((value as Record<string, unknown>)[property.name], property.schema, \`\${location}.\${property.name}\`);
    }
  }
  if (schema.items && Array.isArray(value)) {
    const itemSchema = schema.items;
    value.forEach((item, index) => assertResponseSchema(item, itemSchema, \`\${location}[\${index}]\`));
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(\`Missing required authentication environment variable: \${name}\`);
  return value;
}

async function attachDiagnostic(
  testInfo: TestInfo,
  testCase: GeneratedCase,
  stepKind: string,
  code: string,
  message: string,
  actualStatus?: number
): Promise<void> {
  await testInfo.attach("api-run-diagnostic.json", {
    body: Buffer.from(JSON.stringify({
      caseId: testCase.id,
      method: testCase.method.toUpperCase(),
      pathTemplate: testCase.path,
      stepKind,
      ...(testCase.expectedStatus === undefined ? {} : { expectedStatus: testCase.expectedStatus }),
      ...(actualStatus === undefined ? {} : { actualStatus }),
      code,
      message
    })),
    contentType: "application/json"
  });
}

for (const testCase of cases) {
  test(\`\${testCase.id}: \${testCase.title}\`, async ({ request }, testInfo) => {
    test.skip(testCase.execution !== "automated", testCase.warnings.join(" ") || "This case requires review before automation.");
    test.skip(testCase.warnings.length > 0, testCase.warnings.join(" "));
    test.skip(testCase.mutating && !includeMutating, "Mutating operation excluded. Regenerate with --include-mutating after reviewing its effects.");

    let url: URL | undefined;
    const headers: Record<string, string> = {};
    const cookies: string[] = [];
    let response: APIResponse | undefined;
    let activeStepKind = "test-setup";

    try {
      for (const [index, step] of testCase.steps.entries()) {
        activeStepKind = step.kind;
        await test.step(\`\${index + 1}. \${step.action}\`, async () => {
          if (step.kind === "prepare-url") {
            const baseUrl = process.env.API_BASE_URL ?? defaultBaseUrl;
            if (!baseUrl) throw new Error("No server URL found in the spec. Set API_BASE_URL before running tests.");
            const resolvedPath = resolvePath(testCase.path, testCase.parameters);
            const relativePath = resolvedPath.startsWith("/") ? resolvedPath.slice(1) : resolvedPath;
            url = new URL(relativePath, baseUrl.endsWith("/") ? baseUrl : \`\${baseUrl}/\`);
            for (const parameter of testCase.parameters) {
              if (parameter.in !== "query") continue;
              for (const [name, value] of serializeQueryParameter(parameter)) url.searchParams.append(name, value);
            }
          } else if (step.kind === "prepare-headers") {
            for (const parameter of testCase.parameters) {
              if (parameter.in === "header") headers[parameter.name] = serializeHeaderValue(parameter);
            }
            for (const credential of testCase.security) {
              const suffix = credential.name.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
              if (credential.type === "bearer") {
                headers.authorization = ["Bearer", requiredEnv("API_BEARER_TOKEN")].join(" ");
              } else if (credential.type === "oauth2") {
                headers.authorization = ["Bearer", requiredEnv("API_OAUTH_TOKEN")].join(" ");
              } else if (credential.type === "basic") {
                const username = requiredEnv("API_USERNAME");
                const password = requiredEnv("API_PASSWORD");
                headers.authorization = ["Basic", Buffer.from(\`\${username}:\${password}\`).toString("base64")].join(" ");
              } else if (credential.type === "apiKey") {
                const value = requiredEnv(\`API_KEY_\${suffix}\`);
                if (credential.parameterIn === "header") headers[credential.parameterName] = value;
                else if (credential.parameterIn === "query") {
                  if (!url) throw new Error("Request URL must be prepared before adding query authentication.");
                  url.searchParams.append(credential.parameterName, value);
                } else if (credential.parameterIn === "cookie") {
                  cookies.push(\`\${credential.parameterName}=\${value}\`);
                }
              }
            }
            if (cookies.length > 0) headers.cookie = cookies.join("; ");
            if (testCase.bodyContentType) headers["content-type"] = testCase.bodyContentType;
          } else if (step.kind === "send-request") {
            if (!url) throw new Error("Request URL was not prepared.");
            response = await request.fetch(url.toString(), {
              method: testCase.method.toUpperCase(),
              headers,
              ...(testCase.body === undefined ? {} : { data: JSON.stringify(testCase.body) })
            });
          } else if (step.kind === "assert-status") {
            if (!response || testCase.expectedStatus === undefined) throw new Error("Response status cannot be checked.");
            expect(response.status()).toBe(testCase.expectedStatus);
          } else if (step.kind === "assert-content-type") {
            if (!response || !testCase.responseExpectation?.contentType) throw new Error("Response content type cannot be checked.");
            expect(response.headers()["content-type"]).toContain(testCase.responseExpectation.contentType);
          } else if (step.kind === "assert-response-schema") {
            if (!response || !testCase.responseExpectation) throw new Error("Response schema cannot be checked.");
            const responseSize = Number(response.headers()["content-length"]);
            if (Number.isFinite(responseSize) && responseSize > 5 * 1024 * 1024) {
              throw new Error("Response Content-Length exceeds the configured JSON assertion limit.");
            }
            const expectation = testCase.responseExpectation;
            const payload: unknown = await response.json();
            if (expectation.schema) assertResponseSchema(payload, expectation.schema);
            for (const name of expectation.requiredProperties) expect(payload).toHaveProperty(name);
            if (expectation.arrayItemRequiredProperties.length > 0) {
              expect(Array.isArray(payload)).toBe(true);
              for (const item of payload as unknown[]) {
                for (const name of expectation.arrayItemRequiredProperties) expect(item).toHaveProperty(name);
              }
            }
          } else {
            throw new Error(\`Unsupported automated test step: \${step.kind}\`);
          }
        });
      }
      await attachDiagnostic(testInfo, testCase, activeStepKind, "passed", "API test passed.", response?.status());
    } catch (error) {
      const actualStatus = response?.status();
      const isStatusMismatch = activeStepKind === "assert-status"
        && actualStatus !== undefined
        && testCase.expectedStatus !== undefined
        && actualStatus !== testCase.expectedStatus;
      const isMissingCredential = activeStepKind === "prepare-headers"
        && error instanceof Error
        && error.message.startsWith("Missing required authentication environment variable:");
      const code = isStatusMismatch
        ? "status-mismatch"
        : isMissingCredential
          ? "missing-credentials"
          : activeStepKind === "send-request"
            ? "request-failed"
            : activeStepKind === "assert-response-schema" && error instanceof Error && error.message.includes("Content-Length")
              ? "response-too-large"
              : "assertion-failed";
      const message = isStatusMismatch
        ? \`Expected HTTP \${testCase.expectedStatus}; received HTTP \${actualStatus}.\`
        : isMissingCredential
          ? "A required authentication environment variable is not set."
          : code === "request-failed"
            ? "No HTTP response was received; check the authorized target and network/TLS settings."
            : code === "response-too-large"
              ? "Response Content-Length exceeds the 5 MiB JSON assertion limit."
              : \`The API test failed during the \${activeStepKind} step.\`;
      await attachDiagnostic(testInfo, testCase, activeStepKind, code, message, actualStatus);
      throw new Error(message);
    }
  });
}
`;
}

function markdownPlan(plan: TestPlan): string {
  const cases = plan.operations.flatMap(operation => operation.testCases);
  const lines = [
    `# API test plan: ${plan.title}`,
    "",
    `- **API version:** ${plan.version}`,
    `- **Specification:** ${plan.specVersion}`,
    `- **Default server:** ${plan.baseUrl ?? "Not declared; set API_BASE_URL"}`,
    `- **Operations:** ${plan.operations.length}`,
    `- **Test cases:** ${cases.length} (${cases.filter(item => item.execution === "automated").length} automated candidates, ${cases.filter(item => item.execution === "manual-review").length} review required)`,
    "",
    "> Generated cases are contract-based starting points. Review sample values, preconditions, and warnings before execution. Mutating operations require explicit opt-in; manual-review cases are reported but not automated.",
    ""
  ];

  for (const operation of plan.operations) {
    lines.push(`## ${operation.method.toUpperCase()} ${operation.path}`);
    lines.push("", operation.summary, "");
    lines.push(`- Operation ID: \`${operation.id}\``);
    lines.push(`- Category: ${operation.mutating ? "Mutating" : "Read-only"}`);
    if (operation.parameters.length > 0) {
      lines.push("- Request parameters:");
      for (const parameter of operation.parameters) {
        lines.push(`  - ${parameter.in} \`${parameter.name}\`${parameter.required ? " (required)" : " (optional)"}: \`${JSON.stringify(parameter.value)}\` — source: ${parameter.valueSource}; style: \`${parameter.style}\`, explode: \`${parameter.explode}\`, serialization: ${parameter.serializationSupported ? "supported" : "review required"}.`);
      }
    }
    if (operation.body !== undefined) {
      lines.push(`- Request body (\`${operation.bodyContentType ?? "unspecified"}\`): \`${JSON.stringify(operation.body)}\` — source: ${operation.bodySource ?? "unknown"}.`);
    }
    if (operation.security.length > 0) {
      lines.push(`- Authentication: ${operation.security.map(scheme => `${scheme.name} (${scheme.type})`).join(", ")}.`);
    }
    lines.push("");

    for (const testCase of operation.testCases) {
      lines.push(`### ${testCase.id}: ${testCase.title}`);
      lines.push("");
      lines.push(`- **Case type:** ${testCase.caseType}`);
      lines.push(`- **Automation status:** ${testCase.execution === "automated" ? "automated candidate" : "manual review"}`);
      lines.push(`- **Risk:** ${testCase.mutating ? "Mutating; isolated environment and explicit opt-in required" : "Read-only"}`);
      if (testCase.expectedStatus !== undefined) lines.push(`- **Expected status:** HTTP ${testCase.expectedStatus}`);
      if (testCase.preconditions.length > 0) {
        lines.push("- **Preconditions:**");
        for (const precondition of testCase.preconditions) lines.push(`  - ${precondition}`);
      }
      lines.push("- **Test steps:**");
      for (const [index, step] of testCase.steps.entries()) {
        lines.push(`  ${index + 1}. ${step.action}`);
        lines.push(`     - Expected: ${step.expectedResult}`);
      }
      if (testCase.warnings.length > 0) {
        lines.push("- **Assumptions / review notes:**");
        for (const warning of testCase.warnings) lines.push(`  - ${warning}`);
      }
      lines.push("");
    }
  }
  return `${lines.join("\n")}\n`;
}

export async function writeGeneratedTests(
  plan: TestPlan,
  outputPath: string,
  includeMutating: boolean
): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, testSource(plan, includeMutating), "utf8");
}

export async function writePlan(plan: TestPlan, outputPath: string): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, markdownPlan(plan), "utf8");
}
