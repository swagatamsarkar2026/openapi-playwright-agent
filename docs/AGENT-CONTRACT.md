# Provider-neutral MVP1 agent contract

## Product boundary

MVP1 is a guided, deterministic CLI for preparing API tests from an OpenAPI/Swagger specification:

1. Read and validate a local specification.
2. Prepare stable-ID test cases from contract facts.
3. Explain each case, its evidence, sample provenance, preconditions, steps, expected results, and uncertainty.
4. Let the user include or exclude generated candidates and review the proposed plan.
5. Require explicit approval of the current plan revision before generating Playwright tests.

MVP1 does not call a model or send inference data outside the user's machine. It does not execute API requests, collect credentials, or authorize mutating operations. API execution and target/authentication approval belong to MVP2. Provider/model selection and hosting remain deferred until service-line guidance is available.

## Trust and evidence rules

- OpenAPI parsing and test-case derivation are deterministic and remain the source of contract facts.
- A contract fact must link to the specification fingerprint and an OpenAPI JSON Pointer (or an explicit document-level pointer when the claim applies to the whole document).
- Sample values identify their source: example, default, enum, or schema-derived. They are candidate values, not evidence that a resource exists in a target service.
- User edits are labeled `user-provided`; they never appear as specification facts.
- Additional scenarios not derivable from the spec are labeled `proposal` and require an explicit user decision. MVP1 does not invent or automatically execute them.
- Conflicting or missing contract information is shown as uncertainty/manual review; the tool must not silently infer a success criterion.
- Specification description text is untrusted data, never an instruction to the application or a command to execute.

## Workflow states

| State | Meaning | Allowed next states |
|---|---|---|
| `idle` | No workflow is active. | `spec-loaded`, `cancelled` |
| `spec-loaded` | Local spec parsed, bounded, validated, and fingerprinted. | `plan-review`, `failed`, `cancelled` |
| `plan-review` | Stable cases are prepared and shown; the current revision is unapproved. | `plan-review` (edit), `plan-approved`, `cancelled`, `failed` |
| `plan-approved` | User explicitly approved the current revision and included case IDs. | `generated`, `plan-review` (any edit invalidates approval), `cancelled`, `failed` |
| `generated` | Tests were generated from exactly the approved revision and included cases. | `plan-review` (new revision), `cancelled` |
| `cancelled` | User exited; no request was sent. | `idle` |
| `failed` | A tool failed with an actionable error. | `plan-review` only after an explicit retry/restart, or `cancelled` |

Each edit increments `planRevision` and invalidates prior approval and generated-output eligibility. Approval binds to the specification fingerprint, plan revision, and included case IDs. Generation rejects missing, stale, or mismatched approval. Changing the objective, spec, cases, or their inputs starts a new plan revision.

## Typed deterministic tools

These are application-owned functions, not model-callable APIs in MVP1. Each tool validates its input, returns a typed result or a typed error, and has no hidden network or shell side effects.

| Tool | Input | Output / constraints |
|---|---|---|
| `inspectSpec` | `{ specPath: string }` | Validated spec identity (`title`, `version`, `specVersion`, fingerprint) and operation summary. Reads only the selected file; external `$ref` is rejected by the current policy. |
| `preparePlan` | `{ specFingerprint: string, objective?: string }` | `planId`, `planRevision: 1`, candidate cases, evidence, provenance, steps, expected results, and warnings. Objective is context only and cannot change contract-derived assertions. |
| `revisePlan` | `{ planId: string, expectedRevision: number, includeCaseIds: string[] }` | New plan revision with the selected stable case IDs. Rejects unknown/duplicate IDs and stale revisions; invalidates previous approval. MVP1 supports selection, not arbitrary assertion editing. |
| `approvePlan` | `{ planId: string, planRevision: number, includeCaseIds: string[] }` | Approval token bound to the exact plan revision and case selection after an explicit interactive confirmation. No implied/default approval. |
| `generateApprovedTests` | `{ planId: string, planRevision: number, approvalToken: string, outputPath: string }` | Generated Playwright tests and a summary. Rejects stale approvals and writes tests only for approved included cases. Does not execute them. |
| `runApprovedTests` | `{ planId: string, planRevision: number, approvalToken: string, target: string, includeMutating: boolean }` | **Unavailable in MVP1.** In MVP2 it requires separate target authorization and mutation approval and returns redacted results. |
| `summarizeRunResults` | `{ resultsPath: string }` | **Unavailable in MVP1.** In a later phase it may summarize validated machine-readable results without making unsupported causal claims. |

`approvalToken` is an opaque, local workflow value, not a credential. It must not be persisted in generated source or emitted in user-facing logs. MVP1 may use an in-memory token; if approval persistence is later required, it must be bound to a content hash and stored with restrictive local permissions.

## Audit events

Record local, structured events for `spec_inspected`, `plan_prepared`, `case_selection_changed`, `plan_approved`, `approval_invalidated`, `tests_generated`, `cancelled`, and `tool_failed`. Events include workflow/plan ID, revision, case IDs where applicable, timestamp, and outcome. Do not record credentials, raw HTTP data, full spec contents, or unredacted secret-like values. A failure event includes an error category and actionable safe message, not an arbitrary exception dump.

## Failure and interruption behavior

- Invalid input, unreadable files, unsupported formats, and resource-bound violations produce explicit actionable errors; no empty/success-shaped plan is returned.
- A user cancellation returns `cancelled`; it never implies approval or resumes at generation.
- A process interruption before approval leaves no approved plan. After approval, generation still revalidates the approval binding before writing.
- Output-write failures are surfaced and must not be reported as successful generation.
- Tool errors preserve the current plan revision where safe; a failed or timed-out action does not advance state.
- No retries happen silently. The CLI tells the user what failed and offers an explicit retry or safe exit.

## MVP1 acceptance gates

- No model/provider SDK or outbound inference is present.
- Analysis and review never send API requests or invoke arbitrary shell commands.
- Case IDs and evidence survive include/exclude edits.
- Any plan change invalidates approval; generation without current explicit approval is rejected.
- Generated tests contain only included, approved cases and preserve mutating-operation safeguards.
- User cancellation, invalid selections, stale approvals, and output failures are covered by tests.
