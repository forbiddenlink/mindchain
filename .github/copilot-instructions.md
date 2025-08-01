# StanceStream AI Copilot Instructions

## Project Overview
StanceStream is a **production-ready multi-agent AI debate engine** built for the Redis AI Challenge (August 10, 2025). It showcases all 4 Redis data models through real-time political debates between intelligent AI agents with persistent personalities, memory, fact-checking, and business intelligence.

**🏆 STATUS: PRODUCTION-READY CONTEST SUBMISSION**
- ✅ **Express.js + WebSocket Server** - Real-time concurrent debate support with enterprise-grade reliability
- ✅ **React 19 + Vite Frontend** - 4-mode navigation (Standard/Multi-Debate/Analytics/Contest Showcase)
- ✅ **Complete Redis Integration** - All 4 modules (JSON/Streams/TimeSeries/Vector) with advanced use cases
- ✅ **Intelligent AI Agents** - GPT-4 with emotional states, coalition analysis, memory-driven responses
- ✅ **Semantic Caching System** - Redis Vector-powered with 85% similarity threshold achieving 70%+ hit rates
- ✅ **Real-Time Performance Optimization** - Continuous Redis tuning with live metrics
- ✅ **Advanced Fact-Checking** - Multi-source verification with AI-powered cross-validation
- ✅ **Contest Metrics Engine** - Live scoring aligned with Redis Challenge judging criteria
- ✅ **Business Intelligence Dashboard** - ROI tracking, cost savings, enterprise scaling projections
- ✅ **Semantic Cache Engine Dashboard** - Embedded mission control interface with real-time Redis operations monitoring
- ✅ **Professional UI System** - 47+ Lucide React icons, responsive design, contest-ready presentation

## Redis Architecture (All 4 Modules)

### 1. RedisJSON - Complex Data Structures
```javascript
// Agent profiles with nested personality data
await client.json.get(`agent:${agentId}:profile`);
// Cache metrics with real-time statistics
await client.json.get('cache:metrics');
// Contest scoring with live evaluation
await client.json.get('contest:live_metrics');
// Key moments with AI-generated summaries
await client.json.get(`debate:${debateId}:key_moments`);
// Intelligence metrics for emotional tracking
await client.json.get(`debate:${debateId}:agent:${agentId}:intelligence`);
```

### 2. Redis Streams - Real-Time Messaging
```javascript
// Public debate messages with WebSocket broadcast
await client.xAdd(`debate:${debateId}:messages`, '*', {agent_id, message});
// Private agent memories for strategic intelligence
await client.xAdd(`debate:${debateId}:agent:${agentId}:memory`, '*', {type, content});
// Strategic insights for intelligent decision-making
await client.xAdd(`debate:${debateId}:agent:${agentId}:strategic_memory`, '*', data);
```

### 3. RedisTimeSeries - Time-Based Analytics
```javascript
// Stance evolution tracking over debate timeline
await client.ts.add(`debate:${debateId}:agent:${agentId}:stance:${topic}`, '*', newStance);
// Emotional trajectory for intelligent agent responses
await client.ts.add(`debate:${debateId}:agent:${agentId}:emotions`, '*', intensity);
// Performance metrics for optimization engine
await client.ts.add('system:performance:response_time', '*', responseTime);
```

### 4. Redis Vector - Semantic Intelligence
```javascript
// Fact-checking with COSINE similarity search
const vector = Buffer.from(new Float32Array(embedding).buffer);
await client.hSet(`fact:${factId}`, {content, vector});
// Semantic caching with 85% similarity threshold
await client.hSet(`cache:prompt:${hash}`, {content: prompt, response, vector});
// Advanced fact verification across multiple knowledge bases
await client.ft.search('facts-index', '*=>[KNN 3 @vector $query_vector]', {PARAMS: {query_vector}});
```

## WebSocket Message Architecture

The server broadcasts structured messages for real-time updates:

```javascript
// New debate message with comprehensive metadata
broadcast({
  type: 'new_message',
  debateId, agentId, agentName, message, timestamp,
  factCheck: {fact, score}, // Vector search results
  sentiment: {sentiment, confidence, model}, // AI sentiment analysis
  stance: {topic, value, change}, // Real-time position tracking
  metrics: {totalMessages, activeDebates, thisDebateMessages}
});

// Stance evolution updates for live charting
broadcast({
  type: 'debate:stance_update',
  debateId, senatorbot: 0.6, reformerbot: -0.3,
  timestamp, turn, topic,
  metadata: {round, totalRounds, totalMessages}
});

// Key moments detection with AI analysis
broadcast({
  type: 'key_moment_created',
  debateId, moment: {type, summary, significance},
  totalMoments, timestamp
});

// Contest metrics for live evaluation
broadcast({
  type: 'contest_metrics_updated',
  overall_score, category_scores, recommendations,
  timestamp
});
```

