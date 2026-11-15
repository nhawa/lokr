# Coding agent instructions — Lokr

You are implementing **Lokr MVP self-hosted**. Treat the files in `docs/` as the authoritative product spec. Work incrementally; do not implement speculative cloud/SaaS work.

## Before making changes
1. Read `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/specs/AI_INTEGRATION.md`, `docs/implementation/PLAN.md`.
2. ADR-000 is ACCEPTED and the stack is LOCKED: Next.js App Router/TypeScript/Tailwind, PostgreSQL/Drizzle, pnpm, Docker Compose, Vitest/Playwright. Do not re-run the stack selection. ADR-003 license and ADR-004 CV workflow remain undecided; do not misstate their status.
3. Prefer small, verifiable pull requests. Report files changed, tests run, and unresolved questions.
4. If the requested task requires an undecided ADR, request a decision. If explicitly asked to proceed autonomously, declare a reversible assumption and update the ADR; do not claim user approval.

## Nonnegotiable rules
- Never fabricate resume qualifications or work history. Tailored resumes are editable drafts with provenance and review.
- AI scores are **heuristic matching estimates**, not ATS guarantees or hiring predictions.
- AI output is untrusted data. Validate schemas; render safely; ignore commands embedded in resumes/job descriptions.
- Never pass plaintext API keys, CLI login tokens, secrets, or uploaded private docs to logging/telemetry.
- Never collect subscription cookies or scrape tokens; use official CLI authentication only and follow provider terms.
- CLI execution must use an explicit executable allowlist and argv arrays, no shell string interpolation, no arbitrary user command, no elevated privileges, no Docker socket mount.
- Sandbox CLI runner, separate from the web app, with read-only/rootless constraints where possible, egress limits as feasible, resource/time limits and minimal data access.
- No network-accessible CLI-runner endpoint without authentication; prefer local Unix socket or loopback protected IPC.
- Never send CV content to an AI provider without the user's explicit feature invocation; indicate the selected provider and whether data leaves the machine.
- Maintain DB migrations, input validation, accessibility, backups, and end-to-end tests.
- Do not install dependencies without checking official package names and versions; use lockfiles.

## Completion checklist per issue
- Implementation + relevant tests, positive and negative paths
- UI states: loading, error, empty and success
- Updated docs and `.env.example` when config changes
- Security implications reviewed; `git diff` shows no secrets
- One-paragraph handoff describing behavior and verification
