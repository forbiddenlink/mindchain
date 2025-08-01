# Sentiment Analysis & Sparklines Feature

## Overview
Real-time sentiment analysis system with confidence scoring and historical trend visualization through tiny sparkline charts. Showcases Redis data storage and TensorFlow.js foundation for future ML upgrades.

## Core Components

### `sentimentAnalysis.js` - Backend Engine
- **Rule-based Analysis**: Advanced sentiment scoring with confidence values
- **Redis Integration**: Historical data storage using JSON arrays
- **TensorFlow.js Ready**: Foundation for future ML model upgrades
- **Fallback Handling**: Graceful offline mode when Redis unavailable

### `SentimentBadge.jsx` - Frontend Visualization
- **Confidence Badges**: Color-coded sentiment indicators with scores
- **Tiny Sparklines**: SVG-based historical trend charts (60px × 16px)
- **Real-time Updates**: Fetches new data every 5 seconds
- **Demo Data Fallback**: Shows synthetic trends when no history exists

## Technical Implementation

### Sentiment Analysis Process
```javascript
// 1. Message Analysis
const result = await sentimentAnalyzer.analyzeSentiment(message, debateId, agentId);
// Returns: { confidence: 0.756, sentiment: 'positive', timestamp, agentId, debateId }

// 2. Redis Storage
const key = `sentiment_history:${debateId}:${agentId}`;
await client.set(key, JSON.stringify(history)); // JSON array storage

// 3. API Retrieval
GET /api/sentiment/{debateId}/{agentId}/history?points=15
// Returns: { success: true, history: [...], points: 15 }
```

### Sparkline Rendering
```javascript
// SVG-based tiny charts with automatic scaling
const SentimentSparkline = ({ data, width = 60, height = 16 }) => {
  // Scales confidence values to fit chart dimensions
  // Color-codes trend: green (↑), amber (↓), gray (neutral)
  // Highlights latest data point with circle
}
```

### Data Storage Strategy
- **Primary**: Redis JSON storage for reliability and simplicity
- **Fallback**: Local demo data generation when Redis unavailable
- **Retention**: 20 data points per agent per debate (prevents memory issues)
- **Format**: `[{ timestamp, confidence }, ...]` JSON arrays

## Redis Integration Details

### Storage Keys
```bash
sentiment_history:{debateId}:{agentId}  # JSON array of confidence points
```

### Data Structure
```json
[
  { "timestamp": 1754016383695, "confidence": 0.756 },
  { "timestamp": 1754016393701, "confidence": 0.834 },
  { "timestamp": 1754016403708, "confidence": 0.692 }
]
```

### API Endpoints
- `GET /api/sentiment/{debateId}/{agentId}/history?points=N` - Retrieve sparkline data
- Returns last N confidence points for sparkline rendering

## Visual Design

### Sentiment Badges
- **🟢 Positive**: Green badge with confidence ≥ 0.6
- **🔴 Negative**: Red badge with confidence < 0.4  
- **🔵 Neutral**: Blue badge for confidence 0.4-0.6
- **⚪ Uncertain**: Gray badge for low confidence < 0.6

### Sparkline Charts
- **Dimensions**: 60px wide × 16px tall (ultra-compact)
- **Colors**: Green (upward trend), Amber (downward), Gray (stable)
- **Elements**: Polyline path + highlighted latest point
- **Fallback**: "--" or "📊" when insufficient data

## Configuration & Setup

### Vite Proxy (Required)
```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false
    }
  }
}
```

### Redis Connection
```javascript
// Automatic fallback handling
try {
  this.client = createClient({ url: process.env.REDIS_URL });
  await this.client.connect();
} catch (error) {
  this.client = null; // Graceful offline mode
}
```

## Performance Considerations

### Optimization Strategies
- **Data Limits**: 20 points max per sparkline (prevents memory bloat)
- **Update Frequency**: 5-second intervals (balanced real-time vs performance)
- **Caching**: Browser caches sparkline data between updates
- **Fallbacks**: Demo data generation prevents UI blocking

### Error Handling
- **Network Failures**: Automatic fallback to demo data
- **JSON Parse Errors**: Graceful error logging with fallback
- **Redis Unavailable**: Offline mode with full functionality
- **Icon Missing**: Console warnings but no UI breakage

## Future Enhancements

### TensorFlow.js Integration
- **Model Loading**: Replace rule-based with trained sentiment models
- **Real-time Training**: Adaptive models based on debate context
- **Feature Engineering**: Advanced text analysis beyond word matching

### Advanced Analytics
- **Sentiment Trends**: Long-term agent personality tracking
- **Comparative Analysis**: Cross-debate sentiment patterns
- **Predictive Modeling**: Forecast stance changes based on sentiment

## Contest Integration

This feature showcases **Redis AI Challenge** requirements:
- ✅ **Real-Time AI Innovation**: Live sentiment analysis with confidence scoring
- ✅ **Beyond the Cache**: JSON storage for historical trend analysis  
- ✅ **Production Ready**: Robust error handling and fallback systems
- ✅ **Visual Excellence**: Professional sparkline charts with glass morphism design

The sentiment analysis system demonstrates sophisticated Redis usage beyond simple caching, creating a real-time ML foundation perfect for the contest showcase.
