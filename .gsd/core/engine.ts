import { GSDDatabase, GSDSettings } from './database';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import simpleGit, { SimpleGit } from 'simple-git';

const execAsync = promisify(exec);

export interface UnitContext {
  id: string;
  type: 'milestone' | 'slice' | 'task';
  phase: 'planning' | 'execution' | 'completion' | 'reassessment';
  toolsPolicy: 'planning' | 'planning-dispatch' | 'execution' | 'docs';
  manifest: {
    unitId: string;
    unitType: string;
    phase: string;
    toolsPolicy: string;
    contextMode: boolean;
    verificationCommands: string[];
    timeoutMinutes: number;
  };
}

export interface DispatchResult {
  success: boolean;
  artifact?: string;
  summary?: string;
  error?: string;
  duration: number;
}

export class GSDEngine {
  private db: GSDDatabase;
  private git: SimpleGit;
  private projectRoot: string;
  private settings: GSDSettings;
  private isRunning: boolean = false;
  private currentSession?: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.db = new GSDDatabase(projectRoot);
    this.git = simpleGit(projectRoot);
    this.settings = this.db.getAllSettings();
  }

  // Main auto mode loop
  async startAutoMode(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Auto mode is already running');
    }

    this.isRunning = true;
    console.log('🚀 Starting GSD Auto Mode...');

    try {
      while (this.isRunning) {
        const milestone = this.db.getActiveMilestone();

        if (!milestone) {
          console.log('ℹ️  No active milestone found. Auto mode paused.');
          break;
        }

        // Get next slice to work on
        const pendingSlices = this.db.getPendingSlices(milestone.id);

        if (pendingSlices.length === 0) {
          // All slices completed, validate milestone
          await this.validateMilestone(milestone.id);
          break;
        }

        const nextSlice = pendingSlices[0];
        console.log(`📋 Working on slice: ${nextSlice.title}`);

        try {
          // Execute slice through phases
          await this.executeSlice(nextSlice);

          // Reassess roadmap after slice completion
          if (this.settings.planning_depth !== 'budget') {
            await this.reassessRoadmap(milestone.id);
          }

        } catch (error) {
          console.error(`❌ Slice execution failed: ${error}`);
          this.db.updateSliceStatus(nextSlice.id, 'failed');

          // Check for stuck detection
          if (await this.detectStuckLoop(nextSlice.id)) {
            console.log('🔄 Stuck loop detected. Pausing auto mode.');
            break;
          }
        }

        // Brief pause between slices
        await this.sleep(1000);
      }
    } finally {
      this.isRunning = false;
      console.log('⏹️  GSD Auto Mode stopped');
    }
  }

  async stopAutoMode(): Promise<void> {
    this.isRunning = false;
    if (this.currentSession) {
      this.db.updateSessionStatus(this.currentSession, 'paused');
    }
    console.log('🛑 Auto mode stop requested');
  }

  private async executeSlice(slice: any): Promise<void> {
    // Mark slice as in progress
    this.db.updateSliceStatus(slice.id, 'in_progress');

    // Create session for crash recovery
    this.currentSession = this.db.createSession(slice.id, 'execution');

    try {
      // Phase 1: Planning (if needed)
      if (this.needsPlanning(slice)) {
        await this.executePhase(slice, 'planning');
      }

      // Phase 2: Execute tasks
      const tasks = this.db.getPendingTasks(slice.id);

      if (this.settings.reactive_execution_enabled === 'true' && tasks.length >= 3) {
        await this.executeTasksReactive(tasks);
      } else {
        await this.executeTasksSequential(tasks);
      }

      // Phase 3: Complete slice
      await this.executePhase(slice, 'completion');

      // Mark slice as completed
      this.db.updateSliceStatus(slice.id, 'completed');

    } finally {
      if (this.currentSession) {
        this.db.updateSessionStatus(this.currentSession, 'completed');
        this.currentSession = undefined;
      }
    }
  }

  private async executePhase(slice: any, phase: string): Promise<DispatchResult> {
    const startTime = Date.now();

    try {
      // Create dispatch prompt with context
      const prompt = await this.createDispatchPrompt(slice, phase);

      // Execute the phase (this would integrate with LLM)
      const result = await this.dispatchUnit(slice.id, phase, prompt);

      // Record execution
      const duration = Date.now() - startTime;
      this.db.recordExecution(slice.id, `phase:${phase}`, '', '', result.success ? 0 : 1, duration);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.db.recordExecution(slice.id, `phase:${phase}`, '', '', 1, duration);
      throw error;
    }
  }

  private async executeTasksSequential(tasks: any[]): Promise<void> {
    for (const task of tasks) {
      await this.executeTask(task);
    }
  }

  private async executeTasksReactive(tasks: any[]): Promise<void> {
    // Build dependency graph and execute in parallel where safe
    const readyTasks = this.getReadyTasks(tasks);
    const maxParallel = parseInt(this.settings.reactive_execution_max_parallel);

    const batches = [];
    for (let i = 0; i < readyTasks.length; i += maxParallel) {
      batches.push(readyTasks.slice(i, i + maxParallel));
    }

    for (const batch of batches) {
      await Promise.all(batch.map(task => this.executeTask(task)));
    }
  }

  private async executeTask(task: any): Promise<void> {
    this.db.updateTaskStatus(task.id, 'in_progress');

    try {
      const result = await this.dispatchUnit(task.id, 'execution', `Execute task: ${task.title}`);

      if (result.success) {
        this.db.updateTaskStatus(task.id, 'completed');
        this.db.saveSummary('task', task.id, `Completed: ${task.title}`, result.summary || '', [result.artifact].filter((a): a is string => Boolean(a)));

        // Run verification if configured
        if (this.settings.verification_auto_fix === 'true') {
          await this.runVerification();
        }
      } else {
        this.db.updateTaskStatus(task.id, 'failed');
        throw new Error(`Task failed: ${result.error}`);
      }
    } catch (error) {
      this.db.updateTaskStatus(task.id, 'failed');
      throw error;
    }
  }

  private async dispatchUnit(unitId: string, phase: string, prompt: string): Promise<DispatchResult> {
    // This is where the LLM integration would happen
    // For now, we'll simulate the dispatch

    console.log(`🤖 Dispatching ${phase} for unit ${unitId}`);

    // Simulate work
    await this.sleep(2000);

    // Return mock result
    return {
      success: true,
      artifact: `artifact_${unitId}_${Date.now()}`,
      summary: `Successfully completed ${phase} for ${unitId}`,
      duration: 2000
    };
  }

  private async createDispatchPrompt(slice: any, phase: string): Promise<string> {
    // Load relevant context
    const context = await this.loadContext(slice.id, phase);

    // Build comprehensive prompt
    let prompt = `# GSD Auto Mode Dispatch\n\n`;
    prompt += `## Unit Context\n`;
    prompt += `- Slice: ${slice.title}\n`;
    prompt += `- Phase: ${phase}\n`;
    prompt += `- Tools Policy: ${this.getToolsPolicy(phase)}\n\n`;

    prompt += `## Relevant Context\n${context}\n\n`;

    prompt += `## Instructions\n`;
    prompt += `Execute this phase according to the GSD Auto Mode specifications.\n`;
    prompt += `Focus on minimal, high-quality changes.\n`;
    prompt += `Preserve existing functionality and patterns.\n\n`;

    return prompt;
  }

  private async loadContext(sliceId: string, phase: string): Promise<string> {
    let context = '';

    // Add slice summaries
    const summaries = this.db.getSummaries('slice', sliceId);
    summaries.forEach(summary => {
      context += `### ${summary.title}\n${summary.content}\n\n`;
    });

    // Add relevant knowledge
    const knowledge = this.db.getKnowledge();
    knowledge.slice(0, 5).forEach(item => {
      context += `### Knowledge: ${item.title}\n${item.content}\n\n`;
    });

    // Add project context
    const projectPath = join(this.projectRoot, '.gsd', 'PROJECT.md');
    if (existsSync(projectPath)) {
      const projectContent = readFileSync(projectPath, 'utf-8');
      context += `### Project Context\n${projectContent.substring(0, 1000)}...\n\n`;
    }

    return context;
  }

  private getToolsPolicy(phase: string): string {
    switch (phase) {
      case 'planning': return 'planning';
      case 'execution': return 'execution';
      case 'completion': return 'planning-dispatch';
      default: return 'planning';
    }
  }

  private async runVerification(): Promise<void> {
    const commands = ['npm run lint']; // From settings
    const maxRetries = parseInt(this.settings.verification_max_retries);

    for (const command of commands) {
      let retries = 0;

      while (retries <= maxRetries) {
        try {
          await execAsync(command);
          break; // Success
        } catch (error) {
          retries++;
          if (retries > maxRetries) {
            throw new Error(`Verification failed after ${maxRetries} retries: ${command}`);
          }

          // Auto-fix attempt would go here
          console.log(`🔧 Verification failed, attempting auto-fix (attempt ${retries})`);
          await this.sleep(1000);
        }
      }
    }
  }

  private async validateMilestone(milestoneId: string): Promise<void> {
    console.log('✅ All slices completed. Validating milestone...');

    // Check milestone success criteria
    const milestone = this.db.getActiveMilestone();
    if (!milestone) return;

    // Update milestone status
    this.db.updateMilestoneStatus(milestoneId, 'completed');

    // Generate HTML report if enabled
    if (this.settings.auto_report === 'true') {
      await this.generateReport(milestoneId);
    }

    console.log(`🎯 Milestone completed: ${milestone.title}`);
  }

  private async reassessRoadmap(milestoneId: string): Promise<void> {
    console.log('🔄 Reassessing roadmap...');

    // This would analyze completed work and adjust remaining slices
    // For now, we'll just log the action
    await this.sleep(500);
  }

  private async generateReport(milestoneId: string): Promise<void> {
    console.log('📊 Generating HTML report...');

    const reportPath = join(this.projectRoot, '.gsd', 'reports', `milestone_${milestoneId}_${Date.now()}.html`);

    // Generate comprehensive HTML report
    const report = this.generateHTMLReport(milestoneId);
    writeFileSync(reportPath, report);

    console.log(`📄 Report generated: ${reportPath}`);
  }

  private generateHTMLReport(milestoneId: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>GSD Milestone Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>GSD Auto Mode Report</h1>
        <p>Milestone: ${milestoneId}</p>
        <p>Generated: ${new Date().toISOString()}</p>
    </div>
    
    <div class="section">
        <h2>Summary</h2>
        <div class="metric">Status: Completed</div>
        <div class="metric">Duration: ${Date.now()}ms</div>
        <div class="metric">Tasks: N/A</div>
    </div>
    
    <div class="section">
        <h2>Progress</h2>
        <p>All slices completed successfully.</p>
    </div>
</body>
</html>`;
  }

  private async detectStuckLoop(unitId: string): Promise<boolean> {
    // Simple stuck detection - check if same unit failed multiple times
    const executions = this.db.getSummaries('task', unitId);
    const failures = executions.filter(s => s.title.includes('failed'));

    return failures.length >= 3;
  }

  private needsPlanning(slice: any): boolean {
    // Check if slice needs planning phase
    return !slice.description || slice.description.length < 50;
  }

  private getReadyTasks(tasks: any[]): any[] {
    // Filter tasks that have no unmet dependencies
    return tasks.filter(task => {
      if (!task.dependencies) return true;

      const deps = JSON.parse(task.dependencies);
      return deps.every((depId: string) => {
        const depTask = tasks.find(t => t.id === depId);
        return depTask && depTask.status === 'completed';
      });
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health and diagnostics
  async healthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
    const dbHealth = this.db.healthCheck();
    const issues = [...dbHealth.issues];

    // Check git status
    try {
      const status = await this.git.status();
      if (status.files.length > 0) {
        issues.push('Working directory not clean');
      }
    } catch (error) {
      issues.push('Git status check failed');
    }

    // Check if auto mode is stuck
    if (this.isRunning && !this.currentSession) {
      issues.push('Auto mode running but no active session');
    }

    return {
      healthy: issues.length === 0,
      issues
    };
  }

  // Cleanup
  destroy(): void {
    this.isRunning = false;
    this.db.close();
  }
}
