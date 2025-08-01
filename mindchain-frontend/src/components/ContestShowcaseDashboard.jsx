// System Showcase Dashboard - Premium Analytics and Demonstrations
import { useState, useEffect } from 'react';
import Icon from './Icon';
import LivePerformanceOverlay from './LivePerformanceOverlay';

export default function SystemShowcaseDashboard() {
    const [showcaseData, setShowcaseData] = useState(null);
    const [systemMetrics, setSystemMetrics] = useState(null);
    const [contestMetrics, setContestMetrics] = useState(null);
    const [optimizationMetrics, setOptimizationMetrics] = useState(null);
    const [demoRunning, setDemoRunning] = useState(false);
    const [demoResults, setDemoResults] = useState({});
    const [activeDemo, setActiveDemo] = useState(null);

    // Fetch showcase data every 5 seconds
    useEffect(() => {
        const fetchShowcaseData = async () => {
            try {
                // Get Redis modules showcase
                const showcaseResponse = await fetch('/api/showcase/redis-modules');
                if (showcaseResponse.ok) {
                    const data = await showcaseResponse.json();
                    setShowcaseData(data);
                }

                // Get contest metrics
                const metricsResponse = await fetch('/api/analytics/contest-metrics');
                if (metricsResponse.ok) {
                    const metrics = await metricsResponse.json();
                    setContestMetrics(metrics);
                }

                // Get optimization metrics
                const optimizationResponse = await fetch('/api/optimization/metrics');
                if (optimizationResponse.ok) {
                    const optimization = await optimizationResponse.json();
                    setOptimizationMetrics(optimization);
                }

            } catch (error) {
                console.error('Failed to fetch showcase data:', error);
            }
        };

        fetchShowcaseData();
        // Automatic polling disabled to reduce server load
        // const interval = setInterval(fetchShowcaseData, 15000);
        // return () => clearInterval(interval);

        // Only update on manual interaction
        return () => { }; // No cleanup needed
    }, []);

    // Run demonstration scenario
    const runDemo = async (scenario) => {
        setDemoRunning(true);
        setActiveDemo(scenario);

        try {
            const response = await fetch(`/api/contest/demo/${scenario}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ duration: 15, agents: ['senatorbot', 'reformerbot'] })
            });

            if (response.ok) {
                const result = await response.json();
                setDemoResults(prev => ({
                    ...prev,
                    [scenario]: result
                }));
            }
        } catch (error) {
            console.error(`Demo ${scenario} failed:`, error);
            setDemoResults(prev => ({
                ...prev,
                [scenario]: { success: false, error: error.message }
            }));
        } finally {
            setDemoRunning(false);
            setActiveDemo(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-6 relative">
            {/* Live Performance Metrics Overlay */}
            <LivePerformanceOverlay 
                position="top-right" 
                size="large"
                className="animate-in slide-in-from-right-2 duration-500"
            />

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <Icon name="award" className="w-8 h-8 text-yellow-400" />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        Redis AI Challenge Showcase
                    </h1>
                </div>
                <p className="text-xl text-gray-300">
                    Real-time demonstration of MindChain's multi-modal Redis architecture
                </p>
            </div>

            {/* Contest Metrics Overview */}
            {contestMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Icon name="database" className="w-6 h-6 text-green-400" />
                            <span className="text-lg font-semibold text-green-300">Active Debates</span>
                        </div>
                        <div className="text-3xl font-bold text-green-200">
                            {contestMetrics.contestMetrics?.debateStatistics?.activeDebates || 0}
                        </div>
                        <div className="text-sm text-gray-400">Real-time concurrent processing</div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Icon name="message-circle" className="w-6 h-6 text-blue-400" />
                            <span className="text-lg font-semibold text-blue-300">Total Messages</span>
                        </div>
                        <div className="text-3xl font-bold text-blue-200">
                            {contestMetrics.contestMetrics?.debateStatistics?.totalMessages || 0}
                        </div>
                        <div className="text-sm text-gray-400">Redis Streams throughput</div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Icon name="zap" className="w-6 h-6 text-purple-400" />
                            <span className="text-lg font-semibold text-purple-300">Cache Hit Rate</span>
                        </div>
                        <div className="text-3xl font-bold text-purple-200">
                            {contestMetrics.contestMetrics?.semanticCache?.hit_ratio || 0}%
                        </div>
                        <div className="text-sm text-gray-400">Semantic vector caching</div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border border-orange-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Icon name="activity" className="w-6 h-6 text-orange-400" />
                            <span className="text-lg font-semibold text-orange-300">System Health</span>
                        </div>
                        <div className="text-3xl font-bold text-orange-200">
                            {Math.round((contestMetrics.contestMetrics?.systemHealth?.uptime || 0) / 60)}m
                        </div>
                        <div className="text-sm text-gray-400">Uptime & stability</div>
                    </div>
                </div>
            )}

            {/* Redis Multi-Modal Showcase */}
            {showcaseData && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Icon name="layers" className="w-6 h-6 text-blue-400" />
                        Redis Multi-Modal Architecture Live Demo
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* RedisJSON */}
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <h3 className="text-xl font-semibold text-yellow-300">RedisJSON</h3>
                                <Icon name="file-text" className="w-5 h-5 text-yellow-400" />
                            </div>
                            <p className="text-sm text-gray-400 mb-3">{showcaseData.showcase?.redisJSON?.example}</p>
                            <div className="bg-gray-900/50 rounded-lg p-3 mb-3">
                                <code className="text-xs text-green-400">
                                    Keys: {showcaseData.summary?.activeKeys?.json || 0} |
                                    Pattern: {showcaseData.showcase?.redisJSON?.keyPattern}
                                </code>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {showcaseData.showcase?.redisJSON?.operations?.map((op, i) => (
                                    <span key={i} className="px-2 py-1 bg-yellow-600/20 text-yellow-300 text-xs rounded">
                                        {op}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Redis Streams */}
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <h3 className="text-xl font-semibold text-green-300">Redis Streams</h3>
                                <Icon name="git-branch" className="w-5 h-5 text-green-400" />
                            </div>
                            <p className="text-sm text-gray-400 mb-3">{showcaseData.showcase?.redisStreams?.example}</p>
                            <div className="bg-gray-900/50 rounded-lg p-3 mb-3">
                                <code className="text-xs text-green-400">
                                    Keys: {showcaseData.summary?.activeKeys?.streams || 0} |
                                    Pattern: {showcaseData.showcase?.redisStreams?.keyPattern}
                                </code>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {showcaseData.showcase?.redisStreams?.operations?.map((op, i) => (
                                    <span key={i} className="px-2 py-1 bg-green-600/20 text-green-300 text-xs rounded">
                                        {op}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* RedisTimeSeries */}
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                <h3 className="text-xl font-semibold text-purple-300">RedisTimeSeries</h3>
                                <Icon name="trending-up" className="w-5 h-5 text-purple-400" />
                            </div>
                            <p className="text-sm text-gray-400 mb-3">{showcaseData.showcase?.redisTimeSeries?.example}</p>
                            <div className="bg-gray-900/50 rounded-lg p-3 mb-3">
                                <code className="text-xs text-green-400">
                                    Keys: {showcaseData.summary?.activeKeys?.timeseries || 0} |
                                    Pattern: {showcaseData.showcase?.redisTimeSeries?.keyPattern}
                                </code>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {showcaseData.showcase?.redisTimeSeries?.operations?.map((op, i) => (
                                    <span key={i} className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded">
                                        {op}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Redis Vector */}
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <h3 className="text-xl font-semibold text-blue-300">Redis Vector Search</h3>
                                <Icon name="search" className="w-5 h-5 text-blue-400" />
                            </div>
                            <p className="text-sm text-gray-400 mb-3">{showcaseData.showcase?.redisVector?.example}</p>
                            <div className="bg-gray-900/50 rounded-lg p-3 mb-3">
                                <code className="text-xs text-green-400">
                                    Keys: {showcaseData.summary?.activeKeys?.vector || 0} |
                                    Pattern: {showcaseData.showcase?.redisVector?.keyPattern}
                                </code>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {showcaseData.showcase?.redisVector?.operations?.map((op, i) => (
                                    <span key={i} className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded">
                                        {op}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Performance Optimization Dashboard */}
            {optimizationMetrics && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Icon name="gauge" className="w-6 h-6 text-orange-400" />
                        Real-Time Performance Optimization
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <Icon name="cpu" className="w-5 h-5 text-orange-400" />
                                <span className="font-semibold">Optimization Status</span>
                            </div>
                            <div className="text-2xl font-bold text-orange-300 mb-2">
                                {optimizationMetrics.optimization?.status || 'Offline'}
                            </div>
                            <div className="text-sm text-gray-400">
                                {optimizationMetrics.optimization?.total_optimizations || 0} total optimizations
                            </div>
                        </div>

                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <Icon name="trending-up" className="w-5 h-5 text-green-400" />
                                <span className="font-semibold">Avg Improvement</span>
                            </div>
                            <div className="text-2xl font-bold text-green-300 mb-2">
                                {(optimizationMetrics.optimization?.average_improvement || 0).toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-400">
                                Performance gains per cycle
                            </div>
                        </div>

                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <Icon name="clock" className="w-5 h-5 text-blue-400" />
                                <span className="font-semibold">Last Optimization</span>
                            </div>
                            <div className="text-lg font-bold text-blue-300 mb-2">
                                {optimizationMetrics.optimization?.last_optimization ?
                                    new Date(optimizationMetrics.optimization.last_optimization).toLocaleTimeString() :
                                    'Pending'
                                }
                            </div>
                            <div className="text-sm text-gray-400">
                                Continuous monitoring active
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Interactive Demo Scenarios */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Icon name="play-circle" className="w-6 h-6 text-green-400" />
                    Interactive Contest Demonstrations
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            id: 'multi-modal-showcase',
                            title: 'Multi-Modal Showcase',
                            description: 'Demonstrate all 4 Redis modules in sequence',
                            icon: 'layers',
                            color: 'blue'
                        },
                        {
                            id: 'performance-stress-test',
                            title: 'Performance Stress Test',
                            description: 'High-throughput operations benchmark',
                            icon: 'zap',
                            color: 'yellow'
                        },
                        {
                            id: 'concurrent-debates',
                            title: 'Concurrent Debates',
                            description: 'Multiple simultaneous AI debates',
                            icon: 'users',
                            color: 'green'
                        },
                        {
                            id: 'cache-efficiency',
                            title: 'Cache Efficiency',
                            description: 'Semantic cache hit rate optimization',
                            icon: 'database',
                            color: 'purple'
                        }
                    ].map((demo) => (
                        <div key={demo.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <Icon
                                    name={demo.icon}
                                    className={`w-5 h-5 text-${demo.color}-400`}
                                />
                                <span className="font-semibold">{demo.title}</span>
                            </div>
                            <p className="text-sm text-gray-400 mb-4">{demo.description}</p>

                            <button
                                onClick={() => runDemo(demo.id)}
                                disabled={demoRunning}
                                className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${demoRunning && activeDemo === demo.id
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : `bg-${demo.color}-600 hover:bg-${demo.color}-700 text-white`
                                    }`}
                            >
                                {demoRunning && activeDemo === demo.id ? (
                                    <span className="flex items-center gap-2">
                                        <Icon name="loader-2" className="w-4 h-4 animate-spin" />
                                        Running...
                                    </span>
                                ) : (
                                    'Run Demo'
                                )}
                            </button>

                            {/* Demo Results */}
                            {demoResults[demo.id] && (
                                <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                                    <div className="text-xs text-gray-400 mb-2">Latest Result:</div>
                                    {demoResults[demo.id].success ? (
                                        <div className="text-xs text-green-400">
                                            ✅ Success - {demoResults[demo.id].result?.metrics?.totalOperations || 0} operations
                                        </div>
                                    ) : (
                                        <div className="text-xs text-red-400">
                                            ❌ Error: {demoResults[demo.id].error}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Real-time Activity Feed */}
            <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Icon name="activity" className="w-6 h-6 text-purple-400" />
                    Live System Activity
                </h2>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <div className="space-y-3">
                        {showcaseData && (
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-gray-300">
                                    Redis modules active: {showcaseData.summary?.totalModules || 0}/4
                                </span>
                                <span className="text-gray-500">
                                    {new Date().toLocaleTimeString()}
                                </span>
                            </div>
                        )}

                        {contestMetrics && (
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-gray-300">
                                    Processing {contestMetrics.contestMetrics?.debateStatistics?.activeDebates || 0} concurrent debates
                                </span>
                                <span className="text-gray-500">
                                    {new Date().toLocaleTimeString()}
                                </span>
                            </div>
                        )}

                        {optimizationMetrics?.optimization?.status === 'active' && (
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                <span className="text-gray-300">
                                    Performance optimizer running ({optimizationMetrics.optimization.total_optimizations} cycles completed)
                                </span>
                                <span className="text-gray-500">
                                    {new Date().toLocaleTimeString()}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                            <span className="text-gray-300">
                                Semantic cache hit rate: {contestMetrics?.contestMetrics?.semanticCache?.hit_ratio || 0}%
                            </span>
                            <span className="text-gray-500">
                                {new Date().toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
