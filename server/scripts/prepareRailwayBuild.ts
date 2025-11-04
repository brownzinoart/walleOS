#!/usr/bin/env tsx
/**
 * Railway Build Preparation Script
 *
 * This script prepares the backend for Railway deployment by:
 * 1. Copying content.json from frontend to server/config/
 * 2. Verifying vector DB exists
 * 3. Running TypeScript compilation
 */

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverRoot = resolve(__dirname, '..');
const projectRoot = resolve(serverRoot, '..');

console.log('🚀 Railway Build Preparation\n');

// Step 1: Copy content.json
console.log('📋 Step 1: Copying content.json...');
const contentSource = resolve(projectRoot, 'src/config/content.json');
const contentDest = resolve(serverRoot, 'config/content.json');

if (!existsSync(contentSource)) {
  console.error(`❌ ERROR: content.json not found at ${contentSource}`);
  process.exit(1);
}

// Ensure config directory exists
const configDir = dirname(contentDest);
if (!existsSync(configDir)) {
  mkdirSync(configDir, { recursive: true });
}

copyFileSync(contentSource, contentDest);
console.log(`✅ Copied content.json to ${contentDest}\n`);

// Step 2: Verify vector DB exists
console.log('🗄️  Step 2: Verifying vector database...');
const vectorDbPath = resolve(serverRoot, 'data/vectordb');

if (!existsSync(vectorDbPath)) {
  console.error(`❌ ERROR: Vector database not found at ${vectorDbPath}`);
  console.error('   Run "npm run ingest:corpus" from project root to generate it.');
  process.exit(1);
}

console.log(`✅ Vector database found at ${vectorDbPath}\n`);

// Step 3: Run TypeScript compilation
console.log('🔨 Step 3: Compiling TypeScript...');
try {
  execSync('npm run build', {
    cwd: serverRoot,
    stdio: 'inherit'
  });
  console.log('✅ TypeScript compilation complete\n');
} catch (error) {
  console.error('❌ ERROR: TypeScript compilation failed');
  process.exit(1);
}

console.log('✨ Railway build preparation complete!');
