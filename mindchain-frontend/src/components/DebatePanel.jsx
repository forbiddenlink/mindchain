import React, { useEffect, useRef } from 'react';
import Icon from './Icon';

const DebatePanel = ({ messages = [] }) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const getAgentStyle = (agentId) => {
        switch (agentId) {
            case 'senatorbot':
                return {
                    bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
                    avatar: <Icon name="senator" size={20} className="text-white" />,
                    name: 'SenatorBot'
                };
            case 'reformerbot':
                return {
                    bgColor: 'bg-gradient-to-r from-orange-500 to-red-500',
                    avatar: <Icon name="reformer" size={20} className="text-white" />,
                    name: 'ReformerBot'
                };
            default:
                return {
                    bgColor: 'bg-gradient-to-r from-gray-500 to-gray-600',
                    avatar: <Icon name="message" size={20} className="text-white" />,
                    name: 'Agent'
                };
        }
    };

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-slate-900/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-neutral-600/50 overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-slate-800/80 to-slate-700/80 px-6 py-4 border-b border-slate-600/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Icon name="message" size={20} className="text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Live Debate</h2>
                    </div>
                    {messages.length > 0 && (
                        <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                            <span className="text-emerald-400 text-sm font-medium">
                                {messages.length} messages
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 bg-gradient-to-b from-slate-900/20 to-slate-900/40">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                            <Icon name="message" size={32} className="text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-3">
                            Ready for Debate
                        </h3>
                        <p className="text-slate-400 max-w-md leading-relaxed text-sm">
                            Select a topic and click "Start Debate" to watch AI agents engage in real-time discussion with fact-checking and memory formation.
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, index) => {
                            const agentStyle = getAgentStyle(msg.agentId);
                            const isLeft = msg.agentId === 'senatorbot';

                            return (
                                <div
                                    key={msg.id || index}
                                    className={`flex ${isLeft ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div className={`flex items-start space-x-3 max-w-4xl ${!isLeft ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                        {/* Avatar */}
                                        <div className={`w-10 h-10 ${agentStyle.bgColor} rounded-full flex items-center justify-center shadow-lg flex-shrink-0`}>
                                            {agentStyle.avatar}
                                        </div>

                                        {/* Message Bubble */}
                                        <div className={`relative px-4 py-3 rounded-lg shadow-lg ${isLeft
                                            ? 'bg-slate-700/80 border border-slate-600/50'
                                            : 'bg-gradient-to-r from-blue-600/80 to-purple-600/80 border border-blue-500/30'
                                            }`}>
                                            {/* Agent Name and Timestamp */}
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-semibold text-white">
                                                    {agentStyle.name}
                                                </span>
                                                {msg.timestamp && (
                                                    <span className="text-xs text-slate-300 ml-3">
                                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Message Text */}
                                            <p className="text-white text-sm leading-relaxed">
                                                {msg.text}
                                            </p>

                                            {/* Fact Check Indicator */}
                                            {msg.factCheck && (
                                                <div className="mt-2 p-2 bg-green-900/30 border border-green-500/30 rounded text-xs">
                                                    <div className="text-green-400 font-medium flex items-center gap-1">
                                                        <Icon name="success" size={12} />
                                                        Fact Check
                                                    </div>
                                                    <div className="text-green-200 mt-1">{msg.factCheck.fact}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>
        </div>
    );
};

export default DebatePanel;
