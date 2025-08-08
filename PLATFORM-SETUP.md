# 🚀 StanceStream Platform Setup Guide

**Professional deployment guide for the StanceStream AI Intelligence Platform**

## 📋 Prerequisites

### System Requirements
- **Node.js** 18+ with npm/pnpm
- **Redis** 6.2+ with all modules enabled:
  - RedisJSON
  - Redis Streams  
  - RedisTimeSeries
  - Redis Vector (RediSearch)
- **OpenAI API Key** for GPT-4 and embeddings

### Environment Setup
```bash
# Required environment variables
REDIS_URL=redis://default:<password>@<host>:<port>
OPENAI_API_KEY=sk-proj-...
```

---

## 🏗️ Production Deployment

### Quick Start (Automated)
```powershell
# Windows PowerShell
.\setup-platform.ps1
```

```bash
# Linux/Mac
chmod +x setup-platform.sh && ./setup-platform.sh
```

### Manual Installation

#### 1. Install Dependencies
```bash
# Backend dependencies
pnpm install

# Frontend dependencies  
cd stancestream-frontend
pnpm install
cd ..
```

#### 2. Initialize Redis Indices
```bash
# Create vector search indices (REQUIRED)
node vectorsearch.js          # Creates facts-index for AI fact-checking
node setupCacheIndex.js       # Creates cache-index for semantic caching
```

#### 3. Configure AI Agents
```bash
# Create intelligent agent profiles
node index.js                 # Creates SenatorBot profile
node addReformer.js           # Creates ReformerBot profile
```

#### 4. Platform Optimization
```bash
# Optimize for production performance
node presentationOptimizer.js # Enhances Redis performance and caching
```

#### 5. Start Services
```bash
# Terminal 1: Backend API server
node server.js

# Terminal 2: Frontend development server  
cd stancestream-frontend
pnpm dev

# Open browser: http://localhost:5173
```

---

## 🔧 Configuration Options

### Redis Configuration
- **Connection**: Supports Redis Cloud, AWS ElastiCache, local Redis
- **Modules**: All 4 Redis modules required for full functionality
- **Performance**: Optimized connection pooling and caching

### AI Configuration  
- **OpenAI Models**: GPT-4 for generation, text-embedding-ada-002 for vectors
- **Semantic Caching**: 85% similarity threshold for optimal hit rates
- **Fact Checking**: Multi-source verification with confidence scoring

### Security Settings
- **Rate Limiting**: 200 API requests/minute, 50 AI generations/minute
- **CORS**: Configurable for your domain
- **Helmet**: Security headers enabled
- **Input Validation**: All endpoints protected

---

## 🏢 Enterprise Features

### Real-Time Intelligence
- **Multi-Agent Debates**: Concurrent AI discussions with memory
- **Live Analytics**: Real-time performance metrics and insights
- **Semantic Caching**: 70%+ cache hit rates reducing AI costs
- **Fact Verification**: Cross-validated information checking

### Business Dashboards
- **Executive Showcase**: High-level platform capabilities overview
- **Performance Analytics**: Redis operations and optimization metrics  
- **Cost Tracking**: AI usage and savings from semantic caching
- **System Health**: Connection status and error monitoring

### Scalability
- **WebSocket Support**: Real-time updates for multiple clients
- **Redis Clustering**: Ready for horizontal scaling
- **Microservice Architecture**: Modular components for enterprise integration
- **API Documentation**: Full REST API for custom integrations

---

## 🔍 Verification & Testing

### Health Checks
```bash
# Verify Redis connectivity
node testRedis.js

# Test AI agent generation  
node testAgents.js

# Check WebSocket stability
node testWebSocketQuick.js

# Validate semantic caching
node testCache.js
```

### Platform Verification
```bash
# Comprehensive system check
node verifyPlatformReadiness.js
```

### Expected Results
- ✅ Redis: All 4 modules connected and operational
- ✅ AI: Agent profiles loaded, GPT-4 responding
- ✅ WebSocket: Real-time communication functional  
- ✅ Caching: Vector indices created, semantic matching active
- ✅ Frontend: React app connecting to backend APIs

---

## 📊 Performance Optimization

### Redis Tuning
- **Memory Management**: Optimized for concurrent operations
- **Index Configuration**: Vector search optimized for embeddings
- **Stream Processing**: Efficient message handling and retention

### AI Cost Optimization  
- **Semantic Caching**: Reuses similar AI responses
- **Smart Fact-Checking**: Prevents redundant verification
- **Optimized Prompts**: Reduced token usage while maintaining quality

### Frontend Performance
- **React 19**: Latest concurrent features for smooth UX
- **Vite**: Fast development and optimized production builds
- **Code Splitting**: Efficient bundle loading

---

## 🚨 Troubleshooting

### Common Issues

**Redis Connection Failed**
```bash
# Check Redis server status
redis-cli ping

# Verify module loading
redis-cli MODULE LIST
```

**OpenAI API Errors**
```bash
# Verify API key
echo $OPENAI_API_KEY

# Test API connectivity
node testOpenAI.js
```

**Frontend Build Issues**
```bash
# Clear cache and reinstall
cd stancestream-frontend
rm -rf node_modules package-lock.json
pnpm install
```

### Support & Monitoring
- **Logs**: Check console output for detailed error information
- **Health Endpoints**: `/api/health` for system status
- **Performance Metrics**: Live monitoring via dashboard
- **Error Recovery**: Automatic reconnection and fallback systems

---

## 🎯 Next Steps

### Integration Options
- **API Integration**: REST endpoints for custom applications
- **WebSocket Streaming**: Real-time data feeds for dashboards
- **Database Integration**: Export debate data and analytics
- **Custom Agents**: Add domain-specific AI personalities

### Enterprise Deployment
- **Docker Containerization**: Ready for container orchestration
- **Load Balancing**: Multiple server instances supported
- **SSL/TLS**: Production security configuration
- **Monitoring**: Integration with enterprise monitoring systems

---

*StanceStream Platform Setup Guide - Updated August 8, 2025*
*For technical support and enterprise consulting, contact the development team.*
