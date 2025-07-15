# Minion 🤖

A Bun-based Node.js CLI tool for AI-powered command execution with built-in safety features.

> **Note:** Minion is intended for quick execution of small to medium _ad hoc_ tasks on the command line, not for large or complex projects.

## Prerequisites

- [Bun](https://bun.sh) runtime (install with: `curl -fsSL https://bun.sh/install | bash`)
- An API key for your chosen AI provider (OpenAI, Anthropic, Google Generative AI, or local LLM)

## Features

- 🔒 **Safe Command Execution**: Built-in allowlist and dangerous command detection
- 🤖 **Multiple AI Providers**: Support for OpenAI, Anthropic, Google Generative AI, and local LLM endpoints
- 🛡️ **Safety First**: Comprehensive safety guardrails
- 🚀 **Cross-Platform**: Works on macOS, Linux, and Windows
- ⚡ **Fast**: Built with Bun for optimal performance
- 📦 **Modular**: Clean, composable architecture

## Installation

### Global Installation
```bash
# Using npm
npm install -g @tabbybyte/minion

# Using bun
bun install -g @tabbybyte/minion
```

### From Source
```bash
# Clone the repository
git clone https://github.com/tabbybyte-technologies/minion
cd minion

# Install dependencies
bun install

# Run the tool directly (requires flags or input)
bun run dev -p "List all files in the current directory"

# Optional: Build a single executable binary
bun run build
```

## Configuration

Minion uses environment variables for configuration, which can be set at runtime by placing a `.env` file in the current directory or specifying a custom configuration file using the `--config` flag (or its shortcut `-c`). The required and optional environment variable names are detailed in the `env.SAMPLE` file included in the repository. These names can also be seen in the `--help` output of the CLI.

### Setting Configuration

#### Using `.env` File
Place a `.env` file in the current directory with the following variables:

```bash
# Required: Choose your AI provider
MINION_PROVIDER=openai  # or anthropic, google, local

# For OpenAI
MINION_OPENAI_API_KEY=your_api_key_here
MINION_OPENAI_MODEL=gpt-4  # Default: gpt-4

# For Anthropic
MINION_ANTHROPIC_API_KEY=your_api_key_here
MINION_ANTHROPIC_MODEL=claude-3-sonnet-20240229  # Default: claude-3-sonnet-20240229

# For Google Generative AI
MINION_GOOGLE_API_KEY=your_api_key_here
MINION_GOOGLE_MODEL=gemini-2.0-flash-lite  # Default: gemini-2.0-flash-lite

# For Local LLM (OpenAI-compatible API)
MINION_LOCAL_API_URL=http://localhost:1234/v1
MINION_LOCAL_API_KEY=local  # Optional, default: 'local'
MINION_LOCAL_MODEL=llama2  # Default: llama2

# Optional: Debugging
MINION_DEBUG=1  # Set to 1 to enable debug output

# Optional: LLM Configuration
MINION_TEMPERATURE=0.7  # Set temperature for LLM (default: 0.7)
MINION_MAX_STEPS=5  # Max tool steps (default: 5)
```

#### Using `--config` Flag
You can specify a custom configuration file using the `--config` flag or its shortcut `-c`. This overrides the `.env` file in the current directory.

```bash
minion -c /path/to/custom-config.env
```

Refer to `env.SAMPLE` for a complete list of supported environment variables.

## Usage

### Basic Usage
```bash
# From stdin
echo "List all files in the current directory" | minion

# From file
minion -f task.txt

# Directly from command line
minion -p "List all files in the current directory"

<!-- Dry run mode is temporarily disabled -->
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
  -f, --file <path>      Read prompt from file instead of stdin
  -c, --config <path>    Specify a config env file to load (overrides .env in current dir)
  --print-config         Print loaded config and exit
  -h, --help             Show this help message
  --dry-run              (Temporarily disabled)
  --version, -v          Show version information
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
**Temporarily Disabled**
The `--dry-run` feature is currently disabled and will not have any effect. It will be re-enabled in a future release.

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
bun run dev -p "What is the date today?"

# Build executable binary
bun run build

# Run tests (Coming Soon...)
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
<!-- Dry-run mode is temporarily disabled -->
- Keep API keys secure and never commit them to version control
- Regularly update the tool to get the latest safety improvements

## Support

For help, feedback, or to report issues, please use the following resources:

- 📖 [Documentation](https://github.com/tabbybyte-technologies/minion#readme)
- 🐛 [Bug Reports](https://github.com/tabbybyte-technologies/minion/issues)
- 💡 [Feature Requests](https://github.com/tabbybyte-technologies/minion/issues)
- ✉️ [Email: hello.tabbybytes@gmail.com](mailto:hello.tabbybytes@gmail.com)

## Changelog

### v1.1.0

- refactor: use Bun specific api-s wherever possible for perf ([5b4b7d7], Sayan Riju Chakrabarti, 2025-07-15)
- feat: implement safe file tools for use by LLM ([5f6d75b], Sayan Riju Chakrabarti, 2025-07-15)
- feat: add support for custom configuration files and printing config ([95b40ca], Sayan Riju Chakrabarti, 2025-07-15)

---
*Changelogs are updated for every major or minor release. Patch releases are not included.*
