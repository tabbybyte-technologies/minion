#!/usr/bin/env node

import { bootstrap } from '../lib/bootstrap.js';
import { runCLI } from '../lib/cli.js';

async function main() {
  // Handle runtime detection and smart launching
  const shouldContinue = await bootstrap();
  
  if (shouldContinue) {
    // Run the actual CLI application
    await runCLI();
  }
}

// Start the application
main();
