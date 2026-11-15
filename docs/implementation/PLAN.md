# Implementation plan and gates

## Stage 0 — Decisions and bootstrap
- Stack/DB/ORM are **accepted in ADR-000**: Next.js App Router/TS/Tailwind, PostgreSQL/Drizzle, pnpm and Docker Compose. License (ADR-003) and CV editing style (ADR-004) remain open.
- Do not re-run technology-stack comparison. Follow accepted ADR-000 and implement the scaffold using the locked tools.
- Scaffold app, lockfiles, migrations, authentication, app/data volumes, healthcheck, test runner, CI.

## Stage 1 — Local core vertical slice
CV upload/extract/review; jobs CRUD; application state and history; dashboard. Add fixtures and E2E happy path.

## Stage 2 — AI Gateway and API BYOK
Define interface and schemas, encrypted connection settings, API provider adapter, job status and retries, safe scoring rubric and citations to CV evidence.

## Stage 3 — Subscription CLI support
Build separate restricted runner and IPC; verify safe no-tools mode. Implement Codex CLI PoC -> tests -> documented support; then Claude Code PoC -> tests -> documented support. Unsupported subscriptions/tools must show explicit limitation. Never implement unauthorized session reuse.

## Stage 4 — Tailoring and interview prep
Reviewable tailored CV draft with source verification and PDF export; interview questions, rationales and answer framework. Maintain task history.

## Stage 5 — Release hardening
Threat review; migrations; backup/restore walkthrough; usability/accessibility; clean self-hosted install; installer docs, sample env, CI, release notes.

## Milestones / exit criteria
- M0: accepted stack ADR + Docker starts, setup/login functional, CI green.
- M1: CV/job/application data survive restart, CRUD tests pass.
- M2: matching via BYOK API with privacy disclosure and output validation.
- M3: at least one permitted CLI adapter works safely **or** is explicitly deferred with documented reason; runner failure does not affect baseline app.
- M4: tailored CV reviewed/exported + interview prep end-to-end.
- M5: fresh-host install, backup/restore and E2E validated.

## Definition of done per feature
Acceptance test, authz, error handling, empty/loading UI, migrations, docs and no secrets in repo.
