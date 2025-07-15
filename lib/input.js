import { safeReadFile } from './file-utils.js';

export async function handleInput(filePath) {
  if (filePath) {
    // Read from file using safe file utilities
    try {
      return await safeReadFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read input file: ${error.message}`);
    }
  } else {
    // Read from stdin
    return await readFromStdin();
  }
}

function readFromStdin() {
  return new Promise((resolve, reject) => {
    let input = '';
    
    // Check if stdin is a TTY (interactive terminal)
    if (process.stdin.isTTY) {
      reject(new Error('No input provided. Use -f flag to read from file or pipe input.'));
      return;
    }
    
    process.stdin.setEncoding('utf-8');
    
    process.stdin.on('data', (chunk) => {
      input += chunk;
    });
    
    process.stdin.on('end', () => {
      resolve(input.trim());
    });
    
    process.stdin.on('error', (error) => {
      reject(new Error(`Failed to read from stdin: ${error.message}`));
    });
  });
}
