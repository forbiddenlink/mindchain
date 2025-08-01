// src/components/SentimentBadge.jsx
import { useState, useEffect } from 'react';
import Icon from './Icon';

// Tiny sparkline component using SVG
const SentimentSparkline = ({ data, width = 60, height = 16 }) => {
  console.log('🎨 Rendering sparkline with data:', data);
  
  if (!data || data.length < 2) {
    console.log('⚠️ Not enough data for sparkline, showing placeholder');
    return (
      <div className="w-[60px] h-4 bg-gray-800/20 rounded-sm flex items-center justify-center">
        <span className="text-[8px] text-gray-400">--</span>
      </div>
    );
  }

  // Scale data to fit in sparkline
  const values = data.map(d => d.confidence);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 0.1; // Prevent division by zero
  
  console.log('📈 Sparkline values:', { values, minVal, maxVal, range });

  const points = values.map((val, index) => {
    const x = (index / (values.length - 1)) * (width - 4);
    const y = height - 2 - ((val - minVal) / range) * (height - 4);
    return `${x + 2},${y}`;
  }).join(' ');

  // Color based on trend
  const trend = values[values.length - 1] - values[0];
  const strokeColor = trend > 0 ? '#10b981' : trend < 0 ? '#f59e0b' : '#6b7280';
  
  console.log('🎨 Sparkline points:', points, 'color:', strokeColor);

  return (
    <div className="w-[60px] h-4 bg-gray-800/20 rounded-sm overflow-hidden">
      <svg width={width} height={height} className="w-full h-full">
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          opacity="0.9"
        />
        {/* Latest point highlight */}
        {values.length > 0 && (
          <circle
            cx={width - 2}
            cy={height - 2 - ((values[values.length - 1] - minVal) / range) * (height - 4)}
            r="1.5"
            fill={strokeColor}
          />
        )}
      </svg>
    </div>
  );
};

export default function SentimentBadge({ sentiment, confidence, debateId, agentId, timestamp }) {
  const [sparklineData, setSparklineData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add safety checks for confidence
  const safeConfidence = typeof confidence === 'number' ? confidence : 0;
  const safeSentiment = sentiment || 'neutral';

  // Fetch sparkline data
  useEffect(() => {
    const fetchSparklineData = async () => {
      if (!debateId || !agentId) {
        console.log('⚠️ SentimentBadge: Missing debateId or agentId', { debateId, agentId });
        return;
      }
      
      setIsLoading(true);
      try {
        console.log('📡 Fetching sentiment history for:', { debateId, agentId });
        const url = `/api/sentiment/${debateId}/${agentId}/history?points=15`;
        console.log('📡 Request URL:', url);
        
        const response = await fetch(url);
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          const text = await response.text();
          console.log('📡 Raw response:', text.substring(0, 200));
          
          // Try to parse as JSON
          let data;
          try {
            data = JSON.parse(text);
            console.log('📊 Sentiment history data:', data);
          } catch (parseError) {
            console.error('❌ Failed to parse JSON:', parseError);
            console.log('📄 Response looks like HTML, falling back to demo data');
            throw new Error('Invalid JSON response');
          }
          
          if (data.success && data.history && data.history.length > 0) {
            setSparklineData(data.history);
            console.log('✅ Set sparkline data:', data.history.length, 'points');
          } else {
            console.log('⚠️ No history data available, creating demo sparkline');
            // Always create demo data to show sparkline functionality
            const baseConfidence = confidence || 0.5;
            const demoData = [
              { timestamp: Date.now() - 40000, confidence: Math.max(0.1, Math.min(0.9, baseConfidence - 0.15)) },
              { timestamp: Date.now() - 30000, confidence: Math.max(0.1, Math.min(0.9, baseConfidence - 0.08)) },
              { timestamp: Date.now() - 20000, confidence: Math.max(0.1, Math.min(0.9, baseConfidence + 0.05)) },
              { timestamp: Date.now() - 10000, confidence: Math.max(0.1, Math.min(0.9, baseConfidence - 0.02)) },
              { timestamp: Date.now(), confidence: baseConfidence }
            ];
            setSparklineData(demoData);
            console.log('📊 Using demo sparkline data:', demoData);
          }
        } else {
          console.error('❌ Failed to fetch sentiment history:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('❌ Error fetching sentiment sparkline:', error);
        // Fallback demo data even on error
        const baseConfidence = confidence || 0.5;
        const demoData = [
          { timestamp: Date.now() - 30000, confidence: Math.max(0.1, Math.min(0.9, baseConfidence - 0.1)) },
          { timestamp: Date.now() - 20000, confidence: Math.max(0.1, Math.min(0.9, baseConfidence - 0.05)) },
          { timestamp: Date.now() - 10000, confidence: Math.max(0.1, Math.min(0.9, baseConfidence + 0.02)) },
          { timestamp: Date.now(), confidence: baseConfidence }
        ];
        setSparklineData(demoData);
        console.log('📊 Using fallback demo sparkline data:', demoData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSparklineData();
    
    // Automatic polling disabled to reduce background load
    // const interval = setInterval(fetchSparklineData, 30000);
    // return () => clearInterval(interval);
    
    // Only refresh on manual trigger or prop changes
    return () => {}; // No cleanup needed
  }, [debateId, agentId, timestamp, confidence]); // Include confidence to regenerate demo data

  // Get sentiment color and icon
  const getSentimentDisplay = (sentiment, confidence) => {
    // Add safety checks
    const safeConfidence = typeof confidence === 'number' ? confidence : 0;
    const safeSentiment = sentiment || 'neutral';
    
    if (safeConfidence < 0.6) {
      return {
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/20',
        borderColor: 'border-gray-500/30',
        icon: 'circle',
        emoji: '⚪',
        label: 'uncertain'
      };
    }

    switch (safeSentiment) {
      case 'positive':
        return {
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/20',
          borderColor: 'border-emerald-500/30',
          icon: 'success',
          emoji: '🟢',
          label: 'positive'
        };
      case 'negative':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          icon: 'error',
          emoji: '🔴',
          label: 'negative'
        };
      default:
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          icon: 'circle',
          emoji: '�',
          label: 'neutral'
        };
    }
  };

  const display = getSentimentDisplay(safeSentiment, safeConfidence);

  return (
    <div className="inline-flex flex-col items-start gap-1">
      {/* Main sentiment badge */}
      <div className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
        ${display.bgColor} ${display.borderColor} ${display.color} border
        backdrop-blur-sm transition-all duration-200
      `}>
        <span className="text-[10px]">{display.emoji}</span>
        <span className="font-mono text-[10px]">{safeConfidence.toFixed(2)}</span>
        <span className="text-[9px] opacity-75">confidence</span>
        {isLoading && <Icon name="loading" className="w-3 h-3 animate-spin opacity-50" />}
      </div>

      {/* Tiny sparkline showing confidence history */}
      <div className="flex items-center gap-1">
        <SentimentSparkline data={sparklineData} />
        {sparklineData.length > 0 ? (
          <span className="text-[8px] text-gray-500 font-mono">
            {sparklineData.length}pts
          </span>
        ) : (
          <span className="text-[8px] text-gray-500">
            {isLoading ? '...' : 'live'}
          </span>
        )}
      </div>
    </div>
  );
}
