---
name: Prepare Colleague Handoff
description: "Inspect this repository and prepare a complete, evidence-grounded handoff for a colleague to run and present the API testing demo."
argument-hint: "Optional: colleague name, audience, or handoff date"
agent: "agent"
---

Prepare one clear, self-contained handoff for a colleague who has not worked on this project. Use the current repository state as the source of truth. If the user supplied a colleague name, audience, or date, use it; otherwise do not block on questions.

## Inspect Before Writing

Read the authoritative project material that exists in this workspace:

- `README.md`, `BACKLOG.md`, `HANDOFF.md`, and `SESSION_CONTEXT.md`
- `docs/AGENT-CONTRACT.md`
- `docs/service-line-demo-instructions.md`
- `docs/service-line-demo-presentation.html` and `docs/service-line-demo-presentation.md`
- `docs/petstore-demo-walkthrough.md` and `docs/frankfurter-demo.md`
- `docs/petstore-live-plan-2026-10-10.md` and `examples/petstore/TEST-PLAN-EXAMPLE.md`
- `package.json`, `playwright.config.ts`, relevant CLI/generator source, generated test files, and tests needed to verify claims

Use the latest verified status in `BACKLOG.md` and `HANDOFF.md` over older checkpoint notes. If two sources conflict, report the conflict and prefer the newest dated evidence. Do not treat plan candidates, manual-review entries, screenshots, or HTTP responses from failed assertions as passing automated tests.

Do not run API-under-test requests, start mutations, call OpenAI, install packages, or change project files other than the handoff document requested below. This task is documentation preparation only. Do not copy credentials, environment values, private user data, or raw response bodies into the handoff.

## Create the Handoff

Create or update `docs/COLLEAGUE-HANDOFF.md`. Keep it useful as a standalone document and include:

1. **Project purpose and current status:** what the CLI does, what is verified, what remains, and what is explicitly out of scope.
2. **Setup:** Node.js requirement, `npm ci`, test/typecheck/build/discovery commands, expected outcomes, and where to run them.
3. **Demo sequence:** point to the HTML presentation and detailed runbook; give the order of steps and approximate duration.
4. **Exact commands:** start the loopback Petstore mock; fetch/analyze a current public spec as input; guide, select, review, and approve the inventory case; run it against the mock; summarize results; include the optional local-only order-write/readback/restart-cleanup commands. Keep public Petstore writes prohibited.
5. **Contracts and provenance:** identify Petstore Swagger 2.0 and Frankfurter OpenAPI 3.1 inputs, their documented operation/case counts, and recorded SHA-256 fingerprints when available. Explain that freshly downloaded contracts may change, so plans and approvals must be regenerated from the exact current input.
6. **Case disposition:** distinguish automated candidates, manual-review plan entries, selected/approved cases, executed cases, and deferred cases by stable ID. Include evidence pointers/fingerprints where present. Explain why `TC-PLACEORDER-NEG-400` remains manual if confirmed by the current plan, and why `TC-FINDPETSBYSTATUS-POS-200` is not a passing test if that remains the latest status.
7. **Evidence table:** report separately Petstore live inventory, Petstore mock inventory, Petstore mock order/readback/cleanup, and Frankfurter live `/latest`. State that the `findByStatus` response was HTTP 200 but its schema assertion failed. State that no public Petstore mutation and no live OpenAI request were made, if supported by the current records.
8. **Approvals and safety:** explain plan approval, target approval, authentication confirmation when required, execution approval, and the additional mutation approval. Never imply a sample API key authorizes OAuth2 routes or live writes.
9. **Troubleshooting and recovery:** stale plan binding means re-run guided review and approve a fresh artifact; public service/network failure means use recorded evidence and the local mock, not repeated retries; stop the mock after use; restart clears in-memory order data; preserve TLS verification.
10. **Colleague acceptance checklist:** exact results and blockers to report, which remaining backlog item to update, and a clear next step toward the service-line presentation.

Use copyable shell commands that match this repository's actual scripts and CLI flags. Keep the default presentation deterministic; optional OpenAI drafting is not required. When discussing external inference, state that private specifications and objectives must not be sent. Do not claim full OpenAPI compatibility, production readiness, or that every analyzed case was executed.

Before finishing, verify each command and claim against repository source/docs. Where a past result artifact under `/tmp` is missing, rely only on the recorded documentation and label it as previously recorded evidence. Do not invent timings, statuses, approvals, or test counts. Finish with a short list of remaining acceptance items.