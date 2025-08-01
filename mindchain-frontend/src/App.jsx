// src/App.jsx
import { useState, useEffect } from 'react';
import Header from './components/Header';
import DebatePanel from './components/DebatePanel';
import FactChecker from './components/FactChecker';
import EnhancedControls from './components/EnhancedControls';
import EnhancedPerformanceDashboard from './components/EnhancedPerformanceDashboard';
import TrueMultiDebateViewer from './components/TrueMultiDebateViewer';
import StanceEvolutionChart from './components/StanceEvolutionChart';
import KeyMomentsPanel from './components/KeyMomentsPanel';
import Icon from './components/Icon';
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
  const [stanceData, setStanceData] = useState([]); // Track stance evolution for chart
  const [currentStances, setCurrentStances] = useState({ senatorbot: 0, reformerbot: 0 }); // Track current stance values

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
            factCheck: data.factCheck,
            sentiment: data.sentiment // Add sentiment data from RedisAI
          };

          setDebateMessages(prev => [...prev, newMessage]);

          // Extract stance data from new_message and create stance update
          if (data.stance && data.agentId && data.debateId) {
            console.log('📊 Extracting stance from new_message:', data.stance);
            
            // Update current stances state
            setCurrentStances(prev => {
              const updated = {
                ...prev,
                [data.agentId]: (data.stance.value - 0.5) * 2 // Convert 0-1 to -1 to 1
              };
              
              // Create new stance entry with both agents' current values
              const newStanceEntry = {
                timestamp: data.timestamp,
                turn: Date.now(), // Use timestamp as unique turn identifier
                debateId: data.debateId,
                topic: data.stance.topic,
                senatorbot: updated.senatorbot,
                reformerbot: updated.reformerbot
              };
              
              console.log('📊 Created stance entry from message:', newStanceEntry);
              
              // Add to stance data
              setStanceData(prev => {
                // Filter to current debate in standard mode
                if (viewMode === 'standard' && currentDebateId) {
                  return [...prev.filter(entry => entry.debateId === currentDebateId), newStanceEntry];
                }
                return [...prev, newStanceEntry].slice(-50);
              });
              
              return updated;
            });
          }

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
            
            // If this is a single debate (standard mode), set it as current and clear stance data
            if (viewMode === 'standard') {
              setCurrentDebateId(data.debateId);
              setStanceData([]); // Clear previous stance data for new debate
              setCurrentStances({ senatorbot: 0, reformerbot: 0 }); // Reset current stances
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
            
            // Don't clear currentDebateId immediately to keep messages visible
            // The user can manually start a new debate or switch modes
            console.log(`⏹️ Debate ${data.debateId} stopped - messages remain visible`);
          }
          break;

        case 'debate_ended':
          if (data.debateId) {
            setActiveDebates(prev => {
              const updated = new Map(prev);
              updated.delete(data.debateId);
              return updated;
            });
            
            // Don't clear currentDebateId immediately to keep messages visible
            // The completed debate messages should remain visible
            console.log(`🏁 Debate ${data.debateId} ended - messages remain visible`);
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

        case 'debate:stance_update':
          // Handle real-time stance evolution for election-night style chart
          console.log('📊 Received stance update:', data); // Debug log
          const newStanceEntry = {
            senatorbot: data.senatorbot,
            reformerbot: data.reformerbot,
            timestamp: data.timestamp,
            turn: data.turn,
            debateId: data.debateId,
            topic: data.topic
          };
          
          setStanceData(prev => {
            console.log('📊 Previous stance data:', prev); // Debug log
            console.log('📊 New stance entry:', newStanceEntry); // Debug log
            // Filter to current debate in standard mode, keep all in multi-debate mode
            if (viewMode === 'standard' && currentDebateId) {
              const filtered = [...prev.filter(entry => entry.debateId === currentDebateId), newStanceEntry];
              console.log('📊 Filtered stance data:', filtered); // Debug log
              return filtered;
            }
            // In multi-debate mode, keep last 50 entries to prevent memory issues
            const updated = [...prev, newStanceEntry].slice(-50);
            console.log('📊 Updated stance data:', updated); // Debug log
            return updated;
          });
          
          console.log(`📊 Stance update: SenatorBot(${data.senatorbot.toFixed(2)}), ReformerBot(${data.reformerbot.toFixed(2)}) - Turn ${data.turn}`);
          break;

        case 'error':
          console.error('WebSocket error:', data.message);
          break;

        case 'key_moment_created':
          // Handle new key moment creation
          console.log('🔍 Key moment created:', data.moment);
          
          // Dispatch custom event for KeyMomentsPanel to listen to
          window.dispatchEvent(new CustomEvent('websocket-message', {
            detail: { type: 'key_moment_created', ...data }
          }));
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
        
        // In standard mode, when user explicitly stops a debate, 
        // clear the currentDebateId and messages for a fresh start
        if (viewMode === 'standard') {
          setCurrentDebateId(null);
          setDebateMessages([]); // Clear messages for fresh start
          console.log(`🛑 Stopped debate and cleared messages for fresh start`);
        }
      } catch (error) {
        console.error('Failed to stop current debate:', error);
      }
    }
  };

  // Get messages for current view mode
  const getFilteredMessages = () => {
    if (viewMode === 'standard') {
      if (currentDebateId) {
        // Show messages from the current active debate
        return debateMessages.filter(msg => msg.debateId === currentDebateId);
      } else {
        // If no current debate but we have messages, show the most recent debate's messages
        // This prevents messages from disappearing when a debate ends
        if (debateMessages.length > 0) {
          const latestDebateId = debateMessages[debateMessages.length - 1].debateId;
          return debateMessages.filter(msg => msg.debateId === latestDebateId);
        }
        return debateMessages; // Show all messages if no debate ID filtering is possible
      }
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
                    // Clear previous messages when starting a new debate
                    setDebateMessages([]);
                    setCurrentDebateId(debateId);
                    console.log(`🚀 Started new debate ${debateId} - cleared previous messages`);
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
                    <Icon name="target" size={16} className="mr-1" />
                    Standard
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
                    <Icon name="multi-debate" size={16} className="mr-1" />
                    Multi-Debate
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
                    <Icon name="analytics" size={16} className="mr-1" />
                    Analytics
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
          /* Standard Single-Debate Layout - Optimized 3-Column Layout */
          <div className="flex flex-col gap-4 h-[calc(100vh-200px)] overflow-hidden">
            {/* Main content row: 3-column layout */}
            <div className="flex flex-col xl:flex-row gap-4 flex-1 min-h-0">
              {/* Left Column: Debate Panel (60% width) */}
              <div className="flex-1 xl:flex-[3] min-w-0 min-h-0">
                <DebatePanel messages={getFilteredMessages()} />
              </div>
              
              {/* Middle Column: Key Moments (25% width) */}
              <div className="w-full xl:w-80 xl:flex-[1.5] flex-shrink-0 min-h-0">
                <KeyMomentsPanel debateId={currentDebateId} viewMode="standard" />
              </div>
              
              {/* Right Column: Fact Checker (15% width) */}
              <div className="w-full xl:w-64 xl:flex-[1] flex-shrink-0 min-h-0">
                <FactChecker factChecks={factChecks.filter(fc => !currentDebateId || fc.debateId === currentDebateId)} />
              </div>
            </div>
            
            {/* Bottom row: Stance Evolution Chart */}
            <div className="h-72 flex-shrink-0">
              <StanceEvolutionChart 
                stanceData={currentDebateId ? 
                  stanceData.filter(entry => entry.debateId === currentDebateId) : 
                  stanceData
                } 
              />
            </div>
          </div>
        ) : viewMode === 'multi-debate' ? (
          /* Multi-Debate Layout - Optimized for Multiple Debates with Key Moments Prominence */
          <div className="flex flex-col gap-4 h-[calc(100vh-200px)]">
            {/* Top row: Key Moments across all debates - Prominent position */}
            <div className="h-64 flex-shrink-0">
              <KeyMomentsPanel viewMode="multi-debate" />
            </div>
            
            {/* Middle row: Multi-debate viewer and fact checker */}
            <div className="flex flex-col lg:flex-row gap-4 flex-1">
              {/* Main: Multi-Debate Viewer */}
              <div className="flex-1 min-w-0">
                <TrueMultiDebateViewer
                  messages={debateMessages}
                  activeDebates={activeDebates}
                  onMetricsUpdate={handleMetricsUpdate}
                />
              </div>

              {/* Side Panel: Fact Checker */}
              <div className="w-full lg:w-72 flex-shrink-0">
                <FactChecker factChecks={factChecks} />
              </div>
            </div>
            
            {/* Bottom row: Stance Evolution Chart for all debates */}
            <div className="h-72 flex-shrink-0">
              <StanceEvolutionChart stanceData={stanceData} />
            </div>
          </div>
        ) : (
          /* Analytics Dashboard Layout - Key Moments as Primary Feature */
          <div className="space-y-6">
            {/* Top Row: Key Moments Analytics - Full Width Featured */}
            <div className="w-full">
              <KeyMomentsPanel viewMode="analytics" />
            </div>
            
            {/* Middle Row: Performance Dashboard */}
            <div className="w-full">
              <EnhancedPerformanceDashboard key={metricsUpdateTrigger} />
            </div>
            
            {/* Bottom Row: Quick Actions and Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-slate-900/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-600/50">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <Icon name="analytics" size={20} className="text-blue-400" />
                  Quick Actions
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setViewMode('multi-debate')}
                    className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/20 rounded-lg text-sm text-purple-300 transition-colors"
                  >
                    <Icon name="multi-debate" size={16} className="mr-1" />
                    Multi-Debate View
                  </button>
                  <button
                    onClick={() => setViewMode('standard')}
                    className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/20 rounded-lg text-sm text-blue-300 transition-colors"
                  >
                    <Icon name="target" size={16} className="mr-1" />
                    Standard View
                  </button>
                  <button
                    onClick={handleMetricsUpdate}
                    className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/20 rounded-lg text-sm text-green-300 transition-colors"
                  >
                    <Icon name="refresh" size={16} className="mr-1" />
                    Refresh Data
                  </button>
                </div>
              </div>
              
              {/* Live Stats */}
              <div className="bg-gradient-to-br from-slate-900/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-600/50">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <Icon name="bar-chart" size={20} className="text-green-400" />
                  Live Statistics
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{activeDebates.size}</div>
                    <div className="text-xs text-gray-400">Active Debates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{debateMessages.length}</div>
                    <div className="text-xs text-gray-400">Total Messages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{factChecks.length}</div>
                    <div className="text-xs text-gray-400">Fact Checks</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
