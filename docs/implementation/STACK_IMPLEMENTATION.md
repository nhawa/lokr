# Locked stack implementation checklist — LOK-002

1. Create a pnpm workspace (`apps/web`, `packages/core`, `packages/database`, `packages/ai`, `packages/storage`). Pin supported Node LTS and pnpm, commit `pnpm-lock.yaml`.
2. Bootstrap Next.js App Router + strict TypeScript + Tailwind CSS. Keep database and private server modules in server-only entrypoints. No secrets in `NEXT_PUBLIC_*` variables.
3. Add Drizzle schema/migration toolchain for PostgreSQL (owner/user table plus minimal health/migrations mechanism). Create schema migrations as checked-in artifacts.
4. Implement minimal health endpoint and a basic first-run UI screen; do not pretend signup/auth is complete until LOK-003.
5. Build Compose app + PostgreSQL with localhost-only published app port and named volumes for Postgres/private uploads; no runner by default. Use health checks, non-root, no exposed DB port.
6. Configure Vitest unit smoke tests, Playwright browser smoke test, ESLint, `tsc --noEmit`, and GitHub Actions CI.
7. Write `README.md` quick start with `.env` creation, migration, start/stop, backup caveat, and actual verification results. Never commit credentials.
8. Ensure `pnpm build`, lint, typecheck, migrations, and Compose smoke tests are run where tools are available. Report any skipped verification, not a fabricated pass.
9. Note unresolved decisions: ADR-003 OSS license, ADR-004 resume workflow. Do not build job scraping, cloud billing, auto-apply, or CLI secret scraping.

CLI integration remains task LOK-010 onward. Keep the gateway interfaces provider-neutral; avoid enabling agent shell/tools in baseline runtime.
