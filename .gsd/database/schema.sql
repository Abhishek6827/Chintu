-- GSD Auto Mode Database Schema
-- SQLite database for state management

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active', -- active, completed, paused
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    branch TEXT,
    worktree_path TEXT
);

-- Slices table (milestone tasks)
CREATE TABLE IF NOT EXISTS slices (
    id TEXT PRIMARY KEY,
    milestone_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed, failed
    priority INTEGER DEFAULT 0,
    dependencies TEXT, -- JSON array of slice IDs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    FOREIGN KEY (milestone_id) REFERENCES milestones(id)
);

-- Tasks table (slice subtasks)
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    slice_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed, failed
    priority INTEGER DEFAULT 0,
    dependencies TEXT, -- JSON array of task IDs
    io_annotations TEXT, -- JSON object for file dependencies
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    FOREIGN KEY (slice_id) REFERENCES slices(id)
);

-- Requirements table
CREATE TABLE IF NOT EXISTS requirements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active', -- active, validated, deferred, out_of_scope
    priority INTEGER DEFAULT 0,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Decisions register
CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    context TEXT, -- What led to this decision
    alternatives TEXT, -- JSON array of alternatives considered
    outcome TEXT, -- Expected result
    status TEXT DEFAULT 'active', -- active, superseded, reverted
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Summaries table
CREATE TABLE IF NOT EXISTS summaries (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- task, slice, milestone, project
    entity_id TEXT NOT NULL, -- ID of the related entity
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    artifacts TEXT, -- JSON array of created files/artifacts
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Executions table (for tracking command executions)
CREATE TABLE IF NOT EXISTS executions (
    id TEXT PRIMARY KEY,
    unit_id TEXT NOT NULL, -- Task or slice ID
    command TEXT NOT NULL,
    stdout TEXT,
    stderr TEXT,
    exit_code INTEGER,
    duration_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge base (incremental memory)
CREATE TABLE IF NOT EXISTS knowledge (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    context TEXT, -- When this knowledge applies
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (for crash recovery)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    unit_id TEXT NOT NULL,
    phase TEXT NOT NULL, -- planning, execution, completion, reassessment
    status TEXT DEFAULT 'active', -- active, paused, completed, crashed
    metadata TEXT, -- JSON object with session state
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_slices_milestone ON slices(milestone_id);
CREATE INDEX IF NOT EXISTS idx_tasks_slice ON tasks(slice_id);
CREATE INDEX IF NOT EXISTS idx_summaries_entity ON summaries(type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sessions_unit ON sessions(unit_id);
CREATE INDEX IF NOT EXISTS idx_executions_unit ON executions(unit_id);

-- Default settings
INSERT OR IGNORE INTO settings (key, value) VALUES 
('planning_depth', 'normal'),
('auto_supervisor_soft_timeout', '20'),
('auto_supervisor_idle_timeout', '10'),
('auto_supervisor_hard_timeout', '30'),
('context_mode_enabled', 'true'),
('verification_auto_fix', 'true'),
('verification_max_retries', '2'),
('reactive_execution_enabled', 'true'),
('reactive_execution_max_parallel', '2'),
('git_isolation', 'none'),
('auto_report', 'true'),
('require_slice_discussion', 'false');
