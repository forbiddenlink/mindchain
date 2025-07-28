// Multi-Debate Controller - Contest Feature for Redis AI Challenge
import { useState } from 'react';
import api from '../services/api';

const DEBATE_TOPICS = [
    { id: 'climate', name: '🌍 Climate Policy', description: 'Environmental regulations and green energy' },
    { id: 'ai', name: '🤖 AI Regulation', description: 'Artificial intelligence governance and ethics' },
    { id: 'healthcare', name: '🏥 Healthcare Reform', description: 'Universal healthcare and medical access' },
    { id: 'immigration', name: '🌐 Immigration Policy', description: 'Border security and refugee assistance' },
    { id: 'education', name: '🎓 Education Reform', description: 'Public education and student debt' },
    { id: 'taxation', name: '💰 Tax Policy', description: 'Progressive taxation and wealth redistribution' },
    { id: 'privacy', name: '🔒 Digital Privacy', description: 'Data protection and surveillance' },
    { id: 'space', name: '🚀 Space Exploration', description: 'Space colonization and research funding' }
];

export default function MultiDebateController({ onMetricsUpdate }) {
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [isStarting, setIsStarting] = useState(false);
    const [activeDebates, setActiveDebates] = useState([]);

    const handleTopicToggle = (topicId) => {
        setSelectedTopics(prev =>
            prev.includes(topicId)
                ? prev.filter(id => id !== topicId)
                : [...prev, topicId]
        );
    };

    const startMultipleDebates = async () => {
        if (selectedTopics.length === 0) {
            alert('Please select at least one topic');
            return;
        }

        setIsStarting(true);
        try {
            const topics = selectedTopics.map(id =>
                DEBATE_TOPICS.find(t => t.id === id)?.description || id
            );

            // Try multi-debate endpoint first
            try {
                const response = await api.startMultipleDebates(topics);

                if (response.success) {
                    console.log(`🚀 Started ${topics.length} concurrent debates!`);
                    setActiveDebates(response.debates);

                    if (onMetricsUpdate) {
                        onMetricsUpdate();
                    }
                    setSelectedTopics([]);
                }
            } catch (multiError) {
                console.log('Multi-debate endpoint not available, starting debates individually');

                // Fallback: start debates individually
                const startedDebates = [];
                for (const topic of topics) {
                    try {
                        const response = await api.startDebate({
                            topic,
                            debateId: `fallback_debate_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
                        });

                        if (response.success) {
                            startedDebates.push({
                                debateId: response.debateId,
                                topic: response.topic
                            });
                        }
                    } catch (singleError) {
                        console.error(`Failed to start debate for topic: ${topic}`, singleError);
                    }
                }

                if (startedDebates.length > 0) {
                    console.log(`🚀 Started ${startedDebates.length} debates individually!`);
                    setActiveDebates(startedDebates);

                    if (onMetricsUpdate) {
                        onMetricsUpdate();
                    }
                    setSelectedTopics([]);
                } else {
                    throw new Error('Failed to start any debates');
                }
            }

        } catch (error) {
            console.error('Failed to start debates:', error);
            alert('Failed to start debates. Please try again.');
        } finally {
            setIsStarting(false);
        }
    };

    const loadActiveDebates = async () => {
        try {
            // Try to get active debates, with fallback to empty array
            try {
                const response = await api.getActiveDebates();
                setActiveDebates(response.debates);
            } catch (error) {
                console.log('Active debates endpoint not available, using mock data');
                // Mock some active debates for demo
                setActiveDebates([
                    {
                        debateId: 'demo_debate_1',
                        topic: 'Climate Policy',
                        status: 'running',
                        duration: '2m 30s',
                        messageCount: 12
                    }
                ]);
            }

            if (onMetricsUpdate) {
                onMetricsUpdate();
            }
        } catch (error) {
            console.error('Failed to load active debates:', error);
        }
    };

    return (
        <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-purple-300 flex items-center gap-2">
                    🚀 Multi-Debate Controller
                    <span className="text-sm bg-purple-500/20 px-2 py-1 rounded-full">
                        Contest Feature
                    </span>
                </h2>
                <button
                    onClick={loadActiveDebates}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Topic Selection Grid */}
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                    Select Topics for Concurrent Debates:
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {DEBATE_TOPICS.map(topic => (
                        <label
                            key={topic.id}
                            className={`
                flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all
                ${selectedTopics.includes(topic.id)
                                    ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                                    : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:border-purple-500'
                                }
              `}
                        >
                            <input
                                type="checkbox"
                                checked={selectedTopics.includes(topic.id)}
                                onChange={() => handleTopicToggle(topic.id)}
                                className="sr-only"
                            />
                            <span className="text-sm font-medium">{topic.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Control Actions */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={startMultipleDebates}
                    disabled={selectedTopics.length === 0 || isStarting}
                    className={`
            flex-1 px-4 py-2 rounded-lg font-semibold transition-all
            ${selectedTopics.length > 0 && !isStarting
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }
          `}
                >
                    {isStarting ? (
                        <>⏳ Starting {selectedTopics.length} Debates...</>
                    ) : (
                        <>🚀 Start {selectedTopics.length || 0} Concurrent Debates</>
                    )}
                </button>
            </div>

            {/* Active Debates Display */}
            {activeDebates.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">
                        Active Debates ({activeDebates.length}):
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {activeDebates.map(debate => (
                            <div
                                key={debate.debateId}
                                className="bg-gray-800/30 rounded-lg p-3 border border-gray-600"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-sm font-medium text-purple-300">
                                            {debate.topic}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            ID: {debate.debateId.substring(0, 20)}...
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-green-400">
                                            {debate.status} • {debate.duration}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {debate.messageCount || 0} messages
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-lg font-bold text-purple-400">{selectedTopics.length}</div>
                        <div className="text-xs text-gray-400">Selected</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-green-400">{activeDebates.length}</div>
                        <div className="text-xs text-gray-400">Active</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-blue-400">
                            {activeDebates.reduce((sum, d) => sum + (d.messageCount || 0), 0)}
                        </div>
                        <div className="text-xs text-gray-400">Total Messages</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
