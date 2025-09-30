#!/bin/bash
set -e

echo "🧹 Cleaning previous build artifacts..."
rm -rf .next

echo "🔨 Running production build test..."
npm run build

echo "✅ Production build test passed! Ready for Netlify deployment."
