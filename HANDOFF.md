# Project context handoff

## Project

OpenAPI Playwright Agent: a generic API testing project for an agentic service-line demo. The TypeScript guided CLI uses deterministic OpenAPI analysis and Playwright generation, with opt-in OpenAI manual-case drafting and reviewer-controlled promotion to exact, grounded, read-only Playwright candidates. It does not execute model-authored code or bypass plan/target approvals; no live OpenAI request has been made.

Project root: repository root (`openapi-playwright-agent`)

## Immediate colleague handoff

The next Phase 6 action is an independent clean-setup acceptance run by a colleague. Use [`docs/service-line-demo-instructions.md`](./docs/service-line-demo-instructions.md) as the presenter runbook; it contains setup checks, the deterministic Petstore mock walkthrough, the optional mock-only order-write/cleanup segment, expected outcomes, and troubleshooting. The [Petstore walkthrough](./docs/petstore-demo-walkthrough.md) and [Frankfurter runbook](./docs/frankfurter-demo.md) hold the detailed target boundaries and recorded evidence.

Important transfer detail: the current project snapshot is committed on `feature/agt-07-10-result-quality` but is not yet available remotely. A push attempt was rejected because the cached GitHub credential lacks repository access. Retry after authenticating an account with access, or transfer the current snapshot to the colleague through an approved local handoff. Keep `.vscode/` and `SESSION_CONTEXT.md` local; they are not part of the project handoff. The 2026-10-11 fresh-copy rehearsal was performed by the project owner and does not satisfy colleague acceptance.

Ask the colleague to run the documented setup checks from a clean copy, complete the core loopback-mock inventory case, and record their environment, commands, outcomes, and any deviations in `BACKLOG.md`. The order-write segment is optional and must remain bound to `http://127.0.0.1:4010/v2`; never send a mutation to public Petstore. Keep OpenAI drafting disabled, use no private inputs or real credentials, and retain any run artifacts under `/tmp`.

## Source control and collaboration

- GitHub repository: `https://github.com/<organization>/<repository>`
- `main` is the stable branch; `develop` is the shared integration branch.
- Continue implementation and demo work on the current feature branch. GitHub access was recently granted, but the first push attempt used a cached account without repository permission; authenticate the authorized account before retrying.
- Push only the feature branch when authentication is corrected and do not commit directly to `develop` or `main`. Open a pull request into `develop` only when requested.
- README contains the step-by-step Git commands. Configure branch protection and required reviews/checks in GitHub settings.

## Current scope

- Supports Swagger 2.0 and OpenAPI 3.0/3.1 JSON or YAML inputs.
- Petstore is the primary Phase 6 reference and loopback mock target. Its full live Swagger 2.0 operation set has been reviewed; public writes remain deferred. Frankfurter is an additional no-auth OpenAPI 3.1 target; its guarded `GET /latest` case passed with HTTP 200 and response-schema validation on 2026-10-11 local.
- The dated full live-contract case snapshot is `docs/petstore-live-plan-2026-10-10.md`: 20 operations, 43 cases, 9 automated candidates, and 34 requiring manual review. The snapshot is analyzed coverage, not evidence that all cases were executed.
- Workflow: analyze a spec and write a Markdown plan, guide review and approval, generate Playwright TypeScript tests, run approved tests against an authorized target, and summarize recorded results. AGT-07 result summaries and AGT-10 safety tests are combined on a local feature branch and are not yet merged to `develop`.
- Each generated test case has a stable ID, positive/negative/manual-review classification, automation status, risk, preconditions, sample provenance, numbered steps with expected results, and review notes.
- Each documented 2xx response becomes an automated positive case. Documented 4xx responses become manual-review negative test proposals because safe error-triggering inputs cannot generally be inferred from the response declarations alone.
- Mutating operations are opt-in at test generation and execution.
- Unsupported encodings, complex parameter serialization, and unsupported authentication are flagged for review rather than guessed.
- The default guided workflow remains deterministic: local spec intake, explainable case review, selection, explicit plan approval, and generation only from the approved plan. `guide --ai-draft-cases` is opt-in. Drafts remain manual unless the reviewer separately promotes a mapped, exact candidate; promotion increments the plan revision and requires normal selection and approval.
- OpenAI is an optional prototype, not required for the demo. Keep the demo deterministic and do not send private specifications or objectives. No live OpenAI request has been made. Any future deployment handling private data needs its own applicable data-retention/privacy review. `OPENAI_API_KEY` is provider authentication only and must not be exposed.
- Do not describe the full agentic application, live OpenAI use, or the service-line demo as complete. Promotion is constrained and locally tested; AGT-01 data policy, remaining AGT-10 coverage, and the clean-setup demo gate remain open.

