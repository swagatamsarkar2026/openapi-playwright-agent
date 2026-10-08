# OpenAPI Playwright Agent backlog

This file tracks delivery status for the generic API test generator and the planned agentic service-line demo. **Implemented (unverified)** means code or documentation is present but has not passed the relevant checks. Mark items **Verified** only after running and recording those checks.

## Phased implementation roadmap

Work proceeds in order. A phase is complete only when its exit criteria pass; code being present is not enough. P0 dependencies or decisions block later phases where noted.

| Phase | Name | Status | Depends on | Exit gate |
|---|---|---|---|---|
| 0 | Deterministic API test foundation | Complete for current verification scope | None | Existing CLI, parser, case plan, generation, typecheck/tests/build, and sample generated-test discovery pass. This does not mean broad API compatibility is fully tested. |
| 1 | Harden and validate the test engine | In progress | Phase 0 | Serialization/auth/schema/error-path tests pass; generated artifacts are typechecked; execution diagnostics and resource/secret handling have documented tests. |
| 2 | Agent product and tool contract | Not started | Phase 1; provider/hosting decision | Conversational CLI flow, provider constraints, typed tool schemas, state transitions, and approval policy are reviewed and documented before model integration. |
| 3 | Conversational CLI MVP | Not started | Phase 2 | User can provide a spec/objective, receive grounded case explanations, and revise/exclude cases through a guided terminal session; no test execution happens implicitly. |
| 4 | Approval-gated generation and execution | Not started | Phase 3 | Approved cases produce tests; target and mutating-operation confirmations are enforced in code; agent cannot execute arbitrary shell commands or bypass deterministic tools. |
| 5 | Results, audit, and agent quality | Not started | Phase 4 | Results are linked to case IDs and steps; audit trail and redaction work; agent safety and usability tests pass. |
| 6 | Service-line demo readiness | Not started | Phase 5 | Safe demo target, reset plan, scripted walkthrough, known limitations, and end-to-end acceptance criteria are verified. |

### Phase 0 — Deterministic API test foundation

- [x] Install Node.js 20+ and project dependencies.
- [x] Implement generic Swagger/OpenAPI analyze, generate, and run CLI.
- [x] Produce detailed, stable-ID test plans and Playwright test candidates.
- [x] Pass current typecheck, unit tests, build, generated-output typecheck, and Playwright discovery.
- Broader test coverage beyond the current Petstore and minimal version fixtures is tracked in Phase 1.

### Phase 1 — Harden and validate the test engine

- [x] Add broader deterministic tests for Swagger/OpenAPI examples, defaults, enums, request bodies, security, warnings, and operation/response variants (VAL-04).
- [x] Improve schema assertions and parameter serialization edge coverage; explicitly test unsupported styles (VAL-05).
- [ ] Add machine-readable run results and actionable failure diagnostics with secrets redacted (VAL-06).
- [ ] Review and test local/remote `$ref` policy, input/resource bounds, and secret redaction (VAL-07).
- **Exit:** targeted tests cover supported and deliberately unsupported inputs; generated output remains type-safe; result and security behavior is documented and tested.

### Phase 2 — Agent product and tool contract

- [ ] Decide approved model/provider, external inference/data policy, and hosting constraints (AGT-01).
- [ ] Specify conversation states, typed tools, approval states, audit events, and error/interrupt behavior (AGT-02).
- [ ] Define what assertions are spec-grounded facts versus user/model-proposed cases, and how each links to evidence.
- **Exit:** product/security review approves the conversational CLI architecture and a provider-neutral tool boundary before any model SDK is added.

### Phase 3 — Conversational CLI MVP

- [ ] Implement guided intake for spec, objective, authorized target, auth approach, and exclusions (AGT-03).
- [ ] Show per-case evidence, input provenance, steps, expected results, and uncertainty; support revise/exclude/approve (AGT-04).
- [ ] Add the interactive terminal workflow and resumable/helpful prompts (AGT-08).
- **Exit:** a user can inspect and edit a grounded plan interactively; the CLI never runs requests as a side effect of analysis or conversation.

### Phase 4 — Approval-gated generation and execution

- [ ] Generate tests only from the current approved plan revision.
- [ ] Require explicit authorized-target confirmation before any API request.
- [ ] Require a separate opt-in for mutating requests and default to an isolated non-production environment (AGT-05).
- [ ] Implement bounded orchestration and audit of tool calls, approvals, changes, and outcomes (AGT-06).
- **Exit:** tests prove unapproved plans, targets, and mutating operations cannot reach the API; the model cannot invoke arbitrary shell execution.

