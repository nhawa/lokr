# Agent implementation backlog

Execute in sequence with short reviewable units. Each task has dependencies and testable outcomes. Maintain issues in GitHub if requested; this file is the local source of truth.

| ID | Priority | Title | Dependency |
|---|---|---|---|
| LOK-001 | Done (stack) | Stack accepted in ADR-000; CV and license decisions remain open | — |
| LOK-002 | P0 — NEXT | Scaffold locked Next.js/Postgres/Drizzle stack, Docker, migrations, tests, CI | 001 |
| LOK-003 | P0 | Secure first-run owner setup/login | 002 |
| LOK-004 | P0 | Resume upload, parsing, versions, correction | 003 |
| LOK-005 | P0 | Job manager CRUD | 003 |
| LOK-006 | P0 | Application tracker status and events | 005 |
| LOK-007 | P0 | AI Gateway typed contracts and task lifecycle | 003 |
| LOK-008 | P0 | BYOK API connection, encrypted settings | 007 |
| LOK-009 | P0 | Matching rubric and evidence-based analysis | 004,005,008 |
| LOK-010 | P0 | Restricted CLI Runner and authenticated IPC | 007 |
| LOK-011 | P0 | Codex CLI proof of concept and adapter | 010 |
| LOK-012 | P0* | Claude Code CLI proof of concept and adapter | 010 |
| LOK-013 | P0 | Tailored CV draft, review, PDF export | 009 |
| LOK-014 | P0 | Interview prep question set and answer structure | 009 |
| LOK-015 | P0 | Dashboard | 006 |
| LOK-016 | P0 | Security review, backup/restore, E2E, release | all |
| LOK-017 | P1 | Kilo Code and other providers (validated) | 010 |
| LOK-018 | P1 | Ollama local adapter | 007 |

`*` Claude Code and any subscription integration must pass official support/terms and sandbox feasibility checks; do not block baseline MVP if unavailable.

Detailed first task: `agent/tasks/LOK-001.md`.
