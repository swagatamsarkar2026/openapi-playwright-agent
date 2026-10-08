import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/generated",
  timeout: 30_000,
  reporter: [["./src/run-reporter.ts", { outputFile: process.env.API_TEST_RESULTS ?? "test-results/api-results.json" }]]
});
