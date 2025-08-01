// True Multi-Debate Viewer - Shows multiple debates simultaneously
import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
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

function DebateColumn({ debate, messages, onTopicChange, onStop, index }) {
    const [isChangingTopic, setIsChangingTopic] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState('climate');

    const debateMessages = messages.filter(msg => msg.debateId === debate.id);
    const recentMessages = debateMessages.slice(-10); // Show last 10 messages

    const getAgentColor = (agentId) => {
        return agentId === 'senatorbot' ? 'text-blue-300' : 'text-green-300';
    };

    const getDebateColor = () => {
        const colors = [
            'border-purple-500 bg-purple-900/5',
            'border-blue-500 bg-blue-900/5',
            'border-green-500 bg-green-900/5',
            'border-orange-500 bg-orange-900/5',
            'border-pink-500 bg-pink-900/5',
            'border-cyan-500 bg-cyan-900/5'
        ];
        return colors[index % colors.length];
    };

    const handleTopicChange = async () => {
        const newTopic = DEBATE_TOPICS.find(t => t.id === selectedTopic)?.description;
        if (newTopic && onTopicChange) {
            await onTopicChange(debate.id, newTopic);
            setIsChangingTopic(false);
        }
    };

    return (
        <div className={`flex flex-col h-full border rounded-xl p-3 ${getDebateColor()} min-h-0 overflow-hidden`}>
            {/* Debate Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-600 flex-shrink-0">
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-200 text-sm truncate">{debate.topic}</h3>
                    <div className="text-xs text-slate-400">
                        {debateMessages.length} messages • {debate.status}
                    </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                    <button
                        onClick={() => setIsChangingTopic(!isChangingTopic)}
                        className="text-xs bg-blue-600/20 px-2 py-1 rounded border border-blue-500/20 text-blue-300 hover:bg-blue-600/30 transition-colors flex items-center"
                    >
                        <Icon name="settings" size={12} />
                    </button>
                    <button
                        onClick={() => onStop && onStop(debate.id)}
                        className="text-xs bg-red-600/20 px-2 py-1 rounded border border-red-500/20 text-red-300 hover:bg-red-600/30 transition-colors flex items-center"
                    >
                        <Icon name="stop" size={12} />
                    </button>
                </div>
            </div>

            {/* Topic Change Interface */}
            {isChangingTopic && (
                <div className="mb-2 p-2 bg-slate-800/50 rounded border border-slate-600 flex-shrink-0">
                    <div className="text-xs text-slate-300 mb-2">Change Topic:</div>
                    <select
                        value={selectedTopic}
                        onChange={(e) => setSelectedTopic(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200 mb-2"
                    >
                        {DEBATE_TOPICS.map(topic => (
                            <option key={topic.id} value={topic.id}>
                                {topic.name}
                            </option>
                        ))}
                    </select>
                    <div className="flex gap-1">
                        <button
                            onClick={handleTopicChange}
                            className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                            Change
                        </button>
                        <button
                            onClick={() => setIsChangingTopic(false)}
                            className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                {recentMessages.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                        <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mb-3 mx-auto">
                            <Icon name="message" size={24} className="text-slate-500" />
                        </div>
                        <div className="text-xs">No messages yet</div>
                    </div>
                ) : (
                    recentMessages.map((msg, msgIndex) => (
                        <div
                            key={`${msg.id}-${msgIndex}`}
                            className="p-2 rounded-lg bg-slate-800/30 border border-slate-700/50"
                        >
                            {/* Message Header */}
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-semibold ${getAgentColor(msg.agentId)}`}>
                                    {msg.sender}
                                </span>
                                <div className="flex items-center gap-1">
                                    {msg.factCheck && (
                                        <span className="text-xs bg-green-600/20 px-1 py-0.5 rounded text-green-400 flex items-center gap-1">
                                            <Icon name="success" size={10} />
                                        </span>
                                    )}
                                    <span className="text-xs text-slate-400">
                                        {msg.timestamp ? formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true }) : 'now'}
                                    </span>
                                </div>
                            </div>

                            {/* Message Content */}
                            <div className="text-slate-200 text-xs leading-relaxed">
                                {msg.text || msg.message}
                            </div>

                            {/* Fact Check */}
                            {msg.factCheck && (
                                <div className="mt-1 p-1 bg-green-900/20 border border-green-500/20 rounded text-xs">
                                    <div className="text-green-400 font-medium text-xs">Fact:</div>
                                    <div className="text-green-200 text-xs">{msg.factCheck.fact}</div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Status Footer */}
            <div className="mt-2 pt-2 border-t border-gray-600 text-center flex-shrink-0">
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    Live • {debate.messageCount || 0} total
                </div>
            </div>
        </div>
    );
}

export default function TrueMultiDebateViewer({ messages, activeDebates, onMetricsUpdate }) {
    const [maxDebates, setMaxDebates] = useState(4);

    // Convert activeDebates Map to array
    const activeDebatesArray = useMemo(() => {
        return Array.from(activeDebates.entries())
            .map(([id, data]) => ({ id, ...data }))
            .slice(0, maxDebates);
    }, [activeDebates, maxDebates]);

    const handleTopicChange = async (debateId, newTopic) => {
        try {
            // Stop the old debate
            await api.stopDebate(debateId);

            // Start a new debate with the new topic
            await api.startDebate({
                topic: newTopic,
                debateId: `changed_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
            });

            if (onMetricsUpdate) {
                onMetricsUpdate();
            }
        } catch (error) {
            console.error('Failed to change topic:', error);
            alert('Failed to change topic. Please try again.');
        }
    };

    const handleStopDebate = async (debateId) => {
        try {
            await api.stopDebate(debateId);
            if (onMetricsUpdate) {
                onMetricsUpdate();
            }
        } catch (error) {
            console.error('Failed to stop debate:', error);
        }
    };

    const startNewDebate = async () => {
        try {
            await api.startDebate({
                topic: 'Climate Policy',
                debateId: `new_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
            });
            if (onMetricsUpdate) {
                onMetricsUpdate();
            }
        } catch (error) {
            console.error('Failed to start new debate:', error);
        }
    };

    return (
        <div className="h-full flex flex-col max-w-full overflow-hidden bg-gradient-to-br from-neutral-900/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-600/50">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                    <Icon name="multi-debate" size={20} className="mr-2 text-purple-400" />
                    Multi-Debate Arena
                    <span className="text-xs bg-purple-500/20 px-2 py-1 rounded-full text-purple-400">
                        {activeDebatesArray.length} Active
                    </span>
                </h2>
                <div className="flex items-center gap-2">
                    <select
                        value={maxDebates}
                        onChange={(e) => setMaxDebates(Number(e.target.value))}
                        className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200"
                    >
                        <option value={2}>2 Debates</option>
                        <option value={3}>3 Debates</option>
                        <option value={4}>4 Debates</option>
                        <option value={6}>6 Debates</option>
                    </select>
                    <button
                        onClick={startNewDebate}
                        className="px-3 py-1 bg-green-600/20 border border-green-500/20 rounded text-green-300 text-xs hover:bg-green-600/30 transition-colors flex items-center gap-1"
                    >
                        <Icon name="add" size={14} />
                        New Debate
                    </button>
                </div>
            </div>

            {/* Multi-Debate Grid */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {activeDebatesArray.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400">
                        <div className="text-center max-w-md mx-auto">
                            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                                <Icon name="multi-debate" size={32} className="text-purple-400" />
                            </div>
                            <div className="text-lg mb-2">No Active Debates</div>
                            <div className="text-sm">Start multiple debates to see them here simultaneously</div>
                            <button
                                onClick={startNewDebate}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                            >
                                <Icon name="play" size={16} />
                                Start First Debate
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={`
            grid gap-3 h-full overflow-hidden
            ${activeDebatesArray.length === 1 ? 'grid-cols-1' :
                            activeDebatesArray.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
                                activeDebatesArray.length <= 4 ? 'grid-cols-1 lg:grid-cols-2' :
                                    'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}
          `}>
                        {activeDebatesArray.map((debate, index) => (
                            <DebateColumn
                                key={debate.id}
                                debate={debate}
                                messages={messages}
                                onTopicChange={handleTopicChange}
                                onStop={handleStopDebate}
                                index={index}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Summary Footer */}
            {activeDebatesArray.length > 0 && (
                <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-600">
                    <div className="flex justify-between items-center text-sm">
                        <div className="text-slate-300">
                            <span className="font-semibold">{activeDebatesArray.length}</span> concurrent debates •{' '}
                            <span className="font-semibold">
                                {messages.length}
                            </span> total messages
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Real-time updates
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
