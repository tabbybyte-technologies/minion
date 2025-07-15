import { test, expect } from 'bun:test';
import { 
  safeReadFile, 
  safeWriteFile, 
  safeAppendFile, 
  fileExists, 
  normalizePath,
  isPathSafe,
  getFileExtension,
  getFileNameWithoutExtension
} from '../lib/file-utils.js';
import { rmdir } from 'fs/promises';
import { join } from 'path';

const TEST_DIR = '/tmp/minion-test';
const TEST_FILE = join(TEST_DIR, 'test.txt');

test('file utilities - write and read', async () => {
  const content = 'Hello, Minion!';
  
  // Write file
  await safeWriteFile(TEST_FILE, content);
  
  // Check file exists
  expect(await fileExists(TEST_FILE)).toBe(true);
  
  // Read file
  const readContent = await safeReadFile(TEST_FILE);
  expect(readContent).toBe(content);
  
  // Cleanup
  await Bun.file(TEST_FILE).delete();
  await rmdir(TEST_DIR);
});

test('file utilities - append content', async () => {
  const content1 = 'Hello, ';
  const content2 = 'Minion!';
  
  // Write initial content
  await safeWriteFile(TEST_FILE, content1);
  
  // Append content
  await safeAppendFile(TEST_FILE, content2);
  
  // Read and verify
  const readContent = await safeReadFile(TEST_FILE);
  expect(readContent).toBe(content1 + content2);
  
  // Cleanup
  await Bun.file(TEST_FILE).delete();
  await rmdir(TEST_DIR);
});

test('path utilities', () => {
  // Test path normalization
  expect(normalizePath('./test.txt')).toContain('test.txt');
  expect(normalizePath('../test.txt')).toContain('test.txt');
  
  // Test path safety
  expect(isPathSafe('./safe-file.txt')).toBe(true);
  expect(isPathSafe('/etc/passwd')).toBe(false);
  
  // Test file extension
  expect(getFileExtension('test.txt')).toBe('.txt');
  expect(getFileExtension('test.backup.txt')).toBe('.txt');
  expect(getFileExtension('README')).toBe('');
  
  // Test file name without extension
  expect(getFileNameWithoutExtension('test.txt')).toBe('test');
  expect(getFileNameWithoutExtension('test.backup.txt')).toBe('test.backup');
  expect(getFileNameWithoutExtension('README')).toBe('README');
});

test('error handling', async () => {
  // Test reading non-existent file
  await expect(safeReadFile('/non/existent/file.txt')).rejects.toThrow();
  
  // Test invalid path
  expect(() => normalizePath(null)).toThrow();
  expect(() => normalizePath('')).toThrow();
});
