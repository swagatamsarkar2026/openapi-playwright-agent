# Colleague Handoff: OpenAPI Playwright Demo

**Prepared:** 2026-10-12
**Audience:** colleague running and presenting the service-line demo
**Core demo:** about 15 minutes; optional mock-only write segment: about 5 minutes

## Purpose and Status

This TypeScript CLI prototype analyzes Swagger 2.0 and OpenAPI 3.x contracts, presents evidence-backed test candidates for human review, generates Playwright API tests only from an explicitly approved plan revision, and runs an approved generated file only after target, authentication, and execution confirmations. It records redacted results that can be summarized by stable case ID and assertion step.

The default demo is deterministic and does not use OpenAI. Verified examples include a guarded Petstore inventory read against the public service and loopback mock, a mock-only Petstore order lifecycle with cleanup, and a guarded read-only Frankfurter request. This is not a hosted or production-ready product and does not claim full OpenAPI compatibility. Analyzed candidates are not executed coverage.

The remaining Phase 6 gate is a colleague's independent clean-setup walkthrough and recorded acceptance. Broader AGT-10 safety/quality coverage remains open separately. No live OpenAI request and no mutation to public Petstore have been made. Do not send private specifications, objectives, credentials, or customer data to an external model.

**Source handoff warning:** this workspace is on `feature/agt-07-10-result-quality`, three commits ahead of `origin/develop`, with additional modified and untracked files. The current demo source is not available from the remote branch. The colleague must receive the current project snapshot through an approved local transfer before running acceptance. The owner's 2026-10-11 clean-copy rehearsal is prior evidence, not colleague acceptance. Do not push, stage, or commit as part of this handoff.

## Setup and Checks

Use Node.js 20 or newer. Run from the repository root. `npm ci` installs the lockfile-pinned dependencies; browser binaries are not needed for these API requests.

```sh
npm ci
npm test
npm run typecheck
npm run build
npx playwright test --list --reporter=list
```

The latest recorded project checkpoint reports 32 passing unit tests, successful typecheck and build, and discovery of 3 generated specs. In the owner's fresh-copy rehearsal, additional guided cases had been generated before discovery, which then listed 7 specs. Discovery counts depend on which generated files are present; `--list` does not send API requests. Record the actual output from the colleague's copy rather than assuming the historical count.

## Demo Materials and Sequence

Use the [HTML presentation](./service-line-demo-presentation.html) for presenting; it works as a local file (arrow keys navigate, `N` toggles speaker notes, `F` toggles fullscreen). The [service-line demo instructions](./service-line-demo-instructions.md) are the presenter runbook. The [Petstore walkthrough](./petstore-demo-walkthrough.md) has mock and approval details; the [Frankfurter runbook](./frankfurter-demo.md) has its read-only procedure.

Recommended order:

1. Introduce the deterministic review and approval workflow and its limits.
2. Start the Petstore loopback mock.
3. Fetch the current Petstore contract as analysis input; review and approve only the inventory case.
4. Run that approved case against the mock and summarize the recorded result.
5. Present previously recorded public Petstore and Frankfurter read-only results; do not rerun public services solely for the presentation.
6. If time and audience interest permit, demonstrate the order write only against the mock, then verify readback and restart cleanup.

The order-write segment is optional. Never change its loopback base URL to public Petstore.

## Main Walkthrough: Inventory Mock

Start Terminal A from the repository root and leave it running:

```sh
npm run mock:petstore
```

Expected listener: `http://127.0.0.1:4010/v2`. The mock implements inventory and order routes only; it is not a complete Petstore service.

In Terminal B, fetch the current Swagger 2.0 contract and produce a local analysis plan. Fetching the specification and analyzing it do not call an API operation:

```sh
curl -fsSL https://petstore.swagger.io/v2/swagger.json -o /tmp/petstore-demo-swagger.json
npx tsx src/cli.ts analyze \
  --spec /tmp/petstore-demo-swagger.json \
  --out /tmp/petstore-demo-plan.md
```

