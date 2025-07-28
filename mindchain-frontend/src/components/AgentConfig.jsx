import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AgentConfig = ({ isVisible, onClose, agentId = 'senatorbot' }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isVisible && agentId) {
            loadProfile();
        }
    }, [isVisible, agentId]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            console.log('📡 Loading profile for agent:', agentId);
            const agentProfile = await api.getAgentProfile(agentId);
            console.log('✅ Profile loaded:', agentProfile);
            setProfile(agentProfile);
        } catch (error) {
            console.error('❌ Failed to load profile:', error);
            // Show a more user-friendly error
            setProfile({
                name: agentId === 'senatorbot' ? 'SenatorBot' : 'ReformerBot',
                role: 'AI Agent',
                tone: 'measured',
                stance: {
                    climate_policy: 0.5,
                    economic_risk: 0.5
                },
                biases: ['analytical thinking', 'evidence-based reasoning']
            });
        } finally {
            setLoading(false);
        }
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            await api.updateAgentProfile(agentId, profile);
            alert('Agent profile updated successfully!');
        } catch (error) {
            console.error('Failed to save profile:', error);
            alert('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const updateProfile = (field, value) => {
        setProfile(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const updateStance = (topic, value) => {
        setProfile(prev => ({
            ...prev,
            stance: {
                ...prev.stance,
                [topic]: parseFloat(value)
            }
        }));
    };

    const updateBiases = (biases) => {
        setProfile(prev => ({
            ...prev,
            biases: biases.split(',').map(b => b.trim()).filter(b => b)
        }));
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 border-b border-slate-600">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                {agentId === 'senatorbot' ? (
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {profile?.name || agentId}
                                </h2>
                                <p className="text-slate-400 text-sm">Agent Configuration</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-5rem)]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                <svg className="w-6 h-6 text-slate-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <p className="text-slate-400">Loading agent profile...</p>
                        </div>
                    ) : profile ? (
                        <div className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                                        Agent Name
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={(e) => updateProfile('name', e.target.value)}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                                        Role
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.role}
                                        onChange={(e) => updateProfile('role', e.target.value)}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Tone */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                    Communication Tone
                                </label>
                                <select
                                    value={profile.tone}
                                    onChange={(e) => updateProfile('tone', e.target.value)}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="measured">Measured & Diplomatic</option>
                                    <option value="passionate">Passionate & Energetic</option>
                                    <option value="analytical">Analytical & Data-Driven</option>
                                    <option value="diplomatic">Diplomatic & Consensus-Building</option>
                                    <option value="aggressive">Aggressive & Confrontational</option>
                                    <option value="cautious">Cautious & Risk-Averse</option>
                                </select>
                            </div>

                            {/* Stances */}
                            <div>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                                    </svg>
                                    <span>Policy Stances</span>
                                </h3>
                                <div className="space-y-4">
                                    {Object.entries(profile.stance || {}).map(([topic, value]) => (
                                        <div key={topic} className="bg-slate-700/50 rounded-xl p-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <label className="text-sm font-semibold text-slate-200">
                                                    {topic.replace('_', ' ').toUpperCase()}
                                                </label>
                                                <span className="text-lg font-bold text-blue-400">
                                                    {(value * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={value}
                                                onChange={(e) => updateStance(topic, e.target.value)}
                                                className="w-full h-3 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                                            />
                                            <div className="flex justify-between text-xs text-slate-400 mt-2">
                                                <span className="flex items-center space-x-1">
                                                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                                    <span>Against</span>
                                                </span>
                                                <span className="flex items-center space-x-1">
                                                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                                                    <span>Neutral</span>
                                                </span>
                                                <span className="flex items-center space-x-1">
                                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                                    <span>Support</span>
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Biases */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                    <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H17a1 1 0 110 2h-2.97l-1 4H15a1 1 0 110 2h-2.47l-.56 2.242a1 1 0 11-1.94-.485L10.47 14H7.53l-.56 2.242a1 1 0 11-1.94-.485L5.47 14H3a1 1 0 110-2h2.97l1-4H5a1 1 0 110-2h2.47l.56-2.243a1 1 0 011.213-.727zM9.03 8l-1 4h2.94l1-4H9.03z" clipRule="evenodd" />
                                        </svg>
                                        <span>Core Beliefs & Biases</span>
                                    </div>
                                </label>
                                <textarea
                                    value={profile.biases?.join(', ') || ''}
                                    onChange={(e) => updateBiases(e.target.value)}
                                    rows="4"
                                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                    placeholder="Enter core beliefs separated by commas (e.g., fiscal responsibility, environmental protection, individual liberty)"
                                />
                                <p className="text-xs text-slate-400 mt-2">
                                    These beliefs influence how the agent approaches debates and forms arguments
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-red-400 font-medium">Failed to load agent profile</p>
                            <p className="text-slate-400 text-sm mt-2">Check console for details</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {profile && (
                    <div className="bg-slate-700/50 px-6 py-4 border-t border-slate-600">
                        <div className="flex gap-3">
                            <button
                                onClick={saveProfile}
                                disabled={saving}
                                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg flex items-center justify-center space-x-2"
                            >
                                <span>
                                    {saving ? (
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z"/>
                                        </svg>
                                    )}
                                </span>
                                <span>{saving ? 'Saving Changes...' : 'Save Changes'}</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-3 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentConfig;
