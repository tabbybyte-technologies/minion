#!/usr/bin/env node

import { parseArgs } from 'util';
import ora from 'ora';
import { stdin } from 'process';
import { loadConfig } from '../lib/config.js';
import { createLLMClient } from '../lib/llm.js';
import { handleInput } from '../lib/input.js';
import { setupTools } from '../lib/tools.js';
import { getRuntimeInfo, logRuntimeInfo } from '../lib/runtime-compat.js';
import { readFile } from 'fs/promises';

// Load package.json for version info
let version = '1.2.0'; // fallback version
try {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf-8'));
  version = packageJson.version;
} catch (error) {
  // Fallback for compiled binaries where package.json might not be accessible
  if (!error.message.includes('/$bunfs/package.json')) {
    console.error('Warning: Could not read package.json:', error.message);
  }
}

const USAGE = `
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

async function main() {
  try {
    const { values: args } = parseArgs({
      args: process.argv.slice(2),
      options: {
        file: { type: 'string', short: 'f' },
        prompt: { type: 'string', short: 'p' },
        config: { type: 'string', short: 'c' },
        'print-config': { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
        'dry-run': { type: 'boolean' },
        version: { type: 'boolean', short: 'v' }
      },
      allowPositionals: false
    });

    if (args.help) {
      console.log(USAGE);
      process.exit(0);
    }
    if (args.version) {
      console.log(`Minion version: ${version}`);
      process.exit(0);
    }

    // Load configuration
    const config = await loadConfig(args.config);
    
    if (args['print-config']) {
      // Always show runtime info for print-config command
      const runtimeInfo = getRuntimeInfo();
      console.log(`🚀 Runtime: ${runtimeInfo.runtime} ${runtimeInfo.version} (${runtimeInfo.platform}/${runtimeInfo.arch})`);
      
      // Mask API keys for display
      const safeConfig = { ...config };
      if (safeConfig.apiKey) safeConfig.apiKey = '***';
      if (safeConfig.baseURL) safeConfig.baseURL = safeConfig.baseURL;
      console.log('Loaded config:', JSON.stringify(safeConfig, null, 2));
      process.exit(0);
    }
    
    // Log runtime info if debug is enabled (only when not printing config)
    logRuntimeInfo(config.debug);

    // Get user input: --prompt, --file, or stdin
    let userPrompt = '';
    if (args.prompt) {
      userPrompt = args.prompt;
    } else {
      userPrompt = await handleInput(args.file);
    }
    if (!userPrompt.trim()) {
      console.error('Error: No prompt provided. Use -p/--prompt, -f/--file, or pipe input.');
      process.exit(1);
    }

    // Create LLM client
    const llm = createLLMClient(config);

    // Setup tools
    const tools = setupTools(config);

    // Import base prompt
    const { BASE_PROMPT } = await import('../lib/base_prompt.js');
    const osInfo = `System info: OS=${process.platform}`;
    const fullPrompt = `${BASE_PROMPT}${userPrompt}\n${osInfo}`;

    // Call the LLM with spinner
    const spinner = ora({ text: 'Processing your request...', spinner: 'dots' }).start();

    try {
      const { generateText } = await import('ai');
      const result = await generateText({
        model: llm,
        prompt: fullPrompt,
        tools: tools,
        maxSteps: config.maxSteps,
        temperature: config.temperature,
      });
      spinner.stop();

      console.log('\n✨', result.text);

      if (config.debug && result.toolResults && result.toolResults.length > 0) {
        console.log('\n📋 Tool execution summary:');
        result.toolResults.forEach((toolResult, index) => {
          console.log(`${index + 1}. ${toolResult.toolName}: ${toolResult.result}`);
        });
      }
    } catch (llmError) {
      spinner.stop();
      console.error('LLM Error:', llmError.message);
      process.exit(1);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
