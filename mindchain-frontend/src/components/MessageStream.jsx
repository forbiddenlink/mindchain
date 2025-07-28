import React from 'react';

const MessageStream = ({ messages = [] }) => {

    const getMessageStyle = (type) => {
        switch (type) {
            case 'system':
                return 'border-blue-500 bg-blue-900/20 text-blue-300';
            case 'info':
                return 'border-gray-500 bg-gray-900/20 text-gray-300';
            case 'success':
                return 'border-green-500 bg-green-900/20 text-green-300';
            case 'warning':
                return 'border-yellow-500 bg-yellow-900/20 text-yellow-300';
            case 'error':
                return 'border-red-500 bg-red-900/20 text-red-300';
            default:
                return 'border-gray-500 bg-gray-900/20 text-gray-300';
        }
    };

    return (
        <section className="bg-neutral-900 rounded-lg p-4 border border-neutral-700">
            <h3 className="text-lg font-semibold mb-3 text-white flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                System Status
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {messages.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">No system messages yet</p>
                ) : (
                    messages.slice(-5).map((msg, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-lg border-l-4 ${getMessageStyle(msg.type)}`}
                        >
                            <div className="flex justify-between items-start">
                                <p className="text-sm">{msg.content}</p>
                                <span className="text-xs opacity-70 ml-2">{msg.timestamp}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
};

export default MessageStream;