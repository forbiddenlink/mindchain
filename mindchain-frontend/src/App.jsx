// src/App.jsx
import { useState, useEffect } from 'react';
import Header from './components/Header';
import DebatePanel from './components/DebatePanel';
import MessageStream from './components/MessageStream';
import FactChecker from './components/FactChecker';
import Controls from './components/Controls';
import useWebSocket from './hooks/useWebSocket';
import api from './services/api';

export default function App() {
  const [debateMessages, setDebateMessages] = useState([]);
  const [systemMessages, setSystemMessages] = useState([]);
  const [agents, setAgents] = useState({});
  const [factChecks, setFactChecks] = useState([]);
  const [connectionHealth, setConnectionHealth] = useState('checking');

  // WebSocket connection
  const { connectionStatus, lastMessage, messages } = useWebSocket('ws://localhost:3001');

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
          setSystemMessages(prev => [...prev, {
            type: 'success',
            content: `Debate started: ${data.topic}`,
            timestamp: new Date().toLocaleTimeString()
          }]);
          break;
          
        case 'debate_ended':
          setSystemMessages(prev => [...prev, {
            type: 'info',
            content: 'Debate session ended',
            timestamp: new Date().toLocaleTimeString()
          }]);
          break;
          
        case 'agent_updated':
          setAgents(prev => ({
            ...prev,
            [data.agentId]: data.profile
          }));
          break;
          
        case 'error':
          setSystemMessages(prev => [...prev, {
            type: 'error',
            content: data.message,
            timestamp: new Date().toLocaleTimeString()
          }]);
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
        setSystemMessages(prev => [...prev, {
          type: 'success',
          content: 'Connected to MindChain backend',
          timestamp: new Date().toLocaleTimeString()
        }]);
      } catch (error) {
        setConnectionHealth('error');
        setSystemMessages(prev => [...prev, {
          type: 'error',
          content: 'Failed to connect to backend',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    };
    
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <Header connectionStatus={connectionStatus} backendHealth={connectionHealth} />
      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <DebatePanel messages={debateMessages} />
        <div className="space-y-6">
          <MessageStream messages={systemMessages} />
          <FactChecker factChecks={factChecks} />
          <Controls />
        </div>
      </main>
    </div>
  );
}
