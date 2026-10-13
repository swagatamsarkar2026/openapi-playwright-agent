import { redactSensitiveText } from "./redaction.js";

type ApiRunOutcome = "passed" | "failed" | "timedOut" | "skipped" | "interrupted";
const outcomeLabels: Record<ApiRunOutcome, string> = {
  passed: "PASSED",
  failed: "FAILED",
  timedOut: "TIMED OUT",
  skipped: "SKIPPED",
  interrupted: "INTERRUPTED"
};

interface ApiRunRecord {
  caseId: string;
  outcome: ApiRunOutcome;
  expectedStatus?: number;
  actualStatus?: number;
  diagnostic?: {
    message?: string;
    stepKind?: string;
    stepNumber?: number;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHttpStatus(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 100 && value <= 599;
}

function parseRunRecords(value: unknown): ApiRunRecord[] {
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.results)) {
    throw new Error("Invalid API results: expected schemaVersion 1 and a results array.");
  }

  return value.results.map((record, index) => {
    if (!isRecord(record)
      || typeof record.caseId !== "string"
      || record.caseId.trim().length === 0
      || !["passed", "failed", "timedOut", "skipped", "interrupted"].includes(String(record.outcome))) {
      throw new Error(`Invalid API result record at index ${index}.`);
    }

    const diagnostic = isRecord(record.diagnostic) ? record.diagnostic : undefined;
    return {
      caseId: record.caseId,
      outcome: record.outcome as ApiRunOutcome,
      ...(isHttpStatus(record.expectedStatus) ? { expectedStatus: record.expectedStatus } : {}),
      ...(isHttpStatus(record.actualStatus) ? { actualStatus: record.actualStatus } : {}),
      ...(diagnostic ? {
        diagnostic: {
          ...(typeof diagnostic.message === "string" ? { message: diagnostic.message } : {}),
          ...(typeof diagnostic.stepKind === "string" ? { stepKind: diagnostic.stepKind } : {}),
          ...(typeof diagnostic.stepNumber === "number"
            && Number.isSafeInteger(diagnostic.stepNumber)
            && diagnostic.stepNumber > 0
            ? { stepNumber: diagnostic.stepNumber }
            : {})
        }
      } : {})
    };
  });
}

function safeDisplayText(value: string): string {
  return redactSensitiveText(value)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .slice(0, 300)
    .trim();
}

export function formatRunSummary(value: unknown): string {
  const records = parseRunRecords(value);
  const outcomes: ApiRunOutcome[] = ["passed", "failed", "skipped", "timedOut", "interrupted"];
  const counts = Object.fromEntries(outcomes.map(outcome => [
    outcome,
    records.filter(record => record.outcome === outcome).length
  ])) as Record<ApiRunOutcome, number>;
  const lines = [
    `Run summary: ${records.length} case(s); ${counts.passed} passed, ${counts.failed} failed, ${counts.skipped} skipped, ${counts.timedOut} timed out, ${counts.interrupted} interrupted.`
  ];

  for (const record of records) {
    const evidence: string[] = [];
    if (record.actualStatus !== undefined) {
      evidence.push(`observed HTTP ${record.actualStatus}`);
      if (record.expectedStatus !== undefined) evidence.push(`expected HTTP ${record.expectedStatus}`);
    }
    if (record.diagnostic?.stepNumber !== undefined) {
      const stepKind = record.diagnostic.stepKind ? ` (${safeDisplayText(record.diagnostic.stepKind)})` : "";
      evidence.push(`recorded at step ${record.diagnostic.stepNumber}${stepKind}`);
    }
    if (record.outcome !== "passed" && record.outcome !== "skipped" && record.diagnostic?.message) {
      evidence.push(`observed: ${safeDisplayText(record.diagnostic.message)}`);
    }
    lines.push(`${outcomeLabels[record.outcome]} ${safeDisplayText(record.caseId)}${evidence.length > 0 ? ` | ${evidence.join("; ")}` : ""}`);
  }

  lines.push("This summary reports recorded outcomes only; no root cause is inferred.");
  return lines.join("\n");
}