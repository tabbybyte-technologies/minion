import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';

// Check if we're already running under Bun
const isRunningUnderBun = typeof globalThis.Bun !== 'undefined';

// Function to check if Bun is available
function isBunAvailable() {
  try {
    execSync('bun --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Bootstrap function that handles runtime detection and smart launching
 * If Bun is available and we're not already running under Bun, re-launch with Bun
 * Returns true if we should continue execution, false if we've re-launched
 */
export async function bootstrap() {
  // If we're not already running under Bun, but Bun is available, re-launch with Bun
  if (!isRunningUnderBun && isBunAvailable()) {
    // Get the main script path from process.argv[1] (the script that was executed)
    const mainScriptPath = process.argv[1];
    
    const bunProcess = spawn('bun', [mainScriptPath, ...process.argv.slice(2)], {
      stdio: 'inherit'
    });
    
    bunProcess.on('exit', (code) => {
      process.exit(code);
    });
    
    bunProcess.on('error', (error) => {
      console.error('Failed to launch with Bun, falling back to Node.js:', error.message);
      // Continue with Node.js execution by returning true
      return true;
    });
    
    // Exit here if Bun launch was successful
    if (bunProcess.pid) {
      // Don't continue with Node.js execution
      process.on('SIGINT', () => bunProcess.kill('SIGINT'));
      process.on('SIGTERM', () => bunProcess.kill('SIGTERM'));
      return false; // Signal that we've re-launched and shouldn't continue
    }
  }
  
  // Continue with normal execution (either under Bun or Node.js fallback)
  return true;
}

// Export utility functions for testing/debugging
export { isRunningUnderBun, isBunAvailable };
