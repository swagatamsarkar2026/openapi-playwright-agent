# OpenAPI Playwright Agent: Agentic API Test Suite Generator

A generic API test generation project. Its current foundation is a TypeScript CLI that turns Swagger 2.0 and OpenAPI 3.x (including 3.1) JSON or YAML specifications into a reviewable test plan and Playwright API tests. Petstore is a sample fixture only; operation, schema, and endpoint behavior is spec-driven.

**Product goal:** evolve this foundation into an application suitable for a service-line demonstration. MVP1 is a deterministic, provider-neutral guided CLI: users inspect a spec, review and approve generated cases, then generate Playwright tests from the approved plan. MVP1 will not use an LLM or send API requests. Model/provider and hosting choices are deferred until service-line guidance. See the [MVP1 product and tool contract](./docs/AGENT-CONTRACT.md) and [phased backlog](./BACKLOG.md).

Requires Node.js 20 or newer.

## Setup

```powershell
npm.cmd install
```

## Workflow

The current scaffold has a three-command CLI workflow:

1. **Analyze** — validate a spec, derive stable-ID test cases, and write a detailed plan:

   ```powershell
   npx.cmd tsx src/cli.ts analyze --spec path\to\openapi.yaml --out test-plan.md
   ```

2. **Generate** — write TypeScript Playwright tests from the same cases:

   ```powershell
   npx.cmd tsx src/cli.ts generate --spec path\to\openapi.yaml
   ```

3. **Run** — execute generated API tests against the server declared in the spec, or override it:

   ```powershell
   npx.cmd tsx src/cli.ts run --base-url https://api.example.test --results test-results\api-results.json
   ```

   The default result path is `test-results\api-results.json`; `--results` overrides it. Alternatively, use `npm.cmd run test:api` with `API_BASE_URL` set in the environment.

### Guided MVP1 review and generation

Use the guided flow to inspect cases, choose which to include, and require explicit approval before test source is written:

```powershell
npx.cmd tsx src/cli.ts guide --spec examples\petstore\openapi.yaml --objective "Review read-only pet operations"
```

The CLI shows each case's classification, sample inputs and provenance, preconditions, steps, expected results, warnings, and spec SHA-256/JSON Pointer evidence. Enter `all` or a comma-separated list of case IDs, then type the exact word `APPROVE` to authorize generation for that selection. `edit` returns to case selection; `cancel` or Ctrl+C exits without generating tests. Approval is in-memory and bound to the current plan revision; changing the selection invalidates it. The default generated test path is `tests\generated\api.spec.ts`; the default audit log is `test-results\guided-workflow.jsonl` (override with `--out` or `--audit`). Audit events do not include spec contents, objectives, credentials, or approval tokens.

This MVP1 guided flow does not execute API requests or use a model. The existing low-level `analyze`, `generate`, and `run` commands remain available for direct engine workflows; only the `guide` workflow enforces review and plan approval before generation. Execution approvals and target confirmation are scheduled for MVP2.

## Agentic application target

The intended service-line demo is a guided, explainable workflow rather than an unrestricted autonomous runner. MVP1 implements the review-to-generation path deterministically; a model, if later approved, may assist only through the same bounded tool contract.

1. Accept a spec and the user's test objective; clarify missing environment or safety details.
2. Explain the operations and proposed test cases, including each case's inputs, input provenance, preconditions, steps, and expected results.
3. Let the user review, edit, exclude, or approve cases before generating tests.
4. Use bounded, auditable tools for spec analysis, test generation, validation, and execution; preserve stable case IDs across the flow.
5. Require explicit confirmation and an authorized non-production target before enabling state-changing API calls.
6. Summarize pass/fail/skip results, evidence, and remaining ambiguities in user-readable output.

Keep OpenAPI parsing and test generation deterministic and testable. No model provider is selected or required for MVP1. Any later model may assist with interaction or propose cases, but it must not invent contract facts, credentials, or success criteria, and must not bypass user approval.

The `analyze` command writes a detailed test plan. Each stable-ID case includes its type (positive, negative, or manual review), automation status, risk classification, preconditions, parameter/body samples and their source, numbered test steps with expected results, and assumptions or review notes. Each documented 2xx response becomes its own positive automation candidate with an exact status assertion; cases with review warnings are skipped when executed.

See [the Petstore example test plan](./examples/petstore/TEST-PLAN-EXAMPLE.md) for a sample of the report format.

