import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import { redactSensitiveText } from "./redaction.js";

interface ApiRunDiagnostic {
  caseId: string;
  method: string;
  pathTemplate: string;
  stepKind?: string;
  stepNumber?: number;
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
    stepNumber?: number;
  };
}

interface ReporterOptions {
  outputFile?: string;
  htmlOutputFile?: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character] ?? character);
}

function renderHtmlReport(generatedAt: string, records: readonly ApiRunRecord[], execution?: {
  planId: string;
  planRevision: number;
  specFingerprint: string;
  targetFingerprint: string;
}): string {
  const passed = records.filter(record => record.outcome === "passed").length;
  const failed = records.filter(record => ["failed", "timedOut", "interrupted"].includes(record.outcome)).length;
  const skipped = records.filter(record => record.outcome === "skipped").length;
  const runStatus = failed > 0 ? "Needs attention" : records.length > 0 && skipped === 0 ? "Passed" : "Review results";
  const rows = records.map(record => {
    const outcome = escapeHtml(record.outcome);
    const method = record.request ? `<span class="method">${escapeHtml(record.request.method.toUpperCase())}</span>` : "Not recorded";
    const path = record.request ? escapeHtml(record.request.pathTemplate) : "";
    const status = record.expectedStatus === undefined && record.actualStatus === undefined
      ? "Not recorded"
      : `${record.expectedStatus ?? "-"} / ${record.actualStatus ?? "-"}`;
    const diagnostic = record.diagnostic
      ? `<strong>${escapeHtml(record.diagnostic.stepKind ?? record.diagnostic.code)}</strong>${record.diagnostic.stepNumber === undefined ? "" : `<div class="muted">Step ${record.diagnostic.stepNumber}</div>`}<div class="muted">${escapeHtml(record.diagnostic.message)}</div>`
      : "-";
    return `<tr><td><strong>${escapeHtml(record.caseId)}</strong></td><td><span class="status ${outcome}">${outcome}</span></td><td>${method} ${path}</td><td>${status}</td><td>${record.durationMs} ms</td><td>${diagnostic}</td></tr>`;
  }).join("\n");
  const metadata = execution
    ? `<dl><dt>Plan ID</dt><dd>${escapeHtml(execution.planId)}</dd><dt>Plan revision</dt><dd>${execution.planRevision}</dd><dt>Spec fingerprint</dt><dd>${escapeHtml(execution.specFingerprint)}</dd><dt>Target fingerprint</dt><dd>${escapeHtml(execution.targetFingerprint)}</dd><dt>Generated at</dt><dd>${escapeHtml(generatedAt)}</dd></dl>`
    : `<dl><dt>Generated at</dt><dd>${escapeHtml(generatedAt)}</dd></dl>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>API Execution Report</title>
  <style>
    :root { color-scheme: dark; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; background: #101719; color: #edf3ef; }
    * { box-sizing: border-box; }
    body { margin: 0; background: linear-gradient(145deg, #172220, #101719 52%, #18201d); min-height: 100vh; }
    main { max-width: 1180px; margin: 0 auto; padding: 36px 22px 54px; }
    header { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 0 0 25px; border-bottom: 1px solid #33413b; }
    h1 { margin: 0; font-size: clamp(1.65rem, 4vw, 2.5rem); }
    .subtitle, .muted { color: #aab8af; }
    .subtitle { margin-top: 7px; }
    .run-status { border: 1px solid #4f7a63; border-radius: 999px; padding: 9px 14px; color: #c6f3d2; white-space: nowrap; }
    .stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 22px 0; }
    .stat, .section { border: 1px solid #33413b; background: rgba(23, 34, 32, .84); }
    .stat { padding: 17px; }
    .stat-label { display: block; color: #aab8af; font-size: .77rem; text-transform: uppercase; }
    .stat-value { display: block; margin-top: 6px; font-size: 1.8rem; font-weight: 700; }
    .section { margin-top: 18px; overflow: hidden; }
    h2 { margin: 0; padding: 15px 18px; border-bottom: 1px solid #33413b; font-size: 1rem; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 760px; }
    th, td { padding: 13px 16px; text-align: left; vertical-align: top; border-bottom: 1px solid #2c3934; }
    th { color: #aab8af; font-size: .74rem; text-transform: uppercase; }
    tbody tr:last-child td { border-bottom: 0; }
    .method { display: inline-block; margin-right: 5px; color: #b9e5c2; font-weight: 700; }
    .status { display: inline-block; border-radius: 999px; padding: 5px 9px; font-size: .75rem; text-transform: uppercase; }
    .passed { color: #c6f3d2; background: #234533; }
    .failed, .timedOut, .interrupted { color: #ffd1c7; background: #542e2b; }
    .skipped { color: #ffe0a6; background: #4b3d24; }
    dl { display: grid; grid-template-columns: minmax(145px, 220px) 1fr; gap: 10px 18px; padding: 18px; margin: 0; overflow-wrap: anywhere; }
    dt { color: #aab8af; }
    dd { margin: 0; }
    @media (max-width: 620px) { main { padding: 24px 14px 36px; } .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } header { align-items: flex-start; flex-direction: column; } }
  </style>
</head>
<body>
  <main>
    <header><div><h1>API Execution Report</h1><div class="subtitle">Approved Playwright run results</div></div><div class="run-status">${runStatus}</div></header>
    <section class="stats" aria-label="Run summary">
      <div class="stat"><span class="stat-label">Total cases</span><span class="stat-value">${records.length}</span></div>
      <div class="stat"><span class="stat-label">Passed</span><span class="stat-value">${passed}</span></div>
      <div class="stat"><span class="stat-label">Failed</span><span class="stat-value">${failed}</span></div>
      <div class="stat"><span class="stat-label">Skipped</span><span class="stat-value">${skipped}</span></div>
    </section>
    <section class="section"><h2>Execution results</h2><div class="table-wrap"><table><thead><tr><th>Case ID</th><th>Outcome</th><th>Method / path</th><th>Expected / actual</th><th>Duration</th><th>Diagnostic</th></tr></thead><tbody>${rows || `<tr><td colspan="6">No test results recorded.</td></tr>`}</tbody></table></div></section>
    <section class="section"><h2>Execution metadata</h2>${metadata}</section>
  </main>
</body>
</html>
`;
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
      ...(typeof value.stepNumber === "number" && Number.isSafeInteger(value.stepNumber) && value.stepNumber > 0
        ? { stepNumber: value.stepNumber }
        : {}),
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
  if (diagnostic || outcome === "failed" || outcome === "timedOut" || outcome === "interrupted") {
    record.diagnostic = {
      code: diagnostic?.code ?? "test-failed",
      message: redactSensitiveText(diagnostic?.message ?? "The test failed; inspect the case steps and target service."),
      ...(diagnostic?.stepKind ? { stepKind: redactSensitiveText(diagnostic.stepKind) } : {}),
      ...(diagnostic?.stepNumber === undefined ? {} : { stepNumber: diagnostic.stepNumber })
    };
  }
  return record;
}

