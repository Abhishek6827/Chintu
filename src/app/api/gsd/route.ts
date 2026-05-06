import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    const projectRoot = process.cwd();

    let command = '';
    switch (action) {
      case 'start':
        command = `npm run gsd:auto`;
        break;
      case 'stop':
        command = `npm run gsd:stop`;
        break;
      case 'status':
        command = `npm run gsd:status`;
        break;
      case 'doctor':
        command = `npm run gsd:doctor`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Execute the command with timeout
    const { stdout, stderr } = await execAsync(command, {
      cwd: projectRoot,
      timeout: 30000 // 30 second timeout
    });

    if (stderr && !stderr.includes('warning')) {
      console.error('GSD Command Error:', stderr);
      return NextResponse.json({ error: stderr }, { status: 500 });
    }

    // Parse JSON output for status command
    if (action === 'status') {
      try {
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[0]);
          return NextResponse.json({ success: true, data: jsonData });
        }
      } catch {
        // If JSON parsing fails, return raw output
        return NextResponse.json({ success: true, data: { raw: stdout } });
      }
    }

    return NextResponse.json({
      success: true,
      message: stdout.trim(),
      action
    });

  } catch (error: any) {
    console.error('GSD API Error:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const projectRoot = process.cwd();
    const gsdScript = join(projectRoot, '.gsd', 'cli', 'gsd-cli.ts');

    const { stdout, stderr } = await execAsync(`npx tsx ${gsdScript} status --json`, {
      cwd: projectRoot,
      timeout: 10000
    });

    if (stderr && !stderr.includes('warning')) {
      return NextResponse.json({ error: stderr }, { status: 500 });
    }

    // Try to parse JSON output
    try {
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ success: true, data: jsonData });
      }
    } catch {
      // Fallback to parsing manually
      const data = parseGSDEOutput(stdout);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: true, data: { raw: stdout } });

  } catch (error: any) {
    console.error('GSD Status API Error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to get GSD status'
    }, { status: 500 });
  }
}

function parseGSDEOutput(output: string) {
  const lines = output.split('\n');
  const data: any = {
    milestone: null,
    health: { healthy: true, issues: [] },
    settings: {},
    isRunning: false
  };

  let currentSection = '';

  for (const line of lines) {
    if (line.includes('🎯 Active Milestone:')) {
      currentSection = 'milestone';
      data.milestone = { title: '', status: 'active' };
    } else if (line.includes('🏥 Health Status:')) {
      currentSection = 'health';
    } else if (line.includes('⚙️ Configuration:')) {
      currentSection = 'settings';
    } else if (line.includes('❌') || line.includes('✅')) {
      if (line.includes('❌')) {
        data.health.healthy = false;
      }
    } else if (currentSection === 'milestone' && line.trim()) {
      if (line.includes('Title:')) {
        data.milestone.title = line.split('Title:')[1]?.trim();
      } else if (line.includes('Status:')) {
        data.milestone.status = line.split('Status:')[1]?.trim();
      }
    } else if (currentSection === 'settings' && line.includes(':')) {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value) {
        data.settings[key.replace(/\s+/g, '_').toLowerCase()] = value;
      }
    }
  }

  return data;
}
