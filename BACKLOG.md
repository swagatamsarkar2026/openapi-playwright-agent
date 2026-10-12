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
| 3 | Deterministic guided CLI MVP1 | Complete | Phase 2 | User can provide a spec/objective, inspect grounded cases, include/exclude candidates, approve a plan revision, and generate tests only from that approved plan. No API-under-test execution occurs; optional post-MVP inference is separate and user-authorized. |
| 4 | Authorized API execution MVP2 | Complete; merged to develop/main | Phase 3 | Execution requires explicit authorized-target approval; mutating calls need separate approval; results are tied to the approved plan revision and redacted. |
| 5 | Optional model integration and agent quality | In progress; optional OpenAI prototype tested with mocks; external-data boundary documented | MVP1; public/synthetic-only demo scope | Model use stays opt-in and provider-bounded; no private inputs are sent during the demo; quality, approval-bypass, secret, and interruption tests pass. Private-data deployment policy is a future concern, not a demo exit gate. |
| 6 | Service-line demo readiness | In progress; clean-copy rehearsal passed 2026-10-11, colleague acceptance pending | Phase 4; Phase 5 only if model integration is approved for demo | The live Petstore Swagger contract is analyzed across its documented operations; reviewed representative calls are exercised through the guarded workflow, including mutations only where effects and cleanup are understood. Public-service limitations and end-to-end acceptance evidence are documented. MVP1 can be demonstrated without an LLM. |

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

- [x] Collect and confirm an authorized non-production target and authentication approach before any API request; require HTTPS except for loopback, preflight required environment credentials, and never print their values.
- [x] Require separate explicit approval for target, authentication, and execution; require a separate opt-in and confirmation for mutating cases (AGT-05).
- [x] Bind execution metadata, audit events, and result summaries to guided plan ID/revision and spec/target fingerprints; preserve redacted result reporting.
- [x] Implement bounded deterministic orchestration with a single generated test file, fixed Playwright entry point, per-test timeout, 10-minute process cap, and local audit of approvals/outcomes (AGT-06).
- **Verification at Phase 4 completion:** unapproved artifacts, declined targets, and missing credentials are rejected before API invocation; mutation approval is independently required; an authenticated read-only plan passed against an isolated local mock with plan-bound results and audit. Typecheck, all 17 tests in the suite at that point, build, and diff checks passed. No external target had been exercised.
- **Exit:** tests prove unapproved plans, targets, and mutating operations cannot reach the API; no arbitrary shell execution is exposed.

### Phase 4 follow-up — Petstore onboarding

- [x] Add a browser-friendly, step-by-step onboarding guide for spec intake, case review/approval, and guarded API execution using Petstore.
- [x] Validate the guide in a browser and run only the read-only `GET /store/inventory` case generated from Petstore's live Swagger 2.0 spec; record the observed result and any service limitations.
- **Verification:** `TC-GETINVENTORY-POS-200` passed against `https://petstore.swagger.io/v2/store/inventory` with the spec's public sample key. The bundled OpenAPI 3 fixture targets `/v1/pets`, which currently returns 404 from the live v2 service; the guide downloads the service's actual Swagger spec instead. Windows Node TLS required `--use-system-ca`; verification kept certificate validation enabled. No mutating calls were made.
- **Repeat verification (2026-10-09):** fetched the current live Swagger 2.0 spec, reviewed and approved only `TC-GETINVENTORY-POS-200`, and ran it through the guarded CLI against the same read-only Petstore endpoint. It passed with expected/actual HTTP 200 in 345 ms; the result recorded one pass, zero failures/skips, and zero mutating cases. The documented public sample key was scoped to the run command. The redacted JSON result and HTML report are ignored local artifacts. The HTML path can now be regenerated after each completed run with `--html-report test-results/petstore-live-inventory-report.html`; this does not update while cases are merely being edited or while execution is in progress. This verifies the onboarding path and selected read-only target, but does not complete Phase 6; Petstore remains a shared public service, not an isolated or guaranteed-availability sandbox.
- **Additional manual Petstore observation (2026-10-09):** a user-provided Swagger UI capture shows `POST /v2/pet/001/uploadImage` returning HTTP 200 for a multipart upload with `additionalMetadata=Test`. This is evidence that the public service accepted that call; it was not executed through the generated, approval-gated CLI. Persistence, repeatability, authorization scope, and cleanup behavior have not been established. Do not treat this observation as verification of other mutation operations.

