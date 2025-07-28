# MindChain AI Copilot Instructions

## Project Overview
MindChain is a real-time multi-agent AI debate engine built for the Redis AI Challenge. It simulates political debates between AI agents with persistent personalities, memory, and fact-checking capabilities.

**🏆 CURRENT STATUS: FULLY FUNCTIONAL REAL-TIME SYSTEM - LATEST UPDATES**
- ✅ Express.js API server with WebSocket support (`server.js`)
- ✅ React frontend with live updates (`mindchain-frontend/`)
- ✅ Redis multi-model integration (JSON, Streams, TimeSeries, Vector)
- ✅ AI agent simulation with GPT-4 and OpenAI embeddings
- ✅ Real-time fact-checking pipeline
- ✅ Interactive debate controls and monitoring
- ✅ **NEW: 3-Mode Navigation System** - Standard, Multi-Debate, and Analytics views
- ✅ **FIXED: Layout Overlap Issues** - Clean, responsive interface design
- ✅ **ENHANCED: Context-Aware Controls** - Interface adapts to current view mode
- ✅ **OPTIMIZED: Multi-Debate Focus** - Debates center stage without UI clutter
- ✅ **ENHANCED: Topic Selection** - 8+ predefined topics + custom creation
- ✅ **ENHANCED: Performance Dashboard** - Dedicated Analytics mode with Redis metrics
- ✅ **ENHANCED: Debate History Browser** - Navigate past debates with Streams

## Architecture

### Redis Multi-Model Database (Core)
This project extensively uses Redis modules with specific key patterns:

- **RedisJSON**: Agent profiles at `agent:{id}:profile`
- **Redis Streams**: Debate messages at `debate:{id}:messages` and private memories at `debate:{id}:agent:{id}:memory`
- **RedisTimeSeries**: Stance evolution at `debate:{id}:agent:{id}:stance:{topic}`
- **Redis Vector**: Fact embeddings at `fact:{hash}` with `facts-index` for semantic search

### Agent System
Each agent has a persistent JSON profile with `name`, `role`, `tone`, `stance` (numeric positions), and `biases`. Agents generate contextual responses using OpenAI GPT-4 and store both public messages and private thoughts.

### Fact-Checking Pipeline
1. Facts are embedded using OpenAI and stored as Redis hashes with vector embeddings
2. Agent statements are semantically compared against the fact database using COSINE similarity
3. Results include both content and confidence scores

## Key Development Patterns

### Redis Connection Pattern
```javascript
import { createClient } from 'redis';
const client = createClient({ url: process.env.REDIS_URL });
await client.connect();
// Always quit client when done
await client.quit();
```

### Agent Profile Access
```javascript
const profile = await client.json.get(`agent:${agentId}:profile`);
// Use profile.stance, profile.biases, profile.tone for OpenAI prompts
```

### Message Flow
1. Generate response with `generateMessage(agentId, debateId, topic)` - **NOW WITH TOPIC PARAMETER**
2. Store in shared stream: `client.xAdd('debate:{id}:messages', '*', {agent_id, message})`
3. Store in private memory: `client.xAdd('debate:{id}:agent:{id}:memory', '*', {type, content})`
4. Fact-check with `findClosestFact(message)`

### Vector Operations
Always use Buffer conversion for embeddings:
```javascript
const vector = Buffer.from(new Float32Array(embedding).buffer);
```

## Development Workflow

### Backend Setup
1. Ensure `.env` contains `REDIS_URL` and `OPENAI_API_KEY`
2. Run `node vectorsearch.js` to create the facts index
3. Run `node addFacts.js` to populate fact database
4. Test with `node simulateDebate.js`

