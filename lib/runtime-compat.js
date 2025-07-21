/**
 * Runtime compatibility layer for Bun and Node.js
 * Detects available runtime and provides unified APIs
 */

import { readFile, writeFile, access } from 'fs/promises';
import { spawn } from 'child_process';
import { promisify } from 'util';

// Runtime detection
let _bunAvailable = null;
let _bunAPIs = null;

/**
 * Check if Bun runtime is available
 * @returns {boolean} True if Bun APIs are available
 */
export function isBunAvailable() {
  if (_bunAvailable !== null) {
    return _bunAvailable;
  }

  try {
    // Check if we're running in Bun by testing for Bun global
    _bunAvailable = typeof globalThis.Bun !== 'undefined' && 
                   typeof globalThis.Bun.file === 'function' && 
                   typeof globalThis.Bun.write === 'function' &&
                   typeof globalThis.Bun.spawn === 'function';
    
    if (_bunAvailable) {
      _bunAPIs = globalThis.Bun;
    }
  } catch {
    _bunAvailable = false;
  }

  return _bunAvailable;
}

/**
 * Get runtime information
 * @returns {Object} Runtime details
 */
export function getRuntimeInfo() {
  const isBun = isBunAvailable();
  return {
    runtime: isBun ? 'bun' : 'node',
    version: isBun ? _bunAPIs.version : process.version,
    platform: process.platform,
    arch: process.arch
  };
}

/**
 * Cross-runtime file operations
 */
export const file = {
  /**
   * Read file text content
   * @param {string} path - File path
   * @returns {Promise<string>} File content
   */
  async text(path) {
    if (isBunAvailable()) {
      const bunFile = _bunAPIs.file(path);
      return await bunFile.text();
    } else {
      return await readFile(path, 'utf-8');
    }
  },

  /**
   * Check if file exists
   * @param {string} path - File path
   * @returns {Promise<boolean>} True if file exists
   */
  async exists(path) {
    if (isBunAvailable()) {
      const bunFile = _bunAPIs.file(path);
      return await bunFile.exists();
    } else {
      try {
        await access(path);
        return true;
      } catch {
        return false;
      }
    }
  }
};

/**
 * Cross-runtime file write operation
 * @param {string} path - File path
 * @param {string|Buffer} content - Content to write
 * @returns {Promise<void>}
 */
export async function writeContent(path, content) {
  if (isBunAvailable()) {
    await _bunAPIs.write(path, content);
  } else {
    await writeFile(path, content, 'utf-8');
  }
}

/**
 * Cross-runtime process spawning
 * @param {string[]} command - Command array [cmd, ...args]
 * @param {Object} options - Spawn options
 * @returns {Promise<Object>} Process result
 */
export function spawnProcess(command, options = {}) {
  const timeoutMs = options.timeout || 30000; // 30 second default timeout
  
  if (isBunAvailable()) {
    return spawnWithBun(command, options, timeoutMs);
  } else {
    return spawnWithNode(command, options, timeoutMs);
  }
}

/**
 * Spawn process using Bun.spawn
 * @param {string[]} command - Command array
 * @param {Object} options - Options
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<Object>} Process result
 */
function spawnWithBun(command, options, timeoutMs) {
  return new Promise((resolve, reject) => {
    const proc = _bunAPIs.spawn(command, {
      stdout: 'pipe',
      stderr: 'pipe',
      stdin: 'ignore',
      ...options
    });

    let stdout = '';
    let stderr = '';

    // Set timeout
    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('Command timed out after 30 seconds'));
    }, timeoutMs);

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
            if (options.debug) {
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
            if (options.debug) {
              process.stderr.write(output);
            }
          }
        } catch (error) {
          console.error('Error reading stderr:', error);
        }
      };
      readStderr();
    }

    // Wait for process to finish
    proc.exited.then((exitCode) => {
      clearTimeout(timeout);
      resolve({
        exitCode,
        stdout,
        stderr
      });
    }).catch((error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

/**
 * Spawn process using Node.js child_process
 * @param {string[]} command - Command array
 * @param {Object} options - Options
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<Object>} Process result
 */
function spawnWithNode(command, options, timeoutMs) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command;
    const proc = spawn(cmd, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options
    });

    let stdout = '';
    let stderr = '';

    // Set timeout
    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('Command timed out after 30 seconds'));
    }, timeoutMs);

    proc.stdout?.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      if (options.debug) {
        process.stdout.write(output);
      }
    });

    proc.stderr?.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      if (options.debug) {
        process.stderr.write(output);
      }
    });

    proc.on('close', (exitCode) => {
      clearTimeout(timeout);
      resolve({
        exitCode,
        stdout,
        stderr
      });
    });

    proc.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

/**
 * Log runtime information if debug is enabled
 * @param {boolean} debug - Whether debug mode is enabled
 */
export function logRuntimeInfo(debug = false) {
  if (debug) {
    const info = getRuntimeInfo();
    console.log(`🚀 Runtime: ${info.runtime} ${info.version} (${info.platform}/${info.arch})`);
  }
}