### Phase 5 — Optional model integration and agent quality

- [x] Select OpenAI as an optional prototype provider; keep OpenAPI parsing and test generation provider-neutral.
- [x] Document the external-data boundary (AGT-01): the demo stays deterministic and sends no private specs or objectives to OpenAI. Any future deployment using private data needs an applicable data-retention/privacy review; this is not a demo blocker.
- [x] Verify the local OpenAI draft prototype: strict structured output, bounded requests, explicit outbound consent, safe errors, and no effect on deterministic selection/approval/generation. Verified with mocked provider tests; no live OpenAI request was made.
- [x] Extend AI-drafted manual cases through reviewer selection and controlled promotion into automation only when inputs and assertions can be grounded; keep unresolved scenarios manual. Promotion is limited to an exact, warning-free, non-mutating OpenAPI-derived case from the same operation; model-authored steps and code remain non-executable.
- [x] Present grounded result summaries by case ID and step (AGT-07).
- [ ] Complete prompt-injection, unsupported-claim, approval-bypass, secret-leakage, invalid-output, interruption, and summary tests (AGT-10).
- **AGT-07 verification (2026-10-08):** `summarize` validates schema-version-1 reports, computes outcomes from records, shows stable case IDs and available HTTP/step evidence, redacts displayed text, and makes no root-cause claims. Typecheck, build, and all 20 tests pass. This deterministic command does not imply model/provider integration is complete.
- **OpenAI prototype checkpoint (2026-10-10):** `guide --ai-draft-cases` requests exact `SEND TO OPENAI` consent, sends minimized operation context in groups of 20, validates operation references/evidence pointers, and writes manual-review-only Markdown outside the executable plan. The API key is used for OpenAI authentication and is not prompt/report content. At this checkpoint, all 27 tests, typecheck, build, and Playwright discovery (one generated test) passed; provider tests are mocked and no live OpenAI request has been made. The prototype is local and unmerged. The later HTML-report checkpoint below adds one test.
**Grounded AI-to-automation promotion (2026-10-11):** AI drafts can nominate only synthetic references to eligible read-only deterministic cases from the same operation. The user separately selects draft IDs to promote; promotion creates an unselected plan candidate by copying the exact source request, status, schema assertions, and steps. It increments the plan revision and is audited; the user must still select and approve that revision before Playwright generation. Unknown references and mutation promotion are rejected. Mocked provider and workflow tests pass; no live OpenAI request was made. `npm test` (32 tests), typecheck, build, and Playwright discovery (3 existing generated specs with `--reporter=list`) pass. This completes the controlled promotion slice, not Phase 5 as a whole.

- **Exit:** model output stays within validated proposal boundaries, can be reviewed and selectively promoted only through explicit deterministic gates, and passes groundedness, safety, and usability tests. Phase 6 can continue without completing this optional integration.

### Phase 6 — Service-line demo readiness

