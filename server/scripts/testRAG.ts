#!/usr/bin/env tsx

import { retrieveContext, getRAGServiceHealth, retrieveNarrativeContext, retrieveFactualContext } from '../services/ragService.js';

/**
 * Test RAG retrieval functionality
 */
async function testRAG(): Promise<void> {
  console.log('🧪 Testing RAG System\n');

  try {
    // Test 1: Health check
    console.log('1. Testing RAG service health...');
    const health = await getRAGServiceHealth();
    console.log(`   ✅ RAG Service: ${health.healthy ? 'Healthy' : 'Unhealthy'}`);
    console.log(`   ✅ Vector Store: ${health.vectorStoreReady ? 'Ready' : 'Not Ready'}`);
    console.log(`   📊 Total Chunks: ${health.totalChunks || 0}`);
    console.log(`   📂 Categories: ${JSON.stringify(health.categories || {}, null, 2)}\n`);

    if (!health.healthy || !health.vectorStoreReady) {
      console.log('❌ RAG service is not ready. Please run corpus ingestion first.');
      return;
    }

    // Test 2: General query
    console.log('2. Testing general query retrieval...');
    const generalQuery = 'Tell me about Wally\'s experience with AI and machine learning';
    const generalResult = await retrieveContext({
      query: generalQuery,
      topK: 3,
      includeMetadata: true,
    });

    console.log(`   Query: "${generalQuery}"`);
    console.log(`   Results found: ${generalResult.results.length}`);
    console.log(`   Processing time: ${generalResult.processingTimeMs}ms`);
    
    for (const result of generalResult.results) {
      console.log(`   - [${result.category}] Score: ${result.score.toFixed(3)} | Source: ${result.source}`);
      console.log(`     Content: ${result.content.substring(0, 100)}...`);
    }
    console.log();

    // Test 3: Narrative context (for tone)
    console.log('3. Testing narrative context retrieval...');
    const narrativeResult = await retrieveNarrativeContext('voice tone style communication');
    console.log(`   Narrative results: ${narrativeResult.results.length}`);
    console.log(`   Processing time: ${narrativeResult.processingTimeMs}ms`);
    
    if (narrativeResult.results.length > 0) {
      console.log(`   Top result: [${narrativeResult.results[0].category}] Score: ${narrativeResult.results[0].score.toFixed(3)}`);
      console.log(`   Content: ${narrativeResult.results[0].content.substring(0, 150)}...`);
    }
    console.log();

    // Test 4: Factual context (portfolio/experience)
    console.log('4. Testing factual context retrieval...');
    const factualResult = await retrieveFactualContext('portfolio projects achievements');
    console.log(`   Factual results: ${factualResult.results.length}`);
    console.log(`   Processing time: ${factualResult.processingTimeMs}ms`);
    
    for (const result of factualResult.results) {
      console.log(`   - [${result.category}] Score: ${result.score.toFixed(3)} | Source: ${result.source}`);
    }
    console.log();

    // Test 5: Category-specific query
    console.log('5. Testing category-specific query...');
    const skillsQuery = 'What programming languages and technologies does Wally know?';
    const skillsResult = await retrieveContext({
      query: skillsQuery,
      categoryFilter: ['skills', 'experience'],
      topK: 2,
    });

    console.log(`   Query: "${skillsQuery}"`);
    console.log(`   Results found: ${skillsResult.results.length}`);
    
    for (const result of skillsResult.results) {
      console.log(`   - [${result.category}] Score: ${result.score.toFixed(3)}`);
      console.log(`     Content: ${result.content.substring(0, 120)}...`);
    }
    console.log();

    // Test 6: Context building
    console.log('6. Testing context building...');
    const contextQuery = 'leadership experience and management style';
    const contextResult = await retrieveContext({
      query: contextQuery,
      topK: 3,
    });

    console.log(`   Query: "${contextQuery}"`);
    console.log(`   Context length: ${contextResult.context.length} characters`);
    console.log(`   Context preview:`);
    console.log(`   ${contextResult.context.substring(0, 200)}...`);
    console.log();

    console.log('✅ RAG testing completed successfully!');

  } catch (error) {
    console.error('❌ RAG testing failed:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

/**
 * CLI interface
 */
async function main(): Promise<void> {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Usage: tsx testRAG.ts

Test the RAG (Retrieval-Augmented Generation) system functionality.

This script tests:
- RAG service health
- General query retrieval
- Narrative context retrieval (for tone)
- Factual context retrieval (for content)
- Category-specific queries
- Context building for prompts

Make sure to run corpus ingestion first:
  npm run ingest
    `);
    process.exit(0);
  }

  await testRAG();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { testRAG };
