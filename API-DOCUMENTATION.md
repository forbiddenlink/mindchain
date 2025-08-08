# 📚 StanceStream API Documentation

**Complete REST API reference for the StanceStream AI Intelligence Platform**

## 🔗 Base URL
```
http://localhost:3001/api
```

## 🔐 Authentication
Currently using development mode. In production, implement:
- API key authentication
- Rate limiting per client
- Request signing for sensitive operations

---

## 🎯 Core Endpoints

### Health & Status

#### GET `/health`
**Purpose**: System health check  
**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-08T10:30:00Z",
  "services": {
    "redis": "connected",
    "openai": "operational",
    "websocket": "active"
  }
}
```

#### GET `/status`
**Purpose**: Detailed system status  
**Response**: Comprehensive service status including Redis modules, AI connectivity, and performance metrics.

---

### Agent Management

#### GET `/agent/:id/profile`
**Purpose**: Retrieve AI agent profile and personality  
**Parameters**:
- `id` (string): Agent identifier (e.g., "senatorbot", "reformerbot")

**Response**:
```json
{
  "id": "senatorbot",
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

#### GET `/agent/:id/intelligent-message`
**Purpose**: Generate AI response using enhanced intelligence system  
**Parameters**:
- `id` (string): Agent identifier
- `debateId` (query): Debate context ID
- `topic` (query): Discussion topic

**Response**:
```json
{
  "message": "Generated AI response...",
  "sentiment": "analytical",
  "confidence": 0.85,
  "factCheck": {
    "score": 0.92,
    "sources": ["fact1", "fact2"]
  }
}
```

---

### Debate Operations

#### POST `/debate/start`
**Purpose**: Initialize new debate session  
**Body**:
```json
{
  "topic": "Environmental regulations",
  "agents": ["senatorbot", "reformerbot"],
  "duration": 300
}
```

**Response**:
```json
{
  "debateId": "debate_123456",
  "topic": "Environmental regulations",
  "agents": ["senatorbot", "reformerbot"],
  "startTime": "2025-08-08T10:30:00Z",
  "status": "active"
}
```

#### GET `/debate/:id/messages`
**Purpose**: Retrieve debate message history  
**Parameters**:
- `id` (string): Debate identifier
- `limit` (query): Max messages to return (default: 50)
- `offset` (query): Message offset for pagination

#### GET `/debate/:id/analytics`
**Purpose**: Get debate analytics and insights  
**Response**: Stance evolution, key moments, sentiment analysis, and performance metrics.

---

### Fact Checking

#### POST `/fact-check/advanced`
**Purpose**: Advanced multi-source fact verification  
**Body**:
```json
{
  "statement": "Climate change affects global temperature",
  "context": "Environmental policy debate",
  "sources": ["scientific", "governmental"]
}
```

**Response**:
```json
{
  "fact": "Climate change affects global temperature",
  "verification": {
    "score": 0.95,
    "confidence": "high",
    "sources": [
      {
        "type": "scientific",
        "match": 0.98,
        "content": "Scientific consensus confirms..."
      }
    ]
  },
  "crossValidation": {
    "consistencyScore": 0.92,
    "conflictingClaims": []
  }
}
```

#### GET `/fact-check/analytics`
**Purpose**: Fact-checking performance and statistics  
**Response**: Success rates, source reliability, common fact patterns.

---

### Performance & Analytics

#### GET `/analytics/performance`
**Purpose**: System performance metrics  
**Response**:
```json
{
  "redis": {
    "operationsPerSecond": 450,
    "memoryUsage": "156MB",
    "connectionCount": 12
  },
  "ai": {
    "averageResponseTime": 1200,
    "tokensPerMinute": 15000,
    "cacheHitRate": 0.72
  },
  "websocket": {
    "activeConnections": 8,
    "messagesPerSecond": 25
  }
}
```

#### GET `/analytics/platform-metrics`
**Purpose**: Business intelligence and platform insights  
**Response**: User engagement, cost savings, system efficiency, and ROI metrics.

---

### Caching System

#### GET `/cache/metrics`
**Purpose**: Semantic cache performance  
**Response**:
```json
{
  "hitRate": 0.724,
  "totalRequests": 1250,
  "cacheHits": 905,
  "costSavings": {
    "tokensReduced": 45000,
    "dollarsPerHour": 12.50
  },
  "averageSimilarity": 0.887
}
```

#### DELETE `/cache/clear`
**Purpose**: Clear semantic cache (admin operation)  
**Response**: Cache clearing confirmation and statistics.

#### GET `/cache/similarity/:prompt`
**Purpose**: Find similar cached prompts  
**Parameters**:
- `prompt` (string): Input prompt to match
- `threshold` (query): Similarity threshold (default: 0.85)

---

### Real-Time Features

#### GET `/optimization/metrics`
**Purpose**: Live optimization engine status  
**Response**: Redis performance optimizations, memory management, and efficiency improvements.

#### GET `/optimization/start`
**Purpose**: Initialize performance optimization  
**Response**: Optimization process startup confirmation.

---

## 🌊 WebSocket Events

### Connection
```javascript
const ws = new WebSocket('ws://localhost:3001');
```

### Message Types

#### `new_message`
**Purpose**: New debate message broadcast  
**Data**:
```json
{
  "type": "new_message",
  "debateId": "debate_123",
  "agentId": "senatorbot",
  "agentName": "SenatorBot",
  "message": "AI generated response...",
  "timestamp": "2025-08-08T10:30:00Z",
  "factCheck": {
    "fact": "Verified statement",
    "score": 0.95
  },
  "sentiment": {
    "sentiment": "analytical", 
    "confidence": 0.85
  }
}
```

#### `debate:stance_update`
**Purpose**: Agent stance evolution  
**Data**:
```json
{
  "type": "debate:stance_update",
  "debateId": "debate_123",
  "senatorbot": 0.6,
  "reformerbot": -0.3,
  "timestamp": "2025-08-08T10:30:00Z",
  "topic": "climate_policy"
}
```

#### `key_moment_created`
**Purpose**: Significant debate moment detected  
**Data**:
```json
{
  "type": "key_moment_created",
  "debateId": "debate_123",
  "moment": {
    "type": "coalition_formed",
    "summary": "Agents reached consensus on renewable energy",
    "significance": 0.88
  }
}
```

---

## 📊 Data Models

### Agent Profile
```json
{
  "id": "string",
  "name": "string",
  "role": "string", 
  "tone": "string",
  "stance": {
    "topic": "number (-1 to 1)"
  },
  "biases": ["string"],
  "personality": {
    "openness": "number",
    "conscientiousness": "number",
    "extroversion": "number"
  }
}
```

### Debate Message
```json
{
  "id": "string",
  "debateId": "string",
  "agentId": "string", 
  "message": "string",
  "timestamp": "ISO 8601",
  "factCheck": "FactCheck",
  "sentiment": "SentimentAnalysis",
  "stance": "StanceData"
}
```

### Fact Check Result
```json
{
  "fact": "string",
  "score": "number (0-1)",
  "confidence": "string",
  "sources": ["FactSource"],
  "verification": "VerificationResult"
}
```

---

## 🚨 Error Handling

### Error Response Format
```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2025-08-08T10:30:00Z",
  "details": {
    "field": "Additional context"
  }
}
```

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing/invalid API key)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable (Redis/AI service down)

