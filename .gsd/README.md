# GSD Auto Mode Integration for Chintu

## Overview

GSD (Get Stuff Done) Auto Mode is an autonomous development execution engine that has been integrated into the Chintu project. This system enables automated development workflows with intelligent planning, execution, and verification phases.

## Features

### Core Capabilities
- **Autonomous Development**: Hands-off development with clean git history
- **State Machine**: Plan → Execute → Complete → Reassess → Next Slice
- **SQLite Database**: Persistent state management with crash recovery
- **Context Management**: Smart context loading and tool policies
- **Git Isolation**: Support for none, branch, and worktree isolation modes
- **Verification System**: Automated quality gates with retry mechanisms
- **Real-time Dashboard**: Visual progress tracking in Chintu UI

### Advanced Features
- **Reactive Execution**: Parallel task execution with dependency resolution
- **Incremental Memory**: Cross-session knowledge base (KNOWLEDGE.md)
- **HTML Reports**: Self-contained progress reports with metrics
- **Stuck Detection**: Automatic detection of development loops
- **Health Monitoring**: Real-time system health checks
- **Cost Tracking**: Token usage and cost projections

## Architecture

### Directory Structure
```
.gsd/
├── core/
│   ├── database.ts          # SQLite database management
│   ├── engine.ts            # Core auto mode engine
│   └── git-isolation.ts     # Git isolation utilities
├── cli/
│   └── gsd-cli.ts          # Command-line interface
├── database/
│   └── schema.sql          # Database schema
├── runtime/                # Runtime artifacts
├── worktrees/             # Git worktrees (if used)
├── research/              # Research outputs
├── milestones/            # Milestone planning
├── exec/                  # Command execution logs
└── reports/               # Generated reports
```

### Database Schema
- **milestones**: High-level project milestones
- **slices**: Milestone tasks (development units)
- **tasks**: Individual work items within slices
- **sessions**: Crash recovery session state
- **executions**: Command execution tracking
- **knowledge**: Incremental memory base
- **settings**: Configuration preferences

## Installation & Setup

### Dependencies
The following packages were added to support GSD:
```bash
npm install better-sqlite3 commander chalk ora inquirer simple-git tsx
npm install @types/better-sqlite3 @types/inquirer --save-dev
```

### CLI Commands
New npm scripts added to package.json:
```json
{
  "gsd": "tsx .gsd/cli/gsd-cli.ts",
  "gsd:auto": "tsx .gsd/cli/gsd-cli.ts auto",
  "gsd:stop": "tsx .gsd/cli/gsd-cli.ts stop",
  "gsd:status": "tsx .gsd/cli/gsd-cli.ts status"
}
```

## Usage

### Command Line Interface

#### Start Auto Mode
```bash
npm run gsd:auto
# or
npm run gsd auto
```

#### Stop Auto Mode
```bash
npm run gsd:stop
# or
npm run gsd stop
```

#### Check Status
```bash
npm run gsd:status
# or
npm run gsd status
```

#### Create New Milestone
```bash
npm run gsd new-milestone
```

#### Health Check
```bash
npm run gsd doctor
```

#### Export Reports
```bash
npm run gsd export --html
```

### Web Dashboard

Access the GSD dashboard through the Chintu UI:
1. Sign in to your Chintu account
2. Click the **GSD** button in the header
3. View real-time progress, health status, and controls

### Configuration

#### Project Settings (.gsd/PREFERENCES.md)
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

## Development Workflow

### Auto Mode Loop
1. **Plan**: Research and decompose work into tasks
2. **Execute**: Run tasks with fresh context windows
3. **Complete**: Write summaries and commit changes
4. **Reassess**: Check if roadmap still makes sense
5. **Next Slice**: Continue with next unit of work

### Phase Types
- **Planning**: Research, discovery, task decomposition
- **Execution**: Code implementation and testing
- **Completion**: Documentation, summaries, commits
- **Reassessment**: Roadmap validation and adjustment

### Tool Policies
- **Planning**: Read-only access, no subagent dispatch
- **Planning-Dispatch**: Read-only with subagent capability
- **Execution**: Full access, can edit project files
- **Docs**: Documentation-focused access

## Integration Points

### Chintu UI Integration
- **Dashboard Component**: `src/components/GSD/GSDDashboard.tsx`
- **Route**: `/gsd` (protected route)
- **Navigation**: Purple "GSD" button in header
- **Real-time Updates**: 30-second refresh intervals

### Git Integration
- **Isolation Modes**: none, branch, worktree
- **Clean History**: Meaningful commit messages
- **Conflict Resolution**: Automatic stash/restore
- **Merge Strategy**: Squash merge to main

