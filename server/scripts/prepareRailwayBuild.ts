#!/usr/bin/env tsx
/**
 * Railway Build Preparation Script
 *
 * This script prepares the backend for Railway deployment by:
 * 1. Verifying content.json exists at server/config/ (or copying from src/ if local)
 * 2. Verifying vector DB exists at server/data/vectordb/
 * 3. Running TypeScript compilation
 *
 * Note: For Railway deployment, both content.json and vectordb should be
 * committed to the repository at server/config/ and server/data/vectordb/
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

// Step 1: Verify or copy content.json
console.log('📋 Step 1: Verifying content.json...');
const contentDest = resolve(serverRoot, 'config/content.json');
const contentSource = resolve(projectRoot, 'src/config/content.json');

// Check if content.json already exists (committed to repo for Railway)
if (existsSync(contentDest)) {
  console.log(`✅ content.json found at ${contentDest}\n`);
} else {
  // Try to copy from parent project (for local builds)
  console.log(
    '⚠️  content.json not found in server/config/, attempting to copy from src/...'
  );

  if (!existsSync(contentSource)) {
    console.error(`❌ ERROR: content.json not found at ${contentSource}`);
    console.error(
      '   For Railway deployment, content.json must be committed to server/config/'
    );
    process.exit(1);
  }

  // Ensure config directory exists
  const configDir = dirname(contentDest);
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  copyFileSync(contentSource, contentDest);
  console.log(`✅ Copied content.json to ${contentDest}\n`);
}

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
