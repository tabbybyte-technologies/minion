import { USAGE, DEFAULT_VERSION, CLI_OPTIONS, BASE_PROMPT } from './constants.js';

/**
 * Main CLI application logic
 * Handles argument parsing, configuration, and LLM interaction
 */
export async function runCLI() {
  // Dynamic imports for runtime compatibility
  const { parseArgs } = await import('util');
  const ora = (await import('ora')).default;
  const { loadConfig } = await import('./config.js');
  const { createLLMClient } = await import('./llm.js');
  const { handleInput } = await import('./input.js');
  const { setupTools } = await import('./tools.js');
  const { getRuntimeInfo, logRuntimeInfo } = await import('./runtime-compat.js');
  const { readFile } = await import('fs/promises');

  // Load package.json for version info
  let version = DEFAULT_VERSION; // fallback version
  try {
    const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf-8'));
    version = packageJson.version;
  } catch (error) {
    // Fallback for compiled binaries where package.json might not be accessible
    if (!error.message.includes('/$bunfs/package.json')) {
      console.error('Warning: Could not read package.json:', error.message);
    }
  }

  try {
    const { values: args } = parseArgs({
      args: process.argv.slice(2),
      options: CLI_OPTIONS,
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

    // Prepare the full prompt
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
