import React, { useEffect, useRef } from 'react';

const DebatePanel = ({ messages = [] }) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const getAgentColor = (agentId) => {
        switch (agentId) {
            case 'senatorbot':
                return 'bg-blue-600';
            case 'reformerbot':
                return 'bg-orange-500';
            default:
                return 'bg-gray-600';
        }
    };

    return (
        <section className="w-full flex-grow bg-neutral-900 text-white py-6 px-4 sm:px-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl font-semibold mb-4 border-b border-neutral-700 pb-2">
                    Live Debate
                </h2>

                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <p>🤖 Waiting for agents to join the debate...</p>
                        <p className="text-sm mt-2">Use the controls panel to start a new debate session</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 p-3 bg-green-900/20 border border-green-600 rounded-lg">
                            <p className="text-green-400 font-medium text-sm">
                                🟢 LIVE DEBATE - {messages.length} messages
                            </p>
                        </div>
                        <div className="space-y-4">
                            {messages.map((msg, index) => (
                                <div
                                    key={msg.id || index}
                                    className={`flex ${msg.agentId === 'senatorbot' ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div
                                        className={`max-w-md px-4 py-3 rounded-lg ${getAgentColor(msg.agentId)} text-white shadow-lg`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-sm font-bold">{msg.sender}</p>
                                            {msg.timestamp && (
                                                <span className="text-xs opacity-70">
                                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm leading-relaxed">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

export default DebatePanel;
