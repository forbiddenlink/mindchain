# 🧠 MindChain – Real-Time Multi-Agent AI Debate Engine

**MindChain** is a real-time AI policy debate simulator powered by Redis. Each AI agent is capable of:
- Holding a persistent profile (RedisJSON)
- Logging and recalling memories (Redis Streams)
- Evolving positions in real-time (RedisTimeSeries)
- Verifying statements semantically (Redis Vector Search)
- Communicating via shared debates (Streams)

**🏆 Contest Status: FULLY FUNCTIONAL & ENHANCED** - All major features complete!

**Latest Updates:**
- ✅ **Professional Icon System** - Complete replacement of emojis with Lucide React icons for contest-ready appearance
- ✅ **Enhanced Agent Representation** - Semantic icons for SenatorBot (Gavel) and ReformerBot (Lightbulb) personas
- ✅ **Icon Semantic Accuracy** - All 47+ icons accurately represent their functionality and context
- ✅ **3-Mode Navigation System** - Standard, Multi-Debate, and Analytics views with seamless switching
- ✅ **Enhanced UI Layout** - Fixed overlapping controls, improved responsive design
- ✅ **Context-Aware Controls** - Interface adapts based on current view mode
- ✅ **Multi-Debate Focus** - Debates take center stage without analytics overwhelming the UI
- ✅ **Topic Selection Fixed** - Agents now properly discuss selected topics (8+ predefined + custom)
- ✅ **Stop Button Fixed** - Properly terminates debates via API calls
- ✅ **Performance Dashboard** - Accessible via dedicated Analytics mode
- ✅ **Debate History Browser** - Navigate past debates with Redis Streams

📁 **[View Complete Project Structure](docs/PROJECT-STRUCTURE.md)**  
🎨 **[Professional Icon System Documentation](docs/ICON-SYSTEM.md)**

---

## 🚀 Quick Start

### Backend Server
```bash
cd c:\Users\purpl\OneDrive\Desktop\dev\mindchain
node server.js
```

### Frontend Development Server
```bash
cd mindchain-frontend
pnpm dev
```

### Open Browser
Navigate to `http://localhost:5173` or `http://127.0.0.1:5173`

**Click "Start Debate" to watch AI agents debate in real-time!**

---

## ✅ Core Features & Redis Architecture

### 1. **Express.js API Server** (`server.js`)
- **WebSocket Support**: Real-time message broadcasting
- **REST Endpoints**: `/api/debate/start`, `/api/agent/:id/profile`, `/api/health`
- **CORS Configured**: Supports both localhost and 127.0.0.1 origins
- **Error Handling**: Graceful shutdown and connection management

### 2. **Agent Profiles** (RedisJSON)
Each profile lives at: `agent:{agent_id}:profile`
```json
{
  "name": "SenatorBot",
  "role": "Moderate US Senator", 
  "tone": "measured",
  "stance": {
    "climate_policy": 0.4,
    "economic_risk": 0.8
  },
  "biases": ["fiscal responsibility", "bipartisan compromise"]
}
```

### 3. **Real-Time Debate Messages** (Redis Streams)
- **Shared Stream**: `debate:{debate_id}:messages`
- **Private Memory**: `debate:{debate_id}:agent:{agent_id}:memory`
- **WebSocket Broadcasting**: Instant frontend updates

### 4. **Stance Evolution** (RedisTimeSeries)
Key format: `debate:{debate_id}:agent:{agent_id}:stance:{topic}`
```bash
TS.ADD debate:live_debate:agent:senatorbot:stance:climate_policy * 0.6
```

### 5. **AI-Powered Fact Checking** (Redis Vector Search)
- **Embeddings**: OpenAI text-embedding-ada-002
- **Vector Storage**: `fact:{hash}` with HNSW index
- **Semantic Search**: COSINE similarity matching
- **Real-time Verification**: Every agent statement fact-checked

---

## 🎯 Live Demo Features

### Frontend (React 19 + Vite + Tailwind)
- ✅ **Professional Icon System**: Complete Lucide React integration with 47+ semantic icons
- ✅ **Enhanced Agent Avatars**: Gavel (SenatorBot) and Lightbulb (ReformerBot) for role clarity
- ✅ **3-Mode Navigation**: Standard (single debate), Multi-Debate (concurrent), Analytics (metrics)
- ✅ **Real-time Connection Status**: WebSocket + Backend health monitoring
- ✅ **Live Debate Stream**: Auto-scrolling messages with timestamps  
- ✅ **Enhanced Topic Selection**: 8+ debate topics with custom creation
- ✅ **Interactive Controls**: Context-aware interface adapting to current view mode
- ✅ **Multi-Debate Arena**: View multiple debates simultaneously without UI overlap
- ✅ **Analytics Dashboard**: Dedicated performance monitoring with Redis metrics
- ✅ **Debate History Browser**: Navigate Redis Streams with precision
- ✅ **Agent Configuration**: Live personality and stance editing
- ✅ **Fact Checker Panel**: Confidence scores and knowledge base expansion
- ✅ **AI-Powered Summarization**: GPT-4 debate analysis
- ✅ **Responsive Layout**: Professional contest-ready design with consistent iconography

### Backend (Node.js + Express + Redis)
- ✅ **Multi-Agent Simulation**: SenatorBot vs ReformerBot with personalities
- ✅ **Memory-Aware Responses**: Agents reference conversation history
- ✅ **Stance Tracking**: Position evolution over time via TimeSeries
- ✅ **Real-time Fact Checking**: Vector embeddings for claim verification
- ✅ **Concurrent Debates**: Multiple debate sessions with isolation
- ✅ **WebSocket Broadcasting**: Sub-second message distribution
- ✅ **Performance Monitoring**: Live Redis metrics and health checks

