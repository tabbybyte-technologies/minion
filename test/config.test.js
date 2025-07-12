import { test, expect } from 'bun:test';
import { loadConfig } from '../lib/config.js';

test('config loads with default values', async () => {
  // Set a minimal environment for testing
  process.env.PROVIDER = 'openai';
  process.env.OPENAI_API_KEY = 'test-key';
  
  const config = await loadConfig();
  
  expect(config.provider).toBe('openai');
  expect(config.apiKey).toBe('test-key');
  expect(config.model).toBe('gpt-4');
});

test('config throws error when required API key is missing', async () => {
  // Clear environment variables
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.LOCAL_API_URL;
  
  process.env.PROVIDER = 'openai';
  
  expect(async () => {
    await loadConfig();
  }).toThrow('OPENAI_API_KEY environment variable is required');
});
