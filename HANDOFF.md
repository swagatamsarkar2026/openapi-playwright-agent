# Project context handoff

## Project

OpenAPI Playwright Agent: a generic API testing project whose long-term goal is an agentic service-line demo application. The current implementation is a deterministic TypeScript CLI scaffold for preparing reviewable API test plans and generating Playwright API tests from Swagger/OpenAPI specifications; it is not yet an LLM-powered or conversational app.

Project root: repository root (`openapi-playwright-agent`)

## Source control and collaboration

- GitHub repository: `https://github.com/swagatamsarkar2026/openapi-playwright-agent`
- `main` is the stable branch; `develop` is the shared integration branch.
- All future project changes (code, tests, and docs) must be made on a short-lived branch created from the latest `develop`, then pushed and proposed to `develop` via pull request.
- Promote validated `develop` to `main` via a release pull request. Do not commit directly to either shared branch.
- README contains the step-by-step Git commands. Configure branch protection and required reviews/checks in GitHub settings.

## Current scope

- Supports Swagger 2.0 and OpenAPI 3.0/3.1 JSON or YAML inputs.
- Petstore is only a sample fixture in `examples\petstore\openapi.yaml`; behavior is intended to be spec-driven.
- Workflow: analyze a spec and write a Markdown plan, guide review and approval, generate Playwright TypeScript tests, run approved tests against an authorized target, and summarize recorded results. AGT-07 result summaries and AGT-10 safety tests are combined on a local feature branch and are not yet merged to `develop`.
- Each generated test case has a stable ID, positive/negative/manual-review classification, automation status, risk, preconditions, sample provenance, numbered steps with expected results, and review notes.
- Each documented 2xx response becomes an automated positive case. Documented 4xx responses become manual-review negative test proposals because safe error-triggering inputs cannot generally be inferred from the response declarations alone.
- Mutating operations are opt-in at test generation and execution.
- Unsupported encodings, complex parameter serialization, and unsupported authentication are flagged for review rather than guessed.
- MVP1 is a deterministic, provider-neutral guided CLI: local spec intake, explainable case review, include/exclude selection, explicit plan approval, and test generation only from the approved plan. API execution is MVP2; model/provider integration is deferred until service-line guidance.
- Do not describe the agentic application, LLM integration, or service-line demo experience as implemented yet.

## Backlog and demo planning

`BACKLOG.md` is the source of truth for implementation status, pending verification, the agentic product backlog, and service-line demo acceptance criteria. Update its status when work is verified; installation or code presence alone does not mean a feature has passed validation.

Implementation is split into gated phases 0-6 in `BACKLOG.md`. Phases 0-4 are complete and merged to both shared branches. Phase 2 defined a provider-neutral MVP1 contract in `docs/AGENT-CONTRACT.md`; model/provider, inference/data policy, and hosting decisions (AGT-01) are intentionally deferred until service-line guidance. Phase 3 adds deterministic interactive review/selection/approval, evidence fingerprints and JSON Pointers, revision-bound test generation, local JSONL audit, and cancellation. Phase 4 adds guided approval metadata integrity checks, explicit authorized non-production target confirmation, credential preflight/auth confirmation, separate execution approval, and further approval for mutating cases. Results and run events are bound to the plan revision. Execution is limited to one integrity-checked generated file, a fixed Playwright entry point, no automatic redirects, a 10-minute process cap, and existing per-test timeout. `ONBOARDING.html` is a browser-friendly Petstore walkthrough; validation passed the read-only `TC-GETINVENTORY-POS-200` case against the service's live Swagger 2.0 `/v2` API. Do not use mutation cases on the public demo.

## Environment and next steps

Current environment: macOS with Node.js 20.20.2 and npm 10.8.2. Dependencies were restored from `package-lock.json` with `npm ci` (0 reported vulnerabilities).

Verified from the project root on 2026-10-08:

```sh
npm run typecheck
npm test
npm run build
```

On 2026-10-09, the combined local branch passed `npm run typecheck`, `npm test` (22 passing tests), and `npm run build`. Coverage includes result-summary schema, stable IDs, step/HTTP evidence, redaction and timeout labels, plus spec-instruction rejection and SIGINT cancellation without test generation. The live Petstore read-only inventory smoke test passed on 2026-10-08; no mutation calls were made.

The live Petstore check was repeated on 2026-10-09 using a freshly downloaded Swagger 2.0 spec. Guided review approved only `TC-GETINVENTORY-POS-200`; the guarded run passed with expected/actual HTTP 200 in 345 ms. The run recorded one pass, zero failures/skips, and zero mutations. Current local outputs are `test-results/petstore-live-inventory-results.json` (redacted JSON) and `test-results/petstore-live-inventory-report.html` (static snapshot rendered from that JSON). Both are ignored local artifacts, not source-controlled evidence; the HTML is not a reusable report generator. The workflow/run audit logs and downloaded spec are in `/tmp`. Petstore remains an onboarding example, not the Phase 6 service-line demo target.

Current roadmap: Phases 0-4 are complete and merged. The active local integration branch `feature/agt-07-10-result-quality` combines AGT-07 result summaries with AGT-10 safety tests, based on `origin/develop` at `bc57ab7`. The source branches remain available as local checkpoints. The combined changes are validated locally but not pushed or merged; neither `develop` nor `main` was changed. AGT-09 still needs an authorized non-production demo target and reset plan. Phase 5 model/provider decisions remain deferred until service-line guidance. Use feature branches and PRs; do not commit directly to shared branches.

Running API tests requires a reachable, authorized target service and any required credentials. Browser binaries are not required because Playwright is used for API requests, not browser automation. Analysis accepts internal `$ref` values only; external local/remote references are rejected and must be inlined or bundled. See README for the input/resource limits and result-report policy.

## Important files

- `README.md` — setup, workflow, safety notes, and commands
- `BACKLOG.md` — implemented foundation, validation work, agentic application backlog, and demo exit criteria
- `docs\AGENT-CONTRACT.md` — provider-neutral MVP1 boundary, states, typed tools, approval and evidence rules
- `src\cli.ts` — CLI commands
- `src\openapi.ts` — spec validation, normalization, and test-plan derivation
- `src\generator.ts` — test and plan generation
- `src\run-reporter.ts` — machine-readable Playwright result output and safe failure diagnostics
- `src\run-summary.ts` — schema-validated, redacted interpretation of recorded run results
- `src\spec-safety.ts` — specification resource and reference bounds
- `src\redaction.ts` — credential redaction for result summaries and guided audit identifiers
- `src\guided-workflow.ts` — typed review, selection, plan approval, audit, generation, and execution events
- `src\execution.ts` — approved-plan metadata, target validation, credential requirements, and generated-file path policy
- `tsconfig.json` — TypeScript configuration, including explicit Node.js ambient types
- `ONBOARDING.html` — visual Petstore onboarding for Swagger intake, review, approval, and safe live execution
- `src\model.ts` — normalized plan and operation types
- `src\cli.test.ts` — scaffold tests, including Swagger 2.0 and OpenAPI 3.1 coverage
- `examples\petstore\openapi.yaml` — sample input only
- `examples\petstore\TEST-PLAN-EXAMPLE.md` — illustrative detailed plan format; runtime output should be regenerated from the input spec
- `package-lock.json` — locked dependency tree installed for reproducible setup
- `.gitignore` — excludes generated Playwright output and build/dependency artifacts