### Database Integration
- **SQLite**: Local database with WAL mode
- **Crash Recovery**: Session persistence and resume
- **State Authority**: Database over markdown projections
- **Health Monitoring**: Connection and integrity checks

## Safety & Reliability

### Error Recovery
- **Crash Recovery**: Automatic session reconstruction
- **Stuck Detection**: Sliding-window pattern analysis
- **Artifact Verification**: Ensure expected outputs exist
- **Health Checks**: System diagnostics before execution

### Quality Gates
- **Verification Commands**: Automated linting and testing
- **Auto-fix Retries**: Self-healing on verification failures
- **Context Pressure Monitor**: Prevent context window overflow
- **Timeout Supervision**: Multiple timeout tiers for safety

### Git Safety
- **Working Directory Check**: Ensure clean state before execution
- **Atomic Operations**: Prevent partial commits
- **Rollback Capability**: Clean worktree/branch removal
- **Conflict Prevention**: Stash uncommitted changes

## Monitoring & Observability

### Metrics Tracked
- **Token Usage**: Per-phase, per-slice, per-milestone
- **Execution Time**: Task duration and throughput
- **Success Rates**: Completion and failure metrics
- **Cost Projections**: Budget monitoring and alerts

### Health Indicators
- **Database Health**: Connection and schema integrity
- **Git Status**: Working directory cleanliness
- **Session State**: Active vs. paused sessions
- **System Resources**: Memory and disk usage

### Reports
- **HTML Reports**: Self-contained milestone reports
- **Progress Trees**: Visual dependency graphs
- **Execution Timelines**: Temporal progress visualization
- **Knowledge Base**: Accumulated project wisdom

## Advanced Features

### Deep Planning Mode
Enable comprehensive project discovery:
```bash
npm run gsd new-project --deep
```

Phases:
1. Workflow Preferences
2. Project Context
3. Requirements
4. Research Decision
5. Project Research (optional)
6. Milestone Context/Roadmap

### Parallel Execution
Reactive execution with dependency resolution:
```yaml
reactive_execution:
  enabled: true
  max_parallel: 4
  isolation_mode: same-tree
```

### Remote Control
Telegram integration for remote management:
- `/pause` - Pause auto mode
- `/resume` - Resume execution
- `/status` - Current status
- `/progress` - Roadmap overview
- `/budget` - Token usage
- `/log` - Activity log

## Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
npm run gsd doctor
```
Check SQLite file permissions and disk space.

#### Git Working Directory Not Clean
```bash
git status
git add .
git commit -m "Save work before GSD"
```

#### Auto Mode Stuck
```bash
npm run gsd stop
npm run gsd status
npm run gsd auto
```

#### Verification Failures
Check `.gsd/exec/` logs for detailed error information.

### Debug Mode
Enable verbose logging:
```bash
DEBUG=gsd:* npm run gsd:auto
```

### Forensics
Post-mortem analysis:
```bash
npm run gsd forensics
```

## Best Practices

### Before Starting GSD
1. **Commit Changes**: Ensure clean git state
2. **Run Health Check**: Verify system readiness
3. **Set Milestone**: Create clear development goals
4. **Configure Settings**: Adjust timeouts and limits

### During GSD Execution
1. **Monitor Dashboard**: Watch progress in real-time
2. **Check Logs**: Review `.gsd/exec/` for issues
3. **Validate Results**: Verify artifacts after completion
4. **Update Knowledge**: Add lessons learned

### After Completion
1. **Review Reports**: Analyze HTML reports
2. **Update Documentation**: Sync knowledge base
3. **Clean Up**: Remove temporary artifacts
4. **Plan Next**: Set up next milestone

## Future Enhancements

### Planned Features
- **LLM Integration**: Real AI-powered development
- **Webhook Support**: External system integration
- **Advanced Analytics**: Machine learning insights
- **Team Collaboration**: Multi-user coordination
- **Cloud Storage**: Remote state synchronization

### Extension Points
- **Custom Phases**: Add new development phases
- **Tool Policies**: Create specialized access controls
- **Verification Hooks**: Custom quality gates
- **Report Templates**: Custom report formats

## Support

### Documentation
- **Project Context**: `.gsd/PROJECT.md`
- **Preferences**: `.gsd/PREFERENCES.md`
- **Requirements**: `.gsd/REQUIREMENTS.md`
- **Knowledge**: `.gsd/KNOWLEDGE.md`

### Community
- **Issues**: Report bugs and feature requests
- **Discussions**: Share experiences and best practices
- **Contributions**: Submit pull requests for improvements

---

**GSD Auto Mode** - Transforming how software gets built, one autonomous slice at a time.
