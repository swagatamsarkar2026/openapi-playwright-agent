# OpenAPI Playwright Agent: Agentic API Test Suite Generator

A generic API test generation project. Its current foundation is a TypeScript CLI that turns Swagger 2.0 and OpenAPI 3.x (including 3.1) JSON or YAML specifications into a reviewable test plan and Playwright API tests. Petstore is a sample fixture only; operation, schema, and endpoint behavior is spec-driven.

**Product goal:** evolve this foundation into an agentic application suitable for a service-line demonstration. The selected interaction surface is a conversational CLI. The agent should help a user understand an API spec, prepare and explain test scenarios, incorporate user review, generate Playwright tests, and present run results. The current repository is a deterministic scaffold, **not yet an LLM-powered or conversational agent application**. Track that work in [BACKLOG.md](./BACKLOG.md); model/provider and hosting choices remain open.

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
   npx.cmd tsx src/cli.ts run --base-url https://api.example.test
   ```

   Alternatively, use `npm.cmd run test:api` with `API_BASE_URL` set in the environment.

## Agentic application target

The service-line demo target is a guided, explainable agent workflow rather than an unrestricted autonomous runner:

1. Accept a spec and the user's test objective; clarify missing environment or safety details.
2. Explain the operations and proposed test cases, including each case's inputs, input provenance, preconditions, steps, and expected results.
3. Let the user review, edit, exclude, or approve cases before generating tests.
4. Use bounded, auditable tools for spec analysis, test generation, validation, and execution; preserve stable case IDs across the flow.
5. Require explicit confirmation and an authorized non-production target before enabling state-changing API calls.
6. Summarize pass/fail/skip results, evidence, and remaining ambiguities in user-readable output.

Keep the OpenAPI parsing and Playwright execution deterministic and testable. An LLM may assist with user interaction, interpretation, and proposing additional cases, but it must not invent contract facts, credentials, or success criteria. The conversational CLI surface is selected; provider/model integration and deployment approach remain open decisions before implementing that layer.

The `analyze` command writes a detailed test plan. Each stable-ID case includes its type (positive, negative, or manual review), automation status, risk classification, preconditions, parameter/body samples and their source, numbered test steps with expected results, and assumptions or review notes. Each documented 2xx response becomes its own positive automation candidate with an exact status assertion; cases with review warnings are skipped when executed.

See [the Petstore example test plan](./examples/petstore/TEST-PLAN-EXAMPLE.md) for a sample of the report format.

Generated tests use the same case IDs and step descriptions and report steps through Playwright's `test.step`. Automated positive cases assert the exact documented success status, response content type, and supported nested response constraints (required fields, types, enums, numeric bounds, string lengths, and array-item schemas). Supported parameter serialization covers common query `form`, `deepObject`, `spaceDelimited`, and `pipeDelimited` cases, simple path values/arrays, and simple headers. Unsupported styles, cookies, `allowReserved`, and nested non-primitive parameter shapes are flagged for review instead of guessed. Request values are taken from examples, defaults, enums, or conservative schema-derived samples. Review the generated plan before running: a generated sample may not identify a resource that exists on the target service.

Negative-case proposals are created for documented 4xx responses, including their descriptions and available response content/property expectations. They remain manual-review-only until a tester defines a safe triggering input; the agent does not guess invalid-input behavior. Unsupported request encodings, complex parameter serialization, and unsupported authentication schemes are surfaced as review notes and skipped rather than sent with guessed wire formats.

`POST`, `PUT`, `PATCH`, and `DELETE` operations are skipped by default. After reviewing potential side effects, generate them with `--include-mutating`, then execute with `run --include-mutating`; both explicit opt-ins are required. Supported declared authentication uses environment variables: `API_BEARER_TOKEN`, `API_OAUTH_TOKEN`, `API_USERNAME`/`API_PASSWORD`, or `API_KEY_<SCHEME_NAME>` (the security scheme name converted to uppercase with non-alphanumeric characters changed to underscores). Credentials are never written to generated files.

Local external `$ref` files and remote references may be resolved during parsing. Only use specifications and references from trusted sources. Keep test targets and credentials limited to environments authorized for testing.

## Project status

The deterministic foundation is implemented and verified for its current fixture coverage. Node.js 24.21.0/npm 11.19.0 dependencies are installed; typecheck, 7 unit tests, build, generated test TypeScript check, and Playwright discovery all pass. No live API requests have been run. Phase 1 remains in progress: VAL-04 and VAL-05 are complete; machine-readable run diagnostics and reference/resource/secret safety remain. The agentic interaction/application layer and service-line demo experience remain backlog work, not implemented features. See [the phased backlog](./BACKLOG.md) for current statuses and demo exit criteria.

## Implementation phases

The work is organized into seven gated phases: **0)** deterministic foundation (complete for current verification scope), **1)** engine hardening and broader tests (in progress; VAL-04 and VAL-05 passed, VAL-06 is next), **2)** agent product/tool contract, **3)** conversational CLI MVP, **4)** approval-gated generation and execution, **5)** results/audit/agent quality, and **6)** demo readiness. Each phase has explicit dependencies and exit criteria in [BACKLOG.md](./BACKLOG.md); later agent phases should not start until their prerequisites and safety decisions are complete.

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
