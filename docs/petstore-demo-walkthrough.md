# Petstore Demo Walkthrough

This walkthrough demonstrates the guarded OpenAPI-to-Playwright workflow with one read-only operation: `GET /store/inventory`. It first runs against the loopback mock. The previously recorded live Petstore pass is evidence for the same operation; repeating a live request is not required for the demo.

`GET /pet/findByStatus` is not part of this walkthrough. The live spec declares OAuth2 for that operation, and the available Petstore API key does not satisfy that requirement. Its response-schema fix has local regression coverage, but the post-fix live case is unverified and deferred.

## 1. Start the local mock

In a terminal from the repository root:

```sh
npm run mock:petstore
```

The mock binds to `127.0.0.1:4010`. `GET /v2/store/inventory` requires an `api_key` header and returns fixture data from `examples/petstore/mock-data.json`. `POST /v2/store/order` stores an order in process memory and returns its generated ID; `GET /v2/store/order/{orderId}` reads it back. Stop the mock to discard all order data.

## 2. Review and approve the inventory case

In a second terminal, fetch the live Swagger 2.0 contract and start guided review:

```sh
curl -fsSL https://petstore.swagger.io/v2/swagger.json -o /tmp/petstore-live-swagger.json
npx tsx src/cli.ts guide \
  --spec /tmp/petstore-live-swagger.json \
  --objective "Validate the Petstore inventory read operation" \
  --out tests/generated/petstore-live-inventory.spec.ts \
  --audit /tmp/petstore-inventory-guided.jsonl
```

At the case-selection prompt, enter `TC-GETINVENTORY-POS-200`. Review the displayed evidence and steps, then type the exact word `APPROVE`. This generates the selected case; it sends no request to the API under test.

## 3. Run against the local mock

```sh
API_KEY_API_KEY=local-mock-key npx tsx src/cli.ts run \
  --base-url http://127.0.0.1:4010/v2 \
  --file tests/generated/petstore-live-inventory.spec.ts \
  --results /tmp/petstore-inventory-mock-results.json \
  --html-report /tmp/petstore-inventory-mock-report.html \
  --audit /tmp/petstore-inventory-mock-run.jsonl
```

Confirm the loopback target, the local mock credential, and execution at the prompts using the exact phrases shown by the CLI: `AUTHORIZED NON-PRODUCTION`, `AUTHENTICATION CONFIGURED`, and `RUN APPROVED`. Expected result: one passing inventory case with HTTP 200 and no mutating cases.

**Rehearsal result (2026-10-11):** `TC-GETINVENTORY-POS-200` passed against the loopback mock with expected/actual HTTP 200 in 94 ms; one pass, zero failures/skips, and zero mutating cases. The JSON and HTML outputs were written under `/tmp/petstore-inventory-mock-*`. The mock was stopped after the run.

## 4. Present the live evidence

The existing recorded live run passed `TC-GETINVENTORY-POS-200` against `https://petstore.swagger.io/v2`: expected and actual HTTP 200, one pass, and zero failures or skips. Use the retained result and HTML snapshot in `test-results/` if available; do not rerun the public service just to demonstrate the workflow. Petstore is shared and its availability is not guaranteed.

**Latest live verification (2026-10-11):** the guarded CLI run passed `TC-GETINVENTORY-POS-200` against the same target in 333 ms. The result records expected/actual HTTP 200, one pass, zero failures/skips, plan revision 2, and spec fingerprint `77d18c99ee7f556e8dbcaf5e80ed788e6cb1a182f37f34229e7b0d956bf4757d`. The JSON result is `/tmp/petstore-live-results.json`; the run audit is `/tmp/petstore-live-run.jsonl`.

If a new live request is desired, treat it as a separate execution: verify the current spec and target, use only the documented Petstore sample API key in the process environment, preserve TLS verification, and complete the CLI's target, authentication, and execution confirmations. Do not use the OpenAI provider key as API-under-test authentication.

## Operation disposition

**Review date:** 2026-10-11<br>
**Source:** freshly fetched `https://petstore.swagger.io/v2/swagger.json`<br>
**Specification SHA-256:** `77d18c99ee7f556e8dbcaf5e80ed788e6cb1a182f37f34229e7b0d956bf4757d`<br>
**Analysis:** 20 operations, 43 cases (9 automated candidates, 34 manual-review cases). The full generated plan was written to `/tmp/petstore-live-plan-2026-10-11.md`; this table records review disposition, not execution evidence.