## Backlog and demo planning

`BACKLOG.md` is the source of truth for implementation status, pending verification, the agentic product backlog, and service-line demo acceptance criteria. Update its status when work is verified; installation or code presence alone does not mean a feature has passed validation.

Implementation is split into gated phases 0-6 in `BACKLOG.md`. Phases 0-4 are complete and merged to both shared branches. Phase 2 defined a provider-neutral MVP1 contract in `docs/AGENT-CONTRACT.md`; model/provider, inference/data policy, and hosting decisions (AGT-01) are intentionally deferred until service-line guidance. Phase 3 adds deterministic interactive review/selection/approval, evidence fingerprints and JSON Pointers, revision-bound test generation, local JSONL audit, and cancellation. Phase 4 adds guided approval metadata integrity checks, explicit authorized non-production target confirmation, credential preflight/auth confirmation, separate execution approval, and further approval for mutating cases. Results and run events are bound to the plan revision. Execution is limited to one integrity-checked generated file, a fixed Playwright entry point, no automatic redirects, a 10-minute process cap, and existing per-test timeout. `ONBOARDING.html` remains a read-only Petstore baseline; its `TC-GETINVENTORY-POS-200` case passed against the live Swagger 2.0 `/v2` API. A user-provided Swagger UI capture separately shows `POST /pet/001/uploadImage` returning HTTP 200, but this has not been verified through the generated guarded workflow, and persistence/cleanup behavior is unknown. Phase 6 should review the live contract's documented operations and exercise selected calls only after safety review; the screenshot does not establish that every route is safe or repeatable.

## Environment and next steps

### Latest verified checkpoint (2026-10-11)

- AI drafts can nominate only synthetic references to exact, warning-free, non-mutating OpenAPI candidates from the same operation. Reviewer promotion copies deterministic inputs/assertions, increments the plan revision, and requires normal selection and approval. Audit failure rolls the promotion back.
- `npm test` passes (32 tests); `npm run typecheck`, `npm run build`, and `git diff --check` pass. `npx playwright test --list --reporter=list` discovers 3 generated specs.
- Frankfurter's official OpenAPI 3.1 contract was fetched and analyzed locally: 5 operations, 9 cases, 5 automated candidates, 4 manual-review cases. Only `TC-GET-LATEST-POS-200` was selected and run through the guarded CLI; it passed with expected/actual HTTP 200 and the response-schema assertion. No live OpenAI request was made. Results are under `/tmp/frankfurter-latest-*`.
- Clean-copy rehearsal passed on 2026-10-11 after fresh `npm ci`: the Petstore inventory case passed against the loopback mock; a freshly guided Petstore order case passed against the mock, readback returned HTTP 200, and restart cleanup returned HTTP 404; the freshly guided Frankfurter `/latest` case passed against the public read-only API with schema validation. The copy passed 32 unit tests, typecheck, build, and discovery of 7 generated specs. Results are under `/tmp/petstore-clean-setup-*` and `/tmp/frankfurter-clean-setup-*`; the original worktree was not changed by the rehearsal. No public Petstore mutation was sent.
- Remaining gates: colleague acceptance of the clean-setup walkthrough and outstanding AGT-10 coverage. OpenAI is optional and excluded from the demo; data-policy review only applies to a future private-data deployment. See `BACKLOG.md` and the demo runbooks for current status and target/auth boundaries.

