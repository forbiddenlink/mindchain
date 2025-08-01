import React, { useEffect, useRef } from 'react';
import Icon from './Icon';
import SentimentBadge from './SentimentBadge';

const DebatePanel = ({ messages = [] }) => {
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const lastMessageCountRef = useRef(0);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'nearest'
                });
            }, 100);
        }
    };

    useEffect(() => {
        if (messages.length > lastMessageCountRef.current && messages.length > 0) {
            scrollToBottom();
        }
        lastMessageCountRef.current = messages.length;
    }, [messages]);

    const getAgentStyle = (agentId) => {
        switch (agentId) {
            case 'senatorbot':
                return {
                    gradient: 'from-blue-600 via-blue-500 to-indigo-600',
                    avatar: <Icon name="user" size={20} className="text-white" />,
                    name: 'SenatorBot',
                    accentColor: 'blue-400',
                    bgColor: 'bg-blue-500/10 border-blue-500/20'
                };
            case 'reformerbot':
                return {
                    gradient: 'from-orange-600 via-red-500 to-pink-600',
                    avatar: <Icon name="zap" size={20} className="text-white" />,
                    name: 'ReformerBot',
                    accentColor: 'orange-400',
                    bgColor: 'bg-orange-500/10 border-orange-500/20'
                };
            default:
                return {
                    gradient: 'from-gray-600 to-gray-700',
                    avatar: <Icon name="message" size={20} className="text-white" />,
                    name: 'Agent',
                    accentColor: 'gray-400',
                    bgColor: 'bg-gray-500/10 border-gray-500/20'
                };
        }
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="h-full flex flex-col card-elevated animate-fade-in">
            {/* Enhanced Header */}
            <div className="flex-shrink-0 glass-panel px-6 py-4 border-b border-slate-700/50 rounded-t-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Icon name="message-circle" size={20} className="text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-800 animate-pulse"></div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white font-display">Live Debate</h2>
                            <p className="text-slate-400 text-sm">Real-time AI discussion</p>
                        </div>
                    </div>

                    {messages.length > 0 && (
                        <div className="flex items-center space-x-4">
                            <div className="glass-card px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                    <span className="text-emerald-400 text-sm font-medium">
                                        {messages.length} exchanges
                                    </span>
                                </div>
                            </div>
                            <div className="text-slate-400 text-sm">
                                {formatTimestamp(messages[messages.length - 1]?.timestamp)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Enhanced Messages Area */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6 min-h-0 bg-gradient-to-b from-slate-900/20 to-slate-900/40"
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
                        <div className="relative mb-8">
                            <div className="w-20 h-20 glass-card rounded-2xl flex items-center justify-center">
                                <Icon name="message-circle" size={40} className="text-slate-400" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl -z-10"></div>
                        </div>
                        <h3 className="heading-card text-white mb-4">
                            Ready for Intelligent Debate
                        </h3>
                        <p className="text-slate-400 max-w-md leading-relaxed">
                            Select a topic and start a debate to watch AI agents engage in sophisticated
                            discussion with fact-checking, memory formation, and stance evolution.
                        </p>
                        <div className="mt-6 flex items-center space-x-6 text-slate-500 text-sm">
                            <div className="flex items-center space-x-2">
                                <Icon name="brain" size={16} />
                                <span>AI Memory</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Icon name="search" size={16} />
                                <span>Fact Checking</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Icon name="trending-up" size={16} />
                                <span>Stance Evolution</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, index) => {
                            const agentStyle = getAgentStyle(msg.agentId);
                            const isLeft = msg.agentId === 'senatorbot';
                            const prevMessage = messages[index - 1];
                            const showAvatar = !prevMessage || prevMessage.agentId !== msg.agentId;

                            return (
                                <div
                                    key={msg.id || index}
                                    className={`flex items-start space-x-4 animate-slide-up ${isLeft ? 'flex-row' : 'flex-row-reverse space-x-reverse'
                                        }`}
                                >
                                    {/* Enhanced Avatar */}
                                    <div className={`flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                                        <div className="relative">
                                            <div className={`w-12 h-12 bg-gradient-to-r ${agentStyle.gradient} rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-300`}>
                                                {agentStyle.avatar}
                                            </div>
                                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 bg-${agentStyle.accentColor} rounded-full border-2 border-slate-900`}></div>
                                        </div>
                                    </div>

                                    {/* Enhanced Message Bubble */}
                                    <div className={`flex-1 max-w-3xl ${isLeft ? 'mr-12' : 'ml-12'}`}>
                                        {showAvatar && (
                                            <div className={`flex items-center space-x-3 mb-2 ${isLeft ? 'justify-start' : 'justify-end'
                                                }`}>
                                                <span className={`text-${agentStyle.accentColor} font-semibold text-sm`}>
                                                    {agentStyle.name}
                                                </span>
                                                <span className="text-slate-500 text-xs">
                                                    {formatTimestamp(msg.timestamp)}
                                                </span>
                                                {msg.sentiment && (
                                                    <SentimentBadge sentiment={msg.sentiment} />
                                                )}
                                            </div>
                                        )}

                                        <div className={`glass-card p-4 rounded-2xl border ${agentStyle.bgColor} ${isLeft ? 'rounded-tl-md' : 'rounded-tr-md'
                                            } hover:shadow-lg transition-all duration-300`}>
                                            <p className="text-white leading-relaxed text-base">
                                                {msg.text}
                                            </p>

                                            {/* Fact Check Indicator */}
                                            {msg.factCheck && (
                                                <div className="mt-3 pt-3 border-t border-slate-600/30">
                                                    <div className="flex items-center space-x-2">
                                                        <Icon name="shield-check" size={14} className="text-blue-400" />
                                                        <span className="text-blue-400 text-xs font-medium">
                                                            Fact Check: {(msg.factCheck.score * 100).toFixed(0)}% confidence
                                                        </span>
                                                    </div>
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