| Operation(s) | Disposition | Reason / remaining gate |
|---|---|---|
| `GET /store/inventory` | Selected; mock and guarded live run passed | Only operation with completed generated-CLI live evidence. Read-only and API-key authenticated. |
| `GET /pet/findByStatus`, `GET /pet/findByTags` | Defer | Declare OAuth2; the available Petstore API key is not an OAuth token. Required query values also need review. |
| `GET /pet/{petId}` | Defer | API-key auth is available, but the contract provides no usable pet ID. Do not guess an existing resource. |
| `GET /store/order/{orderId}` | Defer | No usable order ID is specified; a successful check would require a known, authorized test resource. |
| `GET /user/{username}` | Defer | No usable username is specified; do not guess account data. |
| `GET /user/login` | Defer | Required username/password values are absent and query serialization needs review; do not use real credentials in a demo URL. |
| `GET /user/logout` | Manual review; exclude | No documented success response; despite the GET method, its description says it logs out the current session. |
| `POST /pet/{petId}/uploadImage` | Defer live; mock only if modeled | Declares OAuth2, has no usable pet ID, and Swagger formData needs manual implementation. The separate UI capture is not guarded-CLI evidence; effects and cleanup are unknown. |
| `PUT /pet`, `POST /pet` | Defer | Declare OAuth2 and have no documented 2xx response to use as an approved success assertion. |
| `POST /pet/{petId}`, `DELETE /pet/{petId}` | Defer; mock only if modeled | Declare OAuth2, lack a usable pet ID, and have no documented 2xx response; the form-data operation also needs manual implementation. |
| `POST /store/order` | Defer live; candidate for isolated mock | Has a documented 200 response and no declared auth, but creates an order on a shared service. No disposable test-data and cleanup procedure is established. |
| `DELETE /store/order/{orderId}` | Defer; mock only if modeled | No usable order ID or documented 2xx response; deletion on the shared service is not justified. |
| `POST /user`, `POST /user/createWithArray`, `POST /user/createWithList` | Defer; mock only if modeled | Mutating operations have no documented 2xx response; safe test identities and cleanup are not established. |
| `PUT /user/{username}`, `DELETE /user/{username}` | Defer; mock only if modeled | No usable username or documented 2xx response; changes to shared user data are not justified. |

This disposition accounts for all 20 operations. Only `GET /store/inventory` is selected for the current public-service demo. No other operation was executed as part of this review, and no mutation was sent. Re-review the current spec and inputs before adding a case; the 2026-10-10 checked-in plan is an older snapshot.

## Demo boundaries

- No OpenAI request is needed for this walkthrough.
- The inventory rehearsal verifies the inventory assertions. The separate order rehearsal below verifies one generated mutation against an isolated loopback mock, not the public Petstore write behavior.
- No mutating operation is sent to the public Petstore service.
- `GET /pet/findByStatus` remains outside live demo scope until its declared authentication is available or the contract's authentication requirement is independently reviewed.

## Local order write rehearsal

This optional rehearsal covers `POST /store/order` only against the loopback mock. It creates an in-memory order with ID `1`; stopping the mock clears it. Do not change the base URL to the public Petstore service for this mutation.

Start the mock using step 1, then fetch the current contract and start guided review:

```sh
curl -fsSL https://petstore.swagger.io/v2/swagger.json -o /tmp/petstore-live-swagger.json
npx tsx src/cli.ts guide \
  --spec /tmp/petstore-live-swagger.json \
  --objective "Validate order creation against the isolated Petstore mock" \
  --out tests/generated/petstore-live-order.spec.ts \
  --audit /tmp/petstore-order-guided.jsonl
```

Select `TC-PLACEORDER-POS-200`, review the request and expected response, and type `APPROVE`. This approves only test generation; no API request is sent. Then run the approved test against loopback:

```sh
npx tsx src/cli.ts run \
  --base-url http://127.0.0.1:4010/v2 \
  --file tests/generated/petstore-live-order.spec.ts \
  --include-mutating \
  --results /tmp/petstore-order-mock-results.json \
  --html-report /tmp/petstore-order-mock-report.html \
  --audit /tmp/petstore-order-mock-run.jsonl
```

At the prompts, confirm the authorized non-production target, execution, and the separate `APPROVE MUTATING CALLS` gate. Because `POST /store/order` declares no authentication, no API key is needed for this mock case. Expected result: `TC-PLACEORDER-POS-200` passes with HTTP 200. To verify the created in-memory record, request `http://127.0.0.1:4010/v2/store/order/1`; stopping and restarting the mock removes it. This rehearsal demonstrates the guarded workflow and mock behavior only; it does not authorize or verify a live mutation.