- [x] Use Petstore's live Swagger 2.0 contract to inventory and review all documented operations; select representative safe cases for the guarded demo. Keep candidates for unsupported or unsafe operations visible as review/manual items rather than implying they were executed.
- [x] Verify representative read and write cases through the guarded CLI. Before any live mutation, document effects, test data, authorization basis, and cleanup/recovery; use the local mock where public-service cleanup or repeatability is unknown. Record Petstore's shared-service and availability limitations (AGT-09).
- [x] Document the scripted walkthrough, demo inputs, credentials setup, limitations, and recovery steps.
- [x] Rehearse from a fresh `npm ci` copy: guided Petstore inventory against the loopback mock, guarded order creation/readback/restart cleanup against the mock, and guarded Frankfurter `/latest` against its read-only public API. All selected cases passed; no public Petstore mutation was sent.
- [ ] Complete all [service-line demo exit criteria](#service-line-demo-exit-criteria).
- **Exit:** a colleague can run the demo from a clean setup, complete the guided workflow, and verify results without production access or undocumented manual intervention.

**Local mock-to-live inventory verification (2026-10-10):** fetched Petstore's current Swagger 2.0 contract; analysis found 20 operations and 43 cases (9 automated candidates, 34 requiring manual review). The [dated generated test plan](./docs/petstore-live-plan-2026-10-10.md) records the full operation/case inventory and spec fingerprint. Approved only `TC-GETINVENTORY-POS-200` and ran the same generated test against the loopback mock and `https://petstore.swagger.io/v2`; both returned HTTP 200. The retained mock and live summaries each report one pass, zero failures/skips, and the expected case ID. The mock uses a local API key and fixture data; the live run used Petstore's documented sample key only in the process environment. This verifies one read-only route through the mock-to-live workflow, not the full operation inventory or any mutation.

**Full Petstore operation review (2026-10-11):** fetched and analyzed the current live Swagger 2.0 contract (fingerprint `77d18c99ee7f556e8dbcaf5e80ed788e6cb1a182f37f34229e7b0d956bf4757d`): 20 operations, 43 cases, 9 automated candidates, and 34 manual-review cases. Reviewed and dispositioned all operations in [`docs/petstore-demo-walkthrough.md`](./docs/petstore-demo-walkthrough.md). Selected only the already-verified read-only inventory operation. Other reads are deferred for unavailable OAuth2 or missing grounded resource inputs; writes are deferred unless a safe isolated target, expected result, test data, and cleanup are established. The fresh plan was generated under `/tmp`; this review did not execute API operations. Phase 6 remains open pending guarded representative read/write evidence and clean-setup walkthrough verification.

**Guarded local write regression (2026-10-11):** extended the loopback Petstore mock with in-memory `POST /store/order` and GET readback; stopping/restarting the mock clears created orders. A new integration test generated and approved `TC-PLACEORDER-POS-200` from a minimal OpenAPI 3.0 spec matching the Petstore route, ran the generated case through the guarded CLI with target, execution, and mutation approvals, verified HTTP 200 and readback, then verified restart cleanup. `npm test` (31 tests), typecheck, and build pass. This is mock-only evidence; the documented rehearsal using the fresh Petstore Swagger 2.0 spec remains to be run, and no live write was made.

**Fresh-spec guarded mock write (2026-10-11):** guided review fetched from the current Petstore Swagger 2.0 fingerprint `77d18c99ee7f556e8dbcaf5e80ed788e6cb1a182f37f34229e7b0d956bf4757d` selected and generated only `TC-PLACEORDER-POS-200` (plan revision 2). The generated test ran through the guarded CLI against `http://127.0.0.1:4010/v2` after separate target, execution, and mutation confirmations. Result: one pass, zero failures/skips; expected/actual HTTP 200 in 97 ms; final recorded step `assert-content-type`. Redacted run artifacts are `/tmp/petstore-order-mock-results.json`, `/tmp/petstore-order-mock-report.html`, and `/tmp/petstore-order-mock-run.jsonl`. The mock was stopped afterward, clearing the in-memory order. No request was sent to public Petstore.

**Frankfurter guarded read-only verification (2026-10-11):** fetched the official OpenAPI 3.1 contract (`https://api.frankfurter.dev/v1/openapi.json`; fingerprint `e38804965823bcbd7db06471aa6a2b8b19b4dfc5f26f95d14aae8cfad1fb46a6`) and analyzed 5 operations into 9 cases (5 automated candidates, 4 manual-review cases). Guided review selected only `TC-GET-LATEST-POS-200` and generated an approval-bound test. The guarded run against `https://api.frankfurter.dev/v1` passed: one pass, zero failures/skips, expected/actual HTTP 200, final step `assert-response-schema`. No authentication or mutation was involved; dynamic rate values were not asserted. Results are `/tmp/frankfurter-latest-results.json`, `/tmp/frankfurter-latest-report.html`, and `/tmp/frankfurter-latest-run.jsonl`. This adds one public read-only execution to demo evidence; the clean-setup rehearsal remains open.

**Reusable HTML report and generated-test typecheck (2026-10-10):** the custom Playwright reporter now writes a curated HTML summary alongside JSON results, with totals and per-case outcome, method/path, HTTP statuses, duration, and redacted diagnostics. `--html-report` selects the output path; the default is `test-results/api-report.html`. The report is refreshed after a run records results. Generated Playwright files are included in `tsconfig.json`, fixing missing Node `process`/`Buffer` types when checking generated specs. The reporter regression test covers three outcomes and HTML escaping. `npm test` (28 tests), `npm run typecheck`, and `git diff --check` pass. Build and Playwright discovery were not rerun after this report change.

### Recommended next actions

1. Keep OpenAI drafting out of the demo. Do not send private specifications or objectives; any future private-data deployment needs an applicable data-retention/privacy review.
2. Finish and verify the manual-case drafting slice, then define the human review and controlled automation-promotion step.
3. The full Petstore review, guarded Petstore live read, mock inventory/order lifecycle, and Frankfurter live read are documented. A fresh-install copy passed the clean rehearsal on 2026-10-11; next have a colleague run the walkthrough from their clean setup and record acceptance. Do not use public Petstore for a mutation.
4. The result-quality feature branch was merged into `develop` by MR #11 on 2026-10-12. Review the follow-up handoff/runbook documentation through its own pull request; keep AGT-10 as a separate open quality gate.

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
| FND-10 | Curated HTML run report generated from recorded Playwright results | Verified | Reporter regression test covers dynamic totals, rows, duration, and HTML escaping; output path is configurable with `--html-report`. |

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

The current product remains a guided CLI. Deterministic spec analysis and test generation are supplemented by an opt-in local OpenAI manual-case draft prototype; this is not yet a full conversational agent or automated promotion workflow. See `docs/AGENT-CONTRACT.md` for the product boundary and tool contract.

| ID | Priority | Item | Status | Acceptance criteria |
|---|---|---|---|---|
| AGT-01 | P0 | Decide model/provider strategy and hosting constraints | OpenAI selected as an optional prototype; external-data boundary documented | Keep the demo workflow deterministic and do not send private specs or objectives. The optional provider is tested with mocks and is not required for the demo. Any future private-data deployment needs its own applicable data-retention/privacy review; the core engine remains provider-neutral. |
| AGT-02 | P0 | Define agent workflow and typed tool contract | Complete; merged to develop/main | Document states, deterministic typed tools, approval/revision binding, audit events, evidence, and failure/interrupt behavior. The MVP1 contract excludes run/summarize tools; deterministic result summarization was added post-MVP1. |
| AGT-03 | P0 | Implement MVP1 local intake | Complete; Phase 3 | User can provide a local spec and testing objective. Target/auth intake belongs to MVP2 before API execution. |
| AGT-04 | P0 | Add grounded test-case explanation and selection | Complete; Phase 3 | Every contract assertion links to spec evidence or is labeled as a proposal; user can include/exclude candidates and approve before generation. |
| AGT-05 | P0 | Add execution approval policy | Complete; Phase 4 | No request is sent until the user confirms an authorized target; mutating tests need separate explicit approval and a non-production target. MVP1 does not run tests. |
| AGT-06 | P1 | Implement bounded orchestration with audit trail | Complete; Phase 4 | Record tool calls, approvals, plan changes, and outcomes; use bounded deterministic tools; model output, if added, is schema-validated and cannot invoke shell commands. |
| AGT-07 | P1 | Add guided result interpretation | Verified on local combined branch (2026-10-09); not merged to develop/main | Summarize pass/fail/skip by stable case ID, cite available numbered-step and HTTP status evidence, distinguish recorded observations from hypotheses, redact displayed text, and do not fabricate causes. Integration remains open. |
| AGT-08 | P1 | Implement deterministic guided CLI MVP1 | Complete; Phase 3 | User can complete the spec-to-approved-plan-to-test-generation workflow using guided prompts without editing generated files manually; no model or API request is required. |
| AGT-09 | P1 | Prepare safe demo dataset/spec and scripted walkthrough | In progress: inventory-only walkthrough rehearsed locally | Analyze Petstore's live Swagger 2.0 contract across its documented operations and select representative cases. `TC-GETINVENTORY-POS-200` passed through the guarded CLI against the mock and live service. The inventory-only scripted walkthrough is documented in [`docs/petstore-demo-walkthrough.md`](./docs/petstore-demo-walkthrough.md) and passed a guarded loopback rehearsal on 2026-10-11 (one pass, HTTP 200 in 94 ms). A 2026-10-11 guarded attempt of read-only `GET /pet/findByStatus?status=available` returned HTTP 200 but failed schema validation; the generator fix has regression coverage, and local tests/typecheck/build/discovery pass. The post-fix live case is deferred from the demo because the current spec declares OAuth2 and only the Petstore API key is available; do not treat the API key as an OAuth token. A user-provided Swagger UI capture shows `POST /pet/001/uploadImage` returned HTTP 200, but generated-CLI execution, persistence, repeatability, and cleanup remain unverified. Document public-service limits; use local mocks for mutations whose live effects or cleanup are unknown. |
| AGT-10 | P1 | Add agent-specific quality, safety, and usability tests | In progress (2026-10-11) | Tests cover hostile spec text, unsupported claims, approval bypass, secret leakage, model output/evidence validation, no-inference default, outbound consent, interruptions, and clear result summaries. |

**AGT-10 progress (2026-10-09):** The local `feature/agt-07-10-result-quality` branch combines result-summary coverage with tests proving spec-embedded instruction text cannot approve a plan and Ctrl+C during guided review cancels without generating output. Added local-mock integration coverage proving mutating cases are skipped by default, a declined separate mutation confirmation sends no request, and a fully approved POST sends exactly one request with the expected body and status. `npm test` (23 tests), `npm run typecheck`, and `npm run build` pass. The work is not yet merged, and the remaining AGT-10 acceptance matrix is still open. The manual Petstore upload observation is separate from the local-mock and guarded-CLI tests.

**OpenAI draft prototype progress (2026-10-10):** Added `src/model-provider.ts`, `src/openai-provider.ts`, and a separate Markdown renderer. Only explicitly consented calls send the objective and minimized/redacted route, summary, response-status, and evidence-pointer context. Outputs must refer to locally known operations and evidence and are always marked manual-review-only; the Playwright generator does not consume them. Unit tests use a mocked OpenAI client. The implementation has not yet passed the full post-change typecheck/build gate or made a live OpenAI request; do not mark Phase 5 complete.

**AGT-10 verification update (2026-10-11):** Added mocked coverage that strict JSON-schema output uses a token cap, malformed provider JSON produces a generic safe error without echoing response text, declined consent emits no draft-request audit event, and guided review does not request drafts by default even when an AI report path is supplied. `npm test` (30 tests), typecheck, build, Playwright discovery (2 generated tests), and `git diff --check` pass. No live OpenAI or Petstore request was made for this update. AGT-10 and Phase 5 remain in progress.

## Service-line demo exit criteria

- [ ] A user can supply a generic Swagger/OpenAPI spec and a test objective.
- [ ] The application explains the proposed cases and shows spec-derived evidence, steps, expected results, risks, and uncertainties.
- [ ] The user can revise and approve a plan before test code is generated.
- [ ] The agent uses bounded typed tools; model output cannot directly execute arbitrary commands or send unapproved API requests.
- [ ] Review the full Petstore operation set; confirm the target and approve each selected operation before execution. Mutating calls require separate opt-in and confirmation, plus documented safe test data and cleanup/recovery for live execution.
- [ ] Results are traceable to stable case IDs and numbered steps, with secrets removed from reports.
- [ ] The demo walkthrough documents operation selection, live-spec input, public sample-key handling, mutation boundaries, cleanup/recovery, availability limits, and which calls were actually verified.
- [ ] Node-based typecheck, tests, generated-test discovery, build, and selected guarded Petstore runs pass; retain redacted evidence and distinguish live runs from mock/UI observations.

## Decisions to record

| Decision | Status | Notes |
|---|---|---|
| Interaction surface | Decided: conversational CLI | Selected for the service-line demo; implement as an interactive guided terminal workflow. |
| Approved LLM/model provider and whether inference can use external services | OpenAI selected as an optional prototype; excluded from the deterministic demo | No live OpenAI request is required. Keep inference off for the demo and never send private specifications or objectives; deployments that handle private data need their own policy review. |
| Demo API | Selected: public Petstore demo service | Use its live Swagger 2.0 contract to review all documented operations and execute selected approved cases. It is shared and not guaranteed to be available; mutation effects and cleanup must be established before live write cases are part of the repeatable walkthrough. |
| Authentication/secret storage mechanism for the application | Open; Petstore demo uses its documented public sample key | Scope the sample key to the Petstore demo request; never place actual credentials in specs, generated source, or checked-in files. |
