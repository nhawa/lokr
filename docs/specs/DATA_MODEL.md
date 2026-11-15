# Logical data model (DB engine not yet selected)

All identifiers UUID/ULID. Timestamp fields UTC; display local time in UI. Sensitive contents remain private; avoid unbounded duplication of CV text.

| Entity | Essential fields | Relationships |
|---|---|---|
| `users` | `id`, `email/username`, `password_hash`, `created_at` | first install single owner |
| `resumes` | `id`, `user_id`, `label`, `created_at`, `archived_at` | versions |
| `resume_versions` | `id`, `resume_id`, `version`, `storage_key`, `mime_type`, `checksum`, `parsed_text`, `edited_text`, `created_at` | source for AI tasks |
| `jobs` | `id`, `user_id`, `company_name`, `title`, `source_url`, `description`, `location`, `archived_at` | applications |
| `applications` | `id`, `user_id`, `job_id`, `resume_version_id`, `status`, `applied_at`, `next_action_at` | events |
| `application_events` | `id`, `application_id`, `type`, `old_status`, `new_status`, `note`, `created_at` | immutable history |
| `ai_connections` | `id`, `user_id`, `kind`, `provider`, `model`, `encrypted_secret_ref`, `is_default`, `created_at` | tasks |
| `ai_tasks` | `id`, `user_id`, `connection_id`, `type`, `status`, `input_refs`, `error_code`, `created_at`, `completed_at` | analyses/drafts |
| `match_analyses` | `id`, `task_id`, `resume_version_id`, `job_id`, `rubric_json`, `score`, `schema_version` | explainable evidence |
| `tailored_resumes` | `id`, `task_id`, `resume_version_id`, `job_id`, `draft_json`, `review_state`, `export_storage_key` | generated drafts |
| `interview_preparations` | `id`, `task_id`, `job_id`, `resume_version_id`, `questions_json`, `schema_version` | study materials |

## Constraints
- Every user-owned record checked against owner in server-side queries, not just UI.
- Unique (`resume_id`, `version`); one default AI connection per user; FK validity; indexed `user_id`, `status` and creation dates.
- Application and job are distinct: a saved job does not equal an application.
- AI tasks store source **IDs and version** rather than copies of secrets; safe structured output, retention and deletion policy.
- `ai_connections.encrypted_secret_ref` must never hold plaintext; key material lives in a secret store or envelope-encrypted field.
- Define cascade/restrict delete behavior carefully to avoid accidental CV loss.

## Migrations
Add versioned migrations from day 1. Backups must include both database and uploaded file volume. Schema names may change during implementation, but keep the domain distinctions.
