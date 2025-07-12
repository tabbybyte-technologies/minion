import { readFile } from 'fs/promises';
import { createReadStream } from 'fs';

export async function handleInput(filePath) {
  if (filePath) {
    // Read from file
    try {
      return await readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
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
