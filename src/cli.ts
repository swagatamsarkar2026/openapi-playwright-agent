#!/usr/bin/env node
import { Command } from "commander";
import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import type { Writable } from "node:stream";
import { approvePlan, createGuidedSession, createJsonlAuditSink, generateApprovedPlan, recordWorkflowCancellation, revisePlanSelection } from "./guided-workflow.js";
import type { PlannedTestCase } from "./model.js";
import { buildTestPlan } from "./openapi.js";
import { writeGeneratedTests, writePlan } from "./generator.js";
import { redactSensitiveText } from "./redaction.js";

const program = new Command();
program
  .name("openapi-test-agent")
  .description("Prepare and generate Playwright API tests from Swagger and OpenAPI specs.")
  .version("0.1.0");

program.command("analyze")
  .description("Validate a spec and write a reviewable Markdown test plan.")
  .requiredOption("-s, --spec <file>", "Swagger/OpenAPI JSON or YAML spec")
  .option("-o, --out <file>", "Plan output path", "test-plan.md")
  .action(async options => {
    const plan = await buildTestPlan(options.spec);
    await writePlan(plan, resolve(options.out));
    const cases = plan.operations.flatMap(operation => operation.testCases);
    const automated = cases.filter(testCase => testCase.execution === "automated").length;
    const manualReview = cases.length - automated;
    console.log(`Prepared ${cases.length} test cases across ${plan.operations.length} operations in ${resolve(options.out)}`);
    console.log(`${automated} automated candidate(s); ${manualReview} require manual review.`);
  });

program.command("generate")
  .description("Generate Playwright TypeScript tests from a spec.")
  .requiredOption("-s, --spec <file>", "Swagger/OpenAPI JSON or YAML spec")
  .option("-o, --out <file>", "Test output path", "tests/generated/api.spec.ts")
  .option("--include-mutating", "Enable POST/PUT/PATCH/DELETE tests after reviewing their effects", false)
  .action(async options => {
    const plan = await buildTestPlan(options.spec);
    const output = resolve(options.out);
    await writeGeneratedTests(plan, output, options.includeMutating);
    const cases = plan.operations.flatMap(operation => operation.testCases);
    const automated = cases.filter(testCase => testCase.execution === "automated").length;
    console.log(`Generated ${automated} automated test candidate(s) from ${plan.operations.length} operations in ${output}`);
    console.log(`${cases.length - automated} manual-review case(s) are documented in the plan but not automated.`);
    if (!options.includeMutating) {
      console.log("Mutating operations are skipped by default. Use --include-mutating only after reviewing the test plan.");
    }
  });

program.command("guide")
  .description("Review and approve a test plan before generating tests; this command does not run API requests.")
  .requiredOption("-s, --spec <file>", "Local Swagger/OpenAPI JSON or YAML spec")
  .option("--objective <text>", "Optional testing objective for this review")
  .option("-o, --out <file>", "Generated test output path", "tests/generated/api.spec.ts")
  .option("--audit <file>", "Local JSONL workflow audit path", "test-results/guided-workflow.jsonl")
  .action(async options => {
    const audit = createJsonlAuditSink(options.audit);
    let cancelledBySignal = false;
    let session: Awaited<ReturnType<typeof createGuidedSession>> | undefined;
    const prompt = createPrompt(process.stdin, process.stdout, () => {
      cancelledBySignal = true;
    });
    const interruptHandler = (): void => {
      cancelledBySignal = true;
      prompt.close();
    };
    process.once("SIGINT", interruptHandler);

    try {
      const objectiveInput = options.objective ?? (await prompt.question("Optional testing objective (press Enter to skip): ")) ?? "";
      const objective = objectiveInput.trim() || undefined;
      session = await createGuidedSession(options.spec, objective, audit);
      const activeSession = session;
      const allCases = activeSession.plan.operations.flatMap(operation => operation.testCases);
      const printReview = (): void => {
        console.log(`\nAPI: ${activeSession.plan.title} ${activeSession.plan.version} (${activeSession.plan.specVersion})`);
        console.log(`Spec SHA-256: ${activeSession.plan.specFingerprint}`);
        if (activeSession.objective) {
          console.log(`Objective (user-provided context; does not alter contract assertions): ${redactSensitiveText(activeSession.objective)}`);
        }
        console.log(`Plan revision: ${activeSession.planRevision}; case candidates: ${allCases.length}`);
        for (const testCase of allCases) printCase(testCase);
      };
      printReview();
      while (true) {
        const selection = (await prompt.question("\nCase IDs to include (comma-separated), 'all', or 'cancel': ")) ?? "";
        if (!selection.trim() || selection.trim().toLowerCase() === "cancel") {
          await recordWorkflowCancellation(activeSession);
          console.log("Review cancelled. No tests were generated and no API requests were sent.");
          return;
        }

        const selectedIds = selection.trim().toLowerCase() === "all"
          ? allCases.map(testCase => testCase.id)
          : selection.split(",").map(caseId => caseId.trim()).filter(Boolean);
        try {
          await revisePlanSelection(activeSession, activeSession.planRevision, selectedIds);
        } catch (error) {
          console.error(error instanceof Error ? error.message : "Case selection was rejected.");
          continue;
        }

        console.log(`\nSelected ${activeSession.selectedCaseIds.length} case(s) for plan revision ${activeSession.planRevision}.`);
        for (const caseId of activeSession.selectedCaseIds) console.log(`  - ${caseId}`);
        if (activeSession.selectedCaseIds.length === 0) {
          console.log("Select at least one case before approval.");
          continue;
        }

        const decision = ((await prompt.question("Type APPROVE to approve and generate, 'edit' to revise, or 'cancel': ")) ?? "").trim();
        if (decision.toLowerCase() === "cancel" || decision.length === 0) {
          await recordWorkflowCancellation(session);
          console.log("Review cancelled. No tests were generated and no API requests were sent.");
          return;
        }
        if (decision.toLowerCase() === "edit") {
          console.log(`Plan revision ${activeSession.planRevision} remains unapproved. Select the cases again to continue.`);
          continue;
        }
        if (decision !== "APPROVE") {
          console.log("Approval requires the exact word APPROVE; no approval was recorded.");
          continue;
        }

        const approval = await approvePlan(activeSession, activeSession.planRevision, activeSession.selectedCaseIds);
        const result = await generateApprovedPlan(activeSession, approval.token, options.out);
        console.log(`\nGenerated ${result.automatedCount} automated candidate(s) and ${result.manualReviewCount} manual-review case(s) to ${result.outputPath}.`);
        console.log("No API requests were sent. Use the separate run command only after target and execution approval are implemented.");
        return;
      }
    } catch (error) {
      if (cancelledBySignal) {
        if (session) await recordWorkflowCancellation(session);
        console.log("\nReview cancelled. No tests were generated and no API requests were sent.");
        return;
      }
      throw error;
    } finally {
      process.off("SIGINT", interruptHandler);
      prompt.close();
    }
  });

