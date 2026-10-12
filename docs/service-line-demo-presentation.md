# OpenAPI Playwright Agent
## Service-Line Demo

**Presenter:** [name]<br>
**Audience:** Service-line manager and engineering stakeholders<br>
**Format:** 15-minute core demo, optional 5-minute local-write segment, then discussion<br>
**Scope:** Deterministic workflow; no OpenAI call and no public Petstore mutations

---

## 1. The Goal

Turn an existing Swagger/OpenAPI contract into explainable, reviewable API tests.

- Analyze contract facts and prepare stable-ID test candidates
- Let a person review and approve the exact plan
- Generate Playwright tests only from the approved plan
- Require separate target and execution approval before sending requests
- Summarize observed results by case ID and assertion step

**Speaker note:** This is a guided CLI prototype, not an autonomous production testing platform.

---

## 2. The Workflow

```text
OpenAPI contract
  -> deterministic analysis and evidence
  -> human case selection and plan approval
  -> generated Playwright test
  -> target, auth, and execution confirmations
  -> redacted JSON/HTML result and summary
```

The model is not needed for this workflow. OpenAI drafting is optional, excluded from this demo, and has not been called live.

**Speaker note:** Emphasize the approval boundaries. Analysis and guided plan review do not call the API under test.

---

## 3. Source Specifications

### Petstore

- Source: `https://petstore.swagger.io/v2/swagger.json`
- Format: Swagger 2.0
- Fingerprint: `77d18c99ee7f556e8dbcaf5e80ed788e6cb1a182f37f34229e7b0d956bf4757d`
- Analyzer output: 20 operations, 43 cases; 9 automated candidates, 34 manual-review candidates

### Frankfurter

- Source: `https://api.frankfurter.dev/v1/openapi.json`
- Format: OpenAPI 3.1.2
- Fingerprint: `e38804965823bcbd7db06471aa6a2b8b19b4dfc5f26f95d14aae8cfad1fb46a6`
- Analyzer output: 5 operations, 9 cases; 5 automated candidates, 4 manual-review candidates

**Speaker note:** Fingerprints bind case evidence pointers to the exact input documents. The analysis is local and deterministic.

---

## 4. Generated Cases and Human Disposition

| Case | Contract evidence | Review disposition |
|---|---|---|
| `TC-GETINVENTORY-POS-200` | `GET /store/inventory`, documented HTTP 200, `/paths/~1store~1inventory/get/responses/200` | Selected and approved at plan revision 2; generated and passed against both live Petstore and the mock. |
| `TC-PLACEORDER-NEG-400` | `POST /store/order`, documented HTTP 400 “Invalid Order”, `/paths/~1store~1order/post/responses/400` | Generated as a manual-review plan entry only. No safe trigger is specified, so no executable Playwright test was generated. |
| `TC-PLACEORDER-POS-200` | `POST /store/order`, documented HTTP 200 | Reviewed, approved, generated, then run only against the mock after separate mutation approval; readback and restart cleanup passed. |
| `TC-FINDPETSBYSTATUS-POS-200` | `GET /pet/findByStatus`, documented HTTP 200; OAuth2 declared | Attempt returned HTTP 200 but failed schema validation. Not counted as passing coverage. |

**Speaker note:** “Manual-review case generated” means a review item in the plan, not runnable test code. The system does not invent an error-triggering input.

---

## 5. What We Verified

| Environment | Case | Result |
|---|---|---|
| Petstore public API | `GET /store/inventory` | Guarded HTTP 200 pass |
| Petstore loopback mock | `GET /store/inventory` | Guarded HTTP 200 pass |
| Petstore loopback mock | `POST /store/order` | Guarded HTTP 200; readback 200; restart cleanup 404 |
| Frankfurter public API | `GET /latest` | Guarded HTTP 200 and response-schema pass |

Petstore `GET /pet/findByStatus` returned HTTP 200 but failed the generated schema assertion. It is not passing coverage and is excluded from the demo.

**Speaker note:** Separate observed live API results from mock behavior. No mutation was sent to public Petstore.

---

## 6. Start With the Mock

In Terminal A:

```sh
npm run mock:petstore
```

Expected listener: `http://127.0.0.1:4010/v2`.

- Inventory returns fixture data and requires the local API key
- Order creation stores an in-memory order
- Restarting the mock clears its order state

**Speaker note:** The mock is intentionally narrow. It does not pretend to implement all Petstore operations.

---

## 7. Review Before Generating

In Terminal B, fetch the current Petstore contract and start guided review:

```sh
curl -fsSL https://petstore.swagger.io/v2/swagger.json -o /tmp/petstore-demo-swagger.json
npx tsx src/cli.ts guide \
  --spec /tmp/petstore-demo-swagger.json \
  --objective "Validate the Petstore inventory read operation" \
  --out tests/generated/petstore-demo-inventory.spec.ts \
  --audit /tmp/petstore-demo-guided.jsonl
```

Select `TC-GETINVENTORY-POS-200`, inspect evidence and assertions, then enter `APPROVE`.

**Speaker note:** Fetching the spec is not an API-under-test call. The live contract has 20 operations and 43 candidate cases; select only the inventory read.

---

## 8. Run the Public Read

Use the approved file against public Petstore only if the target is authorized and reachable:

```sh
API_KEY_API_KEY=special-key npx tsx src/cli.ts run \
  --base-url https://petstore.swagger.io/v2 \
  --file tests/generated/petstore-demo-inventory.spec.ts \
  --results /tmp/petstore-demo-live-results.json \
  --html-report /tmp/petstore-demo-live-report.html \
  --audit /tmp/petstore-demo-live-run.jsonl
```

