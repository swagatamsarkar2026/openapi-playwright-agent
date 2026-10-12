# Frankfurter Read-Only Demo Runbook

This runbook exercises the generic OpenAPI workflow against Frankfurter's public read-only API. It complements the Petstore loopback mock; it does not replace the mock's guarded write and cleanup demonstration.

## Target and Scope

- Official OpenAPI contract: `https://api.frankfurter.dev/v1/openapi.json`
- API base URL: `https://api.frankfurter.dev/v1`
- Contract analyzed on 2026-10-11: OpenAPI 3.1.2, 5 operations, 9 cases (5 automated candidates and 4 manual-review cases)
- Contract SHA-256: `e38804965823bcbd7db06471aa6a2b8b19b4dfc5f26f95d14aae8cfad1fb46a6`
- Selected case: `TC-GET-LATEST-POS-200`, `GET /latest`

The selected operation is read-only and requires no authentication. The generated request uses `base=EUR` and `symbols=USD,GBP`; its assertions check the documented HTTP 200 response and JSON response shape. Exchange-rate values change, so the test does not assert specific rates.

Frankfurter is a public external service, not an isolated sandbox or a guaranteed-availability test environment. Before each run, confirm that your use of this target is authorized and acceptable under your organization's testing policy. The CLI separately requires explicit target and execution confirmations. Do not treat approval for this read as permission to test other operations or send mutations.

## Run From a Clean Setup

Use Node.js 20 or newer. From the repository root, install the locked dependencies and fetch a fresh copy of the contract:

```sh
npm ci
curl -fsSL https://api.frankfurter.dev/v1/openapi.json -o /tmp/frankfurter-openapi.json
```

Analyze the contract locally. This step does not call an API operation:

```sh
npx tsx src/cli.ts analyze \
  --spec /tmp/frankfurter-openapi.json \
  --out /tmp/frankfurter-plan.md
```

Review and generate only the selected candidate through the guided approval workflow:

```sh
npx tsx src/cli.ts guide \
  --spec /tmp/frankfurter-openapi.json \
  --objective "Validate the Frankfurter latest-rates read operation" \
  --out tests/generated/frankfurter-latest.spec.ts \
  --audit /tmp/frankfurter-guided.jsonl
```

At the prompts, enter `TC-GET-LATEST-POS-200`, then type `APPROVE`. Confirm the displayed operation, inputs, evidence, and expected assertions before approving. The guide command does not send API-under-test requests.

Check test discovery without executing the case:

```sh
npx playwright test --list tests/generated/frankfurter-latest.spec.ts --reporter=list
```

After confirming the target is authorized, run the one approved read-only case:

```sh
npx tsx src/cli.ts run \
  --base-url https://api.frankfurter.dev/v1 \
  --file tests/generated/frankfurter-latest.spec.ts \
  --results /tmp/frankfurter-latest-results.json \
  --html-report /tmp/frankfurter-latest-report.html \
  --audit /tmp/frankfurter-latest-run.jsonl
```

At the target prompt, type `AUTHORIZED NON-PRODUCTION` only if you can truthfully confirm the target is authorized and non-production under your policy. The plan requires no credentials, so no authentication confirmation or secret is needed. At the execution prompt, type `RUN APPROVED` only to authorize this selected case. The plan contains no mutations, so there is no mutation-approval prompt.

Summarize the recorded outcome without making another request:

```sh
npx tsx src/cli.ts summarize --results /tmp/frankfurter-latest-results.json
```

Keep results under `/tmp` when running Playwright: Playwright clears the repository's `test-results` output directory at run start.

## Verified Result

On 2026-10-11 local, the guarded run passed with one pass, zero failures or skips, expected and actual HTTP 200, and final recorded step `assert-response-schema`. The test took 16,990 ms. The result summary reported observations only and inferred no root cause. The retained local evidence was:

- `/tmp/frankfurter-latest-results.json`
- `/tmp/frankfurter-latest-report.html`
- `/tmp/frankfurter-latest-run.jsonl`

These files are local run artifacts, not checked-in evidence; repeat the walkthrough to produce fresh results. The public service can change independently of the contract snapshot. Re-fetch and analyze the contract before a new review; approval is tied to the exact generated plan and must not be reused after the spec or generated file changes.

## Related Guides

- [Petstore demo walkthrough](./petstore-demo-walkthrough.md) for the mock-backed inventory and guarded order-write/cleanup paths.
- [Project README](../README.md) for general setup, workflow, and safety boundaries.
- [Phased backlog](../BACKLOG.md) for remaining demo and agent-quality gates.