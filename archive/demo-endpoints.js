// Archive of demo-specific endpoints and functions from server.js

// Demo cache efficiency endpoint
app.post('/api/platform/demo/cache-efficiency', async (req, res) => {
    try {
        console.log('🎯 Running cache efficiency demo...');
        
        // Import cache modules
        const { runCacheDemo } = await import('./demoCache.js');
        const { getCacheStats } = await import('./semanticCache.js');

        // Run the demo
        const demoResults = await runCacheDemo();

        // Get updated cache stats after demo
        const cacheStats = await getCacheStats();
        
        // Broadcast cache metrics update
        broadcast({
            type: 'metrics_updated',
            metrics: {
                cache: cacheStats,
                demo: demoResults
            },
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            result: {
                metrics: {
                    totalOperations: demoResults.totalOperations,
                    cacheHits: demoResults.cacheHits,
                    cacheMisses: demoResults.cacheMisses,
                    hitRatio: demoResults.hitRatio,
                    costSaved: demoResults.costSaved
                },
                cache_stats: cacheStats,
                duration: demoResults.duration
            }
        });

    } catch (error) {
        console.error('❌ Error running cache demo:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to run cache demo',
            message: error.message
        });
    }
});

// Redis Matrix Demo - Trigger all Redis operations for Matrix visualization
app.post('/api/demo/redis-matrix', async (req, res) => {
    try {
        console.log('🎯 Redis Matrix demo triggered - Broadcasting all module operations');
        
        // Simulate JSON operations
        broadcastRedisOperation('json', 'agent:senatorbot:profile → updating stance', {
            agentId: 'senatorbot',
            field: 'stance',
            value: 0.7
        });
        
        setTimeout(() => {
            broadcastRedisOperation('json', 'debate:metrics → cache stats', {
                hitRate: 94.2,
                totalSaved: 47.32
            });
        }, 500);
        
        // Simulate Stream operations
        setTimeout(() => {
            broadcastRedisOperation('streams', 'debate:climate-policy:messages → new statement', {
                agentId: 'reformerbot',
                messageLength: 156
            });
        }, 1000);
        
        setTimeout(() => {
            broadcastRedisOperation('streams', 'agent:senatorbot:memory → strategic note', {
                agentId: 'senatorbot',
                type: 'strategic_memory'
            });
        }, 1500);
        
        // Simulate TimeSeries operations
        setTimeout(() => {
            broadcastRedisOperation('timeseries', 'stance:climate_policy → +0.3', {
                topic: 'climate_policy',
                change: 0.3,
                agentId: 'reformerbot'
            });
        }, 2000);
        
        setTimeout(() => {
            broadcastRedisOperation('timeseries', 'emotions:intensity → 0.8', {
                agentId: 'senatorbot',
                emotion: 'conviction',
                intensity: 0.8
            });
        }, 2500);
        
        // Simulate Vector operations
        setTimeout(() => {
            broadcastRedisOperation('vector', 'cache:prompt → 92.1% MATCH!', {
                similarity: 0.921,
                costSaved: 0.003,
                cacheHit: true
            });
        }, 3000);
        
        setTimeout(() => {
            broadcastRedisOperation('vector', 'facts:search → COSINE similarity', {
                similarity: 0.887,
                factCheck: true,
                claim: 'renewable energy statistics'
            });
        }, 3500);

        res.json({
            success: true,
            message: 'Redis Matrix operations triggered',
            operations: 8,
            timespan: '4 seconds'
        });
        
    } catch (error) {
        console.error('❌ Error triggering Redis Matrix demo:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Cache Hit Demo - Trigger cache hit celebrations for demonstration
app.post('/api/demo/cache-hit', async (req, res) => {
    try {
        console.log('🎯 Demo cache hit triggered - URL:', req.originalUrl);
        
        // Broadcast THREE cache hit celebrations for dramatic effect
        const broadcastCacheHit = async (delay, similarity, costSaved) => {
            await new Promise(resolve => setTimeout(resolve, delay));
            broadcast({
                type: 'cache_hit',
                debateId: 'demo',
                agentId: 'demo-agent',
                similarity: similarity,
                cost_saved: costSaved,
                timestamp: new Date().toISOString()
            });
            broadcast({
                type: 'metrics-update',
                metrics: {
                    cacheHitRate: 99.1,
                    costSavings: 47 + costSaved,
                    responseTime: 1.8,
                    operationsPerSec: 127
                }
            });
        };

        // Schedule dramatic sequence of cache hits
        broadcastCacheHit(0, 0.92, 0.002);   // First hit
        broadcastCacheHit(1500, 0.95, 0.003); // Better match after 1.5s
        broadcastCacheHit(3000, 0.98, 0.004); // Amazing match after 3s

        res.json({
            success: true,
            message: 'Cache hit celebration sequence triggered',
            data: {
                hits: 3,
                totalSavings: 0.009
            }
        });
        
    } catch (error) {
        console.error('❌ Error triggering cache hit demo:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to trigger cache hit demo',
            message: error.message
        });
    }
});

// Contest Demo API - Automated demo scenarios
app.post('/api/contest/demo/:scenario', async (req, res) => {
    try {
        const { scenario } = req.params;
        const { duration = 30, agents = ['senatorbot', 'reformerbot'] } = req.body;

        let demoResult;

        switch (scenario) {
            case 'multi-modal-showcase':
                demoResult = await runMultiModalDemo(agents, duration);
                break;
            case 'performance-stress-test':
                demoResult = await runPerformanceStressTest(duration);
                break;
            case 'concurrent-debates':
                demoResult = await runConcurrentDebatesDemo(agents, duration);
                break;
            case 'cache-efficiency':
                demoResult = await runCacheEfficiencyDemo(agents, duration);
                break;
            default:
                throw new Error(`Unknown demo scenario: ${scenario}`);
        }

        res.json({
            success: true,
            scenario,
            result: demoResult,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Contest demo error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            scenario: req.params.scenario
        });
    }
});

// Platform API Endpoints - Professional aliases for contest endpoints
app.post('/api/platform/demo/:scenario', async (req, res) => {
    try {
        const { scenario } = req.params;
        const { duration = 30, agents = ['senatorbot', 'reformerbot'] } = req.body;

        let demoResult;

        switch (scenario) {
            case 'multi-modal-showcase':
                demoResult = await runMultiModalDemo(agents, duration);
                break;
            case 'performance-stress-test':
                demoResult = await runPerformanceStressTest(duration);
                break;
            case 'concurrent-debates':
                demoResult = await runConcurrentDebatesDemo(agents, duration);
                break;
            case 'cache-efficiency':
                demoResult = await runCacheEfficiencyDemo(agents, duration);
                break;
            default:
                throw new Error(`Unknown demo scenario: ${scenario}`);
        }

        res.json({
            success: true,
            scenario,
            result: demoResult,
            platformMetrics: demoResult,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Platform demo error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            platformMetrics: { status: 'error' }
        });
    }
});

// Real-time Redis Showcase API - Live demonstration of all 4 modules
app.get('/api/showcase/redis-modules', async (req, res) => {
    try {
        const showcase = {};

        // RedisJSON showcase
        const jsonDemo = await client.json.get('agent:senatorbot:profile').catch(() => null);
        showcase.redisJSON = {
            example: 'Agent profile with complex nested data',
            data: jsonDemo,
            keyPattern: 'agent:*:profile',
            operations: ['JSON.GET', 'JSON.SET', 'JSON.MERGE']
        };

        // Redis Streams showcase
        const streamKeys = await client.keys('debate:*:messages');
        const latestStream = streamKeys[0];
        let streamDemo = null;
        if (latestStream) {
            streamDemo = await client.xRevRange(latestStream, '+', '-', { COUNT: 3 }).catch(() => null);
        }
        showcase.redisStreams = {
            example: 'Real-time debate messages with ordering',
            data: streamDemo,
            keyPattern: 'debate:*:messages',
            operations: ['XADD', 'XRANGE', 'XREVRANGE']
        };

        // RedisTimeSeries showcase
        const timeseriesKeys = await client.keys('debate:*:stance:*');
        const latestTimeseries = timeseriesKeys[0];
        let timeseriesDemo = null;
        if (latestTimeseries) {
            timeseriesDemo = await client.ts.range(latestTimeseries, '-', '+', { COUNT: 5 }).catch(() => null);
        }
        showcase.redisTimeSeries = {
            example: 'Stance evolution tracking over time',
            data: timeseriesDemo,
            keyPattern: 'debate:*:stance:*',
            operations: ['TS.ADD', 'TS.RANGE', 'TS.INFO']
        };

        // Redis Vector showcase
        const vectorKeys = await client.keys('fact:*');
        const vectorDemo = vectorKeys.slice(0, 3);
        let vectorData = null;
        if (vectorDemo.length > 0) {
            vectorData = await Promise.all(
                vectorDemo.map(async key => {
                    const fact = await client.hGet(key, 'content').catch(() => null);
                    return { key, content: fact };
                })
            );
        }
        showcase.redisVector = {
            example: 'Semantic fact-checking with embeddings',
            data: vectorData,
            keyPattern: 'fact:*',
            operations: ['FT.SEARCH', 'HSET', 'FT.CREATE']
        };

        res.json({
            success: true,
            showcase,
            summary: {
                totalModules: 4,
                activeKeys: {
                    json: (await client.keys('agent:*')).length,
                    streams: streamKeys.length,
                    timeseries: timeseriesKeys.length,
                    vector: vectorKeys.length
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Redis showcase error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            showcase: { status: 'error' }
        });
    }
});

// Demo helper functions
async function runMultiModalDemo(agents, duration) {
    const startTime = Date.now();
    const results = { operations: [], metrics: {} };

    try {
        // Demonstrate all 4 Redis modules in sequence

        // 1. RedisJSON operations
        for (const agentId of agents) {
            const profile = await client.json.get(`agent:${agentId}:profile`);
            if (profile) {
                await client.json.set(`agent:${agentId}:profile`, '.demo_timestamp', Date.now());
                results.operations.push(`JSON.SET agent:${agentId}:profile demo_timestamp`);
            }
        }

        // 2. Redis Streams operations
        const demoDebateId = `demo_${Date.now()}`;
        for (let i = 0; i < 3; i++) {
            await client.xAdd(`debate:${demoDebateId}:messages`, '*', {
                agent_id: agents[i % agents.length],
                message: `Demo message ${i + 1} showcasing Redis Streams`,
                demo: 'true'
            });
            results.operations.push(`XADD debate:${demoDebateId}:messages`);
        }

        // 3. RedisTimeSeries operations
        for (const agentId of agents) {
            const stanceKey = `debate:${demoDebateId}:agent:${agentId}:stance:demo_policy`;
            await client.ts.add(stanceKey, '*', Math.random()).catch(() => {
                console.log('TimeSeries not available, skipping TS demo');
            });
            results.operations.push(`TS.ADD ${stanceKey}`);
        }

        // 4. Redis Vector operations (check existing facts)
        const factKeys = await client.keys('fact:*');
        if (factKeys.length > 0) {
            const randomFact = factKeys[Math.floor(Math.random() * factKeys.length)];
            const factContent = await client.hGet(randomFact, 'content');
            results.operations.push(`HGET ${randomFact} content: ${factContent?.substring(0, 50)}...`);
        }

        results.metrics = {
            duration: Date.now() - startTime,
            totalOperations: results.operations.length,
            modulesUsed: 4,
            status: 'completed'
        };

    } catch (error) {
        results.error = error.message;
        results.metrics.status = 'partial';
    }

    return results;
}

async function runPerformanceStressTest(duration) {
    const startTime = Date.now();
    const results = { operations: 0, errors: 0, avgLatency: 0 };
    const latencies = [];

    while (Date.now() - startTime < duration * 1000) {
        try {
            const opStart = Date.now();

            // Mix of operations to test performance
            const operation = Math.floor(Math.random() * 4);
            switch (operation) {
                case 0: // JSON operation
                    await client.json.get('agent:senatorbot:profile');
                    break;
                case 1: // Stream operation
                    const streams = await client.keys('debate:*:messages');
                    if (streams.length > 0) {
                        await client.xLen(streams[0]);
                    }
                    break;
                case 2: // Hash operation
                    const facts = await client.keys('fact:*');
                    if (facts.length > 0) {
                        await client.hGet(facts[0], 'content');
                    }
                    break;
                case 3: // Basic operation
                    await client.ping();
                    break;
            }

            const latency = Date.now() - opStart;
            latencies.push(latency);
            results.operations++;

        } catch (error) {
            results.errors++;
        }

        // Small delay to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 10));
    }

    results.avgLatency = latencies.length > 0 ?
        latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
    results.duration = Date.now() - startTime;
    results.operationsPerSecond = Math.round((results.operations / results.duration) * 1000);

    return results;
}

async function runConcurrentDebatesDemo(agents, duration) {
    const results = { debates: [], totalMessages: 0 };
    const numDebates = 3;

    try {
        // Start multiple concurrent debates
        const debatePromises = [];

        for (let i = 0; i < numDebates; i++) {
            const debateId = `concurrent_demo_${i}_${Date.now()}`;
            const topic = ['Climate Policy', 'AI Regulation', 'Healthcare Reform'][i];

            debatePromises.push(
                (async () => {
                    const debateResult = { debateId, topic, messages: 0 };

                    // Run short debate simulation
                    for (let round = 0; round < 3; round++) {
                        for (const agentId of agents) {
                            await client.xAdd(`debate:${debateId}:messages`, '*', {
                                agent_id: agentId,
                                message: `Concurrent demo message ${round + 1} about ${topic}`,
                                round: round + 1,
                                demo: 'concurrent'
                            });
                            debateResult.messages++;
                            results.totalMessages++;
                        }
                    }

                    return debateResult;
                })()
            );
        }

        // Wait for all debates to complete
        results.debates = await Promise.all(debatePromises);
        results.duration = duration;
        results.status = 'completed';

    } catch (error) {
        results.error = error.message;
        results.status = 'error';
    }

    return results;
}

async function runCacheEfficiencyDemo(agents, duration) {
    const results = { cacheTests: [], efficiency: {} };

    try {
        // Test semantic cache with similar prompts
        const testPrompts = [
            "What are your thoughts on climate change policy?",
            "How do you view climate change policies?",
            "What's your position on environmental regulations?",
            "Can you discuss climate policy approaches?",
            "What are your thoughts on climate change policy?" // Exact duplicate
        ];

        for (const prompt of testPrompts) {
            const testStart = Date.now();

            try {
                // This would use the semantic cache system
                const response = await generateMessage(agents[0], 'cache_demo', prompt);

                results.cacheTests.push({
                    prompt: prompt.substring(0, 50) + '...',
                    responseTime: Date.now() - testStart,
                    cached: false // Would be determined by actual cache system
                });

            } catch (error) {
                results.cacheTests.push({
                    prompt: prompt.substring(0, 50) + '...',
                    error: error.message
                });
            }
        }

        // Get current cache metrics
        const cacheMetrics = await client.json.get('cache:metrics').catch(() => null);
        results.efficiency = cacheMetrics || { hit_ratio: 0, message: 'Cache metrics not available' };

    } catch (error) {
        results.error = error.message;
    }

    return results;
}
