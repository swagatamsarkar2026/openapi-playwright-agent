# OpenAPI Playwright Agent
## Service-Line Demo · Spec → Case → Code → Report

**Format:** 15-minute core walkthrough; optional 5-minute loopback-only write<br>
**Purpose:** Show the complete path from Swagger/OpenAPI input to reviewed cases, approved Playwright TypeScript, guarded execution, and useful reports.

The default demo is deterministic. Do not enable OpenAI drafting or send private specifications, objectives, credentials, or customer data to an external model. No public Petstore mutation is permitted. The optional order write is limited to the loopback mock.

## Journey

```text
local spec → analyzed plan → manual/automated case proposals → human review
           → approved TypeScript → guarded run → HTML + JSON + readable summary
```

The CLI accepts a **local JSON or YAML path** using `--spec`; it does not fetch a URL itself. Download the contract first. `analyze` writes a Markdown plan. `guide` reviews cases, binds approval to a plan revision, and generates TypeScript only after explicit `APPROVE`. Guided review does not call the API under test.

## Inputs

### Petstore · Swagger 2.0

From the repository root in PowerShell:

```powershell
$specPath = Join-Path $env:TEMP 'petstore-demo-swagger.json'
$planPath = Join-Path $env:TEMP 'petstore-demo-plan.md'
curl.exe -fsSL https://petstore.swagger.io/v2/swagger.json -o $specPath
npx.cmd tsx src/cli.ts analyze --spec $specPath --out $planPath
Invoke-Item $planPath
```

Fetching the specification is input acquisition, not an API-under-test request. The 2026-10-11 snapshot analyzed 20 operations and 43 cases: 9 automated candidates and 34 manual-review cases. Fresh specs may change these counts.

### Frankfurter · OpenAPI 3.1

This second input demonstrates the same local-file intake with a different contract version:

```powershell
$frankfurterSpec = Join-Path $env:TEMP 'frankfurter-openapi.json'
$frankfurterPlan = Join-Path $env:TEMP 'frankfurter-plan.md'
curl.exe -fsSL https://api.frankfurter.dev/v1/openapi.json -o $frankfurterSpec
npx.cmd tsx src/cli.ts analyze --spec $frankfurterSpec --out $frankfurterPlan
Invoke-Item $frankfurterPlan
```

The 2026-10-11 analysis recorded 5 operations and 9 cases. The selected `GET /latest` case is read-only and requires no authentication.

## Case Design and Review

The Markdown plan is where reviewers inspect the proposed test cases and detailed steps. Each case includes a stable ID, classification, automation status, input provenance, preconditions, numbered steps, expected outcomes, evidence pointers, and review notes. Open `$planPath` in the editor and find the `## METHOD /path` operation, then its `### TC-...` case.

Automated candidates are not approved tests yet. Documented 4xx responses become **manual-review proposals** when the contract does not establish a safe error-triggering input. For example, `TC-PLACEORDER-NEG-400` records the documented HTTP 400 expectation, but the reviewer must define a safe invalid-order scenario; the tool does not guess a payload. Manual-review cases are not converted into runnable Playwright assertions by approval alone.

Optional OpenAI case drafts are a separate proposal path, not part of the deterministic demo. They require `guide --ai-draft-cases` and the explicit `SEND TO OPENAI` confirmation. Drafts are written separately for manual review; model-authored steps and code are never executed. No live OpenAI request has been made.

Inspect this representative automated case in the plan:

| Field | Example |
|---|---|
| ID / operation | `TC-GETINVENTORY-POS-200` · `GET /store/inventory` |
| Expected status | HTTP 200, documented by the spec |
| Authentication | Declared API key, read from an environment variable |
| Steps | Build URL; set headers/auth; send GET; assert status; check content type; validate response schema |
| Evidence | Spec fingerprint and `/paths/~1store~1inventory/get/responses/200` JSON Pointer |

## Approve and Generate

Start guided review against the same `$specPath` used to create the plan:

```powershell
$guidedAudit = Join-Path $env:TEMP 'petstore-demo-guided.jsonl'
npx.cmd tsx src/cli.ts guide --spec $specPath --objective "Validate the inventory read" --out tests/generated/petstore-demo-inventory.spec.ts --audit $guidedAudit
```

At case selection, choose only `TC-GETINVENTORY-POS-200`. Inspect its evidence, sample, auth requirement, steps, and warnings, then type `APPROVE`. `edit` returns to selection; `cancel` creates no generated test. Approval is bound to the selected plan revision. This is the conversion step: the CLI emits Playwright TypeScript from the approved deterministic candidate; it is not a manual translation exercise.

The generated artifact is:

```text
tests/generated/petstore-demo-inventory.spec.ts
```