Current environment: macOS with Node.js 20 or newer and project dependencies installed from `package-lock.json`.

Verified from the project root on 2026-10-08:

```sh
npm run typecheck
npm test
npm run build
```

On 2026-10-09, the combined local branch passed `npm run typecheck`, `npm test` (23 passing tests), and `npm run build`. Coverage includes result-summary schema, stable IDs, step/HTTP evidence, redaction and timeout labels, spec-instruction rejection, SIGINT cancellation without test generation, and local-mock mutation approval behavior. The guarded CLI Petstore inventory runs contained no mutation cases. A separate Swagger UI screenshot shows one successful upload POST, but is not generated-CLI verification.

The 2026-10-09 live Petstore check used a freshly downloaded Swagger 2.0 spec and approved only `TC-GETINVENTORY-POS-200`; the guarded run passed with expected/actual HTTP 200 in 345 ms. Its local JSON and HTML outputs were ignored artifacts. The HTML was a static snapshot at that time; the reporter now regenerates a curated summary after each completed run that records results.

On 2026-10-10, the current live contract was fetched to `/tmp/petstore-live-swagger.json` and analyzed into the dated Markdown plan linked above. Guided review approved only `TC-GETINVENTORY-POS-200`. The same generated, approval-bound file passed against the loopback mock and `https://petstore.swagger.io/v2`, each with expected/actual HTTP 200. Retained summaries are `/tmp/petstore-mock-results.json` and `/tmp/petstore-live-results.json`; each records one pass, zero failures/skips, and step 5 (`assert-content-type`). The mock serves only `GET /v2/store/inventory` from `examples/petstore/mock-data.json`, requires the API-key header, and binds to `127.0.0.1`. The live run used Petstore's documented sample key only in the command environment. No live mutation was run. Full operation-by-operation review and mutation safety/cleanup remain open.

On 2026-10-11, a guarded attempt of the read-only `GET /pet/findByStatus?status=available` returned HTTP 200 but failed at `assert-response-schema`: the generated validator iterated `requiredProperties` on a nested schema where that optional field was omitted. The generator and active generated test now default the field to an empty list, with regression coverage. Direct Playwright execution correctly rejected the generated file after its approval-bound content changed. A guide attempt using the available `/tmp/petstore-live-swagger.json` showed a different spec fingerprint (`77d18c99ee7f556e8dbcaf5e80ed788e6cb1a182f37f34229e7b0d956bf4757d`) from the approved plan (`c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`), so that review was canceled. The post-fix case has not been rerun against live Petstore and is deferred from the demo because the operation declares OAuth2 and only the API key is available. Its old approval binding is invalid; do not run it directly through Playwright.

At the OpenAI prototype checkpoint, `npm test` passed all 27 tests, `npm run typecheck`, `npm run build`, and `npx playwright test --list --reporter=list` discovered the one generated case. The later HTML-report change adds a reporter test; most recent verification is `npm test` (28 tests), `npm run typecheck`, and `git diff --check`. Build and Playwright discovery have not been rerun after that change. Playwright clears `test-results` at run start, so retain results under `/tmp` when running multiple targets.

On 2026-10-10, the local OpenAI manual-case drafting prototype passed `npm test` (27 tests), `npm run typecheck`, `npm run build`, and Playwright discovery (one generated test). Tests mock the provider; no live OpenAI request was made. The prototype writes separate manual-review Markdown and cannot change executable plan selection or approval. Private-data policy is outside the demo scope; controlled promotion and broader AGT-10 coverage remain tracked separately.

The latest report update adds a custom HTML summary beside JSON results. Counts and rows come from completed test outcomes; `--html-report` can overwrite a chosen report path, including `test-results/petstore-live-inventory-report.html`. It is not a live view during execution and newly added test cases appear only after they run. The regression test checks multiple outcomes, duration, and HTML escaping. `tsconfig.json` now includes generated `tests/**/*.ts`, so Node globals resolve when checking generated Playwright specs.

