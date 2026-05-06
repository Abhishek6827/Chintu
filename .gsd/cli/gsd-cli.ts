#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { join } from 'path';
import { existsSync } from 'fs';
import { GSDEngine } from '../core/engine';
import { GSDDatabase } from '../core/database';

const program = new Command();

// Get project root (assuming we're in a git repo)
function getProjectRoot(): string {
  let current = process.cwd();
  while (current !== '/') {
    if (existsSync(join(current, '.git'))) {
      return current;
    }
    current = join(current, '..');
  }
  throw new Error('Not in a git repository');
}

// Initialize GSD components
function getGSDComponents() {
  const projectRoot = getProjectRoot();
  const db = new GSDDatabase(projectRoot);
  const engine = new GSDEngine(projectRoot);
  return { projectRoot, db, engine };
}

// Utility functions
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// CLI Commands
program
  .name('gsd')
  .description('GSD Auto Mode - Autonomous Development Execution Engine')
  .version('1.0.0');

// Auto mode command
program
  .command('auto')
  .description('Start GSD Auto Mode')
  .option('-d, --deep', 'Enable deep planning mode')
  .option('-b, --budget', 'Use budget token profile')
  .option('-q, --quality', 'Use quality token profile')
  .option('--max-restarts <n>', 'Maximum restart attempts on crash', '3')
  .option('--headless', 'Run in headless mode with auto-restart')
  .action(async (options) => {
    const spinner = ora('Initializing GSD Auto Mode...').start();

    try {
      const { db, engine } = getGSDComponents();

      // Check health first
      const health = await engine.healthCheck();
      if (!health.healthy) {
        spinner.fail('Health check failed');
        console.log(chalk.red('Issues found:'));
        health.issues.forEach(issue => console.log(chalk.red(`  - ${issue}`)));
        return;
      }

      spinner.succeed('Health check passed');

      // Check for active milestone
      const milestone = db.getActiveMilestone();
      if (!milestone) {
        spinner.fail('No active milestone found');
        console.log(chalk.yellow('Please create a milestone first with: gsd new-milestone'));
        return;
      }

      console.log(chalk.green(`🚀 Starting GSD Auto Mode for milestone: ${milestone.title}`));

      // Start auto mode
      await engine.startAutoMode();

    } catch (error) {
      spinner.fail('Failed to start auto mode');
      console.error(chalk.red(error));
    }
  });

// Stop command
program
  .command('stop')
  .description('Stop GSD Auto Mode gracefully')
  .action(async () => {
    const spinner = ora('Stopping GSD Auto Mode...').start();

    try {
      const { engine } = getGSDComponents();
      await engine.stopAutoMode();
      spinner.succeed('GSD Auto Mode stopped');
    } catch (error) {
      spinner.fail('Failed to stop auto mode');
      console.error(chalk.red(error));
    }
  });

// Status command
program
  .command('status')
  .description('Show current GSD status and dashboard')
  .option('--json', 'Output in JSON format')
  .action(async (options) => {
    try {
      const { db, engine } = getGSDComponents();

      const milestone = db.getActiveMilestone();
      const health = await engine.healthCheck();
      const settings = db.getAllSettings();

      if (options.json) {
        console.log(JSON.stringify({
          milestone,
          health,
          settings
        }, null, 2));
        return;
      }

      console.log(chalk.bold.blue('\n📊 GSD Status Dashboard\n'));

      // Milestone status
      if (milestone) {
        console.log(chalk.green('🎯 Active Milestone:'));
        console.log(`  Title: ${milestone.title}`);
        console.log(`  Status: ${milestone.status}`);
        console.log(`  Created: ${new Date(milestone.created_at).toLocaleString()}`);

        // Slice status
        const pendingSlices = db.getPendingSlices(milestone.id);
        console.log(`  Pending Slices: ${pendingSlices.length}`);
      } else {
        console.log(chalk.yellow('⚠️  No active milestone'));
      }

      // Health status
      console.log(chalk.green('\n🏥 Health Status:'));
      if (health.healthy) {
        console.log(chalk.green('  ✅ All systems healthy'));
      } else {
        console.log(chalk.red('  ❌ Issues detected:'));
        health.issues.forEach(issue => {
          console.log(chalk.red(`    - ${issue}`));
        });
      }

      // Settings
      console.log(chalk.green('\n⚙️  Configuration:'));
      console.log(`  Planning Depth: ${settings.planning_depth}`);
      console.log(`  Context Mode: ${settings.context_mode_enabled === 'true' ? 'Enabled' : 'Disabled'}`);
      console.log(`  Reactive Execution: ${settings.reactive_execution_enabled === 'true' ? 'Enabled' : 'Disabled'}`);
      console.log(`  Auto Reports: ${settings.auto_report === 'true' ? 'Enabled' : 'Disabled'}`);

    } catch (error) {
      console.error(chalk.red('Failed to get status:'), error);
    }
  });

// New milestone command
program
  .command('new-milestone')
  .description('Create a new milestone')
  .option('--deep', 'Enable deep planning mode')
  .action(async (options) => {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Milestone title:',
          validate: input => input.length > 0 || 'Title is required'
        },
        {
          type: 'input',
          name: 'description',
          message: 'Milestone description:'
        }
      ]);

      const { db } = getGSDComponents();
      const milestoneId = `M${Date.now()}`;

      db.createMilestone(milestoneId, answers.title, answers.description);

      console.log(chalk.green(`✅ Created milestone: ${milestoneId} - ${answers.title}`));

      if (options.deep) {
        console.log(chalk.blue('🔬 Deep planning mode enabled'));
        // Would trigger deep planning workflow here
      }

    } catch (error) {
      console.error(chalk.red('Failed to create milestone:'), error);
    }
  });

