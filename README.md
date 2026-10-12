# OpenAPI Playwright Agent: Agentic API Test Suite Generator

A generic API test generation project. Its current foundation is a TypeScript CLI that turns Swagger 2.0 and OpenAPI 3.x (including 3.1) JSON or YAML specifications into a reviewable test plan and Playwright API tests. The Petstore fixture and its public Swagger 2.0 service provide sample inputs; operation, schema, and endpoint behavior is spec-driven.

**Product goal:** evolve this foundation into an application suitable for a service-line demonstration. The default guided CLI remains deterministic: users inspect a spec, review and approve generated cases, then generate Playwright tests from the approved plan. Optional OpenAI drafts are proposals; the model cannot directly change the plan or generate executable code. A reviewer may separately promote a draft only when it maps to an exact, eligible OpenAPI-derived read-only candidate; the promoted case still requires normal selection and plan approval. See the [agent contract](./docs/AGENT-CONTRACT.md) and [phased backlog](./BACKLOG.md).

Requires Node.js 20 or newer.

## Step-by-step onboarding

Open [ONBOARDING.html](./ONBOARDING.html) in a browser for a visual onboarding walkthrough. It downloads Swagger Petstore's live Swagger 2.0 contract, demonstrates case review and approval, then runs one read-only `GET /store/inventory` smoke test against the matching `/v2` API. That guide is intentionally a read-only baseline, not the full Phase 6 operation walkthrough. A user-provided Swagger UI capture separately shows `POST /pet/001/uploadImage` returning HTTP 200; that call has not been verified through this project's generated approval-gated CLI, and its persistence/cleanup behavior is unknown. The repository's OpenAPI 3.0 Petstore fixture uses `/v1/pets`, which does not match the live service. See [the backlog](./BACKLOG.md) for the broader Phase 6 scope and verification gates.

## Setup

```powershell
npm.cmd install
```

## Workflow

The current scaffold has a four-command CLI workflow:

1. **Analyze** — validate a spec, derive stable-ID test cases, and write a detailed plan:

   ```powershell
   npx.cmd tsx src/cli.ts analyze --spec path\to\openapi.yaml --out test-plan.md
   ```

2. **Guided review and generate** — inspect/select cases and approve the exact plan revision:

   ```powershell
   npx.cmd tsx src/cli.ts guide --spec path\to\openapi.yaml --objective "Verify read-only operations"
   ```

3. **Run an approved plan** — only guided-approved output is eligible. Provide the exact authorized target:

   ```powershell
   npx.cmd tsx src/cli.ts run --base-url https://api.example.test --results test-results\api-results.json --html-report test-results\api-report.html
   ```

   The runner checks the approved artifact and required credential environment variables, then asks you to confirm the target is authorized and non-production, confirm configured authentication when needed, and separately approve execution. Non-loopback targets must use HTTPS. Plans containing only manual-review/unsupported cases are refused. If the plan contains mutating cases and `--include-mutating` is supplied, a further `APPROVE MUTATING CALLS` confirmation is required. One generated file is run through the fixed Playwright CLI entry point with a 10-minute process cap; per-test timeout remains 30 seconds. Results and local audit events include the approved plan revision and fingerprints, not credential values. The default results path is `test-results\api-results.json`; `--results` overrides it. Each completed run also refreshes `test-results\api-report.html`; use `--html-report` to choose another path. Counts reflect completed test outcomes and update after each run.

4. **Summarize recorded results** — interpret a completed run without sending requests:

   ```powershell
   npx.cmd tsx src/cli.ts summarize --results test-results\api-results.json
   ```

The low-level `generate` command is also available for preparing test source, but its output is intentionally not eligible for the approval-gated `run` command.

### Petstore mock-to-live inventory run

For the timed service-line presentation, manager talking points, Q&A, and recovery steps, see the [service-line demo instructions](./docs/service-line-demo-instructions.md).

For a slide-by-slide presentation with the live Petstore command sequence and presenter notes, see [the service-line demo presentation](./docs/service-line-demo-presentation.md).

To present in a browser or print slides to PDF, open the [standalone HTML presentation](./docs/service-line-demo-presentation.html). It works without a dev server; use the arrow keys to navigate, `N` for speaker notes, and `F` for fullscreen.

The local mock implements read-only `GET /store/inventory` and in-memory `POST /store/order` plus order readback for the guarded write rehearsal. Inventory requires the contract's `api_key` header; order routes do not. Orders exist only in the mock process and are cleared when it stops. The mock binds only to `127.0.0.1`; it does not emulate or verify other Petstore operations. See the [walkthrough](./docs/petstore-demo-walkthrough.md) for the separate mutation approvals and local-only rehearsal.