### Rate Limiting
- **API Requests**: 200 per minute per IP
- **AI Generation**: 50 per minute per IP  
- **Fact Checking**: 30 per minute per IP

Headers returned:
```
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 195
X-RateLimit-Reset: 1628440800
```

---

## 🔧 Development & Testing

### API Testing
```bash
# Health check
curl http://localhost:3001/api/health

# Get agent profile
curl http://localhost:3001/api/agent/senatorbot/profile

# Start debate
curl -X POST http://localhost:3001/api/debate/start \
  -H "Content-Type: application/json" \
  -d '{"topic":"Climate policy","agents":["senatorbot","reformerbot"]}'
```

### WebSocket Testing
```javascript
const ws = new WebSocket('ws://localhost:3001');
ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

---

## 🏢 Enterprise Integration

### Custom Applications
- **REST API**: Full CRUD operations for all resources
- **WebSocket Streaming**: Real-time data feeds
- **Webhook Support**: Event notifications to external systems
- **Batch Operations**: Bulk data processing endpoints

### Security Considerations
- **HTTPS**: Required for production deployments
- **API Keys**: Per-client authentication and tracking
- **CORS**: Configurable for your domain requirements
- **Input Validation**: All endpoints validate and sanitize input

### Monitoring & Observability
- **Health Endpoints**: Detailed service status
- **Metrics APIs**: Performance and usage statistics
- **Error Logging**: Comprehensive error tracking
- **Rate Limit Monitoring**: Usage pattern analysis

---

*StanceStream API Documentation - Updated August 8, 2025*  
*For integration support and enterprise features, contact the development team.*