### Phase 5 — Results, audit, and agent quality

- [ ] Present grounded run summaries by case ID and step, including pass/fail/skip, expected/actual outcome, and redacted evidence (AGT-07).
- [ ] Add tests for prompt injection in specs, unsupported claims, approval bypass, secret leakage, invalid tool arguments, interruptions, and summaries (AGT-10).
- **Exit:** result summaries are traceable to test-run evidence; adversarial and failure-path tests pass.

### Phase 6 — Service-line demo readiness

- [ ] Select and prepare a safe, repeatable demo target and cleanup/reset procedure (AGT-09).
- [ ] Document the scripted walkthrough, demo inputs, credentials setup, limitations, and recovery steps.
- [ ] Complete all [service-line demo exit criteria](#service-line-demo-exit-criteria).
- **Exit:** a colleague can run the demo from a clean setup, complete the guided workflow, and verify results without production access or undocumented manual intervention.

### Recommended next actions

1. VAL-04 and VAL-05 now pass; continue Phase 1 with VAL-06 (machine-readable run results and failure diagnostics).
2. In parallel, obtain the approved model/provider and hosting constraints for AGT-01; do not add a provider SDK before this is decided.
3. Complete Phase 1's exit gate, then lock the Phase 2 tool contract before implementing the conversational layer.

## Implemented foundation

| ID | Item | Status | Evidence / notes |
|---|---|---|---|
| FND-01 | TypeScript CLI commands for `analyze`, `generate`, and `run` | Verified | `npm run build`; commands implemented in `src/cli.ts` |
| FND-02 | Swagger 2.0 and OpenAPI 3.0/3.1 JSON/YAML parsing and validation | Verified for fixture coverage | `npm test` covers Swagger 2.0, OpenAPI 3.0.0, and 3.1.0 |
| FND-03 | Shared operation model and test-case generation from spec responses | Verified for fixture coverage | Tests confirm stable case IDs, documented 2xx candidates, and 4xx review proposal |
| FND-04 | Detailed Markdown plan with risk, inputs, source provenance, preconditions, steps, expected results, and warnings | Verified for fixture coverage | Plan-rendering assertions pass; illustrative plan at `examples/petstore/TEST-PLAN-EXAMPLE.md` |
| FND-05 | Playwright TypeScript API test generation with named `test.step` actions | Verified for sample output | Generated fixture test TypeScript check and Playwright discovery pass; no API requests were sent |
| FND-06 | Mutating operations require opt-in for both generation and execution | Verified by source/typecheck and test coverage | `POST` fixture is skipped by default; execution path requires separate run option |
| FND-07 | Environment-variable based supported authentication | Implemented; needs dedicated tests | Bearer, OAuth token, basic, and API key |
| FND-08 | Sample Petstore spec; sample behavior is not hard-coded into the parser | Verified for fixture coverage | `examples/petstore/openapi.yaml` |
| FND-09 | README and restart/context handoff | Implemented | `README.md`, `HANDOFF.md` |

## Validation and engineering backlog

| ID | Priority | Item | Status | Acceptance criteria |
|---|---|---|---|---|
| VAL-01 | P0 | Install Node.js 20+ and project dependencies | Done | Verified after VS Code restart: Node.js 24.21.0 resolves on PATH; npm 11.19.0 works via `npm.cmd` (PowerShell blocks `npm.ps1` by execution policy); install completed with 0 reported vulnerabilities. |
| VAL-02 | P0 | Run typecheck, unit tests, and build; repair issues | Passed (2026-10-08) | `npm.cmd run typecheck`, `npm.cmd test` (5 passing), and `npm.cmd run build` all pass. |
| VAL-03 | P0 | Typecheck generated Playwright output, not only generator source | Passed (2026-10-08) | Generated Petstore output typechecked and `playwright test --list` discovered 4 cases. No live API request was made. Fixed generated case typing discovered during check. |
| VAL-04 | P1 | Expand deterministic tests for cases, request serialization, security, and plan rendering | Passed (2026-10-08) | Five unit tests pass. Coverage includes Swagger 2.0, OpenAPI 3.0/3.1, parameter examples/defaults/enums, named request-body examples, multiple 2xx responses, documented 4xx response properties, API-key environment wiring, unsupported serialization warnings, stable IDs, and mutation default. |
| VAL-05 | P1 | Improve contract assertions and serialization edge coverage | Passed (2026-10-08) | Seven unit tests pass. Generated requests serialize supported query form arrays/objects, deepObject, delimited arrays, simple path arrays/scalars, and simple headers. Unsupported styles, cookies, nested non-primitive parameter values, and allowReserved are flagged for review. Response assertions validate nested required fields, types (including OpenAPI 3.1 union types), enums, numeric bounds, string lengths, and array items. |
| VAL-06 | P1 | Add generated-test run result export and failure diagnostics | Not started | User can associate each result with case ID, step, request metadata (secrets redacted), expected/actual status, and response diagnostics. |
| VAL-07 | P1 | Review remote/local `$ref` safety, resource limits, and secret redaction | Not started | Trusted-reference policy, bounded input/resource use, and redaction behavior are documented and tested. |

## Agentic application backlog

The target is an agentic application that assists the user while keeping execution deterministic, reviewable, and bounded. No LLM, conversational agent, web UI, or agent orchestration has been implemented yet.

| ID | Priority | Item | Status | Acceptance criteria |
|---|---|---|---|---|
| AGT-01 | P0 | Decide approved model/provider strategy and hosting constraints | Open decision | Select the approved model/provider/runtime and hosting constraints. The interaction surface is decided: conversational CLI. Keep the core test engine provider-neutral. |
| AGT-02 | P0 | Define agent workflow and typed tool contract | Not started; blocked on AGT-01 | Document state transitions and typed tools for inspect-spec, prepare-cases, revise/approve-plan, generate-tests, run-approved-tests, and summarize-results. Agent cannot bypass tool validation. |
| AGT-03 | P0 | Implement conversational/project intake | Not started; blocked on AGT-01 | User can provide a spec, target environment, test objective, auth requirements, and exclusions; agent asks for missing safety-critical details rather than guessing. |
| AGT-04 | P0 | Add grounded test-case explanation and user edits | Not started; blocked on AGT-02 | Every suggested assertion is linked to spec evidence or labeled as a proposal; user can approve, edit, exclude, or request alternatives before generation. |
| AGT-05 | P0 | Add approval gates and execution policy | Not started; blocked on AGT-02 | No request is sent until the user confirms an authorized target; mutating tests need separate explicit approval and default to a non-production environment. |
| AGT-06 | P1 | Implement bounded agent orchestration with audit trail | Not started; blocked on AGT-01/AGT-02 | Tool calls, approvals, case changes, and outcomes are recorded; retries/steps have limits; model output is schema-validated and cannot inject arbitrary shell execution. |
| AGT-07 | P1 | Add guided results interpretation | Not started; blocked on VAL-06/AGT-02 | Agent summarizes pass/fail/skip by stable case ID, cites step evidence, distinguishes spec defects from service failures, and does not fabricate causes. |
| AGT-08 | P1 | Implement conversational CLI experience for the demo | Not started; blocked on AGT-01/AGT-03 | Demo user can complete the agreed workflow through guided CLI prompts without editing generated files manually. |
| AGT-09 | P1 | Prepare safe demo dataset/spec and scripted walkthrough | Not started | Reproducible demo uses a non-production target, known credentials or mock auth, representative positive/negative cases, and documented reset/cleanup. |
| AGT-10 | P1 | Add agent-specific quality, safety, and usability tests | Not started; blocked on AGT-03/AGT-06 | Tests cover prompt injection in specs, unsupported claims, approval bypass, secret leakage, tool argument validation, interruptions, and clear result summaries. |

## Service-line demo exit criteria

- [ ] A user can supply a generic Swagger/OpenAPI spec and a test objective.
- [ ] The application explains the proposed cases and shows spec-derived evidence, steps, expected results, risks, and uncertainties.
- [ ] The user can revise and approve a plan before test code is generated.
- [ ] The agent uses bounded typed tools; model output cannot directly execute arbitrary commands or send unapproved API requests.
- [ ] Target service authorization is confirmed before execution; state-changing operations require explicit opt-in and an isolated demo target.
- [ ] Results are traceable to stable case IDs and numbered steps, with secrets removed from reports.
- [ ] The demo walkthrough, sample inputs, cleanup/reset, and known limitations are documented.
- [ ] Node-based typecheck, tests, generated-test discovery, and build pass in the approved demo environment.

## Decisions to record

| Decision | Status | Notes |
|---|---|---|
| Interaction surface | Decided: conversational CLI | Selected for the service-line demo; implement as an interactive guided terminal workflow. |
| Approved LLM/model provider and whether inference can use external services | Open | Must follow service-line data and security policy. |
| Demo API: local mock, dedicated test environment, or approved public sandbox | Open | Mutating demo cases must not target production. |
| Authentication/secret storage mechanism for the application | Open | Never place actual credentials in specs, generated source, or checked-in files. |
