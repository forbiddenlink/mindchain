# MindChain AI Copilot Instructions

## Project Overview
MindChain is a **real-time multi-agent AI debate engine** built for the Redis AI Challenge. It simulates political debates between AI agents with persistent personalities, memory, and fact-checking capabilities using all 4 Redis data models simultaneously.

**🏆 STATUS: PRODUCTION-READY CONTEST SYSTEM**
- ✅ Express.js + WebSocket server with concurrent debate support
- ✅ React 19 + Vite frontend with 3-mode navigation system  
- ✅ Redis multi-model integration (JSON, Streams, TimeSeries, Vector)
- ✅ GPT-4 AI agents with memory-driven responses and stance evolution
- ✅ Real-time vector-based fact-checking with OpenAI embeddings
- ✅ Semantic caching system with 85% similarity threshold (MAJOR SHOWCASE)
- ✅ Professional UI with 47+ Lucide React icons (contest-ready)

## Critical Architecture Patterns

### Multi-Model Redis Usage (ESSENTIAL)
The system simultaneously uses all 4 Redis data models - understanding this is crucial:

```javascript
// Agent profiles (RedisJSON) - persistent personality data
const profile = await client.json.get(`agent:${agentId}:profile`);
// Contains: name, role, tone, stance (numeric positions), biases

// Debate messages (Streams) - real-time messaging with WebSocket broadcast
await client.xAdd(`debate:${debateId}:messages`, '*', {agent_id, message});
// Private memories: `debate:${debateId}:agent:${agentId}:memory`

// Stance evolution (TimeSeries) - tracks opinion changes over time
await client.ts.add(`debate:${debateId}:agent:${agentId}:stance:${topic}`, '*', newStance);

// Vector facts (Hash + Vector) - semantic fact-checking with embeddings
const vector = Buffer.from(new Float32Array(embedding).buffer);
await client.hSet(`fact:${factId}`, {content, vector});

// Semantic cache (Hash + Vector) - AI response caching with similarity search
const cacheKey = `cache:prompt:${hash}`;
await client.hSet(cacheKey, {content: prompt, response, vector: vectorBuffer});
// Cache metrics stored in RedisJSON: cache:metrics
```

### WebSocket Message Flow (CORE SYSTEM)
The server broadcasts structured messages to all clients:
```javascript
broadcast({
  type: 'new_message',
  debateId, agentId, message, timestamp,
  factCheck: {fact, score}, // from vector search
  metrics: {totalMessages, activeDebates}
});
```

React components listen via `useWebSocket` hook and update state accordingly.

### Agent AI Generation Pattern
1. **Check semantic cache** for similar prompts (85% threshold)
2. Fetch agent profile from RedisJSON for personality context
3. Retrieve conversation history from Redis Streams for memory
4. Generate response using GPT-4 with enhanced prompts (if cache miss)
5. **Cache new response** with embeddings for future similarity matching
6. Fact-check against vector database (`findClosestFact`)
7. Update stance in TimeSeries based on debate dynamics
8. Store message in Streams and broadcast via WebSocket

## Essential Development Workflow

### Initial Setup (REQUIRED SEQUENCE)
```bash
# 1. Install dependencies
pnpm install

# 2. Create Redis vector indices (MUST run first)
node vectorsearch.js
node setupCacheIndex.js

# 3. Initialize agent profiles
node index.js         # Creates SenatorBot
node addReformer.js   # Creates ReformerBot

# 4. Start backend server
node server.js        # Port 3001

# 5. Start frontend (separate terminal)
cd mindchain-frontend && pnpm dev  # Port 5173
```

### Key Files & Their Purpose
- `server.js` - Main Express + WebSocket server with all API endpoints
- `generateMessage.js` - AI message generation with semantic caching integration
- `semanticCache.js` - Redis Vector-powered prompt caching system (MAJOR SHOWCASE)
- `setupCacheIndex.js` - Cache vector index initialization for similarity search
- `enhancedAI.js` - Advanced AI with emotional state, coalition building, similarity checking
- `factChecker.js` - Vector-based fact verification against knowledge base
- `vectorsearch.js` - Creates Redis vector index (run once during setup)
- `App.jsx` - React app with 3-mode navigation (Standard/Multi-Debate/Analytics)

