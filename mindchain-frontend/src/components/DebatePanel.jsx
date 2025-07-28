import React, { useEffect, useRef } from 'react';

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
                    avatar: (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                        </svg>
                    ),
                    name: 'SenatorBot'
                };
            case 'reformerbot':
                return {
                    bgColor: 'bg-gradient-to-r from-orange-500 to-red-500',
                    avatar: (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" />
                        </svg>
                    ),
                    name: 'ReformerBot'
                };
            default:
                return {
                    bgColor: 'bg-gradient-to-r from-gray-500 to-gray-600',
                    avatar: (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                        </svg>
                    ),
                    name: 'Agent'
                };
        }
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 border-b border-slate-600/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                            </svg>
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
            <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-900/20 to-slate-900/40">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-300 mb-2">
                            Ready for Debate
                        </h3>
                        <p className="text-slate-400 text-sm max-w-sm">
                            Click "Start Debate" in the controls panel to watch AI agents engage in real-time discussion
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
                                    <div className={`flex items-start space-x-3 max-w-2xl ${!isLeft ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                        {/* Avatar */}
                                        <div className={`w-10 h-10 ${agentStyle.bgColor} rounded-full flex items-center justify-center shadow-lg flex-shrink-0`}>
                                            {agentStyle.avatar}
                                        </div>

                                        {/* Message Bubble */}
                                        <div className={`relative px-4 py-3 rounded-2xl shadow-lg ${isLeft
                                                ? 'bg-slate-700/80 rounded-tl-sm'
                                                : 'bg-gradient-to-r from-blue-600 to-purple-600 rounded-tr-sm'
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
