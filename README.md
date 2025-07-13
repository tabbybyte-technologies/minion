# Minion 🤖

A Bun-based Node.js CLI tool for AI-powered command execution with built-in safety features.

## Prerequisites

- [Bun](https://bun.sh) runtime (install with: `curl -fsSL https://bun.sh/install | bash`)
- An API key for your chosen AI provider (OpenAI, Anthropic, or local LLM)

## Features

- 🔒 **Safe Command Execution**: Built-in allowlist and dangerous command detection
- 🤖 **Multiple AI Providers**: Support for OpenAI, Anthropic, and local LLM endpoints
- 🛡️ **Safety First**: Dry-run mode and comprehensive safety guardrails
- 🚀 **Cross-Platform**: Works on macOS, Linux, and Windows
- ⚡ **Fast**: Built with Bun for optimal performance
- 📦 **Modular**: Clean, composable architecture

## Installation

### Global Installation
```bash
# Using npm
npm install -g minion

# Using bun
bun install -g minion
```

### From Source
```bash
git clone <repository>
cd minion-tool
bun install
bun run build  # Creates a single executable binary
```

## Configuration

Create a `.env` file in your project directory or set environment variables:

```bash
# Required: Choose your AI provider
MINION_PROVIDER=openai  # or anthropic, local

# For OpenAI
MINION_OPENAI_API_KEY=your_api_key_here
MINION_OPENAI_MODEL=gpt-4  # optional, defaults to gpt-4

# For Anthropic
MINION_ANTHROPIC_API_KEY=your_api_key_here
MINION_ANTHROPIC_MODEL=claude-3-sonnet-20240229  # optional

# For Local LLM (OpenAI-compatible API)
MINION_LOCAL_API_URL=http://localhost:1234/v1
MINION_LOCAL_API_KEY=local  # optional
MINION_LOCAL_MODEL=llama2  # optional
```

## Usage

### Basic Usage
```bash
# From stdin
echo "List all files in the current directory" | minion

# From file
minion -f task.txt

# Directly from command line
minion -p "List all files in the current directory"

# Dry run mode (shows commands without executing)
minion --dry-run -p "List all files in the current directory"
minion --dry-run -f task.txt
```

### Examples

**File management:**
```bash
echo "Create a new directory called 'projects' and list its contents" | minion
```

**Development tasks:**
```bash
echo "Initialize a new npm project and install express" | minion
```

**System information:**
```bash
echo "Show me system information and current disk usage" | minion
```

**Git operations:**
```bash
echo "Check git status and show the last 3 commits" | minion
```

### Command Line Options

```
Usage: minion [OPTIONS]

Options:
  -p, --prompt <prompt> Specify the prompt directly on the command line
  -f, --file <path>    Read prompt from file instead of stdin
  -h, --help          Show this help message
  --dry-run           Show commands without executing them
  --version           Show version information
```

## Safety Features

### Command Allowlist
Only approved commands can be executed:
- File operations: `ls`, `cat`, `mkdir`, `cp`, `mv`, etc.
- Development tools: `git`, `npm`, `bun`, `docker`, etc.
- System utilities: `ps`, `df`, `ping`, etc.

### Dangerous Command Detection
Blocks potentially harmful commands:
- `rm -rf /` (recursive deletion)
- Fork bombs `:(){ :|:& };:`
- Direct device access
- System shutdown commands
- And more...

### Dry Run Mode
Use `--dry-run` to see what commands would be executed without actually running them.

## Architecture

```
minion/
├── bin/minion.js     # Main CLI entry point
├── lib/
│   ├── config.js     # Configuration and environment handling
│   ├── input.js      # Input handling (stdin/file)
│   ├── llm.js        # LLM client creation
│   └── tools.js      # Safe command execution tools
└── package.json      # Project configuration
```

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Build executable binary
bun run build

# Run tests
bun test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Security

This tool is designed with safety as a primary concern, but users should:
- Review commands before execution in production environments
- Use dry-run mode when testing new prompts
- Keep API keys secure and never commit them to version control
- Regularly update the tool to get the latest safety improvements

## Support

- 📖 [Documentation](README.md)
- 🐛 [Bug Reports](issues)
- 💡 [Feature Requests](issues)
- 💬 [Discussions](discussions)