The full analyzer-generated snapshot from the contract fetched on 2026-10-10 is [the Petstore live test plan](./docs/petstore-live-plan-2026-10-10.md). It covers all 20 documented operations and 43 derived cases. `TC-GETINVENTORY-POS-200` has passed against both the mock and live service, including a guarded local rehearsal on 2026-10-11 (one pass, HTTP 200). A later read-only `GET /pet/findByStatus?status=available` returned HTTP 200 but failed response-schema validation when a nested schema omitted `requiredProperties`. The generator fix has regression coverage and passes local checks, but the post-fix live case is deferred from the demo: the spec declares OAuth2 and only the Petstore API key is available. See the [inventory-only demo walkthrough](./docs/petstore-demo-walkthrough.md).

Start the mock in one terminal:

```sh
npm run mock:petstore
```

In another terminal, fetch the current contract and run the guided review:

```sh
curl -fsSL https://petstore.swagger.io/v2/swagger.json -o /tmp/petstore-live-swagger.json
npx tsx src/cli.ts guide --spec /tmp/petstore-live-swagger.json --objective "Validate the Petstore inventory read operation" --out tests/generated/petstore-live-inventory.spec.ts --audit /tmp/petstore-guided.jsonl
```

At the case-selection prompt, enter `TC-GETINVENTORY-POS-200`, then type `APPROVE`. Run that approved file against the mock first:

```sh
API_KEY_API_KEY=local-mock-key npx tsx src/cli.ts run --base-url http://127.0.0.1:4010/v2 --file tests/generated/petstore-live-inventory.spec.ts --results /tmp/petstore-mock-results.json --audit /tmp/petstore-mock-run.jsonl
```

After the local run passes, use the same file against the live read-only Petstore endpoint:

```sh
API_KEY_API_KEY=special-key npx tsx src/cli.ts run --base-url https://petstore.swagger.io/v2 --file tests/generated/petstore-live-inventory.spec.ts --results /tmp/petstore-live-results.json --html-report test-results/petstore-live-inventory-report.html --audit /tmp/petstore-live-run.jsonl
```

The `run` command still requires target, authentication, and execution confirmations. The sample key is scoped to that command and must not be saved in a file. Petstore is a shared public demo service; a local mock pass does not verify its availability or behavior. Keep mutations mock-only until their live effects and cleanup are understood. Result paths use `/tmp` because Playwright clears `test-results` at the start of a run.

### Guided MVP1 review and generation

Use the guided flow to inspect cases, choose which to include, and require explicit approval before test source is written:

```powershell
npx.cmd tsx src/cli.ts guide --spec examples\petstore\openapi.yaml --objective "Review read-only pet operations"
```

The CLI shows each case's classification, sample inputs and provenance, preconditions, steps, expected results, warnings, and spec SHA-256/JSON Pointer evidence. Enter `all` or a comma-separated list of case IDs, then type the exact word `APPROVE` to authorize generation for that selection. `edit` returns to case selection; `cancel` or Ctrl+C exits without generating tests. Approval is in-memory and bound to the current plan revision; changing the selection invalidates it. The default generated test path is `tests\generated\api.spec.ts`; the default audit log is `test-results\guided-workflow.jsonl` (override with `--out` or `--audit`). Audit events do not include spec contents, objectives, credentials, or approval tokens.

### Optional OpenAI case drafts

The deterministic review is unchanged unless you enable AI drafting explicitly:

```powershell
npx.cmd tsx src/cli.ts guide --spec examples\petstore\openapi.yaml --objective "Review Petstore operations" --ai-draft-cases
```

This optional path is not part of the demo. Keep the demo deterministic; do not send private specifications or objectives to an external model.

The CLI shows the outbound data categories and request count; inference proceeds only after you type `SEND TO OPENAI`. Configure `OPENAI_API_KEY` in your local environment. `OPENAI_MODEL` optionally selects a model; the current default is `gpt-6-astra`. Never put the key in a spec, generated file, audit log, or checked-in configuration. The OpenAI SDK uses it only as the provider request credential. OpenAI drafting is not needed for the demo, which remains deterministic. Do not send private specifications or objectives; a future deployment handling private data needs its own applicable data-retention/privacy review.

Each request sends the objective and up to 20 operations' redacted route templates, summaries, documented response statuses/descriptions, evidence pointers, and eligible read-only candidate summaries. It does not send the raw spec, parameter samples, request/response bodies, target base URL, API-under-test credentials, or local case IDs. Operation and candidate references sent to the model are synthetic. Requests use `store: false`, have a 30-second timeout, and are not retried automatically. The local JSONL audit records that drafting was requested/completed/promoted or failed, but not prompts or model output.

