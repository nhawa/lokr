# Product Requirements Document — Lokr MVP v0.1

**Status:** Draft | **Platform:** local/self-hosted browser app | **Audience:** one job seeker/owner per installation.

## Problem
Job seekers scatter CV versions, job descriptions, status notes, interview prep and AI conversations across documents and sites. Lokr provides one private, inspectable workspace.

## MVP outcome
Owner can install Lokr, add CV, save job, check fit, review tailored CV draft, log application, prepare interview, and return to see status; all without sending the application automatically.

## User journey
1. Install via documented Docker Compose and create/configure local owner login.
2. Upload PDF/DOCX resume; parse text; owner reviews corrected source content.
3. Add a job manually: title, company, description and optional URL.
4. Configure an AI connection (BYOK API or supported CLI runner), test it.
5. Request CV-vs-job analysis: evidence-linked strengths, gaps, and a non-ATS heuristic score/rubric, plus failures explained.
6. Create tailored resume draft, edit it, compare with original, export PDF (DOCX optional later; see ADR-004).
7. Track job application state and notes/history.
8. Generate interview questions and suggested points linked to CV/job; text-only MVP, no camera/microphone simulation required.
9. Dashboard with application counts and recent activity.

## Functional requirements
- **F01 CV:** upload PDF/DOCX (configurable size limit), store original, extract normalized text, support versioning, preview and owner correction. Reject invalid formats, safe file names, and avoid executing embedded document content.
- **F02 Jobs:** create/read/update/archive jobs; preserve full job description and original URL; manual entry only.
- **F03 Applications:** link to job, selected CV version, status (`saved`, `applied`, `screening`, `interview`, `offer`, `rejected`, `withdrawn`), timestamps, note history.
- **F04 AI Settings:** choose active AI connection, test connectivity, model and optional limits; handle unavailable CLI and invalid API key clearly.
- **F05 Fit analysis:** evidence for each criterion and missing information; distinguish unsupported claims from detected skills; return versioned structured data and deterministic rubric.
- **F06 Tailored CV:** draft from verified source facts only, editable before export, retain draft-to-source references where feasible, never auto-replace original.
- **F07 Interview prep:** generate staged role-specific questions and `what interviewers look for`, talking points and answer framework; text input practice; optional camera/mic outside MVP.
- **F08 Dashboard:** count by status, recent activity, outstanding tasks.
- **F09 Export/backup:** documented filesystem + DB backup/restore; export data to portable JSON in a later MVP increment if time permits.

## Nonfunctional requirements
- Self-hosted: deployment reproducible; persisted DB and uploaded documents; documented upgrade/migrations; one-command local start **after implementation**.
- Security: owner login; password hash; CSRF/session protection; secure file upload; encrypted API keys at rest; no exposure of secrets in frontend or AI output; dependency and container scanning.
- Reliability: AI request timeout/retry policy with bounded concurrency and clear partial failure states.
- Privacy: user-visible data disclosure before invoking external AI; delete/retention policy and no default telemetry.
- Accessibility: keyboard controls and labeled form fields.
- Testing: unit/domain, integration DB, API contract, and minimal E2E happy path.

## Out of scope
Cloud hosting, SaaS billing, multi-user UI, team management, auto-apply, browser extension, scraping, mass job discovery, email sync, auto outreach, comprehensive CV template marketplace, camera/microphone interview recording, managed AI credits.

## Open decisions
- Framework/backend/ORM/database: ADR-000.
- File-first vs structured CV builder: ADR-004.
- OSS license: ADR-003.
- Which subscription CLI integrations are contractually permitted and stable for the selected runtime: validate via PoC; do not promise all providers at MVP release.

## Release acceptance criteria
1. Fresh self-hosted installation works following documented steps.
2. CV -> job -> analysis -> tailored draft -> export -> application status -> interview practice works end-to-end.
3. A missing/invalid key or absent CLI produces actionable errors, not a crash.
4. No fabricated credentials are introduced into tailored resume.
5. Restarts preserve application data; backup and restore tested.
6. Automated tests run in CI; README and security docs exist.
