import { spawn } from 'child_process';
import { z } from 'zod';

// Command allowlist for safety
const ALLOWED_COMMANDS = [
  'ls', 'dir', 'pwd', 'cd', 'cat', 'head', 'tail', 'grep', 'find', 'which', 'whereis',
  'echo', 'date', 'whoami', 'id', 'uname', 'df', 'du', 'free', 'ps', 'top', 'htop',
  'curl', 'wget', 'ping', 'nslookup', 'dig', 'ssh', 'scp', 'rsync',
  'git', 'npm', 'yarn', 'bun', 'node', 'python', 'python3', 'pip', 'pip3',
  'docker', 'docker-compose', 'kubectl', 'helm',
  'mkdir', 'touch', 'cp', 'mv', 'ln', 'chmod', 'chown',
  'tar', 'zip', 'unzip', 'gzip', 'gunzip',
  'vim', 'nano', 'emacs', 'code', 'subl'
];

// Dangerous command patterns to block
const DANGEROUS_PATTERNS = [
  /rm\s+.*-rf?\s*\//, // rm -rf /
  /:\(\)\{\s*:\|\:&\s*\};\:/, // fork bomb
  />\s*\/dev\/sd[a-z]/, // writing to disk devices
  /dd\s+.*of=\/dev/, // dd to devices
  /mkfs/, // filesystem creation
  /fdisk/, // disk partitioning
  /format/, // disk formatting
  /del\s+.*\/[sq]/, // Windows delete with force/quiet
  /shutdown/, // system shutdown
  /reboot/, // system reboot
  /halt/, // system halt
  /init\s+0/, // shutdown via init
  /kill\s+-9\s+1/, // kill init process
  /killall\s+-9/, // kill all processes
];

export function setupTools(config) {
  return {
    run_safe_command: {
      description: 'Execute a shell command safely with built-in safety checks and allowlist validation',
      parameters: z.object({
        command: z.string().describe('The shell command to execute'),
      }),
      execute: async ({ command }) => {
        return await runSafeCommand(command, config);
      },
    },
  };
}

async function runSafeCommand(command, config) {
  try {
    // Parse the command to get the base command
    const parts = command.trim().split(/\s+/);
    const baseCommand = parts[0];

    // Safety checks
    if (!isCommandSafe(command, baseCommand)) {
      return {
        success: false,
        error: 'Command blocked by safety filters',
        output: '',
        stderr: ''
      };
    }

    // if (config.dryRun) {
    //   if (config.debug) {
    //     console.log(`[DRY RUN] Would execute: ${command}`);
    //   }
    //   return {
    //     success: true,
    //     dryRun: true,
    //     command: command,
    //     output: `[DRY RUN] Would execute: ${command}`,
    //     stderr: ''
    //   };
    // }

    // Execute the command
    if (config.debug) {
      console.log(`🔧 Executing: ${command}`);
    }
    const result = await executeCommand(command, config);
    if (config.debug) {
      console.log(`✅ Command completed with exit code: ${result.exitCode}`);
    }
    return {
      success: result.exitCode === 0,
      exitCode: result.exitCode,
      output: result.stdout,
      stderr: result.stderr,
      command: command
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: '',
      stderr: error.message,
      command: command
    };
  }
}

function isCommandSafe(fullCommand, baseCommand) {
  // Check against dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(fullCommand)) {
      return false;
    }
  }

  // Check allowlist
  if (!ALLOWED_COMMANDS.includes(baseCommand)) {
    return false;
  }

  return true;
}

function executeCommand(command, config) {
  return new Promise((resolve, reject) => {
    const shell = process.platform === 'win32' ? 'cmd' : 'sh';
    const shellFlag = process.platform === 'win32' ? '/c' : '-c';

    const child = spawn(shell, [shellFlag, command], {
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8'
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      if (config.debug) {
        process.stdout.write(output);
      }
    });

    child.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      if (config.debug) {
        process.stderr.write(output);
      }
    });

    child.on('close', (code) => {
      resolve({
        exitCode: code,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to execute command: ${error.message}`));
    });

    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Command timed out after 30 seconds'));
    }, 30000);

    child.on('close', () => {
      clearTimeout(timeout);
    });
  });
}
