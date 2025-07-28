# MindChain AI Copilot Instructions

## Project Overview
MindChain is a real-time multi-agent AI debate engine built for the Redis AI Challenge. It simulates political debates between AI agents with persistent personalities, memory, and fact-checking capabilities.

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
1. Generate response with `generateMessage(agentId, debateId)`
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
- Components follow pattern: Header, DebatePanel, MessageStream, FactChecker, Controls
- Run with `npm run dev` (port 5173)
- **Currently uses mock data** - priority is connecting to Redis backend

### Contest Implementation Priority
1. **WebSocket/SSE connection** for real-time frontend updates
2. **Express.js API layer** with endpoints:
   - `POST /api/debate/start` - trigger new debates
   - `GET /api/debate/:id/messages` - SSE stream of messages
   - `GET /api/agent/:id/profile` - agent personality data
   - `POST /api/agent/:id/update` - modify agent properties
3. **Interactive controls** for judge demonstrations
4. **Performance visualization** showing Redis module usage

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

## Winning Strategy Priorities

### 1. Real-Time Frontend Connection (Critical)
- Connect React frontend to Redis backend via WebSocket/Server-Sent Events
- Show live debate streaming, fact-checking results, and stance evolution
- Display agent personalities and memory insights in real-time

### 2. Interactive Demo Features (High Impact)
- User-triggered debate topics via frontend controls
- Live agent configuration (personalities, biases, stances)
- Debate history browser using Redis Streams navigation
- Performance dashboard showing Redis metrics

### 3. Advanced Agent Intelligence
- Memory-driven responses referencing past debates
- Emotional state tracking in agent profiles
- Coalition building based on stance similarity

### 4. Redis Performance Showcase
- Concurrent multi-debate processing
- Real-time analytics demonstrating all 4 Redis modules working together
- Scalability demonstrations for judges
