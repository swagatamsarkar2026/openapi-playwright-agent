# Service-Line Demo Instructions

**Audience:** presenter and service-line reviewers<br>
**Updated:** 2026-10-12<br>
**Recommended format:** 15-minute core demo, plus 5 minutes for the optional mock-write segment and questions

## Purpose

Show a safe, explainable API test workflow: load an OpenAPI contract, review evidence-backed test cases, approve one, generate a Playwright test, run it through the guarded CLI, and inspect recorded results.

The demo is deterministic. Do not enable OpenAI drafting or send private specifications, objectives, credentials, or customer data to an external model. Do not send mutations to public Petstore. The optional order write is only for the loopback mock.

## Evidence To Present

Keep these outcomes distinct when describing coverage:

| Target and case | Recorded outcome | What it demonstrates |
|---|---|---|
| Petstore live `GET /store/inventory` | Guarded run passed with HTTP 200 | A reviewed, read-only case can run against the public Petstore service. |
| Petstore mock `GET /store/inventory` | Guarded run passed with HTTP 200 | The same read-only workflow works against a local fixture-backed service. |
| Petstore mock `POST /store/order` | Guarded run passed with HTTP 200; readback returned 200; after restart, readback returned 404 | Separate mutation approval, local state, and cleanup behavior. This is not evidence of a public Petstore write. |
| Frankfurter live `GET /latest` | Guarded run passed with HTTP 200 and response-schema validation | The workflow also handles an OpenAPI 3.1 contract and a second public read-only API. |
| Petstore `GET /pet/findByStatus` | HTTP 200 response, but generated schema assertion failed | An attempted case, not passing coverage. Keep it excluded: OAuth2 is declared, while the available sample key is not an OAuth token. |

The 2026-10-11 clean-copy rehearsal used fresh `npm ci` in an isolated copy and passed that checkpoint's 32-test suite, typecheck, build, and Playwright discovery. Current Windows verification on 2026-10-12 passed typecheck and build; unit tests reported 31 passed, 0 failed, and 1 skipped because Windows `child.kill('SIGINT')` terminates the child instead of delivering a catchable signal. Playwright discovery listed 52 tests in 7 files because local generated specs are present. No live OpenAI call or public Petstore mutation was made. The colleague's own clean-setup acceptance run is still the final Phase 6 check.

## Presenter Preparation

From the repository root, use Node.js 20 or newer:

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npx.cmd playwright test --list --reporter=list
```

No OpenAI key is needed. For the Petstore mock segment, confirm port `4010` is available. The mock binds only to `127.0.0.1` and keeps orders in memory. In PowerShell, use `$env:TEMP` for run outputs because Playwright clears the repository `test-results` directory at run start.

Keep a terminal open for the mock and a second terminal for guided review and execution. Do not put real credentials in a file, slide, screenshot, or shell history. The local mock key below is a demo value, not a production credential.

## 15-Minute Core Demo

### 1. Opening and scope (1 minute)

Suggested opening:

> This project turns an existing OpenAPI contract into reviewable API tests. The default path is deterministic: the user reviews and approves a case before code generation, and separately approves the target and execution. Today I will show the Petstore mock and the recorded read-only public API results. Public Petstore writes are out of scope.

Set expectations: this is a guided CLI prototype, not a hosted product or a fully autonomous agent. The service does not need an LLM to demonstrate the workflow.

### 2. Start the Petstore mock (1 minute)

In Terminal A:

```powershell
npm.cmd run mock:petstore
```

Expected output includes `Petstore mock listening at http://127.0.0.1:4010/v2`.

### 3. Fetch the contract and review the case (4 minutes)

In Terminal B, fetch the public contract as analysis input, then start guided review:

```powershell
$specPath = Join-Path $env:TEMP 'petstore-demo-swagger.json'
$planPath = Join-Path $env:TEMP 'petstore-demo-plan.md'
$guidedAudit = Join-Path $env:TEMP 'petstore-demo-guided.jsonl'
curl.exe -fsSL https://petstore.swagger.io/v2/swagger.json -o $specPath
npx.cmd tsx src/cli.ts analyze --spec $specPath --out $planPath
npx.cmd tsx src/cli.ts guide --spec $specPath --objective "Validate the Petstore inventory read operation" --out tests/generated/petstore-demo-inventory.spec.ts --audit $guidedAudit
```

