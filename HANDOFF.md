# Project context handoff

## Project

OpenAPI Playwright Agent: a generic API testing project whose long-term goal is an agentic service-line demo application. The current implementation is a deterministic TypeScript CLI scaffold for preparing reviewable API test plans and generating Playwright API tests from Swagger/OpenAPI specifications; it is not yet an LLM-powered or conversational app.

Project root: `C:\Workspace\openapi-playwright-agent`

## Source control and collaboration

- GitHub repository: `https://github.com/swagatamsarkar2026/openapi-playwright-agent`
- `main` is the stable branch; `develop` is the shared integration branch.
- All future project changes (code, tests, and docs) must be made on a short-lived branch created from the latest `develop`, then pushed and proposed to `develop` via pull request.
- Promote validated `develop` to `main` via a release pull request. Do not commit directly to either shared branch.
- README contains the step-by-step Git commands. Configure branch protection and required reviews/checks in GitHub settings.

## Current scope

- Supports Swagger 2.0 and OpenAPI 3.0/3.1 JSON or YAML inputs.
- Petstore is only a sample fixture in `examples\petstore\openapi.yaml`; behavior is intended to be spec-driven.
- Workflow: analyze a spec and write a Markdown plan, generate Playwright TypeScript tests, then run them against a configured API.
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

After restarting VS Code, Node.js 24.21.0 is available on PATH. npm 11.19.0 is installed and `npm.cmd` works. In PowerShell, `npm` resolves to `npm.ps1`, which is blocked by the current execution policy; use `npm.cmd` and `npx.cmd` in commands. Dependencies were installed with `npm install` (0 reported vulnerabilities).

Verified from the project root on 2026-10-08:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

All three commands passed; `npm test` reports 17 passing tests. In addition to the earlier engine and guided-flow cases, the suite covers execution metadata/source integrity, target validation, required credential preflight without value disclosure, unapproved artifact refusal, explicit target/execution/mutation approval gates, and plan-bound results/audit. A temporary authenticated local mock API verified the approved read-only path, and a declined-target attempt made zero requests. Separately, the onboarding smoke test passed against the live Petstore read-only inventory endpoint using its documented public sample key; no mutation calls were made.

Current roadmap: Phases 0-4 are complete and merged. The current task branch is for the Petstore HTML onboarding guide and its read-only live smoke-test verification. Phase 5 model/provider work remains deferred until service-line guidance; Phase 6 demo readiness can proceed without a model. Continue the Git flow with a fresh feature branch from current `develop`, PR into `develop`, then promote to `main`. Do not commit directly to shared branches.

Running API tests requires a reachable, authorized target service and any required credentials. Browser binaries are not required because Playwright is used for API requests, not browser automation. Analysis accepts internal `$ref` values only; external local/remote references are rejected and must be inlined or bundled. See README for the input/resource limits and result-report policy.

## Important files

- `README.md` — setup, workflow, safety notes, and commands
- `BACKLOG.md` — implemented foundation, validation work, agentic application backlog, and demo exit criteria
- `docs\AGENT-CONTRACT.md` — provider-neutral MVP1 boundary, states, typed tools, approval and evidence rules
- `src\cli.ts` — CLI commands
- `src\openapi.ts` — spec validation, normalization, and test-plan derivation
- `src\generator.ts` — test and plan generation
- `src\run-reporter.ts` — machine-readable Playwright result output and safe failure diagnostics
- `src\spec-safety.ts` — specification resource and reference bounds
- `src\redaction.ts` — credential redaction for result summaries and guided audit identifiers
- `src\guided-workflow.ts` — typed review, selection, plan approval, audit, generation, and execution events
- `src\execution.ts` — approved-plan metadata, target validation, credential requirements, and generated-file path policy
- `ONBOARDING.html` — visual Petstore onboarding for Swagger intake, review, approval, and safe live execution
- `src\model.ts` — normalized plan and operation types
- `src\cli.test.ts` — scaffold tests, including Swagger 2.0 and OpenAPI 3.1 coverage
- `examples\petstore\openapi.yaml` — sample input only
- `examples\petstore\TEST-PLAN-EXAMPLE.md` — illustrative detailed plan format; runtime output should be regenerated from the input spec
- `package-lock.json` — locked dependency tree installed for reproducible setup
- `.gitignore` — excludes generated Playwright output and build/dependency artifacts
