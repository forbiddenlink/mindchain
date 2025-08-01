// src/components/StanceEvolutionChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import Icon from './Icon';

export default function StanceEvolutionChart({ stanceData = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Format data for Recharts
  const chartData = stanceData.map((entry, index) => ({
    turn: entry.turn || index + 1,
    timestamp: entry.timestamp,
    senatorbot: entry.senatorbot || 0,
    reformerbot: entry.reformerbot || 0,
    timeLabel: new Date(entry.timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }));

  // Custom tooltip to show actual values and time
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800/95 backdrop-blur-sm p-3 border border-slate-600/50 rounded-lg shadow-xl">
          <p className="text-sm font-medium text-white">Turn {label}</p>
          <p className="text-xs text-slate-400 mb-2">{data.timeLabel}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.dataKey === 'senatorbot' ? 'SenatorBot' : 'ReformerBot'}:</span> {entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (chartData.length === 0) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-slate-900/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-neutral-600/50 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-slate-800/80 to-slate-700/80 px-6 py-4 border-b border-slate-600/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Icon name="trending" className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Stance Evolution</h3>
            <span className="text-xs bg-purple-500/20 px-2 py-1 rounded-full text-purple-400">
              Election Night Style
            </span>
          </div>
        </div>
        
        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon name="analytics" className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium">Awaiting Stance Data</p>
            <p className="text-slate-500 text-xs mt-1">Chart will update as debate progresses</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-neutral-600/50 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-slate-800/80 to-slate-700/80 px-6 py-4 border-b border-slate-600/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Icon name="trending" className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Stance Evolution</h3>
            <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-400 text-xs font-medium">LIVE</span>
            </div>
          </div>
          <button 
            onClick={toggleExpanded}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-600/30"
            title={isExpanded ? 'Collapse chart' : 'Expand chart'}
          >
            <Icon 
              name={isExpanded ? "Minimize2" : "Maximize2"} 
              className="w-4 h-4 text-slate-400" 
            />
          </button>
        </div>
        
        {/* Agent Legend & Current Positions */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
              <span className="text-sm text-slate-300 font-medium">SenatorBot</span>
              {chartData.length > 0 && (
                <span className="text-sm font-bold text-blue-400">
                  {chartData[chartData.length - 1].senatorbot.toFixed(2)}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
              <span className="text-sm text-slate-300 font-medium">ReformerBot</span>
              {chartData.length > 0 && (
                <span className="text-sm font-bold text-red-400">
                  {chartData[chartData.length - 1].reformerbot.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <div className="text-xs text-slate-500">
            <span className="text-slate-400 font-medium">{chartData.length}</span> turns
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className={`flex-1 p-6 ${isExpanded ? 'min-h-96' : 'min-h-64'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
            <XAxis 
              dataKey="turn" 
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis 
              domain={[-1, 1]}
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94a3b8' }}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="senatorbot" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#1e40af' }}
              name="SenatorBot"
            />
            <Line 
              type="monotone" 
              dataKey="reformerbot" 
              stroke="#ef4444" 
              strokeWidth={3}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#dc2626' }}
              name="ReformerBot"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Election night style footer */}
      <div className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-slate-800/60 to-slate-700/60 border-t border-slate-600/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">
            <Icon name="Activity" className="w-3 h-3 inline mr-1" />
            Real-time stance tracking
          </span>
          <span className="flex items-center space-x-1 text-emerald-400">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
            <span className="font-medium">UPDATING</span>
          </span>
        </div>
      </div>
    </div>
  );
}