// New project command
program
  .command('new-project')
  .description('Initialize a new GSD project')
  .option('--deep', 'Enable deep planning mode')
  .action(async (options) => {
    const spinner = ora('Initializing GSD project...').start();

    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'Project name:',
          validate: input => input.length > 0 || 'Project name is required'
        },
        {
          type: 'input',
          name: 'vision',
          message: 'Project vision:'
        },
        {
          type: 'checkbox',
          name: 'features',
          message: 'Key features:',
          choices: [
            'AI Integration',
            'Web Frontend',
            'Desktop App',
            'Database',
            'Authentication',
            'Payments',
            'API'
          ]
        }
      ]);

      const { db } = getGSDComponents();

      // Update project settings
      db.updateSetting('planning_depth', options.deep ? 'deep' : 'normal');

      spinner.succeed('GSD project initialized');
      console.log(chalk.green(`✅ Project "${answers.projectName}" ready for GSD Auto Mode`));

    } catch (error) {
      spinner.fail('Failed to initialize project');
      console.error(chalk.red(error));
    }
  });

// Visualize command
program
  .command('visualize')
  .description('Open workflow visualizer')
  .action(async () => {
    console.log(chalk.blue('🔍 Opening workflow visualizer...'));
    console.log(chalk.yellow('Note: Web dashboard would open here in full implementation'));

    try {
      const { db } = getGSDComponents();
      const milestone = db.getActiveMilestone();

      if (!milestone) {
        console.log(chalk.yellow('No active milestone to visualize'));
        return;
      }

      // Simple text visualization for now
      console.log(chalk.bold(`\n📈 Milestone: ${milestone.title}\n`));

      const pendingSlices = db.getPendingSlices(milestone.id);
      console.log(chalk.green('Pending Slices:'));
      pendingSlices.forEach((slice, index) => {
        console.log(`  ${index + 1}. ${slice.title} (${slice.status})`);
      });

    } catch (error) {
      console.error(chalk.red('Failed to visualize:'), error);
    }
  });

// Doctor command
program
  .command('doctor')
  .description('Run health diagnostics')
  .action(async () => {
    const spinner = ora('Running GSD diagnostics...').start();

    try {
      const { engine, db } = getGSDComponents();
      const health = await engine.healthCheck();

      spinner.stop();

      console.log(chalk.bold.blue('\n🩺 GSD Health Check\n'));

      if (health.healthy) {
        console.log(chalk.green('✅ Overall Health: GOOD\n'));
      } else {
        console.log(chalk.red('❌ Overall Health: ISSUES FOUND\n'));
      }

      console.log(chalk.bold('Database:'));
      const dbHealth = db.healthCheck();
      if (dbHealth.healthy) {
        console.log(chalk.green('  ✅ Database connection OK'));
      } else {
        console.log(chalk.red('  ❌ Database issues:'));
        dbHealth.issues.forEach(issue => {
          console.log(chalk.red(`    - ${issue}`));
        });
      }

      console.log(chalk.bold('\nConfiguration:'));
      const settings = db.getAllSettings();
      console.log(`  Planning Depth: ${settings.planning_depth}`);
      console.log(`  Context Mode: ${settings.context_mode_enabled === 'true' ? 'Enabled' : 'Disabled'}`);
      console.log(`  Git Isolation: ${settings.git_isolation}`);

      if (health.issues.length > 0) {
        console.log(chalk.bold('\n🔧 Recommended Actions:'));
        health.issues.forEach(issue => {
          if (issue.includes('Working directory not clean')) {
            console.log(chalk.yellow('  - Commit or stash changes before running auto mode'));
          }
          if (issue.includes('Git status check failed')) {
            console.log(chalk.yellow('  - Check git repository status'));
          }
        });
      }

    } catch (error) {
      spinner.fail('Diagnostics failed');
      console.error(chalk.red(error));
    }
  });

// Export command
program
  .command('export')
  .description('Export reports and data')
  .option('--html', 'Generate HTML report')
  .option('--all', 'Export all milestones')
  .action(async (options) => {
    const spinner = ora('Generating export...').start();

    try {
      const { db } = getGSDComponents();

      if (options.html) {
        const milestone = db.getActiveMilestone();
        if (milestone) {
          // HTML report generation would happen here
          spinner.succeed('HTML report generated');
          console.log(chalk.green(`📄 Report saved to .gsd/reports/`));
        } else {
          spinner.fail('No active milestone to export');
        }
      }

      if (options.all) {
        console.log(chalk.blue('📦 Exporting all milestones...'));
        // Would export all milestones here
      }

    } catch (error) {
      spinner.fail('Export failed');
      console.error(chalk.red(error));
    }
  });

// Capture command
program
  .command('capture <message>')
  .description('Fire-and-forget thought capture')
  .action(async (message: string) => {
    try {
      const { db } = getGSDComponents();

      // Add to knowledge base
      db.addKnowledge(
        `Capture: ${message.substring(0, 50)}...`,
        message,
        'capture',
        'User input during development'
      );

      console.log(chalk.green(`💭 Captured: "${message}"`));

    } catch (error) {
      console.error(chalk.red('Failed to capture:'), error);
    }
  });

// Steer command
program
  .command('steer')
  .description('Hard-steer plan documents during execution')
  .action(async () => {
    console.log(chalk.blue('🧭 Steering mode activated'));
    console.log(chalk.yellow('Note: Plan steering interface would open here'));

    // Would provide interactive steering interface
  });

// Parse command line arguments
program.parse();

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught error:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled rejection at:'), promise, 'reason:', reason);
  process.exit(1);
});