Start guided review against that exact input:

```sh
npx tsx src/cli.ts guide \
  --spec /tmp/petstore-demo-swagger.json \
  --objective "Validate the Petstore inventory read operation" \
  --out tests/generated/petstore-demo-inventory.spec.ts \
  --audit /tmp/petstore-demo-guided.jsonl
```

At case selection, enter `TC-GETINVENTORY-POS-200`. Inspect the evidence, expected HTTP 200, request inputs, and authentication requirement; then enter `APPROVE`. The `guide` command does not call the API under test.

Run the newly approved artifact only against the loopback mock:

```sh
API_KEY_API_KEY=local-mock-key npx tsx src/cli.ts run \
  --base-url http://127.0.0.1:4010/v2 \
  --file tests/generated/petstore-demo-inventory.spec.ts \
  --results /tmp/petstore-demo-inventory-results.json \
  --html-report /tmp/petstore-demo-inventory-report.html \
  --audit /tmp/petstore-demo-inventory-run.jsonl
```

At the CLI prompts, confirm the target with `AUTHORIZED NON-PRODUCTION`, the mock credential with `AUTHENTICATION CONFIGURED`, and execution with `RUN APPROVED`. Expected result: one passing inventory case, expected/actual HTTP 200, zero failures, zero skips, and no mutations. Then summarize the stored result without making another request:

```sh
npx tsx src/cli.ts summarize \
  --results /tmp/petstore-demo-inventory-results.json
```

Keep generated results, reports, and audit logs under `/tmp`; Playwright clears the repository `test-results` directory when a run starts.

## Optional Mock-Only Order Write and Cleanup

With the mock running, fetch the current contract if needed and guide a fresh order case:

```sh
curl -fsSL https://petstore.swagger.io/v2/swagger.json -o /tmp/petstore-demo-swagger.json
npx tsx src/cli.ts guide \
  --spec /tmp/petstore-demo-swagger.json \
  --objective "Validate order creation against the isolated Petstore mock" \
  --out tests/generated/petstore-demo-order.spec.ts \
  --audit /tmp/petstore-demo-order-guided.jsonl
```

Select only `TC-PLACEORDER-POS-200`, inspect it, and enter `APPROVE`. Run it against the mock with the separate mutation opt-in:

```sh
npx tsx src/cli.ts run \
  --base-url http://127.0.0.1:4010/v2 \
  --file tests/generated/petstore-demo-order.spec.ts \
  --include-mutating \
  --results /tmp/petstore-demo-order-results.json \
  --html-report /tmp/petstore-demo-order-report.html \
  --audit /tmp/petstore-demo-order-run.jsonl
```

Confirm `AUTHORIZED NON-PRODUCTION`, `RUN APPROVED`, and `APPROVE MUTATING CALLS`. This operation has no declared authentication requirement. Expected result: one passing case with HTTP 200. Read back order ID `1`:

```sh
curl -i http://127.0.0.1:4010/v2/store/order/1
```

Stop the mock with Ctrl+C, restart it, and repeat the readback. It should return HTTP 404 because order state is in memory and is cleared on restart. Stop the mock again after the demo. **Never send this write to public Petstore.**

## Contracts and Case Disposition

The Petstore plan checked into this workspace is an older snapshot than the later live review. Do not treat its fingerprint or approvals as current:

| Input | Recorded analysis | SHA-256 provenance |
|---|---|---|
| Petstore live Swagger 2.0, fetched 2026-10-11 | 20 operations, 43 cases: 9 automated candidates and 34 manual-review cases | `77d18c99ee7f556e8dbcaf5e80ed788e6cb1a182f37f34229e7b0d956bf4757d` |
| Checked-in Petstore plan snapshot dated 2026-10-10 | 20 operations, 43 cases: 9 automated candidates and 34 manual-review cases | `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd` |
| Frankfurter official OpenAPI 3.1.2, fetched 2026-10-11 | 5 operations, 9 cases: 5 automated candidates and 4 manual-review cases | `e38804965823bcbd7db06471aa6a2b8b19b4dfc5f26f95d14aae8cfad1fb46a6` |

