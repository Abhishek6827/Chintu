---
description: GSD Project Preferences
---

# GSD Project Preferences

## Project Configuration
- **Project Name**: Chintu
- **Project Type**: Next.js/Electron AI Interview Assistant
- **Auto Mode**: Enabled
- **Planning Depth**: normal
- **Context Mode**: enabled

## Auto Mode Settings
```yaml
auto_supervisor:
  soft_timeout_minutes: 20
  idle_timeout_minutes: 10
  hard_timeout_minutes: 30

context_mode:
  enabled: true
  exec_timeout_ms: 30000
  exec_stdout_cap_bytes: 1000000
  exec_digest_chars: 500

verification_commands:
  - npm run lint
verification_auto_fix: true
verification_max_retries: 2

reactive_execution:
  enabled: true
  max_parallel: 2
  isolation_mode: same-tree

git:
  isolation: none

auto_report: true
require_slice_discussion: false
```

## Token Profile
- **Profile**: balanced
- **Cost Management**: Enabled with projections

## Skills Configuration
- **Always Use**: basic-coding, testing, documentation
- **Prefer Skills**: architectural-thinking, security-review
- **Skill Rules**: 
  - When working with database: use database-skills
  - When working with UI: use frontend-skills

## Integration Notes
- Electron app requires special handling for file isolation
- Next.js dev server conflicts need to be managed
- Clerk authentication integration points preserved
