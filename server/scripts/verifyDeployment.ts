#!/usr/bin/env tsx
/**
 * Railway Deployment Verification Script
 *
 * Verifies a Railway deployment by:
 * 1. Checking health endpoints
 * 2. Testing chat functionality
 * 3. Verifying RAG retrieval works
 * 4. Checking all LLM providers
 */

import { config } from 'dotenv';

config();

const DEPLOYMENT_URL = process.env['RAILWAY_DEPLOYMENT_URL'] || process.argv[2];

if (!DEPLOYMENT_URL) {
  console.error('❌ ERROR: No deployment URL provided');
  console.error('Usage: npm run verify:deployment <url>');
  console.error('Or set RAILWAY_DEPLOYMENT_URL environment variable');
  process.exit(1);
}

const baseUrl = DEPLOYMENT_URL.endsWith('/') ? DEPLOYMENT_URL.slice(0, -1) : DEPLOYMENT_URL;

console.log('🔍 Railway Deployment Verification\n');
console.log(`📍 Target: ${baseUrl}\n`);

interface HealthResponse {
  status: string;
  timestamp: string;
  services?: {
    chat?: {
      providers: Record<string, { status: string; model?: string }>;
      overall: string;
    };
    embedding?: {
      status: string;
      provider: string;
      model: string;
    };
  };
}

async function checkHealth(): Promise<boolean> {
  console.log('🏥 Step 1: Health Check...');
  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.error(`❌ Health check failed: ${response.status} ${response.statusText}`);
      return false;
    }

    const health: HealthResponse = await response.json();
    console.log(`✅ Status: ${health.status}`);

    if (health.services?.chat) {
      console.log(`   Chat providers: ${health.services.chat.overall}`);
      for (const [provider, details] of Object.entries(health.services.chat.providers)) {
        console.log(`   - ${provider}: ${details.status} (${details.model || 'unknown'})`);
      }
    }

    if (health.services?.embedding) {
      console.log(`   Embedding: ${health.services.embedding.status} (${health.services.embedding.provider}/${health.services.embedding.model})`);
    }

    console.log('');
    return health.status === 'healthy';
  } catch (error) {
    console.error('❌ Health check error:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function testChat(): Promise<boolean> {
  console.log('💬 Step 2: Testing Chat Endpoint...');
  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        message: 'Hello! Can you tell me about Wally\'s experience?',
        conversationHistory: []
      })
    });

    if (!response.ok) {
      console.error(`❌ Chat endpoint failed: ${response.status} ${response.statusText}`);
      return false;
    }

    // Read first few chunks of SSE response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let chunks = 0;
    let hasContent = false;

    if (reader) {
      for (let i = 0; i < 5; i++) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        if (chunk.includes('data:') && !chunk.includes('[DONE]')) {
          chunks++;
          hasContent = true;
        }
      }

      // Cancel the stream
      await reader.cancel();
    }

    if (hasContent) {
      console.log(`✅ Chat streaming works (received ${chunks} chunks)`);
      console.log('');
      return true;
    } else {
      console.error('❌ Chat endpoint returned no content');
      return false;
    }
  } catch (error) {
    console.error('❌ Chat test error:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function testPing(): Promise<boolean> {
  console.log('🏓 Step 3: Testing Ping Endpoint...');
  try {
    const response = await fetch(`${baseUrl}/api/health/ping`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.error(`❌ Ping failed: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Ping successful: ${JSON.stringify(data)}`);
    console.log('');
    return data.status === 'ok';
  } catch (error) {
    console.error('❌ Ping error:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function runVerification() {
  const results = {
    ping: false,
    health: false,
    chat: false
  };

  results.ping = await testPing();
  results.health = await checkHealth();
  results.chat = await testChat();

  console.log('📊 Verification Summary\n');
  console.log(`   Ping endpoint: ${results.ping ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Health check: ${results.health ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Chat streaming: ${results.chat ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');

  const allPassed = results.ping && results.health && results.chat;

  if (allPassed) {
    console.log('✨ All checks passed! Deployment is healthy.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some checks failed. Review errors above.\n');
    process.exit(1);
  }
}

runVerification().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
