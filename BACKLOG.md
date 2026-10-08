# OpenAPI Playwright Agent backlog

This file tracks delivery status for the generic API test generator and the planned agentic service-line demo. **Implemented (unverified)** means code or documentation is present but has not passed the relevant checks. Mark items **Verified** only after running and recording those checks.

## Source control and collaboration

- `main` is the stable, release-ready branch; `develop` is the shared integration branch.
- Create every code, test, or documentation change on a short-lived feature branch from the latest `develop`; do not commit directly to `main` or `develop`.
- Push feature branches and use pull requests into `develop` for review and validation. Promote validated `develop` to `main` through a release pull request.
- See the step-by-step commands and branch protection guidance in the README's [Git workflow](./README.md#collaboration-and-git-workflow).

## Phased implementation roadmap

Work proceeds in order. A phase is complete only when its exit criteria pass; code being present is not enough. P0 dependencies or decisions block later phases where noted.

| Phase | Name | Status | Depends on | Exit gate |
|---|---|---|---|---|
| 0 | Deterministic API test foundation | Complete for current verification scope | None | Existing CLI, parser, case plan, generation, typecheck/tests/build, and sample generated-test discovery pass. This does not mean broad API compatibility is fully tested. |
| 1 | Harden and validate the test engine | Complete for documented verification scope | Phase 0 | Serialization/auth/schema/error-path tests pass; generated artifacts are typechecked; execution diagnostics and resource/secret handling have documented tests. |
| 2 | Provider-neutral MVP1 product and tool contract | Complete; merged to develop/main | Phase 1 | MVP1 boundary, typed deterministic tools, workflow states, approvals, evidence/provenance, audit events, and failure/interrupt behavior are documented without selecting a model provider. |
| 3 | Deterministic guided CLI MVP1 | Complete | Phase 2 | User can provide a spec/objective, inspect grounded cases, include/exclude candidates, approve a plan revision, and generate tests only from that approved plan. No network execution or model integration occurs. |
| 4 | Authorized API execution MVP2 | Not started | Phase 3 | Execution requires explicit authorized-target approval; mutating calls need separate approval; results are tied to the approved plan revision and redacted. |
| 5 | Optional model integration and agent quality | Deferred; service-line guidance required | MVP1; provider/data/hosting approval | Provider strategy and inference/data policy are approved; model is limited to the provider-neutral contract; groundedness, prompt-injection, approval-bypass, secret, and interruption tests pass. |
| 6 | Service-line demo readiness | Not started | Phase 4; Phase 5 only if model integration is approved for demo | Safe demo target, reset plan, known limitations, and end-to-end acceptance criteria are verified. MVP1 can be demonstrated without an LLM. |

### Phase 0 — Deterministic API test foundation

- [x] Install Node.js 20+ and project dependencies.
- [x] Implement generic Swagger/OpenAPI analyze, generate, and run CLI.
- [x] Produce detailed, stable-ID test plans and Playwright test candidates.
- [x] Pass current typecheck, unit tests, build, generated-output typecheck, and Playwright discovery.
- Broader test coverage beyond the current Petstore and minimal version fixtures is tracked in Phase 1.

### Phase 1 — Harden and validate the test engine

- [x] Add broader deterministic tests for Swagger/OpenAPI examples, defaults, enums, request bodies, security, warnings, and operation/response variants (VAL-04).
- [x] Improve schema assertions and parameter serialization edge coverage; explicitly test unsupported styles (VAL-05).
- [x] Add machine-readable run results and actionable failure diagnostics with secrets redacted (VAL-06).
- [x] Review and test local/remote `$ref` policy, input/resource bounds, and secret redaction (VAL-07).
- **Exit:** targeted tests cover supported and deliberately unsupported inputs; generated output remains type-safe; result and security behavior is documented and tested.

Phase 1 verification: 9 unit tests, typecheck, build, generated-test TypeScript check, and Playwright discovery passed. A temporary local mock API run verified JSON results for an HTTP status mismatch and confirmed the API key did not appear in report or console output. No live API target was contacted. External `$ref` values are deliberately unsupported; only internal references are resolved.

### Phase 2 — Provider-neutral MVP1 product and tool contract

