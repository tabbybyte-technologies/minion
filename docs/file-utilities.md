# File Utilities Documentation

## Overview
The `file-utils.js` module provides OS-agnostic, safe file operations for the Minion CLI tool. These utilities include proper error handling, path normalization, and security checks to prevent operations outside the working directory.

## Available File Tools

### 1. `read_file`
Safely reads file contents with proper error handling.

**Parameters:**
- `filePath` (string): Path to the file to read
- `encoding` (string, optional): File encoding (default: 'utf-8')

**Example:**
```bash
echo "Read the contents of package.json" | minion
```

### 2. `write_file`
Safely writes content to a file, creating directories if needed.

**Parameters:**
- `filePath` (string): Path to the file to write
- `content` (string): Content to write to the file
- `encoding` (string, optional): File encoding (default: 'utf-8')

**Example:**
```bash
echo "Create a README.md file with basic project information" | minion
```

### 3. `append_file`
Safely appends content to an existing file or creates it if it doesn't exist.

**Parameters:**
- `filePath` (string): Path to the file to append to
- `content` (string): Content to append to the file
- `encoding` (string, optional): File encoding (default: 'utf-8')

**Example:**
```bash
echo "Add a new entry to the CHANGELOG.md file" | minion
```

### 4. `list_files`
Lists files and directories in a given path with optional detailed information.

**Parameters:**
- `dirPath` (string): Path to the directory to list
- `showDetails` (boolean, optional): Show detailed file information (default: false)

**Example:**
```bash
echo "List all files in the current directory with detailed information" | minion
```

### 5. `check_file_exists`
Checks if a file or directory exists.

**Parameters:**
- `filePath` (string): Path to check

**Example:**
```bash
echo "Check if the .env file exists in the current directory" | minion
```

## Safety Features

### Path Safety
All file operations include path safety checks to prevent access outside the current working directory:
- Prevents `../` traversal attacks
- Normalizes paths for cross-platform compatibility
- Validates that operations stay within the allowed directory

### Error Handling
- Comprehensive error messages for failed operations
- Graceful handling of permission issues
- Proper cleanup of partial operations

### Cross-Platform Compatibility
- Handles Windows and Unix path separators
- Normalizes path formats automatically
- Works consistently across different operating systems

## Utility Functions

### `normalizePath(filePath)`
Normalizes and resolves file paths for cross-platform compatibility.

### `isPathSafe(filePath, baseDir)`
Validates that a file path is safe and doesn't try to escape the working directory.

### `getFileExtension(filePath)`
Returns the file extension (with dot) for a given path.

### `getFileNameWithoutExtension(filePath)`
Returns the filename without its extension.

## Benefits Over Shell Commands

1. **Better Error Handling**: More detailed and user-friendly error messages
2. **Cross-Platform**: Works consistently across Windows, macOS, and Linux
3. **Security**: Built-in path validation prevents directory traversal attacks
4. **Performance**: Direct file operations are faster than spawning shell processes
5. **Reliability**: No issues with shell escaping or command interpretation
6. **Atomic Operations**: File writes are atomic when possible

## Migration from Shell Commands

Instead of using shell commands like:
- `cat file.txt` → Use `read_file` tool
- `echo "content" > file.txt` → Use `write_file` tool
- `echo "content" >> file.txt` → Use `append_file` tool
- `ls -la directory/` → Use `list_files` tool with `showDetails: true`
- `test -f file.txt` → Use `check_file_exists` tool

The LLM will automatically choose the most appropriate tool for file operations, preferring the dedicated file tools over shell commands when possible.
