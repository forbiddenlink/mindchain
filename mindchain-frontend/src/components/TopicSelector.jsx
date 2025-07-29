import React, { useState } from 'react';
import Icon from './Icon';

const TopicSelector = ({ onTopicChange, currentTopic, disabled }) => {
    const [showCustom, setShowCustom] = useState(false);
    const [customTopic, setCustomTopic] = useState('');

    const predefinedTopics = [
        {
            id: 'climate_policy',
            name: 'Climate Change Policy',
            description: 'Environmental regulations vs economic growth',
            icon: 'climate'
        },
        {
            id: 'ai_regulation',
            name: 'AI Regulation & Ethics',
            description: 'Government oversight of artificial intelligence',
            icon: 'ai'
        },
        {
            id: 'healthcare_reform',
            name: 'Universal Healthcare',
            description: 'Single-payer vs private insurance systems',
            icon: 'healthcare'
        },
        {
            id: 'immigration_policy',
            name: 'Immigration & Border Security',
            description: 'Border control vs humanitarian considerations',
            icon: 'immigration'
        },
        {
            id: 'education_funding',
            name: 'Education System Reform',
            description: 'Public funding vs school choice initiatives',
            icon: 'education'
        },
        {
            id: 'tax_policy',
            name: 'Progressive Taxation',
            description: 'Wealth redistribution and income inequality',
            icon: 'taxation'
        },
        {
            id: 'social_media',
            name: 'Social Media Regulation',
            description: 'Content moderation vs free speech protections',
            icon: 'network'
        },
        {
            id: 'space_policy',
            name: 'Space Exploration Funding',
            description: 'Public NASA vs private space ventures',
            icon: 'space'
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
                <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <span>Select Debate Topic</span>
                </label>

                {/* Predefined Topics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {predefinedTopics.map((topic) => (
                        <button
                            key={topic.id}
                            onClick={() => handleTopicSelect(topic)}
                            disabled={disabled}
                            className={`p-4 rounded-xl border text-left transition-all duration-200 transform hover:scale-[1.02] ${currentTopic === topic.name
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-400 text-white shadow-lg'
                                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50 hover:border-blue-500/50'
                                } ${disabled ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}
                        >
                            <div className="flex items-center space-x-3 mb-2">
                                <Icon name={topic.icon} size={32} className="text-blue-400" />
                                <span className="font-semibold text-sm">{topic.name}</span>
                            </div>
                            <div className="text-xs opacity-80">{topic.description}</div>
                        </button>
                    ))}
                </div>

                {/* Custom Topic */}
                <div className="border-t border-slate-600 pt-4">
                    {!showCustom ? (
                        <button
                            onClick={() => setShowCustom(true)}
                            disabled={disabled}
                            className="w-full p-4 bg-slate-700/30 border-2 border-dashed border-slate-600 rounded-xl text-slate-300 text-left hover:bg-slate-600/30 hover:border-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="flex items-center space-x-3 mb-2">
                                <Icon name="enhance" size={20} className="text-purple-400" />
                                <span className="font-semibold text-sm">Custom Topic</span>
                            </div>
                            <div className="text-xs opacity-75">Enter your own debate topic for AI agents to discuss</div>
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3 mb-3">
                                <Icon name="enhance" size={20} className="text-purple-400" />
                                <span className="font-semibold text-white">Create Custom Topic</span>
                            </div>
                            <input
                                type="text"
                                value={customTopic}
                                onChange={(e) => setCustomTopic(e.target.value)}
                                placeholder="e.g., Cryptocurrency regulation and financial innovation..."
                                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCustomSubmit}
                                    disabled={!customTopic.trim()}
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                                >
                                    <Icon name="play" size={16} className="mr-2" />
                                    Start Custom Debate
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCustom(false);
                                        setCustomTopic('');
                                    }}
                                    className="px-6 bg-slate-600 hover:bg-slate-500 text-white font-medium py-3 rounded-xl transition-colors"
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