On 2026-10-11, added a regression assertion to the nested response-schema test confirming generated validators type `requiredProperties` as optional and iterate over an empty list when it is absent. `npm test` (28 tests), `npm run typecheck`, `npm run build`, `npx playwright test --list --reporter=list` (2 tests discovered), and `git diff --check` pass. The inventory-only walkthrough in `docs/petstore-demo-walkthrough.md` also passed a guarded local mock run: one pass, zero failures/skips, HTTP 200 in 94 ms, zero mutations; retained outputs are `/tmp/petstore-inventory-mock-results.json` and `/tmp/petstore-inventory-mock-report.html`. The mock process was stopped after the run. This is local rehearsal evidence, not another live Petstore run. The live `findByStatus` case is deferred from the demo because the current spec declares OAuth2 and only the Petstore API key is available; prior live inventory evidence remains the only live generated-CLI pass.

Roadmap status at the 2026-10-11 checkpoint: Phases 0-4 are complete; Phase 5 has local OpenAI drafting and controlled promotion, with broader AGT-10 verification open. OpenAI is excluded from the deterministic demo, and private-data handling policy is a future-deployment concern rather than a demo blocker. Phase 6 has the full Petstore operation disposition, guarded live inventory evidence, guarded mock inventory/order/cleanup evidence, and a guarded Frankfurter read-only pass. The clean-copy rehearsal passed; colleague acceptance remains open. Local changes remain unpushed/unmerged; preserve the current worktree and use feature branches and PRs rather than committing directly to shared branches.

Running API tests requires a reachable, authorized target service and any required credentials. Browser binaries are not required because Playwright is used for API requests, not browser automation. Analysis accepts internal `$ref` values only; external local/remote references are rejected and must be inlined or bundled. See README for the input/resource limits and result-report policy.

## Important files

- `README.md` — setup, workflow, safety notes, and commands
- `BACKLOG.md` — implemented foundation, validation work, agentic application backlog, and demo exit criteria
- `docs\AGENT-CONTRACT.md` — provider-neutral MVP1 boundary, states, typed tools, approval and evidence rules
- `src\cli.ts` — CLI commands
- `src\openapi.ts` — spec validation, normalization, and test-plan derivation
- `src\generator.ts` — test and plan generation
- `src\run-reporter.ts` — machine-readable results and regenerated, curated HTML summaries with safe diagnostics
- `src\run-summary.ts` — schema-validated, redacted interpretation of recorded run results
- `src\spec-safety.ts` — specification resource and reference bounds
- `src\redaction.ts` — credential redaction for result summaries and guided audit identifiers
- `src\guided-workflow.ts` — typed review, selection, plan approval, audit, generation, and execution events
- `src\model-provider.ts` and `src\openai-provider.ts` — validated manual-case draft contract and OpenAI Responses adapter
- `src\ai-draft-report.ts` — separate non-executable Markdown report for AI proposals
- `src\execution.ts` — approved-plan metadata, target validation, credential requirements, and generated-file path policy
- `tsconfig.json` — TypeScript configuration, including explicit Node.js ambient types and generated-test inclusion
- `ONBOARDING.html` — visual Petstore onboarding for Swagger intake, review, approval, and safe live execution
- `src\model.ts` — normalized plan and operation types
- `src\cli.test.ts` — scaffold tests, including Swagger 2.0 and OpenAPI 3.1 coverage
- `examples\petstore\openapi.yaml` — sample input only
- `examples\petstore\mock-api.ts` and `examples\petstore\mock-data.json` — loopback mock for the inventory read case only
- `docs\petstore-live-plan-2026-10-10.md` — dated full case-plan snapshot from the live Swagger 2.0 contract
- `examples\petstore\TEST-PLAN-EXAMPLE.md` — illustrative detailed plan format; runtime output should be regenerated from the input spec
- `package-lock.json` — locked dependency tree installed for reproducible setup
- `.gitignore` — excludes generated Playwright output and build/dependency artifacts