### Multi-Debate System Architecture
The system supports concurrent debates via `activeDebates` Map:
```javascript
// Track multiple debates simultaneously
const activeDebates = new Map(); // debateId -> {topic, agents, startTime, messageCount}

// Frontend filters messages by debateId for proper separation
const getFilteredMessages = () => {
  if (viewMode === 'standard') {
    return debateMessages.filter(msg => msg.debateId === currentDebateId);
  }
  return debateMessages; // Show all in multi-debate mode
};
```

### Topic-to-Stance Mapping (IMPORTANT)
Topics from frontend dropdowns map to agent profile stance keys via `topicToStanceKey()`:
```javascript
'environmental regulations' → 'climate_policy'
'artificial intelligence governance' → 'ai_policy'  
'universal healthcare' → 'healthcare_policy'
// Affects agent personality and position evolution
```

## Critical Implementation Patterns

### Redis Connection Pattern (ALWAYS use this)
```javascript
import { createClient } from 'redis';
const client = createClient({ url: process.env.REDIS_URL });
await client.connect();
// Always quit client when done
await client.quit();
```

### Vector Operations (Buffer conversion required)
```javascript
const vector = Buffer.from(new Float32Array(embedding).buffer);
await client.hSet(`fact:${factId}`, {content, vector});
```

### Message Flow Pattern
1. Generate response with `generateMessage(agentId, debateId, topic)` or `generateEnhancedMessage()`
2. Store in shared stream: `client.xAdd('debate:{id}:messages', '*', {agent_id, message})`
3. Store in private memory: `client.xAdd('debate:{id}:agent:{id}:memory', '*', {type, content})`
4. Fact-check with `findClosestFact(message)`
5. Broadcast via WebSocket: `broadcast({type: 'new_message', ...})`

### Frontend Component Architecture
```javascript
// 3-Mode Navigation System
'standard' - Single debate with fact-checker sidebar
'multi-debate' - TrueMultiDebateViewer for concurrent debates  
'analytics' - EnhancedPerformanceDashboard with Redis metrics

// Message filtering by debate ID
const getFilteredMessages = () => {
  if (viewMode === 'standard') {
    return debateMessages.filter(msg => msg.debateId === currentDebateId);
  }
  return debateMessages; // All messages for multi-debate
};
```

### Enhanced AI Features (use `enhancedAI.js`)
- Similarity checking prevents repetitive responses
- Emotional state determination: 'frustrated', 'encouraged', 'analytical'
- Coalition building based on stance similarity within 0.3 range
- Dynamic stance evolution with personality resistance factors

## Critical Dependencies & Environment
- `redis@5.6.1` with all modules (JSON, Streams, TimeSeries, Vector) enabled
- `openai@5.10.2` for GPT-4 completions and text-embedding-ada-002
- `@langchain/openai@0.6.3` for embeddings abstraction
- `lucide-react@0.263.1` for professional icon system (47+ icons)
- React 19 with Vite 7 for frontend development
- Environment variables: `REDIS_URL`, `OPENAI_API_KEY`

## Testing & Debugging
- Use `node index.js` to verify Redis connectivity and create SenatorBot
- Test individual modules: `node factChecker.js "climate change"`
- Vector search setup: `node vectorsearch.js` (creates `facts-index`)
- Check Redis keys with RedisInsight or CLI
- Frontend WebSocket: Connect to `ws://localhost:3001` or `ws://127.0.0.1:3001`

## Redis Challenge Contest Focus
Built for Redis AI Challenge demonstrating all 4 Redis data models in a single application:
- **Real-Time AI Innovation**: Multi-agent debates with memory and fact-checking
- **Beyond the Cache**: Complex data modeling, vector search, time-series tracking
- **Live Demo Ready**: Professional UI, concurrent debates, performance analytics
- **Contest Deadline**: August 10, 2025 - Production-ready system
