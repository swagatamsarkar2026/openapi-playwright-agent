import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import { redactSensitiveText } from "./redaction.js";

interface ApiRunDiagnostic {
  caseId: string;
  method: string;
  pathTemplate: string;
  stepKind?: string;
  expectedStatus?: number;
  actualStatus?: number;
  code?: string;
  message?: string;
}

interface ApiRunRecord {
  caseId: string;
  outcome: "passed" | "failed" | "timedOut" | "skipped" | "interrupted";
  durationMs: number;
  expectedStatus?: number;
  actualStatus?: number;
  request?: {
    method: string;
    pathTemplate: string;
  };
  diagnostic?: {
    code: string;
    message: string;
    stepKind?: string;
  };
}

interface ReporterOptions {
  outputFile?: string;
}

function caseIdFromTitle(title: string): string {
  return title.split(":", 1)[0] ?? "unknown";
}

function parseDiagnostic(result: TestResult): ApiRunDiagnostic | undefined {
  const attachment = result.attachments.find(item => item.name === "api-run-diagnostic.json" && item.body);
  if (!attachment?.body || attachment.body.byteLength > 16_384) return undefined;

  const parsed: unknown = JSON.parse(attachment.body.toString("utf8"));
  if (typeof parsed !== "object" || parsed === null) return undefined;
  const value = parsed as Partial<ApiRunDiagnostic>;
  if (typeof value.caseId !== "string" || typeof value.method !== "string" || typeof value.pathTemplate !== "string") {
    return undefined;
  }
  return {
    caseId: value.caseId,
    method: value.method,
    pathTemplate: value.pathTemplate,
    ...(typeof value.stepKind === "string" ? { stepKind: value.stepKind } : {}),
    ...(typeof value.expectedStatus === "number" ? { expectedStatus: value.expectedStatus } : {}),
    ...(typeof value.actualStatus === "number" ? { actualStatus: value.actualStatus } : {}),
    ...(typeof value.code === "string" ? { code: value.code } : {}),
    ...(typeof value.message === "string" ? { message: value.message } : {})
  };
}

function safeRecord(test: TestCase, result: TestResult): ApiRunRecord {
  const diagnostic = parseDiagnostic(result);
  const outcome = result.status;
  const record: ApiRunRecord = {
    caseId: redactSensitiveText(diagnostic?.caseId ?? caseIdFromTitle(test.title)),
    outcome,
    durationMs: result.duration,
    ...(diagnostic?.expectedStatus === undefined ? {} : { expectedStatus: diagnostic.expectedStatus }),
    ...(diagnostic?.actualStatus === undefined ? {} : { actualStatus: diagnostic.actualStatus })
  };

  if (diagnostic) {
    record.request = {
      method: diagnostic.method,
      pathTemplate: redactSensitiveText(diagnostic.pathTemplate)
    };
  }
  if (outcome === "failed" || outcome === "timedOut" || outcome === "interrupted") {
    record.diagnostic = {
      code: diagnostic?.code ?? "test-failed",
      message: redactSensitiveText(diagnostic?.message ?? "The test failed; inspect the case steps and target service."),
      ...(diagnostic?.stepKind ? { stepKind: redactSensitiveText(diagnostic.stepKind) } : {})
    };
  }
  return record;
}

export default class ApiRunReporter implements Reporter {
  private readonly outputFile: string;
  private readonly records: ApiRunRecord[] = [];

  constructor(options: ReporterOptions = {}) {
    this.outputFile = resolve(options.outputFile ?? "test-results/api-results.json");
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    this.records.push(safeRecord(test, result));
  }

  async onEnd(): Promise<void> {
    if (this.records.length === 0) {
      console.log("No API tests executed; no result file was written.");
      return;
    }
    const results = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      ...(process.env.API_PLAN_ID
        && Number.isSafeInteger(Number(process.env.API_PLAN_REVISION))
        && process.env.API_SPEC_FINGERPRINT
        && process.env.API_TARGET_FINGERPRINT
        ? {
            execution: {
              planId: redactSensitiveText(process.env.API_PLAN_ID),
              planRevision: Number(process.env.API_PLAN_REVISION),
              specFingerprint: process.env.API_SPEC_FINGERPRINT,
              targetFingerprint: process.env.API_TARGET_FINGERPRINT
            }
          }
        : {}),
      summary: {
        total: this.records.length,
        passed: this.records.filter(record => record.outcome === "passed").length,
        failed: this.records.filter(record => record.outcome === "failed" || record.outcome === "timedOut" || record.outcome === "interrupted").length,
        skipped: this.records.filter(record => record.outcome === "skipped").length
      },
      results: this.records
    };
    await mkdir(dirname(this.outputFile), { recursive: true });
    await writeFile(this.outputFile, `${JSON.stringify(results, null, 2)}\n`, "utf8");
    console.log(`Machine-readable API results written to ${this.outputFile}`);
    for (const record of this.records) {
      const detail = record.diagnostic ? ` - ${record.diagnostic.message}` : "";
      console.log(`${record.outcome.toUpperCase()} ${record.caseId}${detail}`);
    }
  }
}
