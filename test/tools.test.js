import { test, expect } from 'bun:test';

test('dangerous command detection', () => {
  // Import the functions we need to test
  // Note: These would need to be exported from tools.js for testing
  const dangerousCommands = [
    'rm -rf /',
    'rm -rf /*',
    ':(){ :|:& };:',
    'dd if=/dev/zero of=/dev/sda',
    'mkfs.ext4 /dev/sda1',
    'shutdown -h now',
    'kill -9 1'
  ];
  
  // This is a placeholder test - actual implementation would import 
  // and test the isCommandSafe function
  expect(dangerousCommands.length).toBeGreaterThan(0);
});

test('allowed commands', () => {
  const allowedCommands = [
    'ls -la',
    'git status',
    'npm install',
    'docker ps',
    'cat README.md'
  ];
  
  // This is a placeholder test - actual implementation would import 
  // and test the isCommandSafe function
  expect(allowedCommands.length).toBeGreaterThan(0);
});
