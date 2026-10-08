import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/generated",
  timeout: 30_000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    trace: "retain-on-failure"
  }
});
