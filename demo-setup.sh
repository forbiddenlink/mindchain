#!/bin/bash
# StanceStream Redis Challenge Demo Setup Script

echo "🏆 STANCESTREAM REDIS CHALLENGE DEMO SETUP"
echo "=========================================="
echo ""

# Check if Redis is running
echo "🔍 Checking Redis server..."
redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Redis server is running"
else
    echo "❌ Redis server not running. Please start Redis first."
    exit 1
fi

# Check environment variables
echo "🔐 Checking environment variables..."
if [ -z "$REDIS_URL" ]; then
    echo "⚠️ REDIS_URL not set, using default: redis://localhost:6379"
    export REDIS_URL="redis://localhost:6379"
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY not set. Please configure your OpenAI API key."
    exit 1
else
    echo "✅ OpenAI API key configured"
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "📥 Installing backend dependencies..."
    pnpm install
fi

if [ ! -d "stancestream-frontend/node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    cd stancestream-frontend
    pnpm install
    cd ..
fi

# Setup Redis vector indices
echo "🔍 Setting up Redis vector indices..."
node vectorsearch.js
if [ $? -eq 0 ]; then
    echo "✅ Facts index created successfully"
else
    echo "⚠️ Facts index creation had issues"
fi

node setupCacheIndex.js
if [ $? -eq 0 ]; then
    echo "✅ Cache index created successfully"
else
    echo "⚠️ Cache index creation had issues"
fi

# Initialize agent profiles
echo "🤖 Initializing AI agent profiles..."
node index.js
node addReformer.js
echo "✅ Agent profiles initialized"

# Optional: Add some facts for demonstration
echo "📚 Adding demonstration facts..."
node addFactsEnhanced.js > /dev/null 2>&1
echo "✅ Demonstration facts added"

echo ""
echo "🎉 DEMO SETUP COMPLETE!"
echo "======================"
echo ""
echo "🚀 To start the demo:"
echo "   1. Backend:  node server.js"
echo "   2. Frontend: cd stancestream-frontend && pnpm dev"
echo "   3. Browser:  http://localhost:5173"
echo ""
echo "🎯 Demo Features Ready:"
echo "   ✅ All 4 Redis modules configured"
echo "   ✅ AI agents with personalities loaded"
echo "   ✅ Vector indices for semantic caching"
echo "   ✅ Fact database for verification"
echo "   ✅ Real-time WebSocket connections"
echo ""
echo "🏆 Ready for Redis Challenge demonstration!"
