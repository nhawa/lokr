# AI Gateway & Subscription/CLI integration specification

## Connection types
- `api`: user supplies official API key (BYOK) and chooses model. Key stored encrypted at rest; never passed to browser.
- `cli`: official CLI installed and authenticated in **runner's** execution environment (e.g., Codex CLI, Claude Code) if documented integration supports it and terms permit. Lokr does not proxy/capture tokens or simulate a first-party web client.
- `local`: optional Ollama/local inference adapter (P1, not required for first vertical slice).

**Important:** A subscription to a chat service does not necessarily grant third-party API/automation rights. Validate plan, CLI invocation, auth, headless behavior, structured responses, and licensing/terms separately for each provider. Do not promise Grok or other subscriptions automatically integrate. “Command Code” product name remains unresolved.

## Provider-independent types (illustrative TypeScript, not a chosen runtime)
```ts
type AITaskType = 'resume_match' | 'resume_tailor' | 'interview_prep';
type AIConnection = { id: string; kind: 'api' | 'cli' | 'local'; provider: string; model?: string };
type AIRequest = {
  taskId: string;
  type: AITaskType;
  schemaVersion: 1;
  input: Record<string, unknown>;
  options: { timeoutMs: number; maxOutputBytes: number };
};
type AIResult = {
  taskId: string;
  schemaVersion: 1;
  status: 'completed' | 'failed' | 'cancelled';
  output?: Record<string, unknown>;
  error?: { code: 'AUTH' | 'NOT_INSTALLED' | 'TIMEOUT' | 'LIMIT' | 'BAD_OUTPUT' | 'UNSUPPORTED' | 'INTERNAL'; message: string };
};
interface AIAdapter { healthcheck(connection: AIConnection): Promise<unknown>; execute(request: AIRequest, connection: AIConnection): Promise<AIResult> }
```

## Matching rubric
Return a list of job criteria, per-criterion `status`: `supported` / `partial` / `not_found` / `unclear`, with `evidence` referencing existing CV spans and job requirements. Derive a **heuristic** score from criterion weights (e.g. supported=1, partial=0.5, not_found=0), exclude unclear or score conservatively and explain the rule. Never label it ATS score, probability of hiring, or certainty of job fit.

## Tailoring
LLM may suggest rewrites and ordering **without adding unverified claims**. Every concrete employment/education claim must trace to the source CV or explicit user edits. Any suspected new claim goes into an explicit `needs_review` field and must not be silently exported.

## Interview preparation
Return staged questions with question text, rationale, key talking points, and suggested answer structure derived from job requirements and the candidate's verified CV. Support textual practice in MVP. The Huru-style interview stepper/camera/mic is inspiration, not necessarily MVP implementation.

## CLI runner contract
- Run as separate unprivileged process/service with minimal filesystem access, finite memory/CPU, temp directory and cleanup.
- Explicit allowlist by executable identity (resolved path and pinned command), argv flags controlled by adapter; never generic `sh -c` or arbitrary user commands.
- For agents whose CLI has tool-use/write capability: run in an empty isolated workspace and disable tools/approvals/permissions using **officially documented controls**; do not rely on a prompt alone. If safe restriction is not possible, mark adapter unsupported.
- No password/API key/session token transmission from app to runner; owner performs official authentication in runner's own environment as supported by vendor.
- IPC authenticated, preferably Unix socket with strict permissions or protected loopback; no public listener. Set output byte cap, input size cap, timeout and cancellation.
- Structured JSON output validated against explicit schema; strip ANSI codes; bound stdout/stderr; redact secrets and avoid logging resume content.
- CLI adapter is optional: if unavailable, API BYOK still works.
- Never mount host home directories or Docker socket by default. Explicit install/login instructions must acknowledge security and privacy implications.

## Adapter rollout gates
1. API BYOK adapter: baseline complete and tested.
2. Codex CLI PoC: confirm official noninteractive command, authenticated subscription behavior, input/output format, safe no-tools execution, errors; only then enable.
3. Claude Code CLI PoC with the same gates.
4. Additional tools (Kilo Code, Grok routes, other coding agents) added only after verifying official support and safety. Product names and aliases must be confirmed.

## Required integration tests
- key missing, invalid, exhausted quota, CLI binary missing, unauthenticated, malformed JSON, timeout, cancellation, oversized response, prompt injection in job description, AI fabricated CV claim, CLI permissions disabled, runner outage.
