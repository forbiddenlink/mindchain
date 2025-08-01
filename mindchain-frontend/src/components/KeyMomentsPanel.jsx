import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import api from '../services/api';

const KeyMomentsPanel = ({ debateId, viewMode = 'standard' }) => {
    const [keyMoments, setKeyMoments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total_moments: 0 });
    const [lastUpdate, setLastUpdate] = useState(null);

    // Fetch key moments based on view mode
    const fetchKeyMoments = async () => {
        try {
            setLoading(true);
            
            let response;
            if (viewMode === 'standard' && debateId) {
                // Single debate mode - get moments for specific debate
                response = await api.get(`/debate/${debateId}/key-moments?limit=10`);
                console.log('📊 Key moments API response:', response.data);
                setKeyMoments(response.data?.moments || []);
                setStats(response.data?.stats || { total_moments: 0 });
            } else if (viewMode === 'multi-debate' || viewMode === 'analytics') {
                // Multi-debate or analytics mode - get all moments
                response = await api.get('/key-moments/all?limit=15');
                console.log('📊 All key moments API response:', response.data);
                setKeyMoments(response.data?.moments || []);
                setStats({ total_moments: response.data?.total || 0 });
            } else {
                // No specific debate, clear moments
                setKeyMoments([]);
                setStats({ total_moments: 0 });
            }
            
            setLastUpdate(new Date().toISOString());
            
        } catch (error) {
            console.error('Error fetching key moments:', error);
            setKeyMoments([]);
            setStats({ total_moments: 0 });
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch and refresh on debate/mode changes
    useEffect(() => {
        fetchKeyMoments();
    }, [debateId, viewMode]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchKeyMoments, 30000);
        return () => clearInterval(interval);
    }, [debateId, viewMode]);

    // Handle WebSocket key moment updates
    useEffect(() => {
        const handleKeyMomentCreated = (event) => {
            if (event.detail?.type === 'key_moment_created') {
                const { moment, debateId: eventDebateId } = event.detail;
                
                // Only add if it's relevant to current view
                if (viewMode === 'standard' && eventDebateId === debateId) {
                    setKeyMoments(prev => [moment, ...prev.slice(0, 9)]);
                    setStats(prev => ({ ...prev, total_moments: prev.total_moments + 1 }));
                } else if (viewMode !== 'standard') {
                    setKeyMoments(prev => [moment, ...prev.slice(0, 14)]);
                    setStats(prev => ({ ...prev, total_moments: prev.total_moments + 1 }));
                }
            }
        };

        window.addEventListener('websocket-message', handleKeyMomentCreated);
        return () => window.removeEventListener('websocket-message', handleKeyMomentCreated);
    }, [debateId, viewMode]);

    const getMomentIcon = (type) => {
        switch (type) {
            case 'stance_flip': return 'trending-up';
            case 'questionable_claim': return 'alert-triangle';
            case 'memory_milestone': return 'brain';
            default: return 'star';
        }
    };

    const getMomentStyle = (type, significance) => {
        const base = 'p-3 rounded-lg border transition-all hover:shadow-lg';
        
        if (type === 'stance_flip') {
            return significance === 'major' 
                ? `${base} bg-blue-900/30 border-blue-600`
                : `${base} bg-blue-900/20 border-blue-700`;
        } else if (type === 'questionable_claim') {
            return significance === 'critical'
                ? `${base} bg-red-900/30 border-red-600`
                : `${base} bg-orange-900/30 border-orange-600`;
        } else if (type === 'memory_milestone') {
            return significance === 'major'
                ? `${base} bg-purple-900/30 border-purple-600`
                : `${base} bg-purple-900/20 border-purple-700`;
        }
        
        return `${base} bg-gray-900/30 border-gray-600`;
    };

    const getMomentLabel = (type, significance) => {
        const labels = {
            stance_flip: significance === 'major' ? 'MAJOR STANCE SHIFT' : 'STANCE CHANGE',
            questionable_claim: significance === 'critical' ? 'CRITICAL FACT ISSUE' : 'QUESTIONABLE CLAIM',
            memory_milestone: significance === 'major' ? 'MAJOR MILESTONE' : 'MEMORY MILESTONE'
        };
        return labels[type] || 'KEY MOMENT';
    };

    const getMomentColor = (type) => {
        const colors = {
            stance_flip: 'text-blue-400',
            questionable_claim: 'text-red-400',
            memory_milestone: 'text-purple-400'
        };
        return colors[type] || 'text-gray-400';
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    };

    const getTitle = () => {
        if (viewMode === 'standard') {
            return debateId ? 'Key Moments' : 'Key Moments';
        } else if (viewMode === 'multi-debate') {
            return 'Key Moments - All Active Debates';
        } else {
            return 'Key Moments Analytics - System Wide';
        }
    };

    const getSubtitle = () => {
        if (viewMode === 'standard') {
            return debateId ? `Current Debate: ${debateId}` : 'No active debate';
        } else if (viewMode === 'multi-debate') {
            return 'Real-time moments across all concurrent debates';
        } else {
            return 'Comprehensive analysis of all significant debate moments';
        }
    };

    return (
        <section className="h-full flex flex-col bg-gradient-to-br from-neutral-900/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-600/50 overflow-hidden">
            {/* Enhanced Header */}
            <div className="flex flex-col gap-2 mb-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                        <Icon name="star" size={20} className="mr-2 text-yellow-400" />
                        {getTitle()}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-yellow-500/20 px-2 py-1 rounded-full text-yellow-400 font-medium">
                            {stats.total_moments} total
                        </span>
                        <button
                            onClick={fetchKeyMoments}
                            disabled={loading}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                            title="Refresh key moments"
                        >
                            <Icon name="refresh" size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
                
                {/* Subtitle */}
                <p className="text-sm text-gray-400 leading-relaxed">
                    {getSubtitle()}
                </p>
                
                {/* Detection Criteria Info */}
                <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
                        Stance Flips &gt;0.3
                    </span>
                    <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20">
                        Fact Confidence &lt;0.7
                    </span>
                    <span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20">
                        Memory Milestones
                    </span>
                </div>
            </div>

            {/* Content - with calculated height to leave room for footer */}
            <div className="flex-1 flex flex-col min-h-0" style={{ paddingBottom: lastUpdate ? '2.5rem' : '0' }}>
                {loading && keyMoments.length === 0 ? (
                    <div className="text-center py-6 flex-1 flex flex-col justify-center">
                        <div className="w-10 h-10 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Icon name="loader" size={20} className="text-slate-400 animate-spin" />
                        </div>
                        <p className="text-slate-400 text-sm">Loading key moments...</p>
                    </div>
                ) : keyMoments.length === 0 ? (
                    <div className="text-center py-6 flex-1 flex flex-col justify-center">
                        <div className="w-10 h-10 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Icon name="star" size={20} className="text-slate-400" />
                        </div>
                        <p className="text-slate-400 text-sm">No key moments yet</p>
                        <p className="text-slate-500 text-xs mt-1">
                            Major stance flips (&gt;0.3) or questionable claims (&lt;0.7) will appear here
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3 overflow-y-auto overflow-x-hidden flex-1">
                        {keyMoments.map((moment, index) => (
                            <div key={`${moment.id}_${index}_${moment.timestamp || Date.now()}`} className={getMomentStyle(moment.type, moment.significance)}>
                                {/* Enhanced Header with Better Visual Hierarchy */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="p-1.5 rounded-lg bg-black/20">
                                            <Icon 
                                                name={getMomentIcon(moment.type)} 
                                                size={16} 
                                                className={getMomentColor(moment.type)} 
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <span className={`text-sm font-semibold ${getMomentColor(moment.type)} block`}>
                                                {getMomentLabel(moment.type, moment.significance)}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {formatTimeAgo(moment.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Enhanced Summary with Better Typography */}
                                <div className="mb-3">
                                    <p className="text-white text-sm leading-relaxed font-medium">
                                        {moment.summary}
                                    </p>
                                </div>

                                {/* Enhanced Metadata with Better Layout */}
                                <div className="space-y-2">
                                    {moment.metadata?.agentId && (
                                        <div className="flex items-center gap-2">
                                            <Icon name="user" size={12} className="text-gray-400" />
                                            <span className="text-xs text-gray-300 capitalize font-medium">
                                                {moment.metadata.agentId}
                                            </span>
                                            {viewMode !== 'standard' && moment.metadata?.debateId && (
                                                <>
                                                    <span className="text-gray-500">•</span>
                                                    <span className="text-xs text-gray-400 font-mono">
                                                        {moment.metadata.debateId.length > 15 ? 
                                                            moment.metadata.debateId.substring(0, 15) + '...' : 
                                                            moment.metadata.debateId
                                                        }
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Enhanced Specific metadata with visual indicators */}
                                    {moment.type === 'stance_flip' && moment.metadata?.change && (
                                        <div className="flex items-center gap-2 bg-blue-500/10 px-2 py-1 rounded">
                                            <Icon name="trending-up" size={12} className="text-blue-400" />
                                            <span className="text-xs text-blue-300 font-medium">
                                                {(moment.metadata.change * 100).toFixed(1)}% stance shift
                                            </span>
                                        </div>
                                    )}

                                    {moment.type === 'questionable_claim' && moment.metadata?.factCheckScore !== undefined && (
                                        <div className="flex items-center gap-2 bg-red-500/10 px-2 py-1 rounded">
                                            <Icon name="shield" size={12} className="text-red-400" />
                                            <span className="text-xs text-red-300 font-medium">
                                                {(moment.metadata.factCheckScore * 100).toFixed(1)}% fact confidence
                                            </span>
                                        </div>
                                    )}

                                    {moment.type === 'memory_milestone' && moment.metadata?.messageCount && (
                                        <div className="flex items-center gap-2 bg-purple-500/10 px-2 py-1 rounded">
                                            <Icon name="message-circle" size={12} className="text-purple-400" />
                                            <span className="text-xs text-purple-300 font-medium">
                                                {moment.metadata.messageCount} messages reached
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Enhanced AI Generated Badge */}
                                {moment.analysis?.ai_generated && (
                                    <div className="mt-3 pt-2 border-t border-gray-600/30">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <Icon name="brain" size={10} className="text-green-400" />
                                                <span className="text-xs text-green-400 font-medium">AI Analysis</span>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                GPT-4 Generated
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer - Positioned absolutely at bottom */}
            {lastUpdate && (
                <div className="absolute bottom-4 left-4 right-4 pt-3 bg-gradient-to-t from-neutral-900 to-transparent border-t border-gray-600/30">
                    <p className="text-xs text-gray-500 flex items-center gap-1 bg-neutral-900/80 px-2 py-1 rounded">
                        <Icon name="clock" size={10} />
                        Last updated: {formatTimeAgo(lastUpdate)}
                    </p>
                </div>
            )}
        </section>
    );
};

export default KeyMomentsPanel;