### Frontend (React + Vite)
- Located in `mindchain-frontend/`
- Uses Tailwind CSS with dark theme (bg-gray-950)
- **✅ 3-MODE NAVIGATION**: Standard (single), Multi-Debate (concurrent), Analytics (metrics)
- **✅ FIXED LAYOUT OVERLAPS**: Clean vertical stack layout preventing UI conflicts
- **✅ CONTEXT-AWARE CONTROLS**: Interface adapts based on current view mode
- **✅ TOPIC SELECTION**: Dropdown with 8+ predefined topics + inline custom creation
- **✅ RESPONSIVE DESIGN**: Works properly on all screen sizes without overlapping
- Components: Header, DebatePanel, FactChecker, EnhancedControls, TrueMultiDebateViewer, EnhancedPerformanceDashboard
- Run with `npm run dev` (port 5173)
- **✅ CONNECTED TO BACKEND** - Real-time WebSocket integration complete
- **✅ INTERACTIVE CONTROLS** - Start debates, view live messages, fact-checking

### Contest Implementation Status - COMPLETED ✅
1. **✅ WebSocket/SSE connection** for real-time frontend updates
2. **✅ Express.js API layer** with endpoints:
   - `POST /api/debate/start` - trigger new debates with topic selection
   - `POST /api/debate/:id/stop` - stop running debates (FIXED)
   - `GET /api/debate/:id/messages` - get debate history
   - `GET /api/agent/:id/profile` - agent personality data
   - `POST /api/agent/:id/update` - modify agent properties
   - `GET /api/health` - system health check
   - `GET /api/stats/redis` - Redis performance metrics
   - `POST /api/facts/add` - add facts to knowledge base
   - `POST /api/debate/:id/summarize` - AI-powered debate summaries
3. **✅ Interactive controls** for judge demonstrations
4. **✅ Real-time visualization** showing Redis module usage

## Critical Dependencies
- `redis@5.6.1` with all modules enabled
- `openai@5.10.2` for completions
- `@langchain/openai@0.6.3` for embeddings
- React 19 with Vite 7 for frontend

## Testing & Debugging
- Use `node index.js` for basic Redis connectivity
- Individual modules can be tested standalone (e.g., `node factChecker.js "climate change"`)
- Check Redis keys with RedisInsight or CLI
- Frontend mock data exists in components for UI development

## Redis Challenge Context
This project targets both "Real-Time AI Innovators" and "Beyond the Cache" prompts, showcasing Redis beyond caching through multi-modal data storage, real-time streams, vector search, and time-series tracking for AI agent simulation.

**Contest Deadline: August 10, 2025** - Focus on high-impact features that demonstrate Redis capabilities and provide compelling user experience.

## Winning Strategy Priorities - COMPLETED ✅

### 1. Advanced Demo Features (High Impact) - COMPLETED
- ✅ Multiple debate topics (8+ predefined + custom topics)
- ✅ Live agent configuration UI (personalities, biases, stances)
- ✅ Debate history browser using Redis Streams navigation
- ✅ Performance dashboard showing Redis metrics and operations/sec
- ✅ Topic selection system with dynamic AI responses
- ✅ Functional stop button with proper API integration

### 2. Enhanced Agent Intelligence - COMPLETED
- ✅ Memory-driven responses referencing past debates
- ✅ Topic-aware AI generation with GPT-4
- ✅ Dynamic fact base expansion during debates
- ✅ Real-time stance tracking with TimeSeries

### 3. Redis Performance Showcase - COMPLETED
- ✅ Real-time analytics showing all 4 Redis modules working together
- ✅ Interactive performance dashboard with live metrics
- ✅ Advanced vector search with OpenAI embeddings
- ✅ Multi-debate processing demonstration capabilities
- Performance dashboard showing Redis metrics and operations/sec

### 2. Enhanced Agent Intelligence  
- Improved memory-driven responses referencing past debates
- Emotional state tracking in agent profiles
- Coalition building based on stance similarity
- Dynamic fact base expansion during debates

### 3. Redis Performance Showcase
- Concurrent multi-debate processing demonstration
- Real-time analytics showing all 4 Redis modules working together
- Scalability demonstrations for judges
- Advanced vector search with multiple embedding models