---

## 🧠 Redis Key Summary

| Key Pattern | Purpose | Redis Module |
|-------------|---------|--------------|
| `agent:senatorbot:profile` | Agent personality & beliefs | JSON |
| `debate:live_debate:messages` | Public debate messages | Streams |
| `debate:live_debate:agent:senatorbot:memory` | Private agent memory | Streams |
| `debate:live_debate:agent:senatorbot:stance:climate_policy` | Position evolution | TimeSeries |
| `fact:001` | Fact with vector embedding | Vector + Hash |

---

## 🛠️ Development Setup

### Prerequisites
```bash
# Install dependencies
pnpm install

# Set up Redis indices
node vectorsearch.js

# Create agent profiles  
node index.js
node addReformer.js

# Add sample facts (optional - may hang, use Ctrl+C)
# node addFacts.js
```

### Environment Variables
```env
REDIS_URL=redis://default:<password>@<host>:<port>
OPENAI_API_KEY=sk-proj-...
```

---

## 🏆 Contest-Winning Architecture

### Multi-Modal Redis Excellence
- **RedisJSON**: Complex agent personality storage with nested configurations
- **Redis Streams**: Real-time messaging, private memories, and temporal navigation
- **RedisTimeSeries**: Stance evolution tracking with performance monitoring  
- **Redis Vector**: Semantic fact verification with OpenAI embeddings

### Advanced Demo Features (Contest-Ready)
- **🚀 Performance Dashboard**: Real-time Redis metrics across all 4 modules
- **📜 History Browser**: Navigate Redis Streams with precision timeline control
- **⚙️ Live Agent Config**: Dynamic personality editing with instant updates
- **📝 Knowledge Expansion**: Add facts to Vector database with embeddings
- **📊 AI Summarization**: GPT-4 powered debate analysis and insights
- **🎯 Enhanced Topics**: 8+ sophisticated debate themes plus custom creation

### Real-Time Performance Showcase
- **WebSocket Broadcasting**: Sub-second message delivery to all clients
- **Concurrent Processing**: Multiple agents + fact-checking + memory formation
- **Memory Optimization**: Stream-based conversation history with perfect recall
- **Scalable Design**: Ready for multiple debate rooms and agent personalities
- **Live Monitoring**: Real-time Redis operations, memory usage, and key counts

### AI Integration Excellence
- **GPT-4 Agents**: Context-aware personality simulation with memory
- **Vector Embeddings**: Semantic fact matching with confidence scoring
- **Memory Context**: Multi-turn conversation awareness across sessions
- **Dynamic Adaptation**: Real-time stance evolution with TimeSeries tracking
- **Knowledge Base**: Expandable fact database with user contributions

---

## 📁 Project Organization

The codebase has been cleaned and organized for optimal development:

**🔧 Core Files (Root)**
- `server.js` - Main backend server with WebSocket support
- `generateMessage.js` - AI message generation with topic handling  
- `factChecker.js` - Vector-based fact verification system
- `vectorsearch.js` - Redis vector index initialization

**🎨 Frontend (`mindchain-frontend/`)**
- Complete React application with real-time WebSocket integration
- Professional icon system with 47+ Lucide React icons for contest quality
- 6 optimized components for debate management and monitoring
- Tailwind CSS styling with responsive design and semantic iconography

**📚 Documentation (`docs/`)**
- `PROJECT-STRUCTURE.md` - Complete file organization guide
- `ENHANCEMENT-SUMMARY.md` - Feature development history
- `LATEST-FIXES.md` - Recent updates and bug fixes

**🗄️ Archive (`archive/`)**
- Legacy files safely preserved for reference
- Old documentation versions and superseded implementations

---

## 🎮 Demo Workflow

1. **Start Backend**: `node server.js` (Terminal 1)
2. **Start Frontend**: `cd mindchain-frontend && pnpm dev` (Terminal 2)
3. **Open Browser**: `http://localhost:5173`
4. **Watch Connections**: Green indicators = system ready
5. **Enhanced Features**:
   - 🎯 **3-Mode Navigation**: Switch between Standard, Multi-Debate, and Analytics views
   - 📝 **Standard Mode**: Focus on single debate with fact-checker sidebar
   - 🎭 **Multi-Debate Mode**: View multiple concurrent debates simultaneously
   - 📊 **Analytics Mode**: Dedicated performance dashboard with Redis metrics
   - 🎯 **Select Topics**: Choose from 8+ debate themes or create custom
   - 🚀 **Start Debate**: AI agents begin real-time discussion
   - 📜 **Browse History**: Navigate past debates with Streams precision
   - ⚙️ **Configure Agents**: Edit personalities, stances, and biases
   - 📝 **Add Facts**: Expand knowledge base with Vector embeddings
   - 🤖 **Generate Summary**: AI-powered debate analysis
6. **Observe Real-time**: Fact-checking, stance evolution, memory formation

---

## 📊 System Status: Production Ready

✅ **Backend API**: Express.js with WebSocket support  
✅ **Frontend UI**: React with real-time updates  
✅ **Redis Integration**: All 4 modules operational  
✅ **AI Pipeline**: GPT-4 + OpenAI embeddings  
✅ **Error Handling**: Graceful failures and reconnection  
✅ **Performance**: Optimized for demonstration  

**Contest Deadline: August 10, 2025** - **READY FOR SUBMISSION** 🏆

---

_Last updated: July 28, 2025 - Real-time system operational_
