import React, { useState } from 'react';
import api from '../services/api';
import TopicSelector from './TopicSelector';
import AgentConfig from './AgentConfig';
import PerformanceDashboard from './PerformanceDashboard';
import DebateHistoryBrowser from './DebateHistoryBrowser';

const Controls = () => {
    const [topic, setTopic] = useState('climate change policy');
    const [isDebating, setIsDebating] = useState(false);
    const [currentDebateId, setCurrentDebateId] = useState(null);
    const [showAgentConfig, setShowAgentConfig] = useState(false);
    const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
    const [showDebateHistory, setShowDebateHistory] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState('senatorbot');
    const [loading, setLoading] = useState({
        start: false,
        stop: false,
        addFact: false,
        summarize: false
    });

    const agents = [
        { id: 'senatorbot', name: 'SenatorBot', color: 'bg-blue-600' },
        { id: 'reformerbot', name: 'ReformerBot', color: 'bg-orange-500' }
    ];

    const handleStartDebate = async () => {
        console.log('🎯 Start Debate clicked!');
        setLoading(prev => ({ ...prev, start: true }));
        try {
            console.log('🚀 Calling API to start debate...');
            const debateId = `debate_${Date.now()}`;
            const result = await api.startDebate({
                debateId: debateId,
                topic,
                agents: ['senatorbot', 'reformerbot']
            });
            console.log('✅ Debate started successfully:', result);
            setCurrentDebateId(debateId);
            setIsDebating(true);
        } catch (error) {
            console.error('❌ Failed to start debate:', error);
            alert('Failed to start debate. Check console for details.');
        } finally {
            setLoading(prev => ({ ...prev, start: false }));
        }
    };

    const handleStopDebate = async () => {
        if (!currentDebateId) {
            console.warn('⚠️ No active debate to stop');
            setIsDebating(false);
            return;
        }

        console.log('🛑 Stop Debate clicked!');
        setLoading(prev => ({ ...prev, stop: true }));
        try {
            console.log(`🚀 Calling API to stop debate: ${currentDebateId}...`);
            const result = await api.stopDebate(currentDebateId);
            console.log('✅ Debate stopped successfully:', result);
            setIsDebating(false);
            setCurrentDebateId(null);
        } catch (error) {
            console.error('❌ Failed to stop debate:', error);
            alert('Failed to stop debate. Check console for details.');
            // Still set to false in case of API error to prevent UI getting stuck
            setIsDebating(false);
        } finally {
            setLoading(prev => ({ ...prev, stop: false }));
        }
    };

    const handleAddFact = async () => {
        setLoading(prev => ({ ...prev, addFact: true }));
        try {
            const fact = prompt('Enter a new fact to add to the knowledge base:');
            if (fact && fact.trim()) {
                console.log('📝 Adding fact to knowledge base...');
                const result = await api.addFact(fact.trim());
                console.log('✅ Fact added successfully:', result);
                alert(`Fact added successfully! ID: ${result.factId}`);
            }
        } catch (error) {
            console.error('❌ Failed to add fact:', error);
            alert('Failed to add fact. Check console for details.');
        } finally {
            setLoading(prev => ({ ...prev, addFact: false }));
        }
    };

    const handleSummarize = async () => {
        setLoading(prev => ({ ...prev, summarize: true }));
        try {
            console.log('📊 Generating debate summary...');
            const result = await api.generateSummary('live_debate', 20);
            console.log('✅ Summary generated:', result);

            if (result.success) {
                // Create a simple modal to show the summary
                const summaryWindow = window.open('', '_blank', 'width=800,height=600');
                summaryWindow.document.write(`
                    <html>
                        <head><title>Debate Summary</title></head>
                        <body style="font-family: Arial, sans-serif; padding: 20px; background: #1e293b; color: white;">
                            <h1>🧠 MindChain Debate Summary</h1>
                            <div style="background: #334155; padding: 20px; border-radius: 10px; margin: 20px 0;">
                                <h2>Key Points</h2>
                                <pre style="white-space: pre-wrap; background: #475569; padding: 15px; border-radius: 5px;">${result.summary}</pre>
                            </div>
                            <div style="background: #334155; padding: 20px; border-radius: 10px;">
                                <h2>Metadata</h2>
                                <p><strong>Messages Analyzed:</strong> ${result.metadata?.messageCount || 'N/A'}</p>
                                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                            </div>
                        </body>
                    </html>
                `);
                summaryWindow.document.close();
            } else {
                alert('Failed to generate summary: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Failed to generate summary:', error);
            alert('Failed to generate summary. Check console for details.');
        } finally {
            setLoading(prev => ({ ...prev, summarize: false }));
        }
    };

    const openAgentConfig = (agentId) => {
        console.log('🔧 Opening config for agent:', agentId);
        setSelectedAgent(agentId);
        setShowAgentConfig(true);
    };

    return (
        <>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 border-b border-slate-600/50">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white">Debate Controls</h3>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Topic Selection */}
                    <div>
                        <TopicSelector
                            currentTopic={topic}
                            onTopicChange={setTopic}
                            disabled={isDebating}
                        />
                    </div>

                    {/* Agent Configuration */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-3">
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Configure AI Agents</span>
                            </div>
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                            {agents.map((agent) => (
                                <button
                                    key={agent.id}
                                    onClick={() => openAgentConfig(agent.id)}
                                    disabled={isDebating}
                                    className={`flex items-center justify-between p-4 ${agent.color} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-6 h-6 flex items-center justify-center">
                                            {agent.id === 'senatorbot' ? (
                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <span>{agent.name}</span>
                                    </div>
                                    <span className="text-sm opacity-75">Configure →</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleStartDebate}
                                disabled={isDebating || loading.start}
                                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                            >
                                <span>
                                    {loading.start ? (
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </span>
                                <span>{loading.start ? 'Starting...' : 'Start Debate'}</span>
                            </button>
                            <button
                                onClick={handleStopDebate}
                                disabled={!isDebating || loading.stop}
                                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                            >
                                <span>
                                    {loading.stop ? (
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4a1 1 0 11-2 0V7zM12 9a1 1 0 000 2v2a1 1 0 002 0V9a1 1 0 00-2 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </span>
                                <span>{loading.stop ? 'Stopping...' : 'Stop Debate'}</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleAddFact}
                                disabled={loading.addFact}
                                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                            >
                                <span>
                                    {loading.addFact ? (
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                        </svg>
                                    )}
                                </span>
                                <span>{loading.addFact ? 'Adding...' : 'Add Fact'}</span>
                            </button>
                            <button
                                onClick={handleSummarize}
                                disabled={loading.summarize}
                                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                            >
                                <span>
                                    {loading.summarize ? (
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </span>
                                <span>{loading.summarize ? 'Generating...' : 'Summary'}</span>
                            </button>
                        </div>

                        {/* Performance Dashboard Button */}
                        <button
                            onClick={() => setShowPerformanceDashboard(true)}
                            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                        >
                            <span>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </span>
                            <span>🚀 Redis Performance Dashboard</span>
                        </button>

                        {/* Debate History Browser */}
                        <button
                            onClick={() => setShowDebateHistory(true)}
                            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                        >
                            <span>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                                </svg>
                            </span>
                            <span>📜 Debate History Browser</span>
                        </button>
                    </div>

                    {/* Status Display */}
                    <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-300">System Status</span>
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${isDebating
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-600/50 text-slate-400'
                                }`}>
                                <div className={`w-2 h-2 rounded-full ${isDebating ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                                    }`}></div>
                                <span>{isDebating ? 'Live Debate' : 'Idle'}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Current Topic:</span>
                                <span className="text-white font-medium truncate ml-2">{topic}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Agent Configuration Modal */}
            <AgentConfig
                isVisible={showAgentConfig}
                onClose={() => setShowAgentConfig(false)}
                agentId={selectedAgent}
            />

            {/* Performance Dashboard Modal */}
            <PerformanceDashboard
                isVisible={showPerformanceDashboard}
                onClose={() => setShowPerformanceDashboard(false)}
            />

            {/* Debate History Browser Modal */}
            <DebateHistoryBrowser
                isVisible={showDebateHistory}
                onClose={() => setShowDebateHistory(false)}
            />
        </>
    );
};

export default Controls;