At case selection, enter `TC-GETINVENTORY-POS-200`. Inspect its expected HTTP 200, evidence pointers, and authentication requirement; then type `APPROVE` to generate. This fetches the contract and prepares a test, but does not call an API operation.

Talking point: the full Petstore contract inventory contains 20 operations and 43 cases. The inventory case is selected because its input and expected response are sufficiently grounded. Many other candidates remain manual or deferred rather than guessed.

### 4. Run the inventory case against the mock (3 minutes)

```powershell
$env:API_KEY_API_KEY = 'local-mock-key'
$inventoryResults = Join-Path $env:TEMP 'petstore-demo-inventory-results.json'
$inventoryReport = Join-Path $env:TEMP 'petstore-demo-inventory-report.html'
$inventoryAudit = Join-Path $env:TEMP 'petstore-demo-inventory-run.jsonl'
npx.cmd tsx src/cli.ts run --base-url http://127.0.0.1:4010/v2 --file tests/generated/petstore-demo-inventory.spec.ts --results $inventoryResults --html-report $inventoryReport --audit $inventoryAudit
```

At the prompts, confirm the loopback mock as `AUTHORIZED NON-PRODUCTION`, the local key as `AUTHENTICATION CONFIGURED`, and the approved plan as `RUN APPROVED`. Expected result: one passed case, HTTP 200, zero failures, zero skips, and zero mutations.

Summarize the recorded result without sending another request:

```powershell
npx.cmd tsx src/cli.ts summarize --results $inventoryResults
Remove-Item Env:API_KEY_API_KEY
```

Show the stable case ID, observed status, expected status, and recorded assertion step. Explain that the summary reports observations and does not invent a root cause.

### 5. Show the public-read evidence (2 minutes)

Use the previously recorded guarded results rather than rerunning public services just for the presentation:

- Petstore live inventory: `TC-GETINVENTORY-POS-200`, HTTP 200.
- Frankfurter live `/latest`: `TC-GET-LATEST-POS-200`, HTTP 200 and response-schema validation.

If the result JSON files are available, show them with `summarize`. Existing artifact paths are recorded in `BACKLOG.md` and `docs/frankfurter-demo.md`. Public services are shared and may be unavailable; lack of connectivity does not invalidate the local mock demonstration.

### 6. Close (1 minute)

Suggested close:

> The useful boundary here is controlled automation, not maximum automation. The system makes contract evidence and uncertainty visible, keeps approval with the reviewer, and uses a local mock for writes when public side effects and cleanup are unknown. I would like feedback on which API and workflow your team would want to pilot next.

Ask for feedback on target API choice, useful case review detail, integration expectations, and acceptance criteria for a follow-on pilot. Do not imply the service-line team has approved a production rollout.

## Optional: Local Order Write and Cleanup (5 minutes)

Use this only if the audience wants to see the separate mutation gate. It is a loopback-only mock rehearsal; never change the target to public Petstore.

With the mock running, fetch the current spec if it is not already available, then guide the order case:

```powershell
curl.exe -fsSL https://petstore.swagger.io/v2/swagger.json -o $specPath
$orderGuidedAudit = Join-Path $env:TEMP 'petstore-demo-order-guided.jsonl'
npx.cmd tsx src/cli.ts guide --spec $specPath --objective "Validate order creation against the isolated Petstore mock" --out tests/generated/petstore-demo-order.spec.ts --audit $orderGuidedAudit
```

Select only `TC-PLACEORDER-POS-200`, inspect the request and expected status, and type `APPROVE`. Then run:

```powershell
$orderResults = Join-Path $env:TEMP 'petstore-demo-order-results.json'
$orderReport = Join-Path $env:TEMP 'petstore-demo-order-report.html'
$orderAudit = Join-Path $env:TEMP 'petstore-demo-order-run.jsonl'
npx.cmd tsx src/cli.ts run --base-url http://127.0.0.1:4010/v2 --file tests/generated/petstore-demo-order.spec.ts --include-mutating --results $orderResults --html-report $orderReport --audit $orderAudit
```

Confirm `AUTHORIZED NON-PRODUCTION`, `RUN APPROVED`, and `APPROVE MUTATING CALLS` when prompted. This operation declares no authentication requirement. Expected result: one passing `TC-PLACEORDER-POS-200` with HTTP 200.

