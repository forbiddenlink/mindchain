# Stance Evolution Chart & Sentiment Analysis Features

## Overview
The Stance Evolution Chart provides real-time visualization of agent stance changes during debates, creating an election-night style experience with live updates. Combined with the sentiment analysis sparklines, it creates a comprehensive real-time debate visualization system.

## Implementation Details

### Component: `StanceEvolutionChart.jsx`
- **Library**: Recharts for professional chart rendering
- **Design**: Glass morphism with dark theme matching the app aesthetic
- **Real-time**: Updates live as agents speak during debates
- **Interactive**: Expandable chart with hover tooltips

### Component: `SentimentBadge.jsx` 🆕
- **Real-time Sentiment Analysis**: Rule-based sentiment scoring with confidence values
- **Sparkline Visualization**: Tiny SVG charts showing confidence trends over time
- **Color-coded Badges**: 🟢 Positive, 🔴 Negative, 🔵 Neutral sentiment indicators
- **Redis Integration**: Historical confidence data stored and retrieved from Redis
- **Fallback Handling**: Demo data when no historical data exists

### Data Flow
1. **Server**: Broadcasts `new_message` events with stance data
2. **Frontend**: Extracts stance information from WebSocket messages
3. **Chart**: Converts 0-1 stance values to -1 to 1 for better visualization
4. **Display**: Shows blue line (SenatorBot) and red line (ReformerBot)

### Stance Data Structure
```javascript
{
  senatorbot: 0.6,      // -1 to 1 range (converted from 0-1)
  reformerbot: -0.3,    // -1 to 1 range (converted from 0-1) 
  timestamp: "2025-07-31T...",
  turn: 5,
  debateId: "debate_123",
  topic: "climate change policy"
}
```

### Technical Infrastructure 🆕
- **Vite Proxy Configuration**: Routes `/api/*` requests to backend server
- **Redis JSON Storage**: Sentiment history stored as JSON arrays for reliability
- **Error Handling**: Graceful fallbacks when API calls fail
- **Icon System**: Complete Lucide React icon integration (Maximize2, Activity, etc.)
- **WebSocket + REST**: Hybrid real-time and request-response architecture

### WebSocket Integration
The chart listens for `new_message` events and extracts stance data:
```javascript
// Extract from new_message event
if (data.stance && data.agentId && data.debateId) {
  const stanceValue = (data.stance.value - 0.5) * 2; // Convert 0-1 to -1 to 1
  // Update chart data...
}
```

### UI Features
- **Live Indicator**: Animated pulse showing real-time updates
- **Legend**: Color-coded lines with agent names
- **Tooltips**: Show exact values and timestamps on hover
- **Expandable**: Minimize/maximize button for different chart sizes
- **Current Positions**: Display latest stance values in header
- **Turn Counter**: Shows progression through debate rounds

### Visual Design
- **Colors**: Blue (#3b82f6) for SenatorBot, Red (#ef4444) for ReformerBot
- **Background**: Gradient glass morphism (`bg-gradient-to-br from-slate-900/50 to-gray-900/50`)
- **Animation**: Smooth line transitions and live pulse indicator
- **Typography**: Consistent with app design using Tailwind classes

### Integration Points
- **Standard Mode**: Single debate chart filtered by current debate ID
- **Multi-Debate Mode**: Aggregated chart showing all concurrent debates
- **Analytics Mode**: Chart data contributes to overall performance metrics

### Election-Night Experience
The chart creates excitement through:
- Real-time line movements as positions evolve
- Live indicator showing active updates
- Color-coded competition between agents
- Turn-by-turn progression tracking
- Smooth animations emphasizing changes

## Technical Notes
- Uses `ResponsiveContainer` for automatic sizing
- Implements custom tooltip for rich data display
- Maintains 50-entry limit to prevent memory issues
- Filters data by debate ID in standard mode
- Converts stance values for optimal visualization range (-1 to 1)
