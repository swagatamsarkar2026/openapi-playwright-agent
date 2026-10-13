export interface ManualCaseOperationContext {
  operationRef: string;
  operationId: string;
  method: string;
  path: string;
  summary: string;
  successStatuses: number[];
  errorResponses: Array<{ status: number; description: string }>;
  evidencePointers: string[];
  automationCandidates?: Array<{
    candidateRef: string;
    caseId: string;
    title: string;
    expectedStatus: number;
    evidencePointers: string[];
  }>;
}

export interface DraftManualCasesRequest {
  objective: string;
  operations: ManualCaseOperationContext[];
}

export interface DraftManualCase {
  draftId: string;
  operationRef: string;
  operationId: string;
  title: string;
  intent: string;
  preconditions: string[];
  steps: Array<{ action: string; expectedResult: string }>;
  evidencePointers: string[];
  openQuestions: string[];
  automationCandidateCaseId?: string;
  execution: "manual-review";
}

export interface ManualCaseDraftProvider {
  draftCases(request: DraftManualCasesRequest): Promise<DraftManualCase[]>;
}

const MAX_DRAFTS = 100;
const MAX_DRAFTS_PER_OPERATION = 5;
const MAX_TEXT_LENGTH = 1000;
const MAX_LIST_LENGTH = 12;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedText(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > MAX_TEXT_LENGTH) {
    throw new Error(`AI draft response contains an invalid ${label}.`);
  }
  return value.trim();
}

function textList(value: unknown, label: string, maximum: number): string[] {
  if (!Array.isArray(value) || value.length > maximum) {
    throw new Error(`AI draft response contains an invalid ${label} list.`);
  }
  return value.map(item => boundedText(item, label));
}

export function validateManualCaseDrafts(
  value: unknown,
  request: DraftManualCasesRequest
): DraftManualCase[] {
  if (!isRecord(value) || !Array.isArray(value.cases) || value.cases.length > MAX_DRAFTS) {
    throw new Error("AI draft response does not match the expected case-list shape.");
  }

  const operationByRef = new Map(request.operations.map(operation => [operation.operationRef, operation]));
  const draftCounts = new Map<string, number>();
  return value.cases.map(item => {
    if (!isRecord(item)) throw new Error("AI draft response contains an invalid case.");
    const operationRef = boundedText(item.operationRef, "operation reference");
    const operation = operationByRef.get(operationRef);
    if (!operation) throw new Error("AI draft response references an unknown operation.");

    const draftCount = (draftCounts.get(operationRef) ?? 0) + 1;
    if (draftCount > MAX_DRAFTS_PER_OPERATION) {
      throw new Error("AI draft response contains too many cases for one operation.");
    }
    draftCounts.set(operationRef, draftCount);

    const evidencePointers = textList(item.evidencePointers, "evidence pointer", MAX_LIST_LENGTH);
    if (evidencePointers.length === 0 || evidencePointers.some(pointer => !operation.evidencePointers.includes(pointer))) {
      throw new Error("AI draft response cites evidence outside the analyzed specification.");
    }
    let automationCandidateCaseId: string | undefined;
    if (item.automationCandidateRef !== null) {
      const candidateRef = boundedText(item.automationCandidateRef, "automation candidate reference");
      const candidate = (operation.automationCandidates ?? []).find(value => value.candidateRef === candidateRef);
      if (!candidate || candidate.evidencePointers.some(pointer => !operation.evidencePointers.includes(pointer))) {
        throw new Error("AI draft response references an unknown or ungrounded automation candidate.");
      }
      automationCandidateCaseId = candidate.caseId;
    }
    if (!Array.isArray(item.steps) || item.steps.length === 0 || item.steps.length > MAX_LIST_LENGTH) {
      throw new Error("AI draft response contains an invalid step list.");
    }
    const steps = item.steps.map(step => {
      if (!isRecord(step)) throw new Error("AI draft response contains an invalid step.");
      return {
        action: boundedText(step.action, "step action"),
        expectedResult: boundedText(step.expectedResult, "step expected result")
      };
    });

    return {
      draftId: `AI-DRAFT-${operationRef}-${draftCount}`,
      operationRef,
      operationId: operation.operationId,
      title: boundedText(item.title, "case title"),
      intent: boundedText(item.intent, "case intent"),
      preconditions: textList(item.preconditions, "precondition", MAX_LIST_LENGTH),
      steps,
      evidencePointers,
      openQuestions: textList(item.openQuestions, "open question", MAX_LIST_LENGTH),
      ...(automationCandidateCaseId ? { automationCandidateCaseId } : {}),
      execution: "manual-review"
    };
  });
}