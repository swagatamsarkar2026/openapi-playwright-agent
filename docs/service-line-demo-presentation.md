# OpenAPI Playwright Agent
## Service-Line Demo

**Format:** End-to-end walkthrough with an optional mock-only write segment<br>
**Purpose:** Show how an API contract becomes tests the team can review, run, and trust

---

## 1. The Outcome

Turn an existing Swagger/OpenAPI contract into tests the team can review, run, and trust.

- Reduce repetitive test setup with contract-derived test scaffolding.
- Connect test cases and results to evidence and stable IDs.
- Keep reviewers in control of selection, target, and execution.
- Reuse the workflow across supported Swagger and OpenAPI contracts.

**Say:** “The goal is less manual setup, clearer review, and results that can be traced back to the contract.”

```text
API contract -> reviewable tests -> controlled runs -> useful results
```

## 2. The End-to-End Flow

```text
Contract -> analysis and evidence -> case review and approval
         -> Playwright generation -> guarded execution -> result summary
```

The user supplies a contract and objective, reviews the proposed cases, approves a plan revision, then separately approves the authorized target and execution. Mutating calls need an additional approval.

## 3. What We Built

- **Intake:** Analyze Swagger 2.0 and OpenAPI 3.x inputs into stable operation and case inventories.
- **Plan:** Show expected outcomes, sample provenance, and evidence pointers before generation.
- **Approve:** Bind generated Playwright tests to the explicitly approved plan revision.
- **Verify:** Gate target and execution, then report outcomes with stable IDs and redacted evidence.

Exercised with Petstore (Swagger 2.0; 20 operations, 43 cases analyzed) and Frankfurter (OpenAPI 3.1; 5 operations, 9 cases analyzed).

## 4. From Contract to Cases

Representative cases make the workflow concrete:

| Case | Purpose | Recorded outcome |
|---|---|---|
| `TC-GETINVENTORY-POS-200` | Validate Petstore inventory | Passed against public Petstore and the loopback mock |
| `TC-PLACEORDER-POS-200` | Validate order creation in an isolated mock | Passed; readback and restart cleanup verified |
| `TC-GET-LATEST-POS-200` | Validate an OpenAPI 3.1 read | Passed against Frankfurter with response-schema validation |

## 5. Execution Evidence

| Target | Operation | Result |
|---|---|---|
| Public Petstore | `GET /store/inventory` | Guarded HTTP 200 pass |
| Petstore loopback mock | `GET /store/inventory` | Guarded HTTP 200 pass |
| Petstore loopback mock | `POST /store/order` | HTTP 200; readback 200; after mock restart, 404 |
| Public Frankfurter | `GET /latest` | Guarded HTTP 200 and response-schema pass |

Order creation and cleanup were tested only against the loopback mock.

## 6. Start the Mock

From the repository root:

```sh
npm run mock:petstore
```

The service listens on `http://127.0.0.1:4010/v2`. It serves fixture-backed inventory and stores test orders in memory.

## 7. Review Before Generation

Fetch the current Petstore contract and guide the inventory review:

```sh
curl -fsSL https://petstore.swagger.io/v2/swagger.json -o /tmp/petstore-demo-swagger.json
npx tsx src/cli.ts guide \
  --spec /tmp/petstore-demo-swagger.json \
  --objective "Validate the Petstore inventory read operation" \
  --out tests/generated/petstore-demo-inventory.spec.ts \
  --audit /tmp/petstore-demo-guided.jsonl
```

Select `TC-GETINVENTORY-POS-200`, review the evidence and expected response, and enter `APPROVE`. Guided review does not call the API under test.

## 8. Run Against the Public Read API

The recorded Petstore inventory result is a guarded HTTP 200 pass. Use the existing evidence by default; a fresh public request is optional and requires target authorization and the runner's confirmations.

## 9. Run Against the Mock

Run the same approved case against `http://127.0.0.1:4010/v2`, then use `summarize` on its results file. This demonstrates repeatable validation without depending on public-service availability. Full commands and expected prompts are in the [Petstore walkthrough](./petstore-demo-walkthrough.md).

## 10. Optional Mock Write

For `TC-PLACEORDER-POS-200`, approve generation, run only against the loopback mock with `--include-mutating`, and confirm the additional mutation prompt. Read back order `1`, restart the mock, and verify the record is gone. Never point this write at public Petstore.

## 11. Second API

Frankfurter's `GET /latest` shows the same workflow with an OpenAPI 3.1 contract and a public read-only operation. The recorded run passed HTTP 200 and response-schema validation. See the [Frankfurter runbook](./frankfurter-demo.md) for clean-setup commands.

## 12. Trust and Control

- Generated tests are tied to the exact plan revision the reviewer approved.
- Target and required authentication are confirmed before requests are sent.
- Mutating tests require explicit opt-in and a separate execution approval.
- Stable case IDs and redacted reports make outcomes easier to review.

**Benefit:** Automate repeatable checks while keeping people in control of what runs and where.

## 13. Optional AI-Assisted Drafting

OpenAI can suggest additional scenarios from bounded contract context while deterministic analysis remains the source of executable tests.

- The user must explicitly consent by entering `SEND TO OPENAI`.
- The request uses minimized, redacted operation summaries, documented statuses, evidence pointers, and the objective; it excludes the raw specification, request samples, API-under-test credentials, and target URL.
- Drafts are separate manual-review proposals. Model-authored steps and code are never executed.
- A draft can map to an exact eligible read-only case. Promotion reuses deterministic inputs and assertions, then still requires selection and approval of the new plan revision.
- Provider behavior and safety are covered by mocked tests; no live OpenAI request has been made.
- Do not send private specifications or objectives without the applicable data-policy review.

## 14. Team Discussion

- Which API and representative workflow should we evaluate first?
- Which checks and outcomes matter most to the team?
- What evidence do reviewers need to trust a generated test?
- Where could AI-assisted scenario drafting help within the team's data policies?

## 15. Explore the Project

Use the final slide in the [HTML presentation](./service-line-demo-presentation.html) to open the project guides during discussion:

- [README](../README.md): product overview and CLI usage
- [Backlog](../BACKLOG.md): roadmap, status, and acceptance criteria
- [Project handoff](../HANDOFF.md): project context and collaboration notes
- [Agent contract](./AGENT-CONTRACT.md): workflow, evidence, and approvals
- [Service-line demo instructions](./service-line-demo-instructions.md): presenter script and troubleshooting
- [Petstore walkthrough](./petstore-demo-walkthrough.md): mock, public read, and local order lifecycle
- [Frankfurter runbook](./frankfurter-demo.md): OpenAPI 3.1 read-only workflow
- [Petstore live plan](./petstore-live-plan-2026-10-10.md): operation and case inventory
- [Example test plan](../examples/petstore/TEST-PLAN-EXAMPLE.md): generated case format
- [Colleague handoff](./COLLEAGUE-HANDOFF.md): setup and acceptance checklist

## Presenter Checklist

Run the setup and project checks before the session. Keep outputs under `/tmp`, stop the mock afterward, and use recorded public results if either public service is unavailable. Never send a Petstore mutation to the public service.
