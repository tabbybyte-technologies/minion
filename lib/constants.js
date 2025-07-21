export const USAGE = `
Usage: minion [OPTIONS]

A cross-runtime CLI tool for AI-powered command execution. 
Automatically detects and uses Bun for better performance when available, 
falls back to Node.js when Bun is not installed.

Options:
  -f, --file <path>    Read prompt from file instead of stdin
  -p, --prompt <text>  Provide prompt directly
  -c, --config <path>  Specify a config env file to load (overrides .env in current dir)
  -h, --help           Show this help message
  --dry-run            (Temporarily disabled)
  -v, --version        Show version information

Examples:
  echo "List all files in current directory" | minion
  minion -f prompt.txt
  minion --config custom.env
  # minion --dry-run < task.txt (feature disabled)

Config Priority (override order):
  1. Process environment variables
  2. File specified by --config
  3. .env in current directory

Environment Variables:
  MINION_PROVIDER           AI provider (openai, anthropic, google, local)
  MINION_OPENAI_API_KEY     OpenAI API key (required for OpenAI)
  MINION_OPENAI_MODEL       OpenAI model (default: gpt-4)
  MINION_ANTHROPIC_API_KEY  Anthropic API key (required for Anthropic)
  MINION_ANTHROPIC_MODEL    Anthropic model (default: claude-3-sonnet-20240229)
  MINION_GOOGLE_API_KEY     Google API key (required for Google)
  MINION_GOOGLE_MODEL       Google model (default: gemini-2.0-flash-lite)
  MINION_LOCAL_API_URL      Local LLM API URL (required for local)
  MINION_LOCAL_API_KEY      Local LLM API key (optional, default: 'local')
  MINION_LOCAL_MODEL        Local LLM model (default: llama2)
  MINION_DEBUG              Set to 1 to enable debug output
  MINION_TEMPERATURE        Set temperature for LLM (default: 0.7)
  MINION_MAX_STEPS          Max tool steps (default: 5)
`;

export const DEFAULT_VERSION = '1.2.0';

export const CLI_OPTIONS = {
  file: { type: 'string', short: 'f' },
  prompt: { type: 'string', short: 'p' },
  config: { type: 'string', short: 'c' },
  'print-config': { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
  'dry-run': { type: 'boolean' },
  version: { type: 'boolean', short: 'v' }
};

// Minion base prompt for agent behavior
export const BASE_PROMPT = `You are Minion, an advanced AI agent that helps users perform tasks efficiently and safely. Reason step-by-step, use available tools, and execute safe shell commands when needed.

Minion is best for small to medium ad hoc tasks. If a task is too complex, suggest breaking it down.


Guidelines:
- Use the tools and commands supplied to you for file and system operations
- Be clear and concise in explanations and output
- Visually separate explanations from final command output
- Ask for clarification if instructions are ambiguous
- Decline only truly dangerous or destructive actions, and suggest safer alternatives
- Summarize technical results for easy understanding
- Always consider system OS info supplied to you, for command compatibility

Goal: Help the user accomplish their task efficiently and safely.

User's request: `;