Confirm `AUTHORIZED NON-PRODUCTION`, `AUTHENTICATION CONFIGURED`, and `RUN APPROVED` at the CLI prompts. The sample key is scoped to this command. Expected result: one passing `TC-GETINVENTORY-POS-200`, HTTP 200.

If the service is unavailable or the team has not authorized a fresh request, do not retry. Present the previously recorded guarded pass and continue with the mock.

---

## 9. Show the Same Case Locally

Run the same approved inventory test against the loopback mock:

```sh
API_KEY_API_KEY=local-mock-key npx tsx src/cli.ts run \
  --base-url http://127.0.0.1:4010/v2 \
  --file tests/generated/petstore-demo-inventory.spec.ts \
  --results /tmp/petstore-demo-mock-results.json \
  --html-report /tmp/petstore-demo-mock-report.html \
  --audit /tmp/petstore-demo-mock-run.jsonl
```

Confirm `AUTHORIZED NON-PRODUCTION`, `AUTHENTICATION CONFIGURED`, and `RUN APPROVED`. Then summarize without another request:

```sh
npx tsx src/cli.ts summarize --results /tmp/petstore-demo-mock-results.json
```

**Speaker note:** Compare the mock and live records by stable case ID. A mock pass verifies our fixture path, not public-service availability.

---

## 10. Optional Local Write

If time permits, use only `POST /store/order` against the mock. Generate through `guide`, select only `TC-PLACEORDER-POS-200`, and enter `APPROVE`. Then run:

```sh
npx tsx src/cli.ts run \
  --base-url http://127.0.0.1:4010/v2 \
  --file tests/generated/petstore-demo-order.spec.ts \
  --include-mutating \
  --results /tmp/petstore-demo-order-results.json \
  --html-report /tmp/petstore-demo-order-report.html \
  --audit /tmp/petstore-demo-order-run.jsonl
```

Confirm `AUTHORIZED NON-PRODUCTION`, `RUN APPROVED`, and `APPROVE MUTATING CALLS`. Read back the order with `curl -i http://127.0.0.1:4010/v2/store/order/1`, stop and restart the mock, then confirm readback returns HTTP 404.

**Never change this command's base URL to public Petstore.**

---

## 11. Second Contract, Optional

Frankfurter demonstrates an OpenAPI 3.1 contract and a second read-only target. The guarded `GET /latest` case passed with HTTP 200 and schema validation. Prefer showing its recorded result; rerun only if the team authorizes the public target and network access is available. The exact clean-setup commands are in [the Frankfurter runbook](./frankfurter-demo.md).

---

## 12. Guardrails and Limits

- No OpenAI request is used in this demo; do not send private specs or objectives to an external model.
- No public Petstore mutation is performed.
- Petstore is shared and not guaranteed to be available.
- `findByStatus` is not a pass: the response was HTTP 200, but schema validation failed; its declared OAuth2 is not satisfied by the sample API key.
- Unsupported or under-specified cases remain manual/deferred rather than guessed.
- Reports contain redacted observations, not raw response bodies or causal explanations.
- Keep result files under `/tmp`; Playwright clears repository `test-results` at run start.

---

## 13. Likely Questions

**Is this using AI?**<br>
Not in the demonstrated path. The default workflow is deterministic. Optional OpenAI drafts are proposals; there has been no live OpenAI request.

**How do you prevent unreviewed generated code from running?**<br>
Generation is bound to an approved plan revision. The runner checks that binding and separately requires target, authentication when applicable, execution, and mutation approvals.

**What did you run against real APIs?**<br>
Petstore inventory and Frankfurter `/latest` passed through the guarded CLI. Petstore order creation was mock-only. The `findByStatus` case failed schema validation and is not counted as a pass.

**Why not automate all 43 Petstore cases?**<br>
Some need grounded resource IDs, OAuth2 credentials, supported serialization, or an explicitly documented success condition. We expose uncertainty and defer them instead of guessing.

**Is this production-ready?**<br>
No. It is a project prototype with tested safety boundaries and documented target limitations. A colleague clean-setup acceptance run remains before marking Phase 6 complete.

**What feedback are you asking for?**<br>
Which API and use case should be the next pilot, what evidence reviewers need, and what acceptance criteria would make this useful in the team's delivery workflow.

---

## Presenter Checklist

Before the meeting:

```sh
npm ci
npm test
npm run typecheck
npm run build
npx playwright test --list --reporter=list
```

- Confirm the mock starts on port `4010`.
- Keep API credentials out of slides and files; use only the documented Petstore sample key for the approved public GET.
- Keep the OpenAPI source and run outputs under `/tmp` when practical.
- Do not disable TLS validation. If corporate TLS inspection requires a trusted CA, use the approved CA via `NODE_EXTRA_CA_CERTS`; never set `NODE_TLS_REJECT_UNAUTHORIZED=0`.
- Have the recorded Petstore and Frankfurter result files available as a fallback to public connectivity.
- After the demo, stop the mock and capture feedback/action items in `BACKLOG.md`.

## Related Material

- [Full demo instructions and recovery guide](./service-line-demo-instructions.md)
- [Petstore walkthrough](./petstore-demo-walkthrough.md)
- [Frankfurter runbook](./frankfurter-demo.md)
- [Project README](../README.md)
- [Project backlog](../BACKLOG.md)