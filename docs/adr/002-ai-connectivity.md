# ADR-002: AI connection strategy

**Status: ACCEPTED as architectural direction; provider support individually conditional**

MVP supports BYOK external AI APIs and architecturally accommodates subscription-backed official AI CLI tools via separate secure AI Runner. Initial targets for proof of concept: OpenAI Codex CLI and Anthropic Claude Code CLI. Additional tools including Kilo Code/Grok-related paths are not commitments until terms and interfaces are validated. Local Ollama adapter can follow. No managed AI hosting or credits in MVP.

Reasons: flexible user costs and reuse of officially supported existing CLI authentication; safety isolation is mandatory. See `docs/specs/AI_INTEGRATION.md`.