A contract can change after download. A test plan, generated file, and approval are bound to the exact input and revision. For a new run, review the freshly fetched contract and generate a fresh artifact; never reuse approval after the spec or generated file changes.

| Stable case ID | Classification and evidence | Human disposition and execution status |
|---|---|---|
| `TC-GETINVENTORY-POS-200` | Petstore `GET /store/inventory`, documented HTTP 200. Presentation evidence pointer: `/paths/~1store~1inventory/get/responses/200`. | Selected and approved at plan revision 2 in the recorded review; generated and passed against live Petstore and the loopback mock. Fresh acceptance walkthrough should review and approve its own artifact. |
| `TC-PLACEORDER-POS-200` | Petstore `POST /store/order`, documented HTTP 200. The checked-in older plan records `/paths/~1store~1order/post/responses/200` under fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`. | Selected, approved, and passed only against the loopback mock after separate mutation approval; readback and restart cleanup were verified. No public write was made. |
| `TC-PLACEORDER-NEG-400` | Petstore `POST /store/order`, documented HTTP 400 “Invalid Order”; older-plan pointer `/paths/~1store~1order/post/responses/400`, fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`. | Manual-review plan entry, not executable test code. The contract documents the response but gives no safe input that triggers it, so do not guess one. |
| `TC-FINDPETSBYSTATUS-POS-200` | Petstore `GET /pet/findByStatus`, documented HTTP 200; older-plan pointers `/paths/~1pet~1findByStatus/get` and `/paths/~1pet~1findByStatus/get/responses/200` under fingerprint `c9e513fd37feaa5a98f03dd03a6faa919ad6619b5fe655973ed55e50f9320ccd`. | A guarded attempt received HTTP 200 but failed `assert-response-schema`; it is not a pass. A generator fix has regression coverage, but the post-fix live case has not been rerun. It is deferred because the operation declares OAuth2 and only the Petstore sample API key is available. |
| `TC-GET-LATEST-POS-200` | Frankfurter `GET /latest`, from the OpenAPI 3.1.2 contract above. | Selected and passed through the guarded CLI against the public read-only API with HTTP 200 and response-schema validation. |

These are representative cases, not a complete execution report for all 43 Petstore or 9 Frankfurter cases. The full operation disposition is in the [Petstore walkthrough](./petstore-demo-walkthrough.md); the dated [Petstore plan snapshot](./petstore-live-plan-2026-10-10.md) contains evidence pointers for its own older fingerprint.

## Previously Recorded Execution Evidence

These outcomes are documented historical evidence from 2026-10-11. The referenced `/tmp` artifacts may not exist on the colleague's machine; do not present them as freshly produced by the colleague.

| Target | Case and recorded result | Scope |
|---|---|---|
| Public Petstore `https://petstore.swagger.io/v2` | `TC-GETINVENTORY-POS-200`: guarded pass, expected/actual HTTP 200, one pass, zero failures/skips; latest documented run took 333 ms. | One read-only operation. Petstore is shared and availability is not guaranteed. |
| Petstore loopback mock `http://127.0.0.1:4010/v2` | `TC-GETINVENTORY-POS-200`: guarded pass, expected/actual HTTP 200, one pass, zero failures/skips; documented rehearsal took 94 ms. | Fixture-backed local read. |
| Petstore loopback mock | `TC-PLACEORDER-POS-200`: guarded pass, expected/actual HTTP 200; readback HTTP 200; after mock restart, readback HTTP 404. | Isolated in-memory write and cleanup only; no public Petstore mutation. |
| Public Frankfurter `https://api.frankfurter.dev/v1` | `TC-GET-LATEST-POS-200`: guarded pass, expected/actual HTTP 200 and response-schema assertion passed; documented run took 16,990 ms. | One read-only request; dynamic rates were not asserted. |
| Petstore `GET /pet/findByStatus` | HTTP 200 response, then generated response-schema assertion failed. | Failed test, not passing coverage; post-fix live rerun remains deferred. |

