Scaffold a Bun-based Node.js CLI tool called `minion` (JavaScript only - ESM):

- Read a prompt from stdin or from a file using `-f` flag
- Use the Vercel AI SDK core to call an LLM (OpenAI, Anthropic, or local) based on environment variables
  - Use `.env` file in the current directory to load settings (e.g., `PROVIDER=openai`, `OPENAI_API_KEY`, etc.). If no `.env` file is found, use the process environment variables.
  - Provide the LLM with a base system prompt that defines its role and capabilities
  - The user's prompt should be appended to this base prompt
  - Define a single tool: `run_safe_command(command: string)`
  - This should safely execute shell commands using `child_process.spawn`
  - Handle stdout, stderr, and exit code cleanly
  - Use an allowlist or dry-run mode for safety
  - Guardrails against dangerous commands like `rm -rf /` or `:(){ :|:& };:` (fork bomb)
  - Register this tool via the `tools:` field in the Vercel AI SDK call
  - Make the code modular using separate `lib/` files (e.g., for input handling, LLM interface, tool execution, etc.)
  - Use `bun` for the runtime and package management
  - The tool should handle errors gracefully and provide helpful output
  - CLI arguments should be parsed well in particular, with a usage message on using the `--help` or `-h` flags
  - The tool should be cross platform, so use Bun bulitin-s wherever applicable

  I would like this to be a proper cli tool (so use bin/ as per conventions) installable by `npm i -g minion` or `bun i -g minion`. But still, add a build script using `bun build --compile` for creating a single executable binary.

Keep everything minimal, safe, and composable in a Unix-style one-shot CLI.
