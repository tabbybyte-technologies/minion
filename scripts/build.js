#!/usr/bin/env node

/**
 * Smart build script that detects available runtime and builds accordingly
 */

import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

function detectBun() {
  try {
    execSync('bun --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function detectNode() {
  try {
    execSync('node --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function buildWithBun() {
  console.log('🚀 Building with Bun (optimized binary)...');
  try {
    execSync('bun build --compile --minify --sourcemap ./bin/minion.js --outfile minion', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ Bun build completed successfully!');
    console.log('📦 Single executable binary created: ./minion');
  } catch (error) {
    console.error('❌ Bun build failed:', error.message);
    process.exit(1);
  }
}

function buildWithNode() {
  console.log('📦 Building with Node.js (package validation)...');
  try {
    // For Node.js, we don't create a single binary, just validate the package works
    execSync('node ./bin/minion.js --version', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ Node.js package validation completed successfully!');
    console.log('📦 Package ready for npm distribution');
    console.log('💡 Note: Node.js cannot create single executable binaries');
    console.log('💡 Tip: Install Bun for single-executable binary builds');
  } catch (error) {
    console.error('❌ Node.js package validation failed:', error.message);
    process.exit(1);
  }
}

function main() {
  console.log('🔍 Detecting available runtime...');
  
  const hasBun = detectBun();
  const hasNode = detectNode();
  
  if (!hasNode) {
    console.error('❌ Node.js is required but not found');
    process.exit(1);
  }
  
  if (hasBun) {
    console.log('✅ Detected: Bun (preferred for builds)');
    buildWithBun();
  } else {
    console.log('✅ Detected: Node.js only');
    buildWithNode();
  }
}

main();
