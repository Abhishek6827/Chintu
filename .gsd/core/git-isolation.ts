import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import simpleGit, { SimpleGit } from 'simple-git';

const execAsync = promisify(exec);

export interface GitIsolationConfig {
  mode: 'none' | 'worktree' | 'branch';
  milestoneId: string;
  projectRoot: string;
}

export class GitIsolation {
  private git: SimpleGit;
  private config: GitIsolationConfig;
  private worktreePath?: string;

  constructor(config: GitIsolationConfig) {
    this.config = config;
    this.git = simpleGit(config.projectRoot);
  }

  async initialize(): Promise<void> {
    switch (this.config.mode) {
      case 'none':
        await this.initializeNoneMode();
        break;
      case 'worktree':
        await this.initializeWorktreeMode();
        break;
      case 'branch':
        await this.initializeBranchMode();
        break;
      default:
        throw new Error(`Unknown git isolation mode: ${this.config.mode}`);
    }
  }

  private async initializeNoneMode(): Promise<void> {
    console.log('🔓 Git isolation: none mode (working directly on current branch)');

    // Ensure working directory is clean
    const status = await this.git.status();
    if (status.files.length > 0) {
      throw new Error('Working directory not clean. Please commit or stash changes.');
    }
  }

  private async initializeWorktreeMode(): Promise<void> {
    console.log('🌳 Git isolation: worktree mode');

    // Ensure we have at least one commit
    try {
      await this.git.revparse(['HEAD']);
    } catch {
      throw new Error('Worktree mode requires at least one commit');
    }

    const branchName = `milestone/${this.config.milestoneId}`;
    const worktreeDir = join(this.config.projectRoot, '.gsd', 'worktrees', this.config.milestoneId);

    // Create worktree directory if it doesn't exist
    if (!existsSync(worktreeDir)) {
      mkdirSync(worktreeDir, { recursive: true });
    }

    // Check if worktree already exists
    try {
      const { stdout } = await execAsync(`git worktree list`, { cwd: this.config.projectRoot });
      const worktrees = stdout.split('\n').filter(line => line.trim());
      const existingWorktree = worktrees.find((wt: string) => wt.includes(this.config.milestoneId));

      if (existingWorktree) {
        const worktreePath = existingWorktree.split(' ')[0];
        this.worktreePath = worktreePath;
        console.log(`✅ Using existing worktree: ${this.worktreePath}`);
        return;
      }
    } catch (error) {
      // Worktree list failed, continue with creation
    }

    // Create new worktree
    try {
      await execAsync(`git worktree add ${worktreeDir} -b ${branchName}`, {
        cwd: this.config.projectRoot
      });
      this.worktreePath = worktreeDir;
      console.log(`✅ Created worktree: ${worktreeDir}`);
    } catch (error) {
      throw new Error(`Failed to create worktree: ${error}`);
    }
  }

  private async initializeBranchMode(): Promise<void> {
    console.log('🌿 Git isolation: branch mode');

    const branchName = `milestone/${this.config.milestoneId}`;

    // Check if branch already exists
    try {
      await this.git.branch([branchName]);
      console.log(`✅ Using existing branch: ${branchName}`);
    } catch {
      // Create new branch
      try {
        await this.git.checkoutLocalBranch(branchName);
        console.log(`✅ Created branch: ${branchName}`);
      } catch (error) {
        throw new Error(`Failed to create branch: ${error}`);
      }
    }
  }

  async getWorkingDirectory(): Promise<string> {
    switch (this.config.mode) {
      case 'worktree':
        if (!this.worktreePath) {
          throw new Error('Worktree not initialized');
        }
        return this.worktreePath;
      case 'branch':
      case 'none':
      default:
        return this.config.projectRoot;
    }
  }

  async commitChanges(message: string): Promise<void> {
    const workingDir = await this.getWorkingDirectory();
    const git = simpleGit(workingDir);

    // Stage all changes
    await git.add('.');

    // Check if there are changes to commit
    const status = await git.status();
    if (status.files.length === 0) {
      console.log('ℹ️  No changes to commit');
      return;
    }

    // Commit
    await git.commit(message);
    console.log(`✅ Committed: ${message}`);
  }

  async cleanup(): Promise<void> {
    switch (this.config.mode) {
      case 'worktree':
        await this.cleanupWorktree();
        break;
      case 'branch':
        await this.cleanupBranch();
        break;
      case 'none':
        // No cleanup needed
        break;
    }
  }

  private async cleanupWorktree(): Promise<void> {
    if (!this.worktreePath) return;

    const branchName = `milestone/${this.config.milestoneId}`;

    try {
      // Remove worktree
      await execAsync(`git worktree remove ${this.worktreePath}`, {
        cwd: this.config.projectRoot
      });

      // Remove branch
      await this.git.deleteLocalBranch(branchName);

      console.log(`🧹 Cleaned up worktree: ${this.worktreePath}`);
    } catch (error) {
      console.warn(`⚠️  Failed to cleanup worktree: ${error}`);
    }
  }

  private async cleanupBranch(): Promise<void> {
    const branchName = `milestone/${this.config.milestoneId}`;

    try {
      // Switch back to main branch
      await this.git.checkout('main');

      // Remove milestone branch
      await this.git.deleteLocalBranch(branchName);

      console.log(`🧹 Cleaned up branch: ${branchName}`);
    } catch (error) {
      console.warn(`⚠️  Failed to cleanup branch: ${error}`);
    }
  }

  async mergeToMain(): Promise<void> {
    if (this.config.mode === 'none') {
      console.log('ℹ️  No merge needed in none mode');
      return;
    }

    const originalGit = simpleGit(this.config.projectRoot);
    const branchName = `milestone/${this.config.milestoneId}`;

    try {
      // Switch to main branch
      await originalGit.checkout('main');

      if (this.config.mode === 'worktree') {
        // Merge from worktree branch
        await originalGit.merge([branchName]);
        console.log(`✅ Merged ${branchName} to main`);
      } else if (this.config.mode === 'branch') {
        // We're already on main, just merge the milestone branch
        await originalGit.merge([branchName]);
        console.log(`✅ Merged ${branchName} to main`);
      }

    } catch (error) {
      throw new Error(`Failed to merge to main: ${error}`);
    }
  }

  async getStatus(): Promise<{
    mode: string;
    branch: string;
    clean: boolean;
    worktreePath?: string;
  }> {
    const workingDir = await this.getWorkingDirectory();
    const git = simpleGit(workingDir);

    const status = await git.status();
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);

    return {
      mode: this.config.mode,
      branch,
      clean: status.files.length === 0,
      worktreePath: this.worktreePath
    };
  }

  async stashIfDirty(): Promise<boolean> {
    const workingDir = await this.getWorkingDirectory();
    const git = simpleGit(workingDir);

    const status = await git.status();
    if (status.files.length > 0) {
      await git.stash(['push', '-m', `GSD Auto Mode stash - ${new Date().toISOString()}`]);
      console.log('💾 Stashed uncommitted changes');
      return true;
    }

    return false;
  }

  async unstashIfStashed(): Promise<void> {
    const workingDir = await this.getWorkingDirectory();
    const git = simpleGit(workingDir);

    try {
      const { stdout } = await execAsync('git stash list', { cwd: workingDir });
      if (stdout.trim()) {
        await git.stash(['pop']);
        console.log('📤 Restored stashed changes');
      }
    } catch (error) {
      console.warn('⚠️  Failed to restore stash:', error);
    }
  }
}