- [x] Draft MVP1 as a deterministic guided CLI: inspect a spec, explain generated cases, edit case inclusion, approve a plan revision, and generate tests from that approved revision only.
- [x] Draft conversation states, typed deterministic tools, audit events, and error/interrupt behavior (AGT-02).
- [x] Draft fact/proposal labels and evidence-link requirements for contract assertions and user edits.
- [x] Defer the model/provider, external inference/data policy, and hosting decision (AGT-01) until service-line guidance is received. No model SDK or outbound inference in MVP1.
- [x] Review the provider-neutral MVP1 contract and merge it through develop/main.
- **Exit:** MVP1 product boundary and provider-neutral contracts are reviewed and documented; generation and execution approval boundaries are explicit. Passed with the contract merge in Phase 2.

### Phase 3 — Deterministic guided CLI MVP1

- [x] Implement guided local intake for specification and testing objective (AGT-03; target/auth intake is deferred to execution MVP2).
- [x] Show per-case evidence, input provenance, preconditions, steps, expected results, and uncertainty; support include/exclude review (AGT-04).
- [x] Add an interactive terminal workflow with helpful prompts and safe cancellation (AGT-08).
- [x] Require explicit plan approval before generating tests; bind approval to a plan revision and invalidate it when the plan changes.
- [x] Verify EOF cancellation, output-write and audit-sink failure behavior, and selected-case generated-artifact TypeScript checking and Playwright discovery; implement process/readline Ctrl+C cancellation.
- **Exit:** user can inspect and approve a grounded plan and generate only its included cases; conversation/analysis never sends API requests.

### Phase 4 — Authorized API execution MVP2

- [ ] Collect and confirm an authorized non-production target and authentication approach before any API request.
- [ ] Require separate explicit approval for execution and a separate opt-in for mutating calls (AGT-05).
- [ ] Bind execution and results to the approved plan revision; preserve redacted result reporting.
- [ ] Implement bounded deterministic orchestration and audit of tool calls, approvals, plan changes, and outcomes (AGT-06).
- **Exit:** tests prove unapproved plans, targets, and mutating operations cannot reach the API; no arbitrary shell execution is exposed.

### Phase 5 — Optional model integration and agent quality

- [ ] Obtain approved model/provider, inference/data policy, and hosting decisions from service-line guidance (AGT-01).
- [ ] If approved, integrate through the provider-neutral tool contract; keep model output schema-validated and unable to bypass approvals.
- [ ] Present grounded result summaries by case ID and step (AGT-07).
- [ ] Add prompt-injection, unsupported-claim, approval-bypass, secret-leakage, invalid-argument, interruption, and summary tests (AGT-10).
- **Exit:** any approved model integration stays within typed tools and passes groundedness, safety, and usability tests. This phase may remain deferred without blocking the non-LLM MVP1.

### Phase 6 — Service-line demo readiness

