// Multi-Debate Viewer - Contest Showcase for Concurrent Debates
import { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';

export default function MultiDebateViewer({ messages, activeDebates }) {
    const [selectedDebate, setSelectedDebate] = useState('all');
    const [messageFilter, setMessageFilter] = useState('all'); // all, factchecked, recent

    // Convert activeDebates Map to array for easier handling
    const activeDebatesArray = useMemo(() => {
        return Array.from(activeDebates.entries()).map(([id, data]) => ({
            id,
            ...data
        }));
    }, [activeDebates]);

    // Group messages by debate ID
    const groupedMessages = useMemo(() => {
        return messages.reduce((acc, msg) => {
            const debateId = msg.debateId || 'unknown';
            if (!acc[debateId]) {
                acc[debateId] = [];
            }
            acc[debateId].push(msg);
            return acc;
        }, {});
    }, [messages]);

    const getFilteredMessages = () => {
        let filteredMessages = [...messages];

        // Filter by debate
        if (selectedDebate !== 'all') {
            filteredMessages = filteredMessages.filter(msg => msg.debateId === selectedDebate);
        }

        // Filter by type
        switch (messageFilter) {
            case 'factchecked':
                filteredMessages = filteredMessages.filter(msg => msg.factCheck);
                break;
            case 'recent':
                const oneMinuteAgo = new Date(Date.now() - 60000);
                filteredMessages = filteredMessages.filter(msg => new Date(msg.timestamp) > oneMinuteAgo);
                break;
            default:
                break;
        }

        return filteredMessages.slice(-50); // Show last 50 messages
    };

    const getDebateColor = (debateId) => {
        const colors = [
            'border-purple-500 bg-purple-900/10',
            'border-blue-500 bg-blue-900/10',
            'border-green-500 bg-green-900/10',
            'border-orange-500 bg-orange-900/10',
            'border-pink-500 bg-pink-900/10',
            'border-cyan-500 bg-cyan-900/10',
            'border-yellow-500 bg-yellow-900/10',
            'border-red-500 bg-red-900/10'
        ];
        const index = activeDebatesArray.findIndex(d => d.id === debateId) % colors.length;
        return colors[index];
    };

    const getAgentColor = (agentId) => {
        return agentId === 'senatorbot' ? 'text-blue-300' : 'text-green-300';
    };

    const getDebateTopic = (debateId) => {
        const debate = activeDebates.get(debateId);
        return debate?.topic || 'Unknown Topic';
    };

    const filteredMessages = getFilteredMessages();
    const debateIds = Object.keys(groupedMessages);

    return (
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                    🎭 Multi-Debate Viewer
                    <span className="text-xs bg-blue-500/20 px-2 py-1 rounded-full text-blue-400">
                        {activeDebatesArray.length} Active
                    </span>
                </h2>
                <div className="text-sm text-slate-400">
                    {filteredMessages.length} messages
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-4 flex-wrap">
                {/* Debate Filter */}
                <select
                    value={selectedDebate}
                    onChange={(e) => setSelectedDebate(e.target.value)}
                    className="px-3 py-1 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200"
                >
                    <option value="all">All Debates ({activeDebatesArray.length})</option>
                    {activeDebatesArray.map(debate => (
                        <option key={debate.id} value={debate.id}>
                            {debate.topic} ({groupedMessages[debate.id]?.length || 0})
                        </option>
                    ))}
                </select>

                {/* Message Type Filter */}
                <select
                    value={messageFilter}
                    onChange={(e) => setMessageFilter(e.target.value)}
                    className="px-3 py-1 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200"
                >
                    <option value="all">All Messages</option>
                    <option value="factchecked">Fact-Checked Only</option>
                    <option value="recent">Recent (1 min)</option>
                </select>
            </div>

            {/* Debate Statistics */}
            {activeDebatesArray.length > 1 && selectedDebate === 'all' && (
                <div className="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-600">
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">📊 Active Debates</h3>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                        {activeDebatesArray.slice(0, 4).map(debate => (
                            <div key={debate.id} className={`p-2 rounded border ${getDebateColor(debate.id)}`}>
                                <div className="font-medium">{debate.topic}</div>
                                <div className="text-slate-400">
                                    {groupedMessages[debate.id]?.length || 0} messages •
                                    {debate.messageCount || 0} total
                                </div>
                            </div>
                        ))}
                    </div>
                    {activeDebatesArray.length > 4 && (
                        <div className="text-xs text-slate-400 mt-2 text-center">
                            +{activeDebatesArray.length - 4} more debates
                        </div>
                    )}
                </div>
            )}

            {/* Messages Display */}
            <div className="flex-1 overflow-y-auto space-y-3">
                {filteredMessages.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                        <div className="text-4xl mb-2">💭</div>
                        <div>No messages match your filters</div>
                        <div className="text-sm mt-1">
                            {activeDebatesArray.length === 0 ? 'Start a debate to see messages here' : 'Try adjusting your filters'}
                        </div>
                    </div>
                ) : (
                    filteredMessages.map((msg, index) => (
                        <div
                            key={`${msg.debateId}-${msg.id}-${index}`}
                            className={`p-3 rounded-lg border ${getDebateColor(msg.debateId)} transition-all hover:shadow-lg`}
                        >
                            {/* Message Header */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`font-semibold ${getAgentColor(msg.agentId)}`}>
                                        {msg.sender || msg.agentName}
                                    </span>
                                    {activeDebatesArray.length > 1 && selectedDebate === 'all' && (
                                        <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                                            {getDebateTopic(msg.debateId)}
                                        </span>
                                    )}
                                    {msg.factCheck && (
                                        <span className="text-xs bg-green-600/20 px-2 py-1 rounded text-green-400 border border-green-500/20">
                                            ✅ Fact-Checked
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-slate-400">
                                    {msg.timestamp ? formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true }) : 'now'}
                                </div>
                            </div>

                            {/* Message Content */}
                            <div className="text-slate-200 text-sm leading-relaxed">
                                {msg.text || msg.message}
                            </div>

                            {/* Fact Check Display */}
                            {msg.factCheck && (
                                <div className="mt-2 p-2 bg-green-900/20 border border-green-500/20 rounded text-xs">
                                    <div className="text-green-400 font-medium">Related Fact:</div>
                                    <div className="text-green-200 mt-1">{msg.factCheck.fact}</div>
                                    <div className="text-green-400 mt-1">
                                        Confidence: {Math.round(msg.factCheck.score * 100)}%
                                    </div>
                                </div>
                            )}

                            {/* Metrics Badge */}
                            {msg.metrics && (
                                <div className="mt-2 flex gap-2 text-xs">
                                    <span className="bg-blue-600/20 px-2 py-1 rounded text-blue-300">
                                        #{msg.metrics.thisDebateMessages}
                                    </span>
                                    <span className="bg-purple-600/20 px-2 py-1 rounded text-purple-300">
                                        {msg.metrics.activeDebates} active
                                    </span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Real-time Activity Indicator */}
            {filteredMessages.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-600 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Live updates from {activeDebatesArray.length} concurrent debates
                    </div>
                </div>
            )}
        </div>
    );
}
