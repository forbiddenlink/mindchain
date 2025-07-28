import React, { useState } from 'react';

const TopicSelector = ({ onTopicChange, currentTopic, disabled }) => {
    const [showCustom, setShowCustom] = useState(false);
    const [customTopic, setCustomTopic] = useState('');

    const predefinedTopics = [
        {
            id: 'climate_policy',
            name: 'Climate Change Policy',
            description: 'Environmental regulations vs economic growth'
        },
        {
            id: 'ai_regulation',
            name: 'AI Regulation',
            description: 'Government oversight of artificial intelligence'
        },
        {
            id: 'healthcare_reform',
            name: 'Healthcare Reform',
            description: 'Universal healthcare vs private systems'
        },
        {
            id: 'immigration_policy',
            name: 'Immigration Policy',
            description: 'Border security and immigration reform'
        },
        {
            id: 'education_funding',
            name: 'Education Funding',
            description: 'Public vs private education investment'
        },
        {
            id: 'tax_policy',
            name: 'Tax Policy',
            description: 'Progressive taxation and wealth distribution'
        }
    ];

    const handleTopicSelect = (topic) => {
        onTopicChange(topic.name);
        setShowCustom(false);
    };

    const handleCustomSubmit = () => {
        if (customTopic.trim()) {
            onTopicChange(customTopic.trim());
            setCustomTopic('');
            setShowCustom(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Debate Topic
                </label>

                {/* Predefined Topics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    {predefinedTopics.map((topic) => (
                        <button
                            key={topic.id}
                            onClick={() => handleTopicSelect(topic)}
                            disabled={disabled}
                            className={`p-3 rounded-lg border text-left transition-colors ${currentTopic === topic.name
                                    ? 'bg-blue-600 border-blue-500 text-white'
                                    : 'bg-neutral-800 border-neutral-600 text-gray-300 hover:bg-neutral-700'
                                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500'}`}
                        >
                            <div className="font-medium text-sm">{topic.name}</div>
                            <div className="text-xs opacity-75 mt-1">{topic.description}</div>
                        </button>
                    ))}
                </div>

                {/* Custom Topic */}
                <div className="border-t border-neutral-600 pt-3">
                    {!showCustom ? (
                        <button
                            onClick={() => setShowCustom(true)}
                            disabled={disabled}
                            className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-lg text-gray-300 text-left hover:bg-neutral-700 hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="font-medium text-sm">+ Custom Topic</div>
                            <div className="text-xs opacity-75 mt-1">Enter your own debate topic</div>
                        </button>
                    ) : (
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={customTopic}
                                onChange={(e) => setCustomTopic(e.target.value)}
                                placeholder="Enter custom debate topic..."
                                className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCustomSubmit}
                                    disabled={!customTopic.trim()}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                                >
                                    Use Topic
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCustom(false);
                                        setCustomTopic('');
                                    }}
                                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TopicSelector;