- [ ] Select and prepare a safe, repeatable demo target and cleanup/reset procedure (AGT-09).
- [ ] Document the scripted walkthrough, demo inputs, credentials setup, limitations, and recovery steps.
- [ ] Complete all [service-line demo exit criteria](#service-line-demo-exit-criteria).
- **Exit:** a colleague can run the demo from a clean setup, complete the guided workflow, and verify results without production access or undocumented manual intervention.

### Recommended next actions

1. Create a PR from `feature/guided-cli-mvp1` into `develop`; promote to `main` only through the established branch workflow.
2. Begin Phase 4 only with an explicitly authorized non-production target and clear execution approval policy; MVP1 can already prepare and review test candidates without API access.
3. Ask the service line for model/provider, inference/data, and hosting guidance before starting optional Phase 5.
4. Keep all implementation work on a short-lived feature branch from `develop` and use pull requests for integration.

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
| VAL-02 | P0 | Run typecheck, unit tests, and build; repair issues | Passed (2026-10-08) | `npm.cmd run typecheck`, `npm.cmd test` (9 passing), and `npm.cmd run build` all pass. |
| VAL-03 | P0 | Typecheck generated Playwright output, not only generator source | Passed (2026-10-08) | Generated Petstore output typechecked and `playwright test --list` discovered 4 cases. No live API request was made. Fixed generated case typing discovered during check. |
| VAL-04 | P1 | Expand deterministic tests for cases, request serialization, security, and plan rendering | Passed (2026-10-08) | Unit tests cover Swagger 2.0, OpenAPI 3.0/3.1, parameter examples/defaults/enums, named request-body examples, multiple 2xx responses, documented 4xx response properties, API-key environment wiring, unsupported serialization warnings, stable IDs, and mutation default. |
| VAL-05 | P1 | Improve contract assertions and serialization edge coverage | Passed (2026-10-08) | Seven unit tests pass. Generated requests serialize supported query form arrays/objects, deepObject, delimited arrays, simple path arrays/scalars, and simple headers. Unsupported styles, cookies, nested non-primitive parameter values, and allowReserved are flagged for review. Response assertions validate nested required fields, types (including OpenAPI 3.1 union types), enums, numeric bounds, string lengths, and array items. |
| VAL-06 | P1 | Add generated-test run result export and failure diagnostics | Passed (2026-10-08) | Custom Playwright reporter writes JSON records with case ID, step kind, method/path template, expected/actual status, and safe failure diagnostics. End-to-end local mock returned an intentional 418 against expected 200; report contained the mismatch and redacted API key, verified in JSON and console output. |
| VAL-07 | P1 | Review remote/local `$ref` safety, resource limits, and secret redaction | Passed (2026-10-08) | Only internal `$ref` values are accepted; external file/network references are rejected before parser validation. Enforces 5 MiB input, 300,000 document nodes, 10,000 references, depth 100, 1,000 operations, and parser timeout; tests cover external-ref rejection, size/depth limits, and secret-pattern redaction. Response Content-Length above 5 MiB skips JSON assertion parsing (not a transport-level cap). |

## Agentic application backlog

The near-term target is a deterministic, provider-neutral MVP1 guided CLI. No LLM, conversational agent, web UI, or model orchestration has been implemented yet. See `docs/AGENT-CONTRACT.md` for the product boundary and tool contract.

| ID | Priority | Item | Status | Acceptance criteria |
|---|---|---|---|---|
| AGT-01 | P0 | Decide approved model/provider strategy and hosting constraints | Deferred by user until service-line guidance | No provider decision is needed for MVP1. Before optional model integration, confirm approved provider/runtime, external inference/data policy, and hosting constraints. Keep the core test engine provider-neutral. |
| AGT-02 | P0 | Define agent workflow and typed tool contract | Complete; merged to develop/main | Document states, deterministic typed tools, approval/revision binding, audit events, evidence, and failure/interrupt behavior. MVP1 excludes run/summarize tools. |
| AGT-03 | P0 | Implement MVP1 local intake | Complete; Phase 3 | User can provide a local spec and testing objective. Target/auth intake belongs to MVP2 before API execution. |
| AGT-04 | P0 | Add grounded test-case explanation and selection | Complete; Phase 3 | Every contract assertion links to spec evidence or is labeled as a proposal; user can include/exclude candidates and approve before generation. |
| AGT-05 | P0 | Add execution approval policy | Deferred to MVP2 / Phase 4 | No request is sent until the user confirms an authorized target; mutating tests need separate explicit approval and a non-production target. MVP1 does not run tests. |
| AGT-06 | P1 | Implement bounded orchestration with audit trail | Deferred; only if model integration is approved | Record tool calls, approvals, plan changes, and outcomes; use bounded deterministic tools; model output, if added, is schema-validated and cannot invoke shell commands. |
| AGT-07 | P1 | Add guided result interpretation | Deferred to a post-MVP1 phase | Summarize pass/fail/skip by stable case ID, cite step evidence, distinguish observed outcomes from hypotheses, and do not fabricate causes. |
| AGT-08 | P1 | Implement deterministic guided CLI MVP1 | Complete; Phase 3 | User can complete the spec-to-approved-plan-to-test-generation workflow using guided prompts without editing generated files manually; no model or API request is required. |
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
| Approved LLM/model provider and whether inference can use external services | Deferred | User will request service-line guidance; model integration is not a prerequisite for MVP1. |
| Demo API: local mock, dedicated test environment, or approved public sandbox | Open | Mutating demo cases must not target production. |
| Authentication/secret storage mechanism for the application | Open | Never place actual credentials in specs, generated source, or checked-in files. |