Generated source uses `test()` and named `test.step()` calls for URL construction, headers/auth, request, exact status, content type, and response schema. It carries the stable case ID, request serialization, configured environment-based credentials, safe diagnostics, and integrity metadata binding the file to the approved plan. Generated files are local artifacts and are ignored by Git.

## Review the TypeScript

Open `tests/generated/petstore-demo-inventory.spec.ts` in VS Code and check:

- The case ID, method, path, selected input values, and expected status match the plan.
- Authentication is read from the expected environment variable; no secret is embedded.
- Assertions match documented content type and supported response-schema constraints.
- The generated plan metadata and execution approval checks remain intact.
- Mutation and warning behavior is not weakened.

If the generated file changes, regenerate and reapprove rather than bypassing the integrity check. Typecheck and test discovery are safe checks; they do not send API requests:

```powershell
npm.cmd run typecheck
npx.cmd playwright test --list tests/generated/petstore-demo-inventory.spec.ts --reporter=list
```

## Run and Report

Start the local Petstore mock in Terminal A and leave it running:

```powershell
npm.cmd run mock:petstore
```

It listens only on `http://127.0.0.1:4010/v2`. In Terminal B, configure the fixture key and run only the approved artifact against that loopback target:

```powershell
$env:API_KEY_API_KEY = 'local-mock-key'
$inventoryResults = Join-Path $env:TEMP 'petstore-demo-results.json'
$inventoryReport = Join-Path $env:TEMP 'petstore-demo-report.html'
$inventoryAudit = Join-Path $env:TEMP 'petstore-demo-run.jsonl'
npx.cmd tsx src/cli.ts run --base-url http://127.0.0.1:4010/v2 --file tests/generated/petstore-demo-inventory.spec.ts --results $inventoryResults --html-report $inventoryReport --audit $inventoryAudit
```

At the prompts confirm `AUTHORIZED NON-PRODUCTION`, `AUTHENTICATION CONFIGURED`, and `RUN APPROVED`. Expected result: one pass, HTTP 200, zero failures/skips, and no mutations. Remove the local variable afterward:

```powershell
Remove-Item Env:API_KEY_API_KEY
```

Display the HTML report, then summarize the saved JSON without another request:

```powershell
Invoke-Item $inventoryReport
npx.cmd tsx src/cli.ts summarize --results $inventoryResults
```

The report shows counts and per-case outcome, method/path, expected and actual HTTP status, duration, and redacted diagnostics. The summary adds stable case IDs and available step evidence. It describes recorded observations; it does not infer a root cause. Keep outputs under `$env:TEMP`; Playwright clears repository `test-results` when a run starts.

Previously recorded read-only outcomes are historical examples, not fresh results from this run: Petstore inventory passed against the public service and mock; Frankfurter `GET /latest` passed HTTP 200 with response-schema validation. Public services may be unavailable; continue with the mock instead of repeatedly retrying.

## Optional Mock-Only Write

Only use this five-minute segment if the audience asks about state-changing tests. Re-run `guide` against the current `$specPath`, select and approve only `TC-PLACEORDER-POS-200`, then execute with the separate mutation opt-in:

```powershell
$orderResults = Join-Path $env:TEMP 'petstore-order-results.json'
$orderReport = Join-Path $env:TEMP 'petstore-order-report.html'
npx.cmd tsx src/cli.ts run --base-url http://127.0.0.1:4010/v2 --file tests/generated/petstore-demo-order.spec.ts --include-mutating --results $orderResults --html-report $orderReport
```

Confirm `AUTHORIZED NON-PRODUCTION`, `RUN APPROVED`, and `APPROVE MUTATING CALLS`. Read order `1` and confirm HTTP 200. Stop and restart the mock, then read again and confirm HTTP 404. This verifies in-memory cleanup. **Never target public Petstore with this write.**

## Presenter Close

The workflow demonstrates controlled automation: contract evidence remains visible, reviewers choose what is generated, targets and execution are separately approved, and the report ties observed results back to a case and step.

Ask the team which authorized API and representative workflow they would pilot, what evidence they need to trust a generated check, and what acceptance criteria a follow-up should meet. Do not imply production readiness or service-line acceptance. A colleague's independent clean-setup walkthrough remains the Phase 6 gate; broader AGT-10 quality work is separate.

## Project References

- [HTML presentation](./service-line-demo-presentation.html)
- [Demo instructions and troubleshooting](./service-line-demo-instructions.md)
- [Petstore walkthrough](./petstore-demo-walkthrough.md)
- [Frankfurter runbook](./frankfurter-demo.md)
- [Example test plan](../examples/petstore/TEST-PLAN-EXAMPLE.md)
- [README](../README.md)
- [Backlog](../BACKLOG.md)
- [Colleague handoff](./COLLEAGUE-HANDOFF.md)
