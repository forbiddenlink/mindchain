// Redis Operations Matrix Stream - "The Matrix" for Redis Data
// Showcases all 4 Redis modules working together with flowing animations
import { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

export default function RedisMatrixStream({ position = 'overlay', className = '' }) {
    const [operations, setOperations] = useState([]);
    const [isActive, setIsActive] = useState(true);
    const containerRef = useRef(null);
    const operationIdRef = useRef(0);

    // Add CSS for custom animations
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes glow {
                0% { box-shadow: 0 0 5px rgba(16, 185, 129, 0.5); }
                50% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.8), 0 0 30px rgba(16, 185, 129, 0.6); }
                100% { box-shadow: 0 0 5px rgba(16, 185, 129, 0.5); }
            }
            
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            @keyframes slideOutDown {
                from {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
            }
            
            .matrix-operation-enter {
                animation: slideInUp 0.5s ease-out forwards;
            }
            
            .matrix-operation-exit {
                animation: slideOutDown 0.3s ease-in forwards;
            }
        `;
        document.head.appendChild(style);
        
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Redis operation types with colors and animations
    const operationTypes = {
        json: {
            icon: 'database',
            color: 'blue',
            label: 'JSON',
            description: 'Agent Updates',
            examples: [
                'agent:senatorbot:profile → updating stance',
                'debate:metrics → cache stats',
                'contest:live_metrics → scoring',
                'agent:intelligence → emotions'
            ]
        },
        streams: {
            icon: 'arrow-right',
            color: 'green', 
            label: 'STREAMS',
            description: 'Messages',
            examples: [
                'debate:messages → new statement',
                'agent:memory → strategic note',
                'debate:key_moments → highlight',
                'agent:strategic_memory → insight'
            ]
        },
        timeseries: {
            icon: 'trending-up',
            color: 'purple',
            label: 'TIMESERIES',
            description: 'Stance Changes',
            examples: [
                'stance:climate_policy → +0.3',
                'emotions:intensity → 0.8',
                'performance:response_time → 2.1s',
                'system:health → 99.7%'
            ]
        },
        vector: {
            icon: 'target',
            color: 'orange',
            label: 'VECTOR',
            description: 'Cache Hits',
            examples: [
                'cache:prompt → 92.1% match',
                'facts:search → COSINE similarity',
                'knowledge:verify → fact check',
                'semantic:cache → HIT!'
            ]
        }
    };

    // Generate random Redis operation
    const generateOperation = () => {
        const types = Object.keys(operationTypes);
        const type = types[Math.floor(Math.random() * types.length)];
        const config = operationTypes[type];
        const example = config.examples[Math.floor(Math.random() * config.examples.length)];
        
        return {
            id: ++operationIdRef.current,
            type,
            config,
            operation: example,
            timestamp: new Date(),
            progress: 0,
            phase: 'starting', // starting → processing → completing → success
            similarity: type === 'vector' ? (85 + Math.random() * 15) : null,
            value: type === 'timeseries' ? ((Math.random() - 0.5) * 2).toFixed(2) : null
        };
    };

    // Add new operation to stream
    const addOperation = () => {
        if (!isActive) return;
        
        const newOp = generateOperation();
        setOperations(prev => [...prev.slice(-19), newOp]); // Keep last 20 operations
    };

    // Update operation progress and phases
    const updateOperations = () => {
        setOperations(prev => prev.map(op => {
            let newProgress = op.progress + (2 + Math.random() * 5); // Slower, more controlled progress
            let newPhase = op.phase;
            
            if (newProgress > 20 && op.phase === 'starting') {
                newPhase = 'processing';
            } else if (newProgress > 70 && op.phase === 'processing') {
                newPhase = 'completing';
            } else if (newProgress >= 100) {
                newPhase = 'success';
                newProgress = 100;
            }
            
            return {
                ...op,
                progress: newProgress,
                phase: newPhase
            };
        }).filter(op => {
            // Keep completed operations visible longer (8 seconds instead of 2)
            return !(op.phase === 'success' && op.progress >= 100 && Date.now() - op.timestamp > 8000);
        }));
    };

    // Set up operation generation and updates
    useEffect(() => {
        if (!isActive) return;
        
        // Add new operations at longer intervals for better visibility
        const addInterval = setInterval(() => {
            if (Math.random() > 0.4) { // 60% chance to add (reduced from 70%)
                addOperation();
            }
        }, 1500 + Math.random() * 2000); // 1.5-3.5s intervals (increased from 0.8-2s)
        
        // Update operation progress more slowly
        const updateInterval = setInterval(updateOperations, 200); // Slower updates (200ms vs 150ms)
        
        return () => {
            clearInterval(addInterval);
            clearInterval(updateInterval);
        };
    }, [isActive]);

    // Listen for real Redis operations from WebSocket
    useEffect(() => {
        const handleRedisOperation = (event) => {
            if (!isActive) return;
            
            const { detail } = event;
            
            // Handle direct Redis operation broadcasts
            if (detail?.type === 'redis_operation') {
                const { operation_type, operation, metadata } = detail;
                const config = operationTypes[operation_type];
                
                if (config) {
                    const realOp = {
                        id: ++operationIdRef.current,
                        type: operation_type,
                        config,
                        operation,
                        timestamp: new Date(),
                        progress: 0,
                        phase: 'starting',
                        isReal: true,
                        similarity: metadata?.similarity ? (metadata.similarity * 100) : null,
                        value: metadata?.change || metadata?.value,
                        costSaved: metadata?.costSaved
                    };
                    
                    setOperations(prev => [...prev.slice(-19), realOp]);
                }
                return;
            }
            
            // Map other WebSocket events to Redis operations
            let redisType = null;
            let customOperation = null;
            let metadata = {};
            
            if (detail?.type === 'new_message') {
                redisType = 'streams';
                customOperation = `debate:${detail.debateId}:messages → ${detail.agentName}`;
                metadata = { agentId: detail.agentId };
            } else if (detail?.type === 'stance_update') {
                redisType = 'timeseries';
                customOperation = `stance:${detail.topic} → ${detail.change > 0 ? '+' : ''}${detail.change}`;
                metadata = { change: detail.change, topic: detail.topic };
            } else if (detail?.type === 'cache_hit') {
                redisType = 'vector';
                customOperation = `cache:prompt → ${(detail.similarity * 100).toFixed(1)}% MATCH!`;
                metadata = { similarity: detail.similarity, costSaved: detail.cost_saved };
            } else if (detail?.type === 'agent_update') {
                redisType = 'json';
                customOperation = `agent:${detail.agentId}:profile → updating`;
                metadata = { agentId: detail.agentId };
            }
            
            if (redisType) {
                const config = operationTypes[redisType];
                const realOp = {
                    id: ++operationIdRef.current,
                    type: redisType,
                    config,
                    operation: customOperation,
                    timestamp: new Date(),
                    progress: 0,
                    phase: 'starting',
                    isReal: true,
                    similarity: metadata.similarity ? (metadata.similarity * 100) : null,
                    value: metadata.change || metadata.value,
                    costSaved: metadata.costSaved
                };
                
                setOperations(prev => [...prev.slice(-19), realOp]);
            }
        };

        window.addEventListener('websocket-message', handleRedisOperation);
        return () => window.removeEventListener('websocket-message', handleRedisOperation);
    }, [isActive]);

    // Get phase styling with smoother animations
    const getPhaseStyle = (phase, isReal = false) => {
        const baseStyle = isReal ? 'ring-2 ring-yellow-400/50 transform scale-105 ' : '';
        
        switch (phase) {
            case 'starting':
                return baseStyle + 'bg-gray-800/60 border-gray-600/30 transition-all duration-500';
            case 'processing':
                return baseStyle + 'bg-blue-900/40 border-blue-500/40 transition-all duration-300';
            case 'completing':
                return baseStyle + 'bg-green-900/40 border-green-500/40 transition-all duration-300';
            case 'success':
                return baseStyle + 'bg-emerald-900/60 border-emerald-400/60 transform scale-102 transition-all duration-500';
            default:
                return baseStyle + 'bg-gray-800/60 border-gray-600/30 transition-all duration-500';
        }
    };

    // Progress bar color by type
    const getProgressColor = (type, phase) => {
        const colors = {
            json: phase === 'success' ? 'bg-blue-400' : 'bg-blue-500',
            streams: phase === 'success' ? 'bg-green-400' : 'bg-green-500',
            timeseries: phase === 'success' ? 'bg-purple-400' : 'bg-purple-500',
            vector: phase === 'success' ? 'bg-orange-400' : 'bg-orange-500'
        };
        return colors[type] || 'bg-gray-500';
    };

    // Container classes based on position
    const getContainerClasses = () => {
        if (position === 'embedded') {
            return `w-full ${className}`;
        }
        return `fixed top-4 left-4 w-96 z-40 ${className}`;
    };

    return (
        <div className={getContainerClasses()}>
            {/* Matrix Header */}
            <div className="bg-gradient-to-r from-black/95 to-green-900/80 backdrop-blur-sm border border-green-500/30 rounded-t-lg p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <h3 className="text-sm font-bold text-green-300 tracking-wider font-mono">
                            REDIS OPERATIONS MATRIX
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsActive(!isActive)}
                            className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                                isActive 
                                    ? 'bg-green-600/20 text-green-300 border border-green-500/30' 
                                    : 'bg-red-600/20 text-red-300 border border-red-500/30'
                            }`}
                        >
                            {isActive ? 'LIVE' : 'PAUSED'}
                        </button>
                    </div>
                </div>
                
                {/* Module Status Row */}
                <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
                    {Object.entries(operationTypes).map(([type, config]) => (
                        <div key={type} className="flex items-center gap-1">
                            <Icon name={config.icon} className={`w-3 h-3 text-${config.color}-400`} />
                            <span className={`text-${config.color}-300 font-mono font-bold`}>
                                {config.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Operations Stream */}
            <div 
                ref={containerRef}
                className="bg-black/95 backdrop-blur-sm border-x border-b border-green-500/30 rounded-b-lg p-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-green-500"
                style={{
                    scrollBehavior: 'smooth'
                }}
            >
                <div className="space-y-3">
                    {operations.length === 0 ? (
                        <div className="text-center text-gray-500 font-mono text-sm py-8">
                            <div className="animate-pulse">Initializing Redis Matrix...</div>
                            <div className="text-xs text-gray-600 mt-2">Waiting for operations...</div>
                        </div>
                    ) : (
                        operations.map((op) => (
                            <div
                                key={op.id}
                                className={`border rounded-lg p-3 transition-all duration-500 ease-in-out matrix-operation-enter ${getPhaseStyle(op.phase, op.isReal)} hover:shadow-lg`}
                                style={{
                                    animation: op.phase === 'processing' ? 'pulse 2s infinite' : 
                                              op.phase === 'success' ? 'glow 1s ease-in-out' : 'none',
                                    animationDelay: `${Math.random() * 0.3}s` // Stagger animations
                                }}
                            >
                                {/* Operation Header */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Icon 
                                            name={op.config.icon} 
                                            className={`w-4 h-4 text-${op.config.color}-400 transition-all duration-300 ${
                                                op.phase === 'processing' ? 'animate-spin' : ''
                                            }`} 
                                        />
                                        <span className={`text-sm font-bold text-${op.config.color}-300 font-mono`}>
                                            {op.config.label}
                                        </span>
                                        {op.isReal && (
                                            <span className="px-2 py-1 bg-yellow-600/30 border border-yellow-500/50 rounded text-xs text-yellow-300 font-bold animate-pulse">
                                                LIVE
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        {op.similarity && (
                                            <span className="text-orange-300 font-mono font-bold">
                                                {op.similarity.toFixed(1)}%
                                            </span>
                                        )}
                                        {op.value && (
                                            <span className={`font-mono font-bold ${
                                                parseFloat(op.value) > 0 ? 'text-green-300' : 'text-red-300'
                                            }`}>
                                                {op.value > 0 ? '+' : ''}{op.value}
                                            </span>
                                        )}
                                        <span className="text-gray-400 font-mono">
                                            {op.timestamp.toLocaleTimeString().split(':').slice(-2).join(':')}
                                        </span>
                                    </div>
                                </div>

                                {/* Operation Details */}
                                <div className="text-sm text-gray-300 font-mono mb-3 leading-relaxed">
                                    {op.operation}
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-700/50 rounded-full h-2 mb-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ease-out ${getProgressColor(op.type, op.phase)}`}
                                        style={{ width: `${op.progress}%` }}
                                    ></div>
                                </div>

                                {/* Phase Status */}
                                <div className={`text-xs font-mono font-bold ${
                                    op.phase === 'success' ? 'text-green-300' :
                                    op.phase === 'completing' ? 'text-yellow-300' :
                                    op.phase === 'processing' ? 'text-blue-300' :
                                    'text-gray-400'
                                }`}>
                                    {op.phase.toUpperCase()}
                                    {op.phase === 'success' && ' ✓'}
                                    {op.phase === 'processing' && ' ⟳'}
                                    {op.phase === 'completing' && ' ⚡'}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Operation Summary */}
            <div className="bg-gray-900/95 border border-green-500/30 rounded-b-lg -mt-px p-2">
                <div className="grid grid-cols-4 gap-2 text-xs">
                    {Object.entries(operationTypes).map(([type, config]) => {
                        const count = operations.filter(op => op.type === type).length;
                        return (
                            <div key={type} className="text-center">
                                <div className={`text-${config.color}-300 font-bold font-mono`}>
                                    {count}
                                </div>
                                <div className="text-gray-400 text-xs">
                                    {config.description}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
