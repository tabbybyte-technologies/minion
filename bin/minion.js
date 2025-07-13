#!/usr/bin/env bun

import { parseArgs } from 'util';
import ora from 'ora';
import { readFile } from 'fs/promises';
import { stdin } from 'process';
import { loadConfig } from '../lib/config.js';
import { createLLMClient } from '../lib/llm.js';
import { handleInput } from '../lib/input.js';
import { setupTools } from '../lib/tools.js';
import { version } from '../package.json';

const USAGE = `
Usage: minion [OPTIONS]

A Bun-based CLI tool for AI-powered command execution.

Options:
  -f, --file <path>    Read prompt from file instead of stdin
  -p, --prompt <text>  Provide prompt directly
  -h, --help           Show this help message
  --dry-run            (Temporarily disabled)
  -v, --version        Show version information

Examples:
  echo "List all files in current directory" | minion
  minion -f prompt.txt
  # minion --dry-run < task.txt (feature disabled)

Environment Variables:
  PROVIDER            AI provider (openai, anthropic, local)
  OPENAI_API_KEY      OpenAI API key
  ANTHROPIC_API_KEY   Anthropic API key
  LOCAL_API_URL       Local LLM API URL
`;

async function main() {
  try {
    const { values: args } = parseArgs({
      args: process.argv.slice(2),
      options: {
        file: { type: 'string', short: 'f' },
        prompt: { type: 'string', short: 'p' },
        help: { type: 'boolean', short: 'h' },
        'dry-run': { type: 'boolean' }, // (Temporarily disabled)
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
    const config = await loadConfig();
    
    // Set dry-run mode (disabled)
    if (args['dry-run']) {
      console.error('The --dry-run feature is temporarily disabled and will not have any effect.');
    }
    config.dryRun = false;

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