program.command("run")
  .description("Run generated API tests with Playwright.")
  .option("--base-url <url>", "Override the API_BASE_URL for this run")
  .option("--results <file>", "Machine-readable JSON results path", "test-results/api-results.json")
  .option("--include-mutating", "Allow mutating tests in the generated test file", false)
  .action(options => {
    const env = { ...process.env };
    if (options.baseUrl) env.API_BASE_URL = options.baseUrl;
    env.API_TEST_RESULTS = resolve(options.results);
    if (options.includeMutating) env.INCLUDE_MUTATING = "true";
    const result = spawnSync("npx", ["playwright", "test"], {
      env,
      stdio: "inherit",
      shell: process.platform === "win32"
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  });

await program.parseAsync();

function printCase(testCase: PlannedTestCase): void {
  console.log(`\n[${testCase.id}] ${testCase.title}`);
  console.log(`  Classification: ${testCase.caseType}; execution: ${testCase.execution}; source: specification-derived candidate`);
  console.log(`  Summary (untrusted specification text): ${redactSensitiveText(testCase.summary)}`);
  if (testCase.parameters.length > 0) {
    console.log("  Inputs:");
    for (const parameter of testCase.parameters) {
      const value = redactSensitiveText(JSON.stringify(parameter.value) ?? String(parameter.value));
      console.log(`    ${parameter.in} ${parameter.name}=${value} (source: ${parameter.valueSource})`);
    }
  }
  if (testCase.body !== undefined) {
    console.log(`  Request body candidate: ${redactSensitiveText(JSON.stringify(testCase.body) ?? String(testCase.body))}`);
    console.log(`  Request body source: ${testCase.bodySource ?? "unspecified"}`);
  }
  for (const precondition of testCase.preconditions) console.log(`  Precondition: ${redactSensitiveText(precondition)}`);
  for (const step of testCase.steps) {
    console.log(`  Step: ${redactSensitiveText(step.action)}\n    Expected: ${redactSensitiveText(step.expectedResult)}`);
  }
  for (const evidence of testCase.evidence) {
    console.log(`  Evidence: SHA-256 ${evidence.specFingerprint}; JSON Pointer ${evidence.pointer}`);
  }
  for (const warning of testCase.warnings) console.log(`  Uncertainty/review: ${redactSensitiveText(warning)}`);
}

function createPrompt(
  input: NodeJS.ReadableStream,
  output: Writable,
  onInterrupt: () => void
): { question(message: string): Promise<string | undefined>; close(): void } {
  const readline = createInterface({ input, output });
  const bufferedLines: string[] = [];
  let resolvePending: ((line: string | undefined) => void) | undefined;
  let closed = false;
  let interrupted = false;

  readline.on("line", line => {
    if (resolvePending) {
      const resolveLine = resolvePending;
      resolvePending = undefined;
      resolveLine(line);
    } else {
      bufferedLines.push(line);
    }
  });
  readline.on("close", () => {
    closed = true;
    resolvePending?.(undefined);
    resolvePending = undefined;
  });
  readline.on("SIGINT", () => {
    interrupted = true;
    onInterrupt();
    readline.close();
  });

  return {
    question(message) {
      output.write(message);
      if (interrupted || (closed && bufferedLines.length === 0)) return Promise.resolve(undefined);
      const bufferedLine = bufferedLines.shift();
      if (bufferedLine !== undefined) return Promise.resolve(bufferedLine);
      return new Promise(resolveLine => {
        resolvePending = resolveLine;
      });
    },
    close() {
      readline.close();
    }
  };
}
