import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { PlannedTestCase, TestPlan } from "./model.js";
import { writeGeneratedTests } from "./generator.js";
import { buildTestPlan } from "./openapi.js";
import { redactSensitiveText } from "./redaction.js";

export type WorkflowEventType =
  | "spec_inspected"
  | "plan_prepared"
  | "case_selection_changed"
  | "plan_approved"
  | "approval_invalidated"
  | "tests_generated"
  | "cancelled"
  | "tool_failed";

export interface WorkflowEvent {
  timestamp: string;
  workflowId: string;
  planId?: string;
  planRevision?: number;
  event: WorkflowEventType;
  caseIds?: string[];
  outcome: "success" | "cancelled" | "failed";
  errorCategory?: string;
}

export type AuditSink = (event: WorkflowEvent) => Promise<void>;

export interface PlanApproval {
  token: string;
  revision: number;
  caseIds: string[];
}

export interface GuidedSession {
  workflowId: string;
  planId: string;
  planRevision: number;
  objective?: string;
  plan: TestPlan;
  selectedCaseIds: string[];
  approval?: PlanApproval;
  audit?: AuditSink;
}

export interface GeneratedWorkflowResult {
  outputPath: string;
  caseIds: string[];
  automatedCount: number;
  manualReviewCount: number;
}

function recordEvent(
  session: { workflowId: string; planId?: string; planRevision?: number; audit?: AuditSink },
  event: WorkflowEventType,
  outcome: WorkflowEvent["outcome"],
  caseIds?: string[],
  errorCategory?: string
): Promise<void> {
  if (!session.audit) return Promise.resolve();
  return session.audit({
    timestamp: new Date().toISOString(),
    workflowId: session.workflowId,
    planId: session.planId,
    planRevision: session.planRevision,
    event,
    ...(caseIds ? { caseIds: caseIds.map(caseId => redactSensitiveText(caseId)) } : {}),
    outcome,
    ...(errorCategory ? { errorCategory } : {})
  });
}

export function createJsonlAuditSink(filePath: string): AuditSink {
  const outputPath = resolve(filePath);
  return async event => {
    await mkdir(dirname(outputPath), { recursive: true });
    await appendFile(outputPath, `${JSON.stringify(event)}\n`, "utf8");
  };
}

export async function createGuidedSession(
  specPath: string,
  objective: string | undefined,
  audit?: AuditSink
): Promise<GuidedSession> {
  const workflowId = randomUUID();
  const sessionMetadata = { workflowId, planRevision: 1, ...(audit ? { audit } : {}) };
  try {
    const plan = await buildTestPlan(specPath);
    const planId = randomUUID();
    const caseCount = plan.operations.reduce((count, operation) => count + operation.testCases.length, 0);
    if (caseCount === 0) throw new Error("The specification produced no reviewable test cases.");
    const session: GuidedSession = {
      workflowId,
      planId,
      planRevision: 1,
      ...(objective ? { objective } : {}),
      plan,
      selectedCaseIds: plan.operations.flatMap(operation => operation.testCases.map(testCase => testCase.id)),
      ...(audit ? { audit } : {})
    };
    await recordEvent(session, "spec_inspected", "success");
    await recordEvent(session, "plan_prepared", "success", session.selectedCaseIds);
    return session;
  } catch (error) {
    const category = error instanceof Error ? error.name : "UnknownError";
    await recordEvent(sessionMetadata, "tool_failed", "failed", undefined, category);
    throw error;
  }
}

function validateCaseSelection(session: GuidedSession, caseIds: readonly string[]): string[] {
  if (new Set(caseIds).size !== caseIds.length) {
    throw new Error("Case selection contains duplicate case IDs.");
  }
  const knownIds = new Set(session.plan.operations.flatMap(operation => operation.testCases.map(testCase => testCase.id)));
  const unknownIds = caseIds.filter(caseId => !knownIds.has(caseId));
  if (unknownIds.length > 0) {
    throw new Error(`Unknown case ID(s): ${unknownIds.join(", ")}.`);
  }
  return session.plan.operations
    .flatMap(operation => operation.testCases.map(testCase => testCase.id))
    .filter(caseId => caseIds.includes(caseId));
}

export async function revisePlanSelection(
  session: GuidedSession,
  expectedRevision: number,
  caseIds: readonly string[]
): Promise<number> {
  try {
    if (expectedRevision !== session.planRevision) {
      throw new Error(`Stale plan revision ${expectedRevision}; current revision is ${session.planRevision}.`);
    }
    const selectedCaseIds = validateCaseSelection(session, caseIds);
    if (selectedCaseIds.length === session.selectedCaseIds.length
      && selectedCaseIds.every((caseId, index) => caseId === session.selectedCaseIds[index])) {
      return session.planRevision;
    }

    const previousApproval = session.approval;
    session.planRevision += 1;
    session.selectedCaseIds = selectedCaseIds;
    delete session.approval;
    if (previousApproval) {
      await recordEvent(session, "approval_invalidated", "success", previousApproval.caseIds);
    }
    await recordEvent(session, "case_selection_changed", "success", selectedCaseIds);
    return session.planRevision;
  } catch (error) {
    await recordEvent(session, "tool_failed", "failed", undefined, "PlanRevisionError");
    throw error;
  }
}

export async function approvePlan(
  session: GuidedSession,
  planRevision: number,
  caseIds: readonly string[]
): Promise<PlanApproval> {
  try {
    if (planRevision !== session.planRevision) {
      throw new Error(`Cannot approve stale plan revision ${planRevision}; current revision is ${session.planRevision}.`);
    }
    const selectedCaseIds = validateCaseSelection(session, caseIds);
    if (selectedCaseIds.length === 0) throw new Error("Select at least one case before approving the plan.");
    if (selectedCaseIds.length !== session.selectedCaseIds.length
      || selectedCaseIds.some((caseId, index) => caseId !== session.selectedCaseIds[index])) {
      throw new Error("Approval case IDs do not match the current plan selection.");
    }

    const approval = { token: randomUUID(), revision: session.planRevision, caseIds: selectedCaseIds };
    session.approval = approval;
    await recordEvent(session, "plan_approved", "success", selectedCaseIds);
    return approval;
  } catch (error) {
    await recordEvent(session, "tool_failed", "failed", undefined, "PlanApprovalError");
    throw error;
  }
}

function approvedPlan(session: GuidedSession, token: string): TestPlan {
  const approval = session.approval;
  if (!approval || approval.token !== token) {
    throw new Error("A current explicit plan approval is required before generating tests.");
  }
  if (approval.revision !== session.planRevision
    || approval.caseIds.length !== session.selectedCaseIds.length
    || approval.caseIds.some((caseId, index) => caseId !== session.selectedCaseIds[index])) {
    throw new Error("Plan approval is stale or does not match the current case selection.");
  }

  const selected = new Set(approval.caseIds);
  return {
    ...session.plan,
    operations: session.plan.operations.map(operation => ({
      ...operation,
      testCases: operation.testCases.filter(testCase => selected.has(testCase.id))
    }))
  };
}

export async function generateApprovedPlan(
  session: GuidedSession,
  token: string,
  outputPath: string
): Promise<GeneratedWorkflowResult> {
  let plan: TestPlan;
  try {
    plan = approvedPlan(session, token);
  } catch (error) {
    await recordEvent(session, "tool_failed", "failed", undefined, "ApprovalValidationError");
    throw error;
  }
  const cases: PlannedTestCase[] = plan.operations.flatMap(operation => operation.testCases);
  const resolvedOutputPath = resolve(outputPath);
  try {
    await writeGeneratedTests(plan, resolvedOutputPath, false);
  } catch (error) {
    await recordEvent(session, "tool_failed", "failed", session.selectedCaseIds, "OutputWriteError");
    throw error;
  }
  await recordEvent(session, "tests_generated", "success", session.selectedCaseIds);
  return {
    outputPath: resolvedOutputPath,
    caseIds: cases.map(testCase => testCase.id),
    automatedCount: cases.filter(testCase => testCase.execution === "automated").length,
    manualReviewCount: cases.filter(testCase => testCase.execution === "manual-review").length
  };
}

export async function recordWorkflowCancellation(session: GuidedSession): Promise<void> {
  await recordEvent(session, "cancelled", "cancelled", session.selectedCaseIds);
}