export default class ApiRunReporter implements Reporter {
  private readonly outputFile: string;
  private readonly htmlOutputFile: string;
  private readonly records: ApiRunRecord[] = [];

  constructor(options: ReporterOptions = {}) {
    this.outputFile = resolve(options.outputFile ?? "test-results/api-results.json");
    this.htmlOutputFile = resolve(options.htmlOutputFile ?? "test-results/api-report.html");
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    this.records.push(safeRecord(test, result));
  }

  async onEnd(): Promise<void> {
    if (this.records.length === 0) {
      console.log("No API tests executed; no result file was written.");
      return;
    }
    const generatedAt = new Date().toISOString();
    const execution = process.env.API_PLAN_ID
      && Number.isSafeInteger(Number(process.env.API_PLAN_REVISION))
      && process.env.API_SPEC_FINGERPRINT
      && process.env.API_TARGET_FINGERPRINT
      ? {
          planId: redactSensitiveText(process.env.API_PLAN_ID),
          planRevision: Number(process.env.API_PLAN_REVISION),
          specFingerprint: process.env.API_SPEC_FINGERPRINT,
          targetFingerprint: process.env.API_TARGET_FINGERPRINT
        }
      : undefined;
    const results = {
      schemaVersion: 1,
      generatedAt,
      ...(execution ? { execution } : {}),
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
    await mkdir(dirname(this.htmlOutputFile), { recursive: true });
    await writeFile(this.htmlOutputFile, renderHtmlReport(generatedAt, this.records, execution), "utf8");
    console.log(`Machine-readable API results written to ${this.outputFile}`);
    console.log(`HTML API report written to ${this.htmlOutputFile}`);
    for (const record of this.records) {
      const detail = record.diagnostic ? ` - ${record.diagnostic.message}` : "";
      console.log(`${record.outcome.toUpperCase()} ${record.caseId}${detail}`);
    }
  }
}
