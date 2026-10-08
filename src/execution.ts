import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import type { SecurityCredential } from "./model.js";

const MAX_GENERATED_TEST_SIZE = 10 * 1024 * 1024;
const EXECUTION_PLAN_MARKER = "// openapi-playwright-agent-execution-plan: ";
export const MAX_EXECUTION_DURATION_MS = 10 * 60 * 1000;

export interface ExecutionPlanDetails {
  workflowId: string;
  planId: string;
  planRevision: number;
  specFingerprint: string;
  caseIds: string[];
  runnableCaseIds: string[];
  mutatingCaseIds: string[];
  authenticationEnvironmentVariables: string[];
}

export interface ApprovedExecutionPlan extends ExecutionPlanDetails {
  generatedContentFingerprint: string;
  approvalBinding: string;
}

export interface AuthorizedTarget {
  url: string;
  fingerprint: string;
}

export function createExecutionPlanMetadata(
  plan: ExecutionPlanDetails,
  generatedContentFingerprint: string
): ApprovedExecutionPlan {
  const details = { ...plan, generatedContentFingerprint };
  return { ...details, approvalBinding: executionPlanBinding(details) };
}

export function executionPlanBinding(
  plan: Omit<ApprovedExecutionPlan, "approvalBinding">
): string {
  const canonical = JSON.stringify({
    workflowId: plan.workflowId,
    planId: plan.planId,
    planRevision: plan.planRevision,
    specFingerprint: plan.specFingerprint,
    caseIds: plan.caseIds,
    runnableCaseIds: plan.runnableCaseIds,
    mutatingCaseIds: plan.mutatingCaseIds,
    authenticationEnvironmentVariables: plan.authenticationEnvironmentVariables,
    generatedContentFingerprint: plan.generatedContentFingerprint
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export function serializeExecutionPlanMarker(plan?: ApprovedExecutionPlan): string {
  return `${EXECUTION_PLAN_MARKER}${JSON.stringify(plan ?? null)}`;
}

export function generatedExecutionContentFingerprint(source: string): string {
  const sourceWithoutMarker = source
    .split(/\r?\n/)
    .filter(line => !line.startsWith(EXECUTION_PLAN_MARKER))
    .join("\n");
  const bindingLine = /^const executionApprovalBinding = "(?:[\da-f]*)";$/m;
  if (!bindingLine.test(sourceWithoutMarker)) {
    throw new Error("Generated test file is missing its execution-approval guard.");
  }
  const normalized = sourceWithoutMarker.replace(bindingLine, 'const executionApprovalBinding = "";');
  return createHash("sha256").update(normalized).digest("hex");
}

export function requiredAuthenticationEnvironmentVariables(
  cases: readonly { security: readonly SecurityCredential[] }[]
): string[] {
  const names = new Set<string>();
  for (const testCase of cases) {
    for (const credential of testCase.security) {
      if (credential.type === "bearer") names.add("API_BEARER_TOKEN");
      else if (credential.type === "oauth2") names.add("API_OAUTH_TOKEN");
      else if (credential.type === "basic") {
        names.add("API_USERNAME");
        names.add("API_PASSWORD");
      } else {
        const suffix = credential.name.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
        names.add(`API_KEY_${suffix}`);
      }
    }
  }
  return [...names];
}

export async function readApprovedExecutionPlan(filePath: string): Promise<ApprovedExecutionPlan> {
  const path = resolve(filePath);
  const { size } = await stat(path);
  if (size > MAX_GENERATED_TEST_SIZE) {
    throw new Error(`Generated test file exceeds the ${MAX_GENERATED_TEST_SIZE}-byte execution limit.`);
  }
  const source = await readFile(path, "utf8");
  const markers = source.split(/\r?\n/).filter(line => line.startsWith(EXECUTION_PLAN_MARKER));
  const marker = markers[0];
  if (!marker) throw new Error("Test file has no guided-approval metadata; generate it through the guide command first.");
  if (markers.length > 1) throw new Error("Generated test file contains ambiguous execution-plan metadata.");

  let value: unknown;
  try {
    value = JSON.parse(marker.slice(EXECUTION_PLAN_MARKER.length));
  } catch (error) {
    throw new Error("Generated execution-plan metadata is invalid JSON.", { cause: error });
  }
  if (value === null) {
    throw new Error("Test file has no guided approval; generate it through the guide command first.");
  }
  if (!isApprovedExecutionPlan(value)) {
    throw new Error("Test file does not contain valid approval metadata from a guided plan.");
  }
  if (generatedExecutionContentFingerprint(source) !== value.generatedContentFingerprint) {
    throw new Error("Generated test source does not match the approved plan content.");
  }
  return value;
}

export function validateAuthorizedTarget(target: string): AuthorizedTarget {
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch (error) {
    throw new Error("The target must be an absolute HTTP(S) URL.", { cause: error });
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Only HTTP and HTTPS API targets are supported.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Do not put credentials in the target URL; use the supported environment variables.");
  }
  if (parsed.search || parsed.hash) {
    throw new Error("Target URLs must not include a query string or fragment.");
  }
  if (parsed.protocol === "http:" && !isLoopback(parsed.hostname)) {
    throw new Error("Non-loopback targets must use HTTPS.");
  }
  return {
    url: parsed.toString(),
    fingerprint: createHash("sha256").update(parsed.toString()).digest("hex")
  };
}

export function resolveGeneratedTestFile(filePath: string, workingDirectory = process.cwd()): string {
  const generatedDirectory = resolve(workingDirectory, "tests", "generated");
  const resolvedPath = resolve(workingDirectory, filePath);
  const relativePath = relative(generatedDirectory, resolvedPath);
  if (!relativePath || relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error("The test file must be inside tests/generated.");
  }
  if (!resolvedPath.endsWith(".spec.ts")) {
    throw new Error("The test file must use the .spec.ts extension.");
  }
  return resolvedPath;
}

function isApprovedExecutionPlan(value: unknown): value is ApprovedExecutionPlan {
  if (typeof value !== "object" || value === null) return false;
  const plan = value as Partial<ApprovedExecutionPlan>;
  if (typeof plan.workflowId !== "string" || !plan.workflowId
    || typeof plan.planId !== "string" || !plan.planId
    || typeof plan.planRevision !== "number" || !Number.isSafeInteger(plan.planRevision) || plan.planRevision < 1
    || typeof plan.specFingerprint !== "string" || !/^[\da-f]{64}$/.test(plan.specFingerprint)
    || typeof plan.generatedContentFingerprint !== "string" || !/^[\da-f]{64}$/.test(plan.generatedContentFingerprint)
    || typeof plan.approvalBinding !== "string" || !/^[\da-f]{64}$/.test(plan.approvalBinding)
    || !isStringArray(plan.caseIds) || plan.caseIds.length === 0
    || !isStringArray(plan.runnableCaseIds)
    || !isStringArray(plan.mutatingCaseIds)
    || !isStringArray(plan.authenticationEnvironmentVariables)) {
    return false;
  }
  if (new Set(plan.caseIds).size !== plan.caseIds.length
    || new Set(plan.runnableCaseIds).size !== plan.runnableCaseIds.length
    || new Set(plan.mutatingCaseIds).size !== plan.mutatingCaseIds.length
    || new Set(plan.authenticationEnvironmentVariables).size !== plan.authenticationEnvironmentVariables.length
    || plan.mutatingCaseIds.some(caseId => !plan.caseIds?.includes(caseId))) {
    return false;
  }
  if (plan.runnableCaseIds.some(caseId => !plan.caseIds?.includes(caseId))
    || plan.mutatingCaseIds.some(caseId => !plan.runnableCaseIds?.includes(caseId))) {
    return false;
  }
  const bindingInput = {
    workflowId: plan.workflowId,
    planId: plan.planId,
    planRevision: plan.planRevision,
    specFingerprint: plan.specFingerprint,
    caseIds: plan.caseIds,
    runnableCaseIds: plan.runnableCaseIds,
    mutatingCaseIds: plan.mutatingCaseIds,
    authenticationEnvironmentVariables: plan.authenticationEnvironmentVariables,
    generatedContentFingerprint: plan.generatedContentFingerprint
  };
  return executionPlanBinding(bindingInput) === plan.approvalBinding;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string" && item.length > 0);
}

function isLoopback(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}