The mock starts with order ID `1` after a fresh start. Read it back:

```powershell
curl.exe -i http://127.0.0.1:4010/v2/store/order/1
```

Stop the mock with Ctrl+C, restart it, then repeat the readback command. The order should return HTTP 404 because the mock's in-memory state was cleared. Stop the mock again after the demo.

## Likely Questions and Answers

**Is this an AI agent?**<br>
The demonstrated workflow is deterministic and CLI-based. An optional OpenAI draft prototype exists, but no live OpenAI request is part of this demo. Model use is not needed to analyze the spec, approve cases, generate tests, or run them.

**How do you prevent a model from writing or running arbitrary tests?**<br>
The demo does not call a model. In the optional prototype, model output is a non-executable proposal. Promotion is limited to cloning an exact eligible deterministic read-only candidate; the reviewer must select and approve the new plan revision before generation.

**What has actually been tested against live APIs?**<br>
Petstore `GET /store/inventory` and Frankfurter `GET /latest` passed through the guarded CLI with HTTP 200. The Petstore order write was tested only against the loopback mock. The `findByStatus` response returned HTTP 200 but failed the generated schema assertion, so it is not counted as a passing test.

**Why not test more Petstore routes?**<br>
The reviewed contract has missing resource IDs, unsupported inputs, OAuth2 requirements, or undocumented success conditions for many operations. We defer them instead of guessing data, authentication, or expected outcomes.

**Why use a public API at all?**<br>
The public read-only cases show the generator against real Swagger/OpenAPI contracts. They are examples, not availability guarantees or evidence for every operation. The repeatable write and cleanup demonstration remains local.

**Can the tool test any OpenAPI service?**<br>
It supports Swagger 2.0 and OpenAPI 3.x within its documented feature set. Unsupported authentication or serialization is surfaced for review rather than guessed. It is not a claim of complete OpenAPI compatibility.

**How are credentials protected?**<br>
Supported API credentials are supplied through environment variables, not generated source. Results and audit are curated/redacted. The public Petstore sample key is scoped to a command; never put actual credentials in checked-in files or presentation material.

**What about the OpenAI data policy?**<br>
It is outside this deterministic demo. Do not send private specifications or objectives. Any future deployment that handles private data needs an applicable review before enabling that use.

**What remains before calling Phase 6 complete?**<br>
A colleague must run the walkthrough from their own clean setup and record acceptance. Broader AGT-10 work is tracked separately and does not block this deterministic showcase.

## Troubleshooting and Guardrails

- **Mock will not start:** check whether port `4010` is already occupied. Stop the existing mock or resolve the port conflict; do not silently point the test at public Petstore.
- **Generated file is rejected as stale or unapproved:** rerun `guide`, select the intended case, and approve the newly generated revision. Do not bypass integrity checks or invoke Playwright directly.
- **Public service is unavailable:** stop retrying during the presentation. Show the recorded result as historical evidence and continue with the local mock.
- **Authentication prompt does not match the selected API:** cancel. Do not use the Petstore API key as an OAuth token or substitute unrelated credentials.
- **A test fails:** preserve the stable case ID, redacted result JSON, and audit file; describe the recorded status/step without guessing a cause. Do not change the assertion merely to obtain a pass.
- **Do not disable TLS validation.** Do not use `NODE_TLS_REJECT_UNAUTHORIZED=0`.
- **Never run a Petstore mutation against the public service.** The local order-write example is specifically bound to `http://127.0.0.1:4010/v2`.

## After the Demo

1. Stop the mock with Ctrl+C.
2. Keep result JSON, HTML reports, and audit logs in `/tmp` unless the team explicitly wants sanitized artifacts retained elsewhere.
3. Record service-line feedback, requested target APIs, and acceptance criteria in `BACKLOG.md`.
4. Ask a colleague to repeat the clean-setup walkthrough; update the Phase 6 status only after that acceptance is recorded.

## Related Documents

- [Project README](../README.md)
- [Phased backlog](../BACKLOG.md)
- [Petstore demo walkthrough](./petstore-demo-walkthrough.md)
- [Frankfurter read-only runbook](./frankfurter-demo.md)
- [Agent contract](./AGENT-CONTRACT.md)