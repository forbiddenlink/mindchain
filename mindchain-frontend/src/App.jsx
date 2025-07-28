// src/App.jsx
import { useState, useEffect } from 'react';
import Header from './components/Header';
import DebatePanel from './components/DebatePanel';
import FactChecker from './components/FactChecker';
import Controls from './components/Controls';
import useWebSocket from './hooks/useWebSocket';
import api from './services/api';

export default function App() {
  const [debateMessages, setDebateMessages] = useState([]);
  const [agents, setAgents] = useState({});
  const [factChecks, setFactChecks] = useState([]);
  const [connectionHealth, setConnectionHealth] = useState('checking');

  // WebSocket connection
  const wsUrl = window.location.hostname === '127.0.0.1'
    ? 'ws://127.0.0.1:3001'
    : 'ws://localhost:3001';
  const { connectionStatus, lastMessage, messages } = useWebSocket(wsUrl);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      const { type, ...data } = lastMessage;

      switch (type) {
        case 'new_message':
          setDebateMessages(prev => [...prev, {
            id: Date.now(),
            sender: data.agentName,
            agentId: data.agentId,
            text: data.message,
            timestamp: data.timestamp
          }]);

          if (data.factCheck) {
            setFactChecks(prev => [...prev.slice(-4), {
              id: Date.now(),
              message: data.message,
              fact: data.factCheck.fact,
              score: data.factCheck.score,
              timestamp: data.timestamp
            }]);
          }
          break;

        case 'debate_started':
          // Could add visual feedback here if needed
          break;

        case 'debate_stopped':
          // Could add visual feedback here if needed
          break;

        case 'debate_ended':
          // Could add visual feedback here if needed
          break;

        case 'agent_updated':
          setAgents(prev => ({
            ...prev,
            [data.agentId]: data.profile
          }));
          break;

        case 'error':
          console.error('WebSocket error:', data.message);
          break;
      }
    }
  }, [lastMessage]);

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.getHealth();
        setConnectionHealth('healthy');
      } catch (error) {
        setConnectionHealth('error');
        console.error('Backend health check failed:', error);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      <Header connectionStatus={connectionStatus} backendHealth={connectionHealth} />
      
      {/* Compact Controls Bar - Fixed at top */}
      <div className="flex-shrink-0 border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-2 max-w-7xl">
          <Controls />
        </div>
      </div>

      {/* Main Content - Takes remaining space */}
      <main className="flex-1 container mx-auto px-4 py-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Primary Debate Panel - Takes center stage */}
          <div className="lg:col-span-3 order-1">
            <DebatePanel messages={debateMessages} />
          </div>

          {/* Right Sidebar - Monitoring & Info */}
          <div className="lg:col-span-1 order-2 space-y-4">
            {/* Live Fact Checking - Most important secondary info */}
            <FactChecker factChecks={factChecks} />
          </div>
        </div>
      </main>
    </div>
  );
}
