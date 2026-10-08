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
- The target agent is a conversational CLI for a service-line demo. It should guide users through spec intake, explainable test proposals, user review/approval, generation, controlled execution, and results presentation. Parsing and execution should remain deterministic tools; model provider and deployment are open decisions.
- Do not describe the agentic application, LLM integration, or service-line demo experience as implemented yet.

## Backlog and demo planning

`BACKLOG.md` is the source of truth for implementation status, pending verification, the agentic product backlog, and service-line demo acceptance criteria. Update its status when work is verified; installation or code presence alone does not mean a feature has passed validation.

Implementation is split into gated phases 0-6 in `BACKLOG.md`. Phase 0 is complete for the current verification scope; Phase 1 (test-engine hardening and broader deterministic tests) is in progress. VAL-04 and VAL-05 passed; next continue with VAL-06 (machine-readable run diagnostics), then `$ref`/resource/secret safety. Obtain the approved model/provider and hosting constraints (AGT-01) before designing conversational agent integration. Do not add a model-provider SDK until that decision is made.

## Environment and next steps

After restarting VS Code, Node.js 24.21.0 is available on PATH. npm 11.19.0 is installed and `npm.cmd` works. In PowerShell, `npm` resolves to `npm.ps1`, which is blocked by the current execution policy; use `npm.cmd` and `npx.cmd` in commands. Dependencies were installed with `npm install` (0 reported vulnerabilities).

Verified from the project root on 2026-10-08:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

All three commands passed; `npm test` now reports 7 passing tests. The suite covers Swagger/OpenAPI versions, sample precedence, named request-body examples, 2xx/4xx response cases, API-key wiring, parameter styles and warnings, nested response types/enums/bounds/lengths, stable IDs, and plan rendering. Generated Petstore tests passed standalone TypeScript checking and Playwright discovery (4 cases). No live API tests were run and no request was sent. Named request-body example support and generated response-schema checking were added during this work.

Current roadmap: Phase 0 is complete for current verification scope. Phase 1 remains in progress; VAL-04 and VAL-05 passed, and VAL-06 is next. Do not mark Phase 1 complete until its exit gate in `BACKLOG.md` passes.

Running API tests requires a reachable, authorized target service and any required credentials. Browser binaries are not required because Playwright is used for API requests, not browser automation.

## Important files

- `README.md` — setup, workflow, safety notes, and commands
- `BACKLOG.md` — implemented foundation, validation work, agentic application backlog, and demo exit criteria
- `src\cli.ts` — CLI commands
- `src\openapi.ts` — spec validation, normalization, and test-plan derivation
- `src\generator.ts` — test and plan generation
- `src\model.ts` — normalized plan and operation types
- `src\cli.test.ts` — scaffold tests, including Swagger 2.0 and OpenAPI 3.1 coverage
- `examples\petstore\openapi.yaml` — sample input only
- `examples\petstore\TEST-PLAN-EXAMPLE.md` — illustrative detailed plan format; runtime output should be regenerated from the input spec
- `package-lock.json` — locked dependency tree installed for reproducible setup
- `.gitignore` — excludes generated Playwright output and build/dependency artifacts
