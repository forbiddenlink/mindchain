import React, { useState, useEffect } from 'react';
import api from '../services/api';

const DebateHistoryBrowser = ({ isVisible, onClose }) => {
    const [debateHistory, setDebateHistory] = useState([]);
    const [selectedDebate, setSelectedDebate] = useState(null);
    const [messages, setMessages] = useState([]);
    const [agentMemories, setAgentMemories] = useState({});
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('messages'); // 'messages', 'memories', 'timeline'

    // Mock debate history data (in production, this would come from a backend endpoint)
    const mockDebateHistory = [
        {
            id: 'live_debate',
            topic: 'Climate Change Policy',
            startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            endTime: new Date().toISOString(),
            participants: ['senatorbot', 'reformerbot'],
            messageCount: 23,
            status: 'completed'
        },
        {
            id: 'debate_' + (Date.now() - 7200000),
            topic: 'AI Regulation Framework',
            startTime: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            endTime: new Date(Date.now() - 5400000).toISOString(),
            participants: ['senatorbot', 'reformerbot'],
            messageCount: 18,
            status: 'completed'
        },
        {
            id: 'debate_' + (Date.now() - 14400000),
            topic: 'Healthcare Reform',
            startTime: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
            endTime: new Date(Date.now() - 12600000).toISOString(),
            participants: ['senatorbot', 'reformerbot'],
            messageCount: 31,
            status: 'completed'
        }
    ];

    useEffect(() => {
        if (isVisible) {
            setDebateHistory(mockDebateHistory);
        }
    }, [isVisible]);

    const loadDebateMessages = async (debateId) => {
        setLoading(true);
        try {
            console.log(`📜 Loading messages for debate: ${debateId}`);
            const debateMessages = await api.getDebateMessages(debateId, 50);
            setMessages(debateMessages);

            // Load agent memories for this debate
            const memories = {};
            const agents = ['senatorbot', 'reformerbot'];

            for (const agentId of agents) {
                try {
                    const agentMemory = await api.getAgentMemory(agentId, debateId, 10);
                    memories[agentId] = agentMemory;
                } catch (error) {
                    console.log(`⚠️ Could not load memory for ${agentId}`);
                    memories[agentId] = [];
                }
            }

            setAgentMemories(memories);
            console.log('✅ Debate data loaded successfully');

        } catch (error) {
            console.error('❌ Failed to load debate:', error);
            setMessages([]);
            setAgentMemories({});
        } finally {
            setLoading(false);
        }
    };

    const selectDebate = (debate) => {
        setSelectedDebate(debate);
        loadDebateMessages(debate.id);
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    const getAgentColor = (agentId) => {
        const colors = {
            'senatorbot': 'text-blue-400',
            'reformerbot': 'text-orange-400'
        };
        return colors[agentId] || 'text-slate-400';
    };

    const getAgentName = (agentId) => {
        const names = {
            'senatorbot': 'SenatorBot',
            'reformerbot': 'ReformerBot'
        };
        return names[agentId] || agentId;
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 border-b border-slate-600">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Debate History Browser</h2>
                                <p className="text-slate-400 text-sm">Navigate Redis Streams with temporal precision</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="flex h-[calc(90vh-5rem)]">
                    {/* Sidebar - Debate List */}
                    <div className="w-80 bg-slate-700/30 border-r border-slate-600 flex flex-col">
                        <div className="p-4 border-b border-slate-600">
                            <h3 className="font-semibold text-white mb-2">Recent Debates</h3>
                            <p className="text-xs text-slate-400">Powered by Redis Streams</p>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {debateHistory.map((debate) => (
                                <button
                                    key={debate.id}
                                    onClick={() => selectDebate(debate)}
                                    className={`w-full p-4 text-left border-b border-slate-600/50 hover:bg-slate-600/30 transition-colors ${selectedDebate?.id === debate.id ? 'bg-slate-600/50 border-l-4 border-l-blue-500' : ''
                                        }`}
                                >
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-white text-sm">{debate.topic}</h4>
                                        <div className="text-xs text-slate-400 space-y-1">
                                            <div className="flex justify-between">
                                                <span>Messages:</span>
                                                <span className="text-slate-300">{debate.messageCount}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Duration:</span>
                                                <span className="text-slate-300">
                                                    {Math.round((new Date(debate.endTime) - new Date(debate.startTime)) / 60000)}min
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {formatTimestamp(debate.startTime)}
                                            </div>
                                        </div>
                                        <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${debate.status === 'completed'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {debate.status}
                                        </div>
                                    </div>
                                </button>
                            ))}

                            {debateHistory.length === 0 && (
                                <div className="p-4 text-center text-slate-400">
                                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm">No debate history available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col">
                        {selectedDebate ? (
                            <>
                                {/* Content Header */}
                                <div className="p-4 border-b border-slate-600 bg-slate-800/50">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-bold text-white">{selectedDebate.topic}</h3>
                                        <div className="flex items-center space-x-1">
                                            {['messages', 'memories', 'timeline'].map((mode) => (
                                                <button
                                                    key={mode}
                                                    onClick={() => setViewMode(mode)}
                                                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${viewMode === mode
                                                            ? 'bg-blue-500 text-white'
                                                            : 'text-slate-400 hover:text-white hover:bg-slate-600'
                                                        }`}
                                                >
                                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-400">
                                        {formatTimestamp(selectedDebate.startTime)} → {formatTimestamp(selectedDebate.endTime)}
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 overflow-y-auto p-4">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-64">
                                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="ml-3 text-slate-400">Loading debate data...</span>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Messages View */}
                                            {viewMode === 'messages' && (
                                                <div className="space-y-4">
                                                    {messages.length > 0 ? (
                                                        messages.map((msg, index) => (
                                                            <div key={msg.id || index} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className={`font-medium ${getAgentColor(msg.agentId)}`}>
                                                                        {getAgentName(msg.agentId)}
                                                                    </span>
                                                                    <span className="text-xs text-slate-400">
                                                                        {formatTimestamp(msg.timestamp)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-slate-200">{msg.message}</p>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center text-slate-400 py-12">
                                                            <p>No messages found for this debate</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Memories View */}
                                            {viewMode === 'memories' && (
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {Object.entries(agentMemories).map(([agentId, memories]) => (
                                                        <div key={agentId} className="space-y-4">
                                                            <h4 className={`font-semibold ${getAgentColor(agentId)} text-lg`}>
                                                                {getAgentName(agentId)} Private Memory
                                                            </h4>
                                                            {memories.length > 0 ? (
                                                                memories.map((memory, index) => (
                                                                    <div key={memory.id || index} className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/50">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="text-xs font-medium text-slate-400">
                                                                                {memory.type || 'memory'}
                                                                            </span>
                                                                            <span className="text-xs text-slate-500">
                                                                                {formatTimestamp(memory.timestamp)}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-sm text-slate-300">{memory.content}</p>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="text-center text-slate-400 py-8">
                                                                    <p className="text-sm">No private memories recorded</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Timeline View */}
                                            {viewMode === 'timeline' && (
                                                <div className="space-y-6">
                                                    <div className="text-center text-slate-400 py-12">
                                                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        <h4 className="text-lg font-medium mb-2">Timeline Visualization</h4>
                                                        <p className="text-sm">Interactive timeline showing stance evolution</p>
                                                        <p className="text-xs mt-2 opacity-75">Coming soon - powered by RedisTimeSeries</p>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center text-slate-400">
                                    <svg className="w-20 h-20 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                                    </svg>
                                    <h3 className="text-xl font-medium mb-2">Select a Debate</h3>
                                    <p className="text-sm">Choose a debate from the sidebar to explore its history</p>
                                    <p className="text-xs mt-2 opacity-75">Navigate Redis Streams with temporal precision</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-700/50 px-6 py-3 border-t border-slate-600 flex justify-between items-center">
                    <div className="text-sm text-slate-400">
                        <span className="font-semibold">Redis Streams</span> - Complete message history and temporal navigation
                    </div>
                    {selectedDebate && (
                        <div className="text-sm text-slate-400">
                            Viewing: <span className="text-white font-medium">{messages.length}</span> messages
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DebateHistoryBrowser;
