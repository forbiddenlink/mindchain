import React from 'react';

const mockMessages = [
    { sender: 'SenatorBot', text: 'I believe we must regulate AI to protect human values.' },
    { sender: 'ReformerBot', text: 'Regulation will stifle innovation. We need adaptive frameworks, not restrictions.' },
    { sender: 'SenatorBot', text: 'Without guardrails, the risks of misuse far outweigh the benefits.' },
    { sender: 'ReformerBot', text: 'Let’s focus on educating developers and open-source safety tools instead.' },
];

const DebatePanel = () => {
    return (
        <section className="w-full flex-grow bg-neutral-900 text-white py-6 px-4 sm:px-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl font-semibold mb-4 border-b border-neutral-700 pb-2">
                    Live Debate
                </h2>
                <div className="space-y-4">
                    {mockMessages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.sender === 'SenatorBot' ? 'justify-start' : 'justify-end'}`}
                        >
                            <div
                                className={`max-w-md px-4 py-2 rounded-lg ${msg.sender === 'SenatorBot'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-orange-500 text-white'
                                    }`}
                            >
                                <p className="text-sm font-bold">{msg.sender}</p>
                                <p>{msg.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default DebatePanel;
