# Proposed HTTP API contract (framework neutral)

All routes are illustrative and require owner authorization except setup, login, and health. Use version `/api/v1`.

| Method | Route | Purpose |
|---|---|---|
| POST | `/setup` | first-run owner creation, only when uninitialized, race-safe |
| POST | `/auth/login` | establish secure session |
| POST | `/auth/logout` | invalidate session |
| GET/POST | `/resumes` | list/create CV |
| POST | `/resumes/{id}/versions` | upload new version |
| GET | `/resumes/{id}/versions/{version}` | retrieve metadata/parsed text |
| GET/POST | `/jobs` | list/create jobs |
| PATCH | `/jobs/{id}` | edit job |
| GET/POST | `/applications` | list/create application |
| PATCH | `/applications/{id}` | update status and next action |
| POST | `/applications/{id}/events` | add note/history |
| GET/POST | `/ai/connections` | list/create configuration (never return secret) |
| POST | `/ai/connections/{id}/test` | test configured connection |
| POST | `/ai/tasks` | run/schedule matching, tailoring or interview prep |
| GET | `/ai/tasks/{id}` | status / validated output |
| POST | `/tailored-resumes/{id}/export` | owner-reviewed export |
| GET | `/dashboard` | summary of applications |

Use explicit schema validation, pagination for lists, idempotency where appropriate, uniform problem details, per-endpoint rate limits for login/AI, strict file upload constraints and CSRF protection for cookie sessions. Secrets are write-only, never serialized back.
