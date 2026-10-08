#!/usr/bin/env node
import { Command } from "commander";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { buildTestPlan } from "./openapi.js";
import { writeGeneratedTests, writePlan } from "./generator.js";

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