No live OpenAI request has been made. No public Petstore mutation has been made. Do not infer that all analyzed operations ran from these examples.

## Approval and Safety Boundaries

- **Plan approval:** `guide` displays contract-derived candidates and evidence. The reviewer selects case IDs and enters `APPROVE`; this permits generation for that plan revision only. It does not call the API under test.
- **Target approval:** before a run, the reviewer must confirm the exact target is authorized and non-production with `AUTHORIZED NON-PRODUCTION`. Non-loopback targets must use HTTPS.
- **Authentication confirmation:** when the selected plan requires credentials, configure the required environment variable and confirm `AUTHENTICATION CONFIGURED`. Do not put credential values in specs, generated files, logs, slides, or this handoff.
- **Execution approval:** `RUN APPROVED` separately authorizes the selected approved artifact to execute against the confirmed target.
- **Mutation approval:** mutating operations are excluded by default. Generation and execution require explicit opt-ins; running with `--include-mutating` also requires `APPROVE MUTATING CALLS`.

The local mock key `local-mock-key` is demo fixture data only. The public Petstore sample API key is not an OAuth2 token and does not authorize OAuth2 operations. Do not send mutations to public Petstore. The Petstore public read evidence is not permission to probe other routes. Preserve TLS certificate validation; never set `NODE_TLS_REJECT_UNAUTHORIZED=0`. If corporate TLS inspection blocks a request, use only an organization-approved CA with `NODE_EXTRA_CA_CERTS` or use the local mock and recorded evidence.

## Troubleshooting and Recovery

- **Stale or unapproved generated file:** rerun `guide` with the exact current spec, select the intended case, inspect it, and approve the new revision. Do not bypass the integrity guard or run generated files directly with Playwright.
- **Public API or network unavailable:** do not repeatedly retry during the presentation. Continue with the loopback mock and use previously recorded public read evidence, labeled as historical.
- **Mock port 4010 unavailable:** find and stop the existing mock or resolve the port conflict. Do not silently switch to public Petstore.
- **Unexpected auth prompt:** cancel and review the operation's declared security. Never use the Petstore API key as an OAuth token or substitute unrelated credentials.
- **Mock order cleanup:** stop and restart the mock to clear in-memory orders; verify ID `1` returns HTTP 404, then stop the mock after the session.
- **Test failure:** retain the stable case ID, redacted JSON/report, and audit under `/tmp`; describe recorded status and step without guessing a cause or weakening assertions to obtain a pass.

## Colleague Acceptance Checklist

Complete this from the transferred project snapshot, not from the owner's prior rehearsal:

- [ ] Run `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, and `npx playwright test --list --reporter=list`; record actual outputs and any failures.
- [ ] Complete inventory guide/review/generation and mock execution above; verify `TC-GETINVENTORY-POS-200` passes with HTTP 200 and zero failures/skips, then summarize the saved result.
- [ ] If the optional write segment is shown, verify `TC-PLACEORDER-POS-200` passes against loopback, readback returns HTTP 200, and readback after restart returns HTTP 404. Do not perform any public write.
- [ ] Record date, Node version, commands, test/discovery counts, case IDs, observed statuses, and deviations. Keep results and audits redacted and under `/tmp`; do not record secrets.
- [ ] Update the Phase 6 colleague-acceptance item in [`BACKLOG.md`](../BACKLOG.md) only after the independent run is complete. Keep AGT-10 as a separate open quality gate.
- [ ] Use the presentation and runbook for the service-line session; capture reviewer feedback and proposed next pilot/acceptance criteria in the backlog.

**Remaining acceptance items:** colleague clean-setup acceptance is pending; broader AGT-10 coverage remains open. The deterministic demo does not require OpenAI or private-data processing. Any future private-data deployment requires its own applicable data-retention/privacy review.