Generated tests use the same case IDs and step descriptions and report steps through Playwright's `test.step`. Automated positive cases assert the exact documented success status, response content type, and supported nested response constraints (required fields, types, enums, numeric bounds, string lengths, and array-item schemas). Supported parameter serialization covers common query `form`, `deepObject`, `spaceDelimited`, and `pipeDelimited` cases, simple path values/arrays, and simple headers. Unsupported styles, cookies, `allowReserved`, and nested non-primitive parameter shapes are flagged for review instead of guessed. Request values are taken from examples, defaults, enums, or conservative schema-derived samples. Review the generated plan before running: a generated sample may not identify a resource that exists on the target service.

Negative-case proposals are created for documented 4xx responses, including their descriptions and available response content/property expectations. They remain manual-review-only until a tester defines a safe triggering input; the agent does not guess invalid-input behavior. Unsupported request encodings, complex parameter serialization, and unsupported authentication schemes are surfaced as review notes and skipped rather than sent with guessed wire formats.

`POST`, `PUT`, `PATCH`, and `DELETE` operations are skipped by default. After reviewing potential side effects, generate them with `--include-mutating`, then execute with `run --include-mutating`; both explicit opt-ins are required. Supported declared authentication uses environment variables: `API_BEARER_TOKEN`, `API_OAUTH_TOKEN`, `API_USERNAME`/`API_PASSWORD`, or `API_KEY_<SCHEME_NAME>` (the security scheme name converted to uppercase with non-alphanumeric characters changed to underscores). Credentials are never written to generated files.

### Run results and diagnostics

Each Playwright run writes a machine-readable JSON summary with stable case IDs, pass/fail/skip status, duration, request method and path template, expected/actual HTTP statuses when available, and a redacted failure code/message and step. Raw exception text, response bodies, request headers, and concrete request URLs/query values are not included. Known API credential environment-variable values and common credential-shaped strings are redacted. The built-in HTML reporter and failure traces are disabled to avoid secondary outputs containing raw request/response data. A report write failure fails the Playwright run.

Response JSON assertions are not parsed when the response advertises a `Content-Length` above 5 MiB. This check is a parsing guard, not a transport-level response-size limit; Playwright can buffer the response before the assertion step.

### Specification reference and resource policy

Only internal `$ref` references (those beginning with `#`) are resolved. External references—including local files and remote URLs—are rejected before validation/dereferencing; inline or bundle those definitions into the specification. This avoids implicit filesystem reads and network access during analysis. Input specifications are limited to 5 MiB, 300,000 document nodes, 10,000 references, 100 levels of nesting, and 1,000 operations; parser validation/dereferencing has a 10-second timeout. These bounds reduce accidental or hostile resource exhaustion but do not make untrusted specs safe for unrestricted execution. Keep test targets and credentials limited to environments authorized for testing.

## Project status

The deterministic foundation is implemented and verified for its current fixture coverage. Node.js 24.21.0/npm 11.19.0 dependencies are installed; typecheck, 12 unit/integration tests, build, selected-case generated-test TypeScript checking, and Playwright discovery pass. Tests include the guided CLI approval/revision path and prove generated output contains only selected approved cases. EOF cancellation, output-write failure, and audit-sink failure are covered; process/readline Ctrl+C cancellation is implemented. A local mocked API run verified failure diagnostics and API-key redaction; no live API requests were run. Phases 1-3 are complete (Phase 3 awaits PR review). Model/provider decisions remain deferred pending service-line guidance. See [the phased backlog](./BACKLOG.md) for current statuses and demo exit criteria.

## Implementation phases

The work is organized into seven gated phases: **0)** deterministic foundation (complete for current verification scope), **1)** engine hardening (complete), **2)** provider-neutral MVP1 product/tool contract (complete and merged), **3)** deterministic guided CLI MVP1 (complete; ready for PR), **4)** authorized API execution MVP2, **5)** optional model integration and agent quality (deferred pending service-line guidance), and **6)** demo readiness. Each phase has explicit dependencies and exit criteria in [BACKLOG.md](./BACKLOG.md); MVP1 can be built and demonstrated without a model provider.

## Development

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

## Collaboration and Git workflow

`main` is the stable, release-ready branch. `develop` is the shared integration branch. Make all project changes—including code, tests, and documentation—on a short-lived branch created from the latest `develop`; do not commit directly to `main` or `develop`.

```powershell
git switch develop
git pull
git switch -c feature/short-description
```

Use `fix/short-description` or `docs/short-description` when those names better describe the work. Run the relevant checks, commit the change, and push the feature branch:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
git add .
git commit -m "Describe the change"
git push -u origin feature/short-description
```

Open a pull request from the feature branch into `develop`, request teammate review, and merge after checks pass. For a release, open a pull request from `develop` into `main` after the integrated changes have been validated. Protect `main` from direct pushes and require review/checks in GitHub repository settings; protect `develop` similarly if the team wants all integration changes reviewed. Delete short-lived branches after they are merged.
