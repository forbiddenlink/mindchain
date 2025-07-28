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
        <section className="bg-neutral-900 rounded-lg p-6 border border-neutral-700">
            <h3 className="text-xl font-semibold mb-4 text-white">System Messages</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div 
                        key={index}
                        className={`p-3 rounded-lg border-l-4 ${getMessageStyle(msg.type)}`}
                    >
                        <div className="flex justify-between items-start">
                            <p className="text-sm">{msg.content}</p>
                            <span className="text-xs opacity-70 ml-2">{msg.timestamp}</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default MessageStream;