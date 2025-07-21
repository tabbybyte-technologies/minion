import { dirname, resolve, normalize, join, isAbsolute } from 'path';
import { readdir, mkdir, stat } from 'fs/promises';
import { file, writeContent } from './runtime-compat.js';

/**
 * OS-agnostic file utility functions for safe file operations
 * Provides robust error handling and path normalization
 * Uses runtime detection to leverage Bun APIs when available
 */

/**
 * Safely read a file with proper error handling
 * @param {string} filePath - Path to the file
 * @param {string} encoding - File encoding (default: 'utf-8')
 * @returns {Promise<string>} File contents
 */
export async function safeReadFile(filePath, encoding = 'utf-8') {
  try {
    const normalizedPath = normalizePath(filePath);
    await checkFileExists(normalizedPath);
    return await file.text(normalizedPath);
  } catch (error) {
    throw new Error(`Failed to read file '${filePath}': ${error.message}`);
  }
}

/**
 * Safely write a file with directory creation if needed
 * @param {string} filePath - Path to the file
 * @param {string} content - Content to write
 * @param {string} encoding - File encoding (default: 'utf-8')
 * @returns {Promise<void>}
 */
export async function safeWriteFile(filePath, content, encoding = 'utf-8') {
  try {
    const normalizedPath = normalizePath(filePath);
    const dir = dirname(normalizedPath);
    // Create directory if it doesn't exist
    await ensureDirectory(dir);
    await writeContent(normalizedPath, content);
  } catch (error) {
    throw new Error(`Failed to write file '${filePath}': ${error.message}`);
  }
}

/**
 * Safely append content to a file
 * @param {string} filePath - Path to the file
 * @param {string} content - Content to append
 * @param {string} encoding - File encoding (default: 'utf-8')
 * @returns {Promise<void>}
 */
export async function safeAppendFile(filePath, content, encoding = 'utf-8') {
  try {
    const normalizedPath = normalizePath(filePath);
    let existingContent = '';
    // Read existing content if file exists
    if (await fileExists(normalizedPath)) {
      existingContent = await safeReadFile(normalizedPath, encoding);
    }
    const newContent = existingContent + content;
    await writeContent(normalizedPath, newContent);
  } catch (error) {
    throw new Error(`Failed to append to file '${filePath}': ${error.message}`);
  }
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>}
 */
export async function fileExists(filePath) {
  try {
    const normalizedPath = normalizePath(filePath);
    return await file.exists(normalizedPath);
  } catch {
    return false;
  }
}

/**
 * Check if a file exists and throw if it doesn't
 * @param {string} filePath - Path to the file
 * @returns {Promise<void>}
 */
export async function checkFileExists(filePath) {
  if (!(await fileExists(filePath))) {
    throw new Error(`File does not exist: ${filePath}`);
  }
}

/**
 * Get file statistics
 * @param {string} filePath - Path to the file
 * @returns {Promise<import('fs').Stats>}
 */
export async function getFileStats(filePath) {
  try {
    const normalizedPath = normalizePath(filePath);
    return await stat(normalizedPath);
  } catch (error) {
    throw new Error(`Failed to get file stats for '${filePath}': ${error.message}`);
  }
}

/**
 * List directory contents
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<string[]>}
 */
export async function listDirectory(dirPath) {
  try {
    const normalizedPath = normalizePath(dirPath);
    return await readdir(normalizedPath);
  } catch (error) {
    throw new Error(`Failed to list directory '${dirPath}': ${error.message}`);
  }
}

/**
 * Ensure a directory exists, create if it doesn't
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<void>}
 */
export async function ensureDirectory(dirPath) {
  try {
    const normalizedPath = normalizePath(dirPath);
    // Use Node.js fs/promises mkdir since Bun doesn't have Bun.mkdir
    await mkdir(normalizedPath, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create directory '${dirPath}': ${error.message}`);
  }
}

/**
 * Normalize and resolve file paths for cross-platform compatibility
 * @param {string} filePath - Path to normalize
 * @returns {string} Normalized path
 */
export function normalizePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path provided');
  }
  
  // Convert to absolute path if relative
  const absolutePath = isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath);
  
  // Normalize path separators and resolve . and .. segments
  return normalize(absolutePath);
}

/**
 * Safely join path segments
 * @param {...string} paths - Path segments to join
 * @returns {string} Joined path
 */
export function safePath(...paths) {
  return normalizePath(join(...paths));
}

/**
 * Validate that a file path is safe (not trying to escape working directory)
 * @param {string} filePath - Path to validate
 * @param {string} baseDir - Base directory to restrict to (default: cwd)
 * @returns {boolean}
 */
export function isPathSafe(filePath, baseDir = process.cwd()) {
  try {
    const normalizedPath = normalizePath(filePath);
    const normalizedBase = normalizePath(baseDir);
    
    // Check if the path is within the base directory
    return normalizedPath.startsWith(normalizedBase);
  } catch {
    return false;
  }
}

/**
 * Get file extension
 * @param {string} filePath - Path to the file
 * @returns {string} File extension (with dot)
 */
export function getFileExtension(filePath) {
  const normalized = normalizePath(filePath);
  const lastDot = normalized.lastIndexOf('.');
  const lastSlash = Math.max(normalized.lastIndexOf('/'), normalized.lastIndexOf('\\'));
  
  if (lastDot > lastSlash) {
    return normalized.substring(lastDot);
  }
  return '';
}

/**
 * Get file name without extension
 * @param {string} filePath - Path to the file
 * @returns {string} File name without extension
 */
export function getFileNameWithoutExtension(filePath) {
  const normalized = normalizePath(filePath);
  const lastSlash = Math.max(normalized.lastIndexOf('/'), normalized.lastIndexOf('\\'));
  const fileName = normalized.substring(lastSlash + 1);
  const lastDot = fileName.lastIndexOf('.');
  
  if (lastDot > 0) {
    return fileName.substring(0, lastDot);
  }
  return fileName;
}
