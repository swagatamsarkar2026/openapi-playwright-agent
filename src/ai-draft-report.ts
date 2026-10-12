import type { DraftManualCase } from "./model-provider.js";
import { redactSensitiveText } from "./redaction.js";

function markdownText(value: string): string {
  return redactSensitiveText(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("`", "\\`")
    .replaceAll("*", "\\*")
    .replaceAll("_", "\\_")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ");
}

export function renderManualCaseDrafts(drafts: readonly DraftManualCase[], specFingerprint: string): string {
  const sections = drafts.map(draft => [
    `## ${markdownText(draft.draftId)}: ${markdownText(draft.title)}`,
    "",
    `- Operation: ${markdownText(draft.operationId)}`,
    "- Status: AI-generated proposal; manual review required; not executable",
    ...(draft.automationCandidateCaseId
      ? [`- Grounded automation candidate: ${markdownText(draft.automationCandidateCaseId)} (promotion requires explicit review and approval)`]
      : ["- Grounded automation candidate: none; keep this proposal manual until its inputs and assertions can be grounded."]),
    `- Intent: ${markdownText(draft.intent)}`,
    `- Evidence pointers: ${draft.evidencePointers.map(markdownText).join(", ")}`,
    "",
    "### Preconditions",
    ...(draft.preconditions.length > 0 ? draft.preconditions.map(item => `- ${markdownText(item)}`) : ["- None stated."]),
    "",
    "### Steps",
    ...draft.steps.flatMap((step, index) => [
      `${index + 1}. ${markdownText(step.action)}`,
      `   Expected: ${markdownText(step.expectedResult)}`
    ]),
    "",
    "### Open questions",
    ...(draft.openQuestions.length > 0 ? draft.openQuestions.map(item => `- ${markdownText(item)}`) : ["- None stated."])
  ].join("\n"));

  return [
    "# AI-Drafted Manual API Test Cases",
    "",
    "> These are proposals for human review. They are not included in generated Playwright tests and must not be run as-is.",
    "",
    `Source spec SHA-256: ${markdownText(specFingerprint)}`,
    "",
    ...(sections.length > 0 ? sections : ["No draft cases were returned."]),
    ""
  ].join("\n");
}