AI results are saved by default to `test-results/ai-manual-case-drafts.md` (use `--ai-drafts-out` to choose another path; an existing file is not overwritten). Each draft is labeled a proposal and cites only known evidence pointers. The report itself is not read by the Playwright generator. A draft may nominate an exact same-operation candidate by synthetic reference; after reviewing the mapping, the user must separately promote its draft ID. Promotion copies only the deterministic candidate's inputs and assertions, adds it unselected to the plan, increments the revision, and records an audit event. The user must then select and approve the new revision before generation. Model-authored steps or code never become executable; ungrounded or mutating proposals remain manual. If the key is unavailable or the provider fails, deterministic review remains available.

The guided flow does not execute API-under-test requests. Only its deterministic approved output contains integrity-checked plan approval metadata accepted by the Phase 4 `run` command; artifacts from the low-level `generate` command are not eligible to run. The runner does not invoke a shell command, disables automatic redirects, and generated tests require the matching per-run approval value before making a request. `npm.cmd run test:api` does not perform target/execution approvals and is not the supported execution path. These local confirmations are operational safety guardrails, not a security boundary against a user who edits code or manually sends API requests.

## Agentic application target

The intended service-line demo is a guided, explainable workflow rather than an unrestricted autonomous runner. The default review-to-generation path is deterministic. Optional OpenAI assistance can draft proposals from bounded spec-derived context, but cannot call tools, directly change the plan, or bypass user approval. Human promotion is constrained to exact deterministic, read-only candidates.

1. Accept a spec and the user's test objective; clarify missing environment or safety details.
2. Explain the operations and proposed test cases, including each case's inputs, input provenance, preconditions, steps, and expected results.
3. Let the user review, edit, exclude, or approve cases before generating tests.
4. Use bounded, auditable tools for spec analysis, test generation, validation, and execution; preserve stable case IDs across the flow.
5. Require explicit confirmation and an authorized non-production target before enabling state-changing API calls.
6. Summarize pass/fail/skip results, evidence, and remaining ambiguities in user-readable output.

Keep OpenAPI parsing and Playwright generation deterministic and testable. OpenAI is the selected provider for optional drafting; model output is a proposal, never a contract fact, credential, success criterion, or approval. An explicitly promoted clone may enter the approved plan, but its executable inputs and assertions come from the validated OpenAPI candidate, not model text.

The `analyze` command writes a detailed test plan. Each stable-ID case includes its type (positive, negative, or manual review), automation status, risk classification, preconditions, parameter/body samples and their source, numbered test steps with expected results, and assumptions or review notes. Each documented 2xx response becomes its own positive automation candidate with an exact status assertion; cases with review warnings are skipped when executed.

See [the Petstore example test plan](./examples/petstore/TEST-PLAN-EXAMPLE.md) for a sample of the report format.

Generated tests use the same case IDs and step descriptions and report steps through Playwright's `test.step`. Automated positive cases assert the exact documented success status, response content type, and supported nested response constraints (required fields, types, enums, numeric bounds, string lengths, and array-item schemas). Supported parameter serialization covers common query `form`, `deepObject`, `spaceDelimited`, and `pipeDelimited` cases, simple path values/arrays, and simple headers. Unsupported styles, cookies, `allowReserved`, and nested non-primitive parameter shapes are flagged for review instead of guessed. Request values are taken from examples, defaults, enums, or conservative schema-derived samples. Review the generated plan before running: a generated sample may not identify a resource that exists on the target service.

Negative-case proposals are created for documented 4xx responses, including their descriptions and available response content/property expectations. They remain manual-review-only until a tester defines a safe triggering input; the agent does not guess invalid-input behavior. Unsupported request encodings, complex parameter serialization, and unsupported authentication schemes are surfaced as review notes and skipped rather than sent with guessed wire formats.

`POST`, `PUT`, `PATCH`, and `DELETE` operations are skipped by default. After reviewing potential side effects, generate them with `--include-mutating`, then execute with `run --include-mutating`; both explicit opt-ins are required. Supported declared authentication uses environment variables: `API_BEARER_TOKEN`, `API_OAUTH_TOKEN`, `API_USERNAME`/`API_PASSWORD`, or `API_KEY_<SCHEME_NAME>` (the security scheme name converted to uppercase with non-alphanumeric characters changed to underscores). For OAuth2, provide an already-issued access token in `API_OAUTH_TOKEN`; generated requests send it as a Bearer token. The CLI does not perform OAuth authorization, token exchange, or token refresh. Credentials are never written to generated files.

