# HTTP API contract

All owner routes require authorization. Cookie-authenticated mutations require CSRF protection. `/api/v1` is the versioned public API namespace. Schemas in `apps/web/src/lib/api-contract` define transport validation only; they do not implement authorization, persistence, extraction, rate limiting, or storage.

## Problem details

Errors use `application/problem+json` and RFC 9457-style fields:

```json
{
  "type": "https://lokr.local/problems/validation_failed",
  "title": "Validation failed",
  "status": 400,
  "code": "validation_failed",
  "detail": "One or more fields are invalid.",
  "requestId": "request_12345678",
  "issues": [{ "path": "filename", "code": "custom", "message": "Filename extension must match the declared MIME type." }]
}
```

Supported codes: `malformed_request` (400), `validation_failed` (400), `export_request_invalid` (400), `upload_too_large` (413), `unsupported_media_type` (415), `invalid_file_signature` (422), `extraction_failed` (422), `not_found` (404), `conflict` (409), `extraction_unavailable` (503), `export_unavailable` (503), and `internal_error` (500). Problems never include request bodies, document bytes/text, storage keys, secrets, stack traces, or parser/browser details.

## CV/Resume v1

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/resumes` | query: `cursor`, `limit` (1–100), `direction` | paginated resume summaries |
| POST | `/api/v1/resumes` | JSON `{ label, idempotencyKey? }` | resume summary |
| POST | `/api/v1/resumes/{resumeId}/versions` | `multipart/form-data`: file plus validated metadata | version summary |
| GET | `/api/v1/resumes/{resumeId}/versions/{versionId}` | — | version detail |
| PATCH | `/api/v1/resumes/{resumeId}/versions/{versionId}/content` | JSON `{ text, source, revision }` | version detail |
| POST | `/api/v1/resumes/{resumeId}/versions/{versionId}/review` | JSON `{ revision, confirm: true }` | version detail |

Collection responses are `{ "data": [...], "page": { "nextCursor": null, "limit": 25 } }`. IDs, cursors, revision tokens, and request IDs are opaque. Timestamps are ISO 8601 UTC. Create/upload calls accept an optional idempotency key; implementations must bind it to the authenticated owner and request semantics.

Resume summaries intentionally exclude parsed and edited text. Version detail includes original document metadata (`filename`, MIME type, byte size, checksum, upload timestamp), extraction and review state, and content only when available. Storage paths and keys are never public.

Lifecycle enums are extraction: `queued`, `processing`, `ready`, `failed`; review: `not_ready`, `needs_review`, `reviewed`. Review can be confirmed only after extraction is ready and with the current revision. For ready content, `needs_review` returns `reviewedAt: null`; `reviewed` returns a UTC review completion timestamp. Content sources are `parsed` and `owner_edit`; PATCH requires an optimistic revision token. Content is untrusted text and must be rendered safely. Schema validation does not sanitize HTML.

Uploads support PDF and DOCX and have an initial 10 MiB declared-byte limit. The original file is write-only. The server must enforce authenticated ownership, CSRF protection for cookie sessions, normalized filenames, MIME and file-signature verification, byte and decompression limits, opaque storage keys outside public assets, parser isolation, and no macro execution. Browser-provided MIME and filenames are insufficient.

`POST /api/resume-pdf` is a temporary, non-versioned browser-demo rendering endpoint. It accepts unpersisted Markdown and a display filename and uses `export_request_invalid` or `export_unavailable` problems. It does not verify authentication, ownership, or persisted review state and must not be used as a production export authorization boundary. A future secure export endpoint must accept a persisted resume version or draft ID, authenticate the owner, resolve review state, source content, and eligibility server-side, and never treat client-provided content or approval flags as proof.
