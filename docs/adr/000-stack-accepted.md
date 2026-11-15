# ADR-000 — Technology stack for Lokr MVP

**Status: ACCEPTED (owner instruction 2026-11-15)**

## Decision

- **Web + server:** Next.js App Router, React, TypeScript (Node.js runtime for server-only code).
- **UI:** Tailwind CSS, accessible semantic components. No mandatory component library in v0.1.
- **Architecture:** modular monolith, Next.js route handlers/server components and isolated domain/application packages. No separate general-purpose HTTP backend.
- **Data:** PostgreSQL; Drizzle ORM + drizzle-kit migrations; `postgres` driver (node-postgres is an acceptable documented alternative only if justified in an ADR).
- **Validation:** Zod at all untrusted boundaries and typed internal interfaces.
- **File storage:** local private persistent volume through a storage interface; never serve uploads directly as static files.
- **Deployment:** Docker Compose with application + Postgres; optional isolated AI CLI Runner added as separate service when implemented.
- **AI:** BYOK API adapter and optional CLI subscription adapters behind provider-neutral AI Gateway; Runner uses explicit executable allowlist, authenticated local IPC, non-root restricted execution, no arbitrary shell/agent tools. Official provider auth only. Local Ollama is optional P1.
- **Testing:** Vitest for units/integration; Playwright for E2E; ESLint + TypeScript strict mode; CI via GitHub Actions.
- **Package manager:** pnpm with committed lockfile; Node LTS pinned to a supported major after checking current releases at implementation time.

## Why

The previous Lokr planning baseline recommended Next.js/TypeScript modular monolith + PostgreSQL + Docker Compose. This decision removes implementation ambiguity. Drizzle and pnpm are **explicit project design choices**, not claimed as findings of an unavailable complete research report. PostgreSQL suits application data/relations and repeatable migrations; App Router keeps a small self-hosted app in one main runtime. A separate runner limits risks from provider CLI integrations.

## Alternatives considered

- **SvelteKit + TS:** lightweight and compelling, but not selected to keep the existing React/Next baseline and contributor familiarity.
- **React/Vite + Go API:** strong typed Go backend and clear runtime boundaries, but two primary app stacks add maintenance/integration work for this single-user MVP.
- **Django/HTMX or FastAPI + React:** good document/AI ecosystem, but extra language/runtime and divergent frontend stack for this MVP.
- **SQLite:** lower resource footprint; PostgreSQL chosen for relational workload, future growth and consistency of migration/recovery strategy. Postgres service is accepted self-hosted overhead.
- **Prisma:** valid TS ORM; Drizzle chosen for explicit SQL-aligned schema/migrations and lightweight control. Revisit only with benchmark or concrete blocker.

## Constraints and consequences

- Never introduce SaaS billing, cloud features, auto-apply, or web scraping into v0.1.
- Do not introduce Redis, Kafka, vector DB, microservices, or a separate generic worker until a concrete need is demonstrated.
- Preserve separation of domain code from Next.js entrypoints to avoid framework coupling.
- `docs/adr/004-resume-workflow.md` (file-first vs structured builder) and license choice remain **open**.
- This starter package is still a **blueprint**, not runnable until LOK-002 bootstrap is implemented.
