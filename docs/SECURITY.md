# Security and privacy threat model — MVP

## Threats and mitigations
1. **Resume and job description prompt injection:** treat all imported text as untrusted input, not system instructions. Restrict model tools; validate output; don't let content choose command, executable, path, URL or provider.
2. **CLI agent excessive permissions:** independent runner, minimal privileges, no default home mount, no Docker socket, empty workspace, allowlisted binaries and arguments, no arbitrary code execution, sandbox and output limits.
3. **Provider login credentials:** only official login method in provider CLI; never ingest or reserialize subscription token. Do not assume a subscription permits arbitrary app use.
4. **API key leaks:** encryption at rest with owner-controlled encryption secret, secure server-side use, redaction, masked settings, never in source control/client or logs.
5. **Local web exposure:** auth by default even on localhost, bind host ports to `127.0.0.1` by default, document reverse-proxy HTTPS requirements. Protect setup from repeat/bootstrap race.
6. **Malicious document uploads:** MIME + file signature checks, max file/decompression sizes, non-executable storage, safe parser, no macro execution, no inline active content, content-security-policy.
7. **File path traversal/data access:** opaque keys, canonicalization, owner checks, storage outside public static directory.
8. **AI output privacy/integrity:** explicit user confirmation when sending CV to external provider; no default analytics; schema validation; suspect claims flagged and require review.
9. **Session compromise:** HttpOnly/SameSite/Secure cookies where appropriate, CSRF defenses, password hashing (Argon2id recommended), brute-force rate limiting.
10. **Data loss:** durable volumes, tested backup/restore and migrations.

## Deployment guardrails
- Runner is optional; absence must not prevent normal app startup or API-based AI.
- No unauthenticated or public runner RPC ports.
- No `privileged: true`, host network, or Docker socket mounts.
- Run containers as non-root with dropped capabilities and read-only rootfs where viable.
- Treat CLI installer/updaters as supply-chain dependencies; pin/review versions and provenance.

## Privacy UX
On first use of external AI, disclose: selected provider, data types sent (CV/job description), and that provider retention is governed by its terms. Provide a way to delete local data and stored secrets.
