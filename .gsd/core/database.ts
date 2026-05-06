import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync } from 'fs';

export interface GSDSettings {
  planning_depth: string;
  auto_supervisor_soft_timeout: string;
  auto_supervisor_idle_timeout: string;
  auto_supervisor_hard_timeout: string;
  context_mode_enabled: string;
  verification_auto_fix: string;
  verification_max_retries: string;
  reactive_execution_enabled: string;
  reactive_execution_max_parallel: string;
  git_isolation: string;
  auto_report: string;
  require_slice_discussion: string;
}

export class GSDDatabase {
  private db: Database.Database;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    const dbPath = join(projectRoot, '.gsd', 'gsd.db');
    
    // Ensure .gsd directory exists
    const gsdDir = join(projectRoot, '.gsd');
    if (!existsSync(gsdDir)) {
      mkdirSync(gsdDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    const schemaPath = join(this.projectRoot, '.gsd', 'database', 'schema.sql');
    if (existsSync(schemaPath)) {
      const schema = readFileSync(schemaPath, 'utf-8');
      this.db.exec(schema);
    }
  }

  // Milestone operations
  createMilestone(id: string, title: string, description?: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO milestones (id, title, description)
      VALUES (?, ?, ?)
    `);
    stmt.run(id, title, description);
  }

  getActiveMilestone(): any {
    const stmt = this.db.prepare(`
      SELECT * FROM milestones 
      WHERE status = 'active' 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    return stmt.get();
  }

  updateMilestoneStatus(id: string, status: string): void {
    const stmt = this.db.prepare(`
      UPDATE milestones 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, id);
  }

  // Slice operations
  createSlice(id: string, milestoneId: string, title: string, description?: string, priority: number = 0): void {
    const stmt = this.db.prepare(`
      INSERT INTO slices (id, milestone_id, title, description, priority)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, milestoneId, title, description, priority);
  }

  getPendingSlices(milestoneId: string): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM slices 
      WHERE milestone_id = ? AND status = 'pending'
      ORDER BY priority DESC, created_at ASC
    `);
    return stmt.all(milestoneId);
  }

  updateSliceStatus(id: string, status: string): void {
    const stmt = this.db.prepare(`
      UPDATE slices 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, id);
  }

  // Task operations
  createTask(id: string, sliceId: string, title: string, description?: string, priority: number = 0): void {
    const stmt = this.db.prepare(`
      INSERT INTO tasks (id, slice_id, title, description, priority)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, sliceId, title, description, priority);
  }

  getPendingTasks(sliceId: string): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM tasks 
      WHERE slice_id = ? AND status = 'pending'
      ORDER BY priority DESC, created_at ASC
    `);
    return stmt.all(sliceId);
  }

  updateTaskStatus(id: string, status: string): void {
    const stmt = this.db.prepare(`
      UPDATE tasks 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, id);
  }

  // Summary operations
  saveSummary(type: string, entityId: string, title: string, content: string, artifacts?: string[]): void {
    const stmt = this.db.prepare(`
      INSERT INTO summaries (type, entity_id, title, content, artifacts)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(type, entityId, title, content, artifacts ? JSON.stringify(artifacts) : null);
  }

  getSummaries(type: string, entityId: string): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM summaries 
      WHERE type = ? AND entity_id = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(type, entityId);
  }

  // Session operations for crash recovery
  createSession(unitId: string, phase: string, metadata?: any): string {
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, unit_id, phase, metadata)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, unitId, phase, metadata ? JSON.stringify(metadata) : null);
    return id;
  }

  getActiveSession(unitId: string): any {
    const stmt = this.db.prepare(`
      SELECT * FROM sessions 
      WHERE unit_id = ? AND status = 'active'
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    return stmt.get(unitId);
  }

  updateSessionStatus(id: string, status: string): void {
    const stmt = this.db.prepare(`
      UPDATE sessions 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, id);
  }

  // Settings operations
  getSetting(key: string): string | undefined {
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    const result = stmt.get(key) as { value: string } | undefined;
    return result?.value;
  }

  getAllSettings(): GSDSettings {
    const stmt = this.db.prepare('SELECT key, value FROM settings');
    const results = stmt.all() as { key: string; value: string }[];
    
    const settings: any = {};
    results.forEach(row => {
      settings[row.key] = row.value;
    });
    
    return settings as GSDSettings;
  }

  updateSetting(key: string, value: string): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(key, value);
  }

  // Knowledge operations
  addKnowledge(title: string, content: string, category?: string, context?: string): void {
    const id = `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stmt = this.db.prepare(`
      INSERT INTO knowledge (id, title, content, category, context)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, title, content, category, context);
  }

  getKnowledge(): any[] {
    const stmt = this.db.prepare('SELECT * FROM knowledge ORDER BY created_at DESC');
    return stmt.all();
  }

  // Execution tracking
  recordExecution(unitId: string, command: string, stdout: string, stderr: string, exitCode: number, durationMs: number): void {
    const id = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stmt = this.db.prepare(`
      INSERT INTO executions (id, unit_id, command, stdout, stderr, exit_code, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, unitId, command, stdout, stderr, exitCode, durationMs);
  }

  // Cleanup and maintenance
  close(): void {
    this.db.close();
  }

  // Health check
  healthCheck(): { healthy: boolean; issues: string[] } {
    const issues: string[] = [];
    
    try {
      // Test database connection
      this.db.prepare('SELECT 1').get();
      
      // Check if required tables exist
      const tables = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('milestones', 'slices', 'tasks', 'sessions')
      `).all() as { name: string }[];
      
      const requiredTables = ['milestones', 'slices', 'tasks', 'sessions'];
      const existingTables = tables.map(t => t.name);
      
      requiredTables.forEach(table => {
        if (!existingTables.includes(table)) {
          issues.push(`Missing required table: ${table}`);
        }
      });
      
    } catch (error) {
      issues.push(`Database connection error: ${error}`);
    }
    
    return {
      healthy: issues.length === 0,
      issues
    };
  }
}