### Run results and diagnostics

Each Playwright run that records test outcomes writes a machine-readable JSON summary and a curated HTML summary with stable case IDs, pass/fail/skip status, duration, request method and path template, expected/actual HTTP statuses when available, and redacted diagnostics. The HTML counts and rows are generated from the completed run and refreshed after each run; newly added tests appear after they execute. The default HTML path is `test-results/api-report.html`; `--html-report` can select another path, such as `test-results/petstore-live-inventory-report.html`. Raw exception text, response bodies, request headers, and concrete request URLs/query values are not included. Known API credential environment-variable values and common credential-shaped strings are redacted. Playwright's built-in HTML reporter and failure traces remain disabled. A report write failure fails the Playwright run.

The `summarize` command validates the result schema and reports counts computed from individual records, stable case IDs, and available HTTP status and numbered-step evidence. It redacts displayed text and reports observations only; it does not infer root causes. Older schema-version-1 reports without numbered-step evidence remain readable.

Response JSON assertions are not parsed when the response advertises a `Content-Length` above 5 MiB. This check is a parsing guard, not a transport-level response-size limit; Playwright can buffer the response before the assertion step.

### Specification reference and resource policy

Only internal `$ref` references (those beginning with `#`) are resolved. External references—including local files and remote URLs—are rejected before validation/dereferencing; inline or bundle those definitions into the specification. This avoids implicit filesystem reads and network access during analysis. Input specifications are limited to 5 MiB, 300,000 document nodes, 10,000 references, 100 levels of nesting, and 1,000 operations; parser validation/dereferencing has a 10-second timeout. These bounds reduce accidental or hostile resource exhaustion but do not make untrusted specs safe for unrestricted execution. Keep test targets and credentials limited to environments authorized for testing.

## Project status

The deterministic foundation is verified for its current fixture coverage. Latest local checks pass: `npm test` (32 tests), `npm run typecheck`, `npm run build`, and Playwright discovery (3 generated specs). The OpenAI provider is tested with a mock; no live OpenAI request has been made. AI drafts can be explicitly mapped and promoted only to exact, warning-free, non-mutating OpenAPI candidates; promotion invalidates approval and requires normal re-selection and approval. The local-mock regression suite verifies this workflow and preserves mutation safeguards. The demo remains deterministic and uses no private data; broader AGT-10 coverage and the clean-setup demo gate remain open. Data-handling review for a future private-data deployment is outside the demo gate. See [the backlog](./BACKLOG.md) and [demo walkthrough](./docs/petstore-demo-walkthrough.md) for current status and target boundaries.

The [HTML onboarding guide](./ONBOARDING.html) remains a read-only Petstore baseline. The 2026-10-11 full Petstore operation review and guarded loopback order-write rehearsal are documented in the [demo walkthrough](./docs/petstore-demo-walkthrough.md); no public Petstore mutation was sent. Frankfurter's official OpenAPI 3.1 contract was analyzed locally (5 operations, 9 cases), and guarded `GET /latest` passed with HTTP 200 and response-schema validation; repeatable commands are in the [Frankfurter demo runbook](./docs/frankfurter-demo.md). A fresh-`npm ci` copy passed the Petstore mock inventory and order lifecycle plus Frankfurter `/latest` walkthrough on 2026-10-11; the remaining Phase 6 check is a colleague's clean-setup acceptance run. OpenAI remains optional and out of the demo; remaining AGT-10 coverage is a Phase 5 task. Data-handling review is only needed before any future use with private data. See [the phased backlog](./BACKLOG.md) for current status and evidence.

## Implementation phases

The work is organized into seven gated phases: **0)** deterministic foundation (complete for current verification scope), **1)** engine hardening (complete), **2)** provider-neutral MVP1 product/tool contract (complete and merged), **3)** deterministic guided CLI MVP1 (complete and merged), **4)** authorized API execution MVP2 (complete and merged), **5)** optional model integration and agent quality (in progress; local OpenAI drafting and controlled promotion, with AGT-10 quality tests open), and **6)** demo readiness (fresh-install rehearsal passed; colleague acceptance pending). Each phase has explicit dependencies and exit criteria in [BACKLOG.md](./BACKLOG.md); Phase 6 can proceed without a live model call.

## Development

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

## Collaboration and Git workflow

`main` is the stable, release-ready branch. `develop` is the shared integration branch. Make all project changes—including code, tests, and documentation—on a short-lived branch created from the latest `develop`; do not commit directly to `main` or `develop`.

Implementation and verification can proceed entirely on the local feature branch. If GitHub access is unavailable, defer pushing and opening a pull request until local work and the demo are ready.

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
