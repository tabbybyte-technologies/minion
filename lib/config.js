import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';


export async function loadConfig(configPath) {
  // Priority: process.env > --config file > .env in cwd
  // 1. Load .env in cwd (lowest priority)
  const localEnvPath = resolve(process.cwd(), '.env');
  if (existsSync(localEnvPath)) {
    config({ path: localEnvPath, override: false });
  }
  // 2. Load --config file (middle priority)
  if (configPath && existsSync(configPath)) {
    config({ path: configPath, override: true });
  }
  // 3. process.env is always present (highest priority)

  const provider = process.env.MINION_PROVIDER || 'openai';

  const configuration = {
    provider,
    // dryRun: false, // (Temporarily disabled)
    temperature: process.env.MINION_TEMPERATURE ? Number(process.env.MINION_TEMPERATURE) : 0.3,
    maxSteps: process.env.MINION_MAX_STEPS ? Number(process.env.MINION_MAX_STEPS) : 5,
    debug: process.env.MINION_DEBUG === 'true' || process.env.MINION_DEBUG === 'yes' || !!+process.env.DEBUG,
  };

  // Provider-specific configuration
  switch (provider.toLowerCase()) {
    case 'openai':
      if (!process.env.MINION_OPENAI_API_KEY) {
        throw new Error('MINION_OPENAI_API_KEY environment variable is required for OpenAI provider');
      }
      configuration.apiKey = process.env.MINION_OPENAI_API_KEY;
      configuration.model = process.env.MINION_OPENAI_MODEL || 'gpt-4';
      break;

    case 'anthropic':
      if (!process.env.MINION_ANTHROPIC_API_KEY) {
        throw new Error('MINION_ANTHROPIC_API_KEY environment variable is required for Anthropic provider');
      }
      configuration.apiKey = process.env.MINION_ANTHROPIC_API_KEY;
      configuration.model = process.env.MINION_ANTHROPIC_MODEL || 'claude-3-sonnet-20240229';
      break;

    case 'google':
      if (!process.env.MINION_GOOGLE_API_KEY) {
        throw new Error('MINION_GOOGLE_API_KEY environment variable is required for Google provider');
      }
      configuration.apiKey = process.env.MINION_GOOGLE_API_KEY;
      configuration.model = process.env.MINION_GOOGLE_MODEL || 'gemini-2.0-flash-lite';
      // Set the expected env variable for the SDK
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.MINION_GOOGLE_API_KEY;
      break;

    case 'local':
      if (!process.env.MINION_LOCAL_API_URL) {
        throw new Error('MINION_LOCAL_API_URL environment variable is required for local provider');
      }
      configuration.baseURL = process.env.MINION_LOCAL_API_URL;
      configuration.apiKey = process.env.MINION_LOCAL_API_KEY || 'local';
      configuration.model = process.env.MINION_LOCAL_MODEL || 'llama2';
      break;

    default:
      throw new Error(`Unsupported provider: ${provider}. Supported providers: openai, anthropic, google, local`);
  }

  return configuration;
}
