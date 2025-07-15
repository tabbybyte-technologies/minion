import { z } from 'zod';
import { 
  safeReadFile, 
  safeWriteFile, 
  safeAppendFile, 
  fileExists, 
  listDirectory, 
  getFileStats,
  isPathSafe,
  getFileExtension 
} from './file-utils.js';

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
    read_file: {
      description: 'Read the contents of a file safely with proper error handling',
      parameters: z.object({
        filePath: z.string().describe('Path to the file to read'),
        encoding: z.string().optional().default('utf-8').describe('File encoding (default: utf-8)'),
      }),
      execute: async ({ filePath, encoding }) => {
        return await readFileContents(filePath, encoding, config);
      },
    },
    write_file: {
      description: 'Write content to a file safely, creating directories if needed',
      parameters: z.object({
        filePath: z.string().describe('Path to the file to write'),
        content: z.string().describe('Content to write to the file'),
        encoding: z.string().optional().default('utf-8').describe('File encoding (default: utf-8)'),
      }),
      execute: async ({ filePath, content, encoding }) => {
        return await writeFileContents(filePath, content, encoding, config);
      },
    },
    append_file: {
      description: 'Append content to a file safely',
      parameters: z.object({
        filePath: z.string().describe('Path to the file to append to'),
        content: z.string().describe('Content to append to the file'),
        encoding: z.string().optional().default('utf-8').describe('File encoding (default: utf-8)'),
      }),
      execute: async ({ filePath, content, encoding }) => {
        return await appendFileContents(filePath, content, encoding, config);
      },
    },
    list_files: {
      description: 'List files and directories in a given path',
      parameters: z.object({
        dirPath: z.string().describe('Path to the directory to list'),
        showDetails: z.boolean().optional().default(false).describe('Show detailed file information'),
      }),
      execute: async ({ dirPath, showDetails }) => {
        return await listFiles(dirPath, showDetails, config);
      },
    },
    check_file_exists: {
      description: 'Check if a file or directory exists',
      parameters: z.object({
        filePath: z.string().describe('Path to check'),
      }),
      execute: async ({ filePath }) => {
        return await checkFileExistence(filePath, config);
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

    // Use Bun.spawn instead of Node.js spawn for better performance
    const proc = Bun.spawn([shell, shellFlag, command], {
      stdout: 'pipe',
      stderr: 'pipe',
      stdin: 'ignore',
    });

    let stdout = '';
    let stderr = '';

    // Handle stdout
    if (proc.stdout) {
      const stdoutReader = proc.stdout.getReader();
      const readStdout = async () => {
        try {
          while (true) {
            const { done, value } = await stdoutReader.read();
            if (done) break;
            const output = new TextDecoder().decode(value);
            stdout += output;
            if (config.debug) {
              process.stdout.write(output);
            }
          }
        } catch (error) {
          console.error('Error reading stdout:', error);
        }
      };
      readStdout();
    }

    // Handle stderr
    if (proc.stderr) {
      const stderrReader = proc.stderr.getReader();
      const readStderr = async () => {
        try {
          while (true) {
            const { done, value } = await stderrReader.read();
            if (done) break;
            const output = new TextDecoder().decode(value);
            stderr += output;
            if (config.debug) {
              process.stderr.write(output);
            }
          }
        } catch (error) {
          console.error('Error reading stderr:', error);
        }
      };
      readStderr();
    }

    // Wait for process to exit
    proc.exited.then((exitCode) => {
      resolve({
        exitCode: exitCode,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    }).catch((error) => {
      reject(new Error(`Failed to execute command: ${error.message}`));
    });

    // Set timeout
    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('Command timed out after 30 seconds'));
    }, 30000);

    proc.exited.finally(() => {
      clearTimeout(timeout);
    });
  });
}

// File operation implementations
async function readFileContents(filePath, encoding, config) {
  try {
    if (!isPathSafe(filePath)) {
      return {
        success: false,
        error: 'File path is not safe - outside allowed directory',
        content: ''
      };
    }

    if (config.debug) {
      console.log(`📖 Reading file: ${filePath}`);
    }

    const content = await safeReadFile(filePath, encoding);
    
    if (config.debug) {
      console.log(`✅ File read successfully, ${content.length} characters`);
    }

    return {
      success: true,
      content: content,
      filePath: filePath,
      size: content.length
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      content: '',
      filePath: filePath
    };
  }
}

async function writeFileContents(filePath, content, encoding, config) {
  try {
    if (!isPathSafe(filePath)) {
      return {
        success: false,
        error: 'File path is not safe - outside allowed directory'
      };
    }

    if (config.debug) {
      console.log(`✏️  Writing file: ${filePath}`);
    }

    await safeWriteFile(filePath, content, encoding);
    
    if (config.debug) {
      console.log(`✅ File written successfully, ${content.length} characters`);
    }

    return {
      success: true,
      filePath: filePath,
      size: content.length,
      message: 'File written successfully'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      filePath: filePath
    };
  }
}

async function appendFileContents(filePath, content, encoding, config) {
  try {
    if (!isPathSafe(filePath)) {
      return {
        success: false,
        error: 'File path is not safe - outside allowed directory'
      };
    }

    if (config.debug) {
      console.log(`➕ Appending to file: ${filePath}`);
    }

    await safeAppendFile(filePath, content, encoding);
    
    if (config.debug) {
      console.log(`✅ Content appended successfully, ${content.length} characters`);
    }

    return {
      success: true,
      filePath: filePath,
      appendedSize: content.length,
      message: 'Content appended successfully'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      filePath: filePath
    };
  }
}

async function listFiles(dirPath, showDetails, config) {
  try {
    if (!isPathSafe(dirPath)) {
      return {
        success: false,
        error: 'Directory path is not safe - outside allowed directory',
        files: []
      };
    }

    if (config.debug) {
      console.log(`📁 Listing directory: ${dirPath}`);
    }

    const files = await listDirectory(dirPath);
    
    if (showDetails) {
      const detailedFiles = [];
      for (const file of files) {
        try {
          const fullPath = `${dirPath}/${file}`;
          const stats = await getFileStats(fullPath);
          detailedFiles.push({
            name: file,
            path: fullPath,
            size: stats.size,
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile(),
            modified: stats.mtime.toISOString(),
            extension: getFileExtension(file)
          });
        } catch (error) {
          detailedFiles.push({
            name: file,
            error: `Could not get stats: ${error.message}`
          });
        }
      }
      
      if (config.debug) {
        console.log(`✅ Listed ${detailedFiles.length} items with details`);
      }

      return {
        success: true,
        files: detailedFiles,
        count: detailedFiles.length,
        dirPath: dirPath
      };
    } else {
      if (config.debug) {
        console.log(`✅ Listed ${files.length} items`);
      }

      return {
        success: true,
        files: files,
        count: files.length,
        dirPath: dirPath
      };
    }

  } catch (error) {
    return {
      success: false,
      error: error.message,
      files: [],
      dirPath: dirPath
    };
  }
}

async function checkFileExistence(filePath, config) {
  try {
    if (!isPathSafe(filePath)) {
      return {
        success: false,
        error: 'File path is not safe - outside allowed directory',
        exists: false
      };
    }

    if (config.debug) {
      console.log(`🔍 Checking existence: ${filePath}`);
    }

    const exists = await fileExists(filePath);
    
    if (config.debug) {
      console.log(`✅ File ${exists ? 'exists' : 'does not exist'}`);
    }

    return {
      success: true,
      exists: exists,
      filePath: filePath
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      exists: false,
      filePath: filePath
    };
  }
}
