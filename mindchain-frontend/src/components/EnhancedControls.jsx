// Enhanced Controls - Single interface for both standard and multi-debate modes
import { useState } from 'react';
import api from '../services/api';
import Icon from './Icon';

const DEBATE_TOPICS = [
    { id: 'climate', name: 'Climate Policy', description: 'Environmental regulations and green energy', icon: 'climate' },
    { id: 'ai', name: 'AI Regulation', description: 'Artificial intelligence governance and ethics', icon: 'ai' },
    { id: 'healthcare', name: 'Healthcare Reform', description: 'Universal healthcare and medical access', icon: 'healthcare' },
    { id: 'immigration', name: 'Immigration Policy', description: 'Border security and refugee assistance', icon: 'immigration' },
    { id: 'education', name: 'Education Reform', description: 'Public education and student debt', icon: 'education' },
    { id: 'taxation', name: 'Tax Policy', description: 'Progressive taxation and wealth redistribution', icon: 'taxation' },
    { id: 'privacy', name: 'Digital Privacy', description: 'Data protection and surveillance', icon: 'privacy' },
    { id: 'space', name: 'Space Exploration', description: 'Space colonization and research funding', icon: 'space' }
];

export default function EnhancedControls({ 
    viewMode, 
    activeDebates, 
    currentDebateId, 
    debateMessages = [], 
    isDebating = false,
    onMetricsUpdate, 
    onStopCurrentDebate, 
    onClearConversation,
    onDebateStarted 
}) {
    const [selectedTopics, setSelectedTopics] = useState(['climate']);
    const [customTopic, setCustomTopic] = useState('');
    const [isStarting, setIsStarting] = useState(false);
    const [isAddingTopic, setIsAddingTopic] = useState(false);

    const handleTopicToggle = (topicId) => {
        if (viewMode === 'standard') {
            // Standard mode: single selection
            setSelectedTopics([topicId]);
        } else {
            // Multi-debate mode: multiple selection
            setSelectedTopics(prev =>
                prev.includes(topicId)
                    ? prev.filter(id => id !== topicId)
                    : [...prev, topicId]
            );
        }
    };

    const addCustomTopic = () => {
        if (customTopic.trim()) {
            const customTopicObj = {
                id: `custom_${Date.now()}`,
                name: customTopic,
                description: customTopic.trim(),
                icon: 'idea'
            };

            DEBATE_TOPICS.push(customTopicObj);
            setSelectedTopics(prev => [...prev, customTopicObj.id]);
            setCustomTopic('');
            setIsAddingTopic(false);
        }
    };

    const startDebates = async () => {
        if (selectedTopics.length === 0) {
            alert('Please select at least one topic');
            return;
        }

        setIsStarting(true);
        try {
            if (viewMode === 'multi-debate' && selectedTopics.length > 1) {
                // Multi-debate mode: start multiple debates
                const topics = selectedTopics.map(id =>
                    DEBATE_TOPICS.find(t => t.id === id)?.description || id
                );

                try {
                    await api.startMultipleDebates(topics);
                    console.log(`🚀 Started ${topics.length} concurrent debates!`);
                } catch (error) {
                    // Fallback: start individually
                    for (const topic of topics) {
                        try {
                            await api.startDebate({
                                topic,
                                debateId: `multi_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
                            });
                        } catch (singleError) {
                            console.error(`Failed to start debate for: ${topic}`, singleError);
                        }
                    }
                }
            } else {
                // Standard mode: single debate
                // Stop current debate first if one is running
                if (currentDebateId && onStopCurrentDebate) {
                    console.log('🛑 Stopping current debate before starting new one...');
                    await onStopCurrentDebate();
                    // Small delay to ensure stop is processed
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                const topic = DEBATE_TOPICS.find(t => t.id === selectedTopics[0])?.description || selectedTopics[0];
                const response = await api.startDebate({ 
                    topic,
                    debateId: 'standard_debate' // Use consistent ID for standard mode
                });
                console.log(`🎯 Started single debate: ${topic}`);
                
                // Notify parent of the new debate ID
                if (onDebateStarted && response.debateId) {
                    onDebateStarted(response.debateId);
                }
            }

            if (onMetricsUpdate) {
                onMetricsUpdate();
            }

        } catch (error) {
            console.error('Failed to start debates:', error);
            alert('Failed to start debates. Please try again.');
        } finally {
            setIsStarting(false);
        }
    };

    const stopAllDebates = async () => {
        try {
            // Try to stop all active debates
            for (const [debateId] of activeDebates) {
                try {
                    await api.stopDebate(debateId);
                } catch (error) {
                    console.error(`Failed to stop debate ${debateId}:`, error);
                }
            }
        } catch (error) {
            console.error('Failed to stop debates:', error);
        }
    };

    return (
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-xl p-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

                {/* Column 1: Mode & Status */}
                <div className="lg:col-span-1">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                            {viewMode === 'multi-debate' ? (
                                <>
                                    <Icon name="multi-debate" size={20} className="text-purple-400" />
                                    Multi-Debate
                                </>
                            ) : viewMode === 'analytics' ? (
                                <>
                                    <Icon name="analytics" size={20} className="text-blue-400" />
                                    Analytics Dashboard
                                </>
                            ) : (
                                <>
                                    <Icon name="target" size={20} className="text-green-400" />
                                    Single Debate
                                </>
                            )}
                        </h2>
                        {viewMode === 'standard' && currentDebateId ? (
                            <div className="flex items-center gap-2">
                                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-sm border border-green-500/20">
                                    Active
                                </span>
                                <button
                                    onClick={onStopCurrentDebate}
                                    className="px-2 py-1 bg-red-600/20 border border-red-500/20 rounded text-red-300 hover:bg-red-600/30 transition-colors text-sm flex items-center gap-1"
                                >
                                    <Icon name="stop" size={14} />
                                    Stop
                                </button>
                                {debateMessages.length > 0 && (
                                    <button
                                        onClick={onClearConversation}
                                        className="px-2 py-1 bg-slate-600/20 border border-slate-500/20 rounded text-slate-300 hover:bg-slate-600/30 transition-colors text-sm flex items-center gap-1"
                                    >
                                        <Icon name="trash" size={14} />
                                        Clear
                                    </button>
                                )}
                            </div>
                        ) : viewMode === 'multi-debate' && activeDebates.size > 0 ? (
                            <div className="flex items-center gap-2">
                                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-sm border border-green-500/20">
                                    {activeDebates.size} Active
                                </span>
                                <button
                                    onClick={stopAllDebates}
                                    className="px-2 py-1 bg-red-600/20 border border-red-500/20 rounded text-red-300 hover:bg-red-600/30 transition-colors text-sm flex items-center gap-1"
                                >
                                    <Icon name="stop" size={14} />
                                    Stop All
                                </button>
                                {debateMessages.length > 0 && (
                                    <button
                                        onClick={onClearConversation}
                                        className="px-2 py-1 bg-slate-600/20 border border-slate-500/20 rounded text-slate-300 hover:bg-slate-600/30 transition-colors text-sm flex items-center gap-1"
                                    >
                                        <Icon name="trash" size={14} />
                                        Clear All
                                    </button>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Column 2-3: Topic Selection Grid - Hide in analytics mode */}
                {viewMode !== 'analytics' && (
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-slate-300">
                            {viewMode === 'multi-debate'
                                ? `Topics (${selectedTopics.length} selected):`
                                : 'Select Topic:'
                            }
                        </h3>
                        <button
                            onClick={() => setIsAddingTopic(!isAddingTopic)}
                            className="text-xs bg-blue-600/20 px-2 py-1 rounded border border-blue-500/20 text-blue-300 hover:bg-blue-600/30 transition-colors flex items-center gap-1"
                        >
                            {isAddingTopic ? (
                                <>
                                    <Icon name="remove" size={12} />
                                    Cancel
                                </>
                            ) : (
                                <>
                                    <Icon name="add" size={12} />
                                    Custom
                                </>
                            )}
                        </button>
                    </div>

                    {/* Custom Topic Input */}
                    {isAddingTopic && (
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={customTopic}
                                onChange={(e) => setCustomTopic(e.target.value)}
                                placeholder="Enter custom debate topic..."
                                className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-slate-200 text-sm"
                                onKeyPress={(e) => e.key === 'Enter' && addCustomTopic()}
                            />
                            <button
                                onClick={addCustomTopic}
                                disabled={!customTopic.trim()}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${customTopic.trim()
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                Add
                            </button>
                        </div>
                    )}

                    {/* Topic Grid - Optimized for horizontal space */}
                    <div className="grid grid-cols-4 gap-1">
                        {DEBATE_TOPICS.map(topic => (
                            <label
                                key={topic.id}
                                className={`
                  flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-all text-xs
                  ${selectedTopics.includes(topic.id)
                                        ? 'bg-blue-500/20 border-blue-400 text-blue-200'
                                        : 'bg-slate-800/50 border-slate-600 text-slate-300 hover:border-blue-500'
                                    }
                `}
                            >
                                <input
                                    type={viewMode === 'multi-debate' ? 'checkbox' : 'radio'}
                                    name="topic"
                                    checked={selectedTopics.includes(topic.id)}
                                    onChange={() => handleTopicToggle(topic.id)}
                                    className="sr-only"
                                />
                                <span className="flex items-center gap-2 font-medium text-center">
                                    <Icon name={topic.icon} size={16} className="flex-shrink-0" />
                                    <span className="truncate">{topic.name}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
                )}

                {/* Analytics Mode Info Panel */}
                {viewMode === 'analytics' && (
                <div className="lg:col-span-2">
                    <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-3">
                        <h3 className="text-sm font-semibold text-slate-300 mb-2">Performance Monitoring</h3>
                        <div className="text-xs text-slate-400 space-y-1">
                            <div>• Real-time Redis metrics and operations</div>
                            <div>• Multi-model database performance (JSON, Streams, TimeSeries, Vector)</div>
                            <div>• Debate engine statistics and agent interactions</div>
                            <div>• System health and connection monitoring</div>
                        </div>
                        <div className="mt-2 text-xs text-blue-400 flex items-center gap-1">
                            <Icon name="idea" size={14} />
                            Switch to Standard or Multi-Debate mode to start new debates
                        </div>
                    </div>
                </div>
                )}

                {/* Column 4: Action Buttons & Active Debates */}
                <div className="lg:col-span-1">
                    <div className="flex flex-col gap-2">
                        {viewMode !== 'analytics' ? (
                            <button
                                onClick={startDebates}
                                disabled={selectedTopics.length === 0 || isStarting || (viewMode === 'standard' && currentDebateId)}
                                className={`
                    w-full px-3 py-2 rounded-lg font-semibold transition-all text-sm flex items-center justify-center
                    ${selectedTopics.length > 0 && !isStarting && !(viewMode === 'standard' && currentDebateId)
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    }
                  `}
                            >
                                {isStarting ? (
                                    <>
                                        <Icon name="loading" size={16} className="animate-spin mr-2" />
                                        Starting...
                                    </>
                                ) : viewMode === 'standard' && currentDebateId ? (
                                    <>
                                        <Icon name="pause" size={16} className="mr-2" />
                                        Debate Active
                                    </>
                                ) : viewMode === 'multi-debate' ? (
                                    <>
                                        <Icon name="play" size={16} className="mr-2" />
                                        Start {selectedTopics.length}
                                    </>
                                ) : (
                                    <>
                                        <Icon name="target" size={16} className="mr-2" />
                                        Start Debate
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                                <Icon name="analytics" size={16} />
                                Analytics View Active
                            </div>
                        )}

                        {/* Active Debates Compact View */}
                        {activeDebates.size > 0 && (
                            <div className="mt-2">
                                <div className="text-xs text-slate-400 mb-1">Active:</div>
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                    {Array.from(activeDebates.entries()).slice(0, 4).map(([id, debate]) => (
                                        <div
                                            key={id}
                                            className="text-xs bg-slate-700 px-2 py-1 rounded border border-slate-600 text-slate-300"
                                        >
                                            <div className="font-medium truncate">{debate.topic}</div>
                                            <div className="text-slate-500">{debate.messageCount || 0} msgs</div>
                                        </div>
                                    ))}
                                    {activeDebates.size > 4 && (
                                        <div className="text-xs text-slate-400 text-center">
                                            +{activeDebates.size - 4} more...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