React components use `useWebSocket` hook for real-time state management.

## AI Generation System

### Message Generation with Semantic Caching
1. **Check semantic cache** using Redis Vector search (85% similarity threshold)
2. **Fetch agent profile** from RedisJSON for personality context
3. **Retrieve conversation history** from Redis Streams for memory
4. **Generate enhanced response** using GPT-4 with emotional context (if cache miss)
5. **Cache new response** with OpenAI embeddings for future similarity matching
6. **Fact-check message** against vector database using `findClosestFact`
7. **Update stance** in TimeSeries based on debate dynamics and emotional state
8. **Store in streams** and broadcast via WebSocket with comprehensive metadata

### Enhanced AI Features
- **Intelligent Agents**: Use `enhancedAI.js` or `intelligentAgents.js` for advanced behaviors
- **Emotional States**: 'frustrated', 'encouraged', 'analytical' tracked in TimeSeries
- **Coalition Building**: Agents form alliances based on stance similarity (±0.3 range)
- **Memory-Driven Responses**: Strategic memory streams influence future responses
- **Similarity Prevention**: Retry generation if response too similar to recent messages
- **Performance Optimization**: Real-time Redis optimization affects response quality

## Essential Development Workflow

### Production Setup (REQUIRED SEQUENCE)
```bash
# Install dependencies
pnpm install
cd stancestream-frontend; pnpm install; cd ..

# 2. Create Redis vector indices (MUST run first)
node vectorsearch.js       # Creates facts-index
node setupCacheIndex.js    # Creates cache-index for semantic caching

# 3. Initialize agent profiles and optimize system
node index.js              # Creates SenatorBot profile
node addReformer.js        # Creates ReformerBot profile
node presentationOptimizer.js  # Optimizes for demo performance

# 4. Start production services
node server.js             # Backend (port 3001)
cd stancestream-frontend; pnpm dev  # Frontend (port 5173)
```

### Key System Files
**Backend Core:**
- `server.js` - Main Express + WebSocket server with all API endpoints and contest features
- `generateMessage.js` - AI message generation with semantic caching integration
- `semanticCache.js` - Redis Vector-powered prompt caching system (MAJOR SHOWCASE)
- `intelligentAgents.js` - Advanced AI agents with emotional states and coalition analysis
- `redisOptimizer.js` - Real-time Redis performance optimization engine
- `advancedFactChecker.js` - Multi-source fact verification with cross-validation
- `contestMetricsEngine.js` - Live contest scoring and evaluation system
- `enhancedAI.js` - Enhanced AI with emotional context and similarity prevention

**Frontend Core:**
- `App.jsx` - Main React app with 4-mode navigation and WebSocket integration
- `ContestShowcaseDashboard.jsx` - Premium demonstration interface for contest judges
- `LivePerformanceOverlay.jsx` - Semantic Cache Engine Dashboard with embedded layout and overlay modes
- `StanceEvolutionChart.jsx` - Real-time stance visualization with Recharts
- `EnhancedPerformanceDashboard.jsx` - Advanced Redis and cache metrics dashboard
- `TrueMultiDebateViewer.jsx` - Concurrent debate management interface

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
// 4-Mode Navigation System
'standard' - Single debate with fact-checker sidebar + embedded semantic cache engine
'multi-debate' - TrueMultiDebateViewer for concurrent debates + aggregated stance chart
'analytics' - EnhancedPerformanceDashboard with Redis metrics
'contest' - ContestShowcaseDashboard with premium demonstration interface

// Semantic Cache Engine Layout Integration
// Embedded in right column instead of overlay for better UX
<div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
  <div className="lg:col-span-3">
    {/* Main content area */}
  </div>
  <div className="lg:col-span-1 space-y-6">
    <LivePerformanceOverlay position="embedded" />
  </div>
</div>

// Responsive positioning modes
position="embedded" - Layout-friendly integration with responsive grid
position="top-right" - Traditional floating overlay (still supported)

// Message filtering by debate ID
const getFilteredMessages = () => {
  if (viewMode === 'standard') {
    return debateMessages.filter(msg => msg.debateId === currentDebateId);
  }
  return debateMessages; // All messages for multi-debate
};

// Stance data extraction from WebSocket messages
// Converts 0-1 stance values to -1 to 1 for better visualization
const stanceValue = (data.stance.value - 0.5) * 2;
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
- `recharts@3.1.0` for stance evolution chart visualization
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