**Automated regression (2026-10-11):** the test suite generated and approved `TC-PLACEORDER-POS-200` from a minimal OpenAPI 3.0 fixture matching this Petstore route, ran it through the guarded CLI against the loopback mock with all separate approvals, verified order readback, then restarted the mock and confirmed the order was gone. This validates the local mutation/cleanup path. It is not a live Petstore write and does not replace running the documented fresh-Swagger walkthrough above.

**Fresh Petstore spec rehearsal (2026-10-11):** guided review selected and approved only `TC-PLACEORDER-POS-200` from the live Swagger 2.0 spec (fingerprint `77d18c99ee7f556e8dbcaf5e80ed788e6cb1a182f37f34229e7b0d956bf4757d`). The guarded CLI then ran against `http://127.0.0.1:4010/v2` after target, execution, and mutation confirmations. It passed with expected/actual HTTP 200 in 97 ms, one pass, zero failures/skips. Results and audit are under `/tmp/petstore-order-mock-*`. The mock was stopped after the run; no public Petstore mutation was sent.

## Alternative public target and authorization decisions

### Frankfurter

Frankfurter is a candidate for public, read-only demo coverage alongside the Petstore mock:

- Official OpenAPI 3.1 contract: `https://api.frankfurter.dev/v1/openapi.json`.
- The official contract was fetched and analyzed locally on 2026-10-11. The analyzer prepared 5 operations and 9 cases: 5 automated candidates and 4 manual-review cases. Its SHA-256 is `e38804965823bcbd7db06471aa6a2b8b19b4dfc5f26f95d14aae8cfad1fb46a6`.
- `GET /latest` (`TC-GET-LATEST-POS-200`) is a no-auth, read-only case with documented JSON response-schema assertions. A guarded run against `https://api.frankfurter.dev/v1` passed on 2026-10-11 local: one pass, zero failures/skips, expected/actual HTTP 200, and the final recorded step was `assert-response-schema`. The request used the documented EUR base and USD/GBP symbols; it did not assert live exchange-rate values. Results, HTML report, and audit are `/tmp/frankfurter-latest-results.json`, `/tmp/frankfurter-latest-report.html`, and `/tmp/frankfurter-latest-run.jsonl`.
- See the [Frankfurter read-only demo runbook](./frankfurter-demo.md) for clean-setup commands, approvals, and result summarization.
- Frankfurter may complement the existing Petstore evidence; it does not replace the loopback mock's mutation and cleanup demonstration. HTTPBin was also checked, but its published Swagger 2.0 document failed this project's strict validation and is not currently a demo candidate.

### Direct Petstore calls

Organizational approval to test an endpoint does not itself grant API access. Before a guarded call to an OAuth2-protected Petstore operation:

1. Confirm the selected operation, target, and test purpose are authorized.
2. Use a bearer token issued for the Petstore service with the required scopes. A corporate token is not interchangeable unless it is explicitly valid for Petstore. The Petstore sample API key does not satisfy an OAuth2 requirement.
3. Supply the token only through the runner's `API_OAUTH_TOKEN` environment variable. Do not put credentials in the spec, generated test, audit, report, or command history.
4. Complete the CLI's separate target, authentication, and execution confirmations. Mutating operations also require the independent mutation approval.

The public Petstore service is shared, not an isolated sandbox. A valid token and organizational approval do not establish that a write is repeatable or safely reversible. Keep writes on the loopback mock unless safe test data, effects, and cleanup/recovery are established for that specific live operation. The current walkthrough sends no public Petstore mutations.

### OpenAI approval is separate

Petstore target authorization and OpenAI outbound-data approval are independent decisions. The optional OpenAI workflow requires explicit per-run consent, but that consent does not replace organizational privacy/retention approval. No live OpenAI request was made for this walkthrough. Until the organizational policy is confirmed, keep model-provider tests mocked and inference disabled for private objectives or specifications.

### Recommended demo split

Use Frankfurter for an additional public read-only contract/run; the `/latest` case is now verified. Retain Petstore's loopback mock for guarded mutation and cleanup, and include both paths in the clean-setup rehearsal. Record live endpoint results separately from local analysis and mock results. This public API pass does not close the remaining OpenAI data-policy, AGT-10 quality-test, or clean-setup walkthrough gates.