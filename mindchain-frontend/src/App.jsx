// src/App.jsx
import { useState, useEffect } from 'react';
import Header from './components/Header';
import DebatePanel from './components/DebatePanel';
import FactChecker from './components/FactChecker';
import EnhancedControls from './components/EnhancedControls';
import EnhancedPerformanceDashboard from './components/EnhancedPerformanceDashboard';
import TrueMultiDebateViewer from './components/TrueMultiDebateViewer';
import useWebSocket from './hooks/useWebSocket';
import api from './services/api';

export default function App() {
  const [debateMessages, setDebateMessages] = useState([]);
  const [agents, setAgents] = useState({});
  const [factChecks, setFactChecks] = useState([]);
  const [connectionHealth, setConnectionHealth] = useState('checking');
  const [viewMode, setViewMode] = useState('standard'); // 'standard', 'multi-debate', or 'analytics'
  const [metricsUpdateTrigger, setMetricsUpdateTrigger] = useState(0);
  const [activeDebates, setActiveDebates] = useState(new Map()); // Track multiple debates
  const [currentDebateId, setCurrentDebateId] = useState(null); // Track current single debate

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
          const newMessage = {
            id: Date.now(),
            sender: data.agentName,
            agentId: data.agentId,
            text: data.message,
            timestamp: data.timestamp,
            debateId: data.debateId, // Include debate ID for proper separation
            factCheck: data.factCheck
          };

          setDebateMessages(prev => [...prev, newMessage]);

          // Track active debates
          if (data.debateId) {
            setActiveDebates(prev => {
              const updated = new Map(prev);
              const existing = updated.get(data.debateId) || {
                topic: 'Unknown Topic',
                messageCount: 0,
                startTime: new Date().toISOString()
              };
              existing.messageCount = (existing.messageCount || 0) + 1;
              existing.lastActivity = data.timestamp;
              updated.set(data.debateId, existing);
              return updated;
            });
          }

          if (data.factCheck) {
            setFactChecks(prev => [...prev.slice(-4), {
              id: Date.now(),
              message: data.message,
              fact: data.factCheck.fact,
              score: data.factCheck.score,
              timestamp: data.timestamp,
              debateId: data.debateId
            }]);
          }
          break;

        case 'debate_started':
          // Track the new debate with proper topic info
          if (data.debateId && data.topic) {
            setActiveDebates(prev => {
              const updated = new Map(prev);
              updated.set(data.debateId, {
                topic: data.topic,
                agents: data.agents,
                startTime: data.timestamp,
                messageCount: 0,
                status: 'running'
              });
              return updated;
            });
            
            // If this is a single debate (standard mode), set it as current
            if (viewMode === 'standard') {
              setCurrentDebateId(data.debateId);
            }
          }
          break;

        case 'debate_stopped':
          if (data.debateId) {
            setActiveDebates(prev => {
              const updated = new Map(prev);
              updated.delete(data.debateId);
              return updated;
            });
            
            // If this was the current single debate, clear it
            if (currentDebateId === data.debateId) {
              setCurrentDebateId(null);
            }
          }
          break;

        case 'debate_ended':
          if (data.debateId) {
            setActiveDebates(prev => {
              const updated = new Map(prev);
              updated.delete(data.debateId);
              return updated;
            });
            
            // If this was the current single debate, clear it
            if (currentDebateId === data.debateId) {
              setCurrentDebateId(null);
            }
          }
          break;

        case 'multi_debates_started':
          // Visual feedback for multiple debates started
          console.log(`🚀 Multi-debate session started: ${data.debates.length} debates`);
          break;

        case 'metrics_updated':
          // Trigger metrics refresh in dashboard
          setMetricsUpdateTrigger(prev => prev + 1);
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

  // Helper function to trigger metrics updates
  const handleMetricsUpdate = () => {
    setMetricsUpdateTrigger(prev => prev + 1);
  };

  // Helper function to stop current debate
  const handleStopCurrentDebate = async () => {
    if (currentDebateId) {
      try {
        await api.stopDebate(currentDebateId);
        setCurrentDebateId(null);
      } catch (error) {
        console.error('Failed to stop current debate:', error);
      }
    }
  };

  // Get messages for current view mode
  const getFilteredMessages = () => {
    if (viewMode === 'standard' && currentDebateId) {
      // In standard mode, only show messages from current debate
      return debateMessages.filter(msg => msg.debateId === currentDebateId);
    } else if (viewMode === 'multi-debate') {
      // In multi-debate mode, show all messages
      return debateMessages;
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      <Header connectionStatus={connectionStatus} backendHealth={connectionHealth} />

      {/* Enhanced Controls Bar - Full Width Layout */}
      <div className="flex-shrink-0 border-b border-slate-700/50 bg-slate-800/30">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <div className="flex flex-col gap-4">
            {/* Top Row: Enhanced Controls - Full Width */}
            <div className="w-full">
              <EnhancedControls
                viewMode={viewMode}
                activeDebates={activeDebates}
                currentDebateId={currentDebateId}
                onMetricsUpdate={handleMetricsUpdate}
                onStopCurrentDebate={handleStopCurrentDebate}
                onDebateStarted={(debateId) => {
                  if (viewMode === 'standard') {
                    setCurrentDebateId(debateId);
                  }
                }}
              />
            </div>

            {/* Bottom Row: Mode Toggle + Quick Stats */}
            <div className="flex items-center justify-between">
              {/* Left: Quick Stats */}
              <div className="flex items-center gap-3 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">{activeDebates.size}</div>
                  <div className="text-xs text-gray-400">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">{debateMessages.length}</div>
                  <div className="text-xs text-gray-400">Messages</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">{factChecks.length}</div>
                  <div className="text-xs text-gray-400">Facts</div>
                </div>
              </div>

              {/* Right: View Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Mode:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewMode('standard')}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${viewMode === 'standard'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }
                    `}
                  >
                    📝 Standard
                  </button>
                  <button
                    onClick={() => setViewMode('multi-debate')}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${viewMode === 'multi-debate'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }
                    `}
                  >
                    🎭 Multi-Debate
                  </button>
                  <button
                    onClick={() => setViewMode('analytics')}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${viewMode === 'analytics'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }
                    `}
                  >
                    📊 Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Main Content Based on View Mode */}
      <main className="flex-1 container mx-auto px-4 py-4 max-w-7xl">
        {viewMode === 'standard' ? (
          /* Standard Single-Debate Layout - Improved */
          <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-200px)]">
            <div className="flex-1 min-w-0">
              <DebatePanel messages={getFilteredMessages()} />
            </div>
            <div className="w-full lg:w-72 flex-shrink-0">
              <FactChecker factChecks={factChecks.filter(fc => !currentDebateId || fc.debateId === currentDebateId)} />
            </div>
          </div>
        ) : viewMode === 'multi-debate' ? (
          /* Multi-Debate Layout - Full Width for Debates */
          <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-200px)]">
            {/* Main: Multi-Debate Viewer - Full Focus */}
            <div className="flex-1 min-w-0">
              <TrueMultiDebateViewer
                messages={debateMessages}
                activeDebates={activeDebates}
                onMetricsUpdate={handleMetricsUpdate}
              />
            </div>

            {/* Side Panel: Just Fact Checker - Minimal */}
            <div className="w-full lg:w-72 flex-shrink-0">
              <FactChecker factChecks={factChecks} />
            </div>
          </div>
        ) : (
          /* Analytics Dashboard Layout */
          <div className="space-y-6">
            {/* Full Analytics Dashboard */}
            <div className="w-full">
              <EnhancedPerformanceDashboard key={metricsUpdateTrigger} />
            </div>
            
            {/* Quick Actions Bar */}
            <div className="bg-gradient-to-br from-slate-900/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-600/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-white">📊 Performance Analytics</h3>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-400">{activeDebates.size}</div>
                      <div className="text-xs text-gray-400">Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">{debateMessages.length}</div>
                      <div className="text-xs text-gray-400">Messages</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-400">{factChecks.length}</div>
                      <div className="text-xs text-gray-400">Facts</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('multi-debate')}
                    className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/20 rounded-lg text-sm text-purple-300 transition-colors"
                  >
                    🎭 Back to Debates
                  </button>
                  <button
                    onClick={() => setViewMode('standard')}
                    className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/20 rounded-lg text-sm text-blue-300 transition-colors"
                  >
                    � Standard View
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
