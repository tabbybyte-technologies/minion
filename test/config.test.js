import { test, expect } from 'bun:test';
import { loadConfig } from '../lib/config.js';

test('config loads with default values', async () => {
  // Save original environment
  const originalEnv = { ...process.env };
  
  // Set a minimal environment for testing
  process.env.MINION_PROVIDER = 'openai';
  process.env.MINION_OPENAI_API_KEY = 'test-key';
  
  // Clear any conflicting env vars
  delete process.env.MINION_GOOGLE_API_KEY;
  delete process.env.MINION_ANTHROPIC_API_KEY;
  
  const config = await loadConfig();
  
  expect(config.provider).toBe('openai');
  expect(config.apiKey).toBe('test-key');
  expect(config.model).toBe('gpt-4');
  
  // Restore original environment
  process.env = originalEnv;
});

test('config throws error when required API key is missing', async () => {
  // Save original environment
  const originalEnv = { ...process.env };
  
  // Temporarily move .env file if it exists
  let envMoved = false;
  try {
    if (await Bun.file('.env').exists()) {
      await Bun.write('.env.test-backup', await Bun.file('.env').text());
      await Bun.write('.env', '');
      envMoved = true;
    }
  } catch {
    // .env doesn't exist, which is fine for this test
  }
  
  try {
    // Clear ALL relevant environment variables
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('MINION_')) {
        delete process.env[key];
      }
    });
    
    process.env.MINION_PROVIDER = 'openai';
    
    try {
      await loadConfig();
      expect.unreachable('Should have thrown an error');
    } catch (error) {
      expect(error.message).toContain('MINION_OPENAI_API_KEY environment variable is required');
    }
  } finally {
    // Restore .env file if we moved it
    if (envMoved) {
      try {
        await Bun.write('.env', await Bun.file('.env.test-backup').text());
      } catch {
        // Ignore errors restoring
      }
    }
    
    // Restore original environment
    process.env = originalEnv;
  }
});
