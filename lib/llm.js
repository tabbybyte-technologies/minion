import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

export function createLLMClient(config) {
  if (config.debug) console.log(`⚙️  Provider: ${config.provider.toLowerCase()}`);
  if (config.debug) console.log(`⚙️  Model: ${config.model}`);
  switch (config.provider.toLowerCase()) {
    case 'openai':
      return openai(config.model, {
        apiKey: config.apiKey, // MINION_OPENAI_API_KEY
        temperature: config.temperature,
      });
    case 'anthropic':
      return anthropic(config.model, {
        apiKey: config.apiKey, // MINION_ANTHROPIC_API_KEY
        temperature: config.temperature,
      });
    case 'google':
      return google(`models/${config.model}`, {
        apiKey: config.apiKey, // MINION_GOOGLE_API_KEY
        temperature: config.temperature,
      });
    case 'local':
      // Create a custom OpenAI-compatible client for local models
      const localClient = createOpenAI({
        baseURL: config.baseURL, // MINION_LOCAL_API_URL
        apiKey: config.apiKey,   // MINION_LOCAL_API_KEY
        temperature: config.temperature,
      });
      return localClient(config.model); // MINION_LOCAL_MODEL
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}
