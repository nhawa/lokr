#!/usr/bin/env python3
"""Check that core project planning inputs exist. No third-party dependencies."""
from pathlib import Path
root = Path(__file__).resolve().parents[1]
required = [
    'README.md', 'AGENTS.md', 'docs/PRD.md', 'docs/ARCHITECTURE.md',
    'docs/SECURITY.md', 'docs/specs/AI_INTEGRATION.md',
    'docs/specs/DATA_MODEL.md', 'docs/specs/API_CONTRACT.md',
    'docs/implementation/PLAN.md', 'agent/tasks/README.md',
    'docs/adr/000-stack-accepted.md', 'docs/adr/004-resume-workflow.md',
]
missing = [p for p in required if not (root / p).is_file()]
if missing:
    raise SystemExit('Missing: ' + ', '.join(missing))
print('Blueprint OK — planning files present. Application scaffolding not implemented.')
