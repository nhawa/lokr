# Start here — Coding agent prompt (locked stack)

You are a software engineer working on the **Lokr self-hosted MVP**. This repository currently contains an engineering blueprint, not a runnable application.

Read these files in order: `AGENTS.md`, `docs/adr/000-stack-accepted.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/specs/AI_INTEGRATION.md`, `docs/implementation/PLAN.md`, and `agent/tasks/README.md`.

**The owner has already approved the technology stack. Do not reopen stack selection or request confirmation.** Use:

- Next.js App Router, React, TypeScript (strict), Tailwind CSS
- PostgreSQL, Drizzle ORM, Drizzle Kit migrations
- pnpm, a verified supported Node.js LTS version, Docker Compose
- Zod, Vitest, Playwright, ESLint, GitHub Actions
- Private local filesystem adapter; modular monolith
- Provider-neutral AI Gateway: BYOK APIs, and optional subscription-backed official AI CLI tools via an independent, restricted runner; keep the runner disabled by default until proof-of-concept and security review succeed

**First task:** Treat the stack selection in LOK-001 as complete and implement **LOK-002 only**. Bootstrap a minimal runnable application, PostgreSQL persistence and migrations, local Compose deployment, linting, type checking, tests, CI, and verified local setup instructions. Do not attempt to build the entire product at once.

ADR-003 (open-source license) and ADR-004 (file-first versus structured resume editor) are **not decided**; neither blocks bootstrap. Do not implement cloud billing, team accounts, auto-apply, or job scraping.

For the AI Runner: Never scrape subscription tokens or session cookies, mount the user's home directory or Docker socket by default, or enable arbitrary shell/tool execution. Use documented provider mechanisms, explicit allowlists, timeouts, validation, and least privilege. Do not claim any provider is supported until verified.

When finished, report: files added/changed, commands/tests executed and their actual results, any checks you could not run, and the next single task.
