import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createClient } from 'redis';
import { generateMessage } from './generateMessage.js';
import { findClosestFact } from './factChecker.js';
import { generateEnhancedMessage, updateStanceBasedOnDebate } from './enhancedAI.js';
import { RedisMetricsCollector, generateContestAnalytics } from './advancedMetrics.js';
// import { addFactToDatabase } from './addFactsEnhanced.js';
// import { summarizeDebate } from './summarizeDebateEnhanced.js';
import { createServer } from 'http';
import sentimentAnalyzer from './sentimentAnalysis.js';
import keyMomentsDetector, { processDebateEvent, getKeyMoments, getAllKeyMoments } from './keyMoments.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({
    server,
    verifyClient: (info) => {
        const origin = info.origin;
        return origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173';
    }
});

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Vite dev server (both localhost and 127.0.0.1)
    credentials: true
}));
app.use(express.json());

// Redis client
const client = createClient({ url: process.env.REDIS_URL });
await client.connect();

// Initialize sentiment analyzer
try {
    await sentimentAnalyzer.initialize();
    console.log('🧠 Sentiment analyzer initialized successfully');
} catch (sentimentInitError) {
    console.log('⚠️ Sentiment analyzer failed to initialize, will use fallback mode:', sentimentInitError.message);
}

// Store active WebSocket connections
const connections = new Set();

// Store active debate state - NOW SUPPORTS MULTIPLE CONCURRENT DEBATES
const activeDebates = new Map();

// Enhanced debate metrics for analytics
const debateMetrics = {
    totalDebatesStarted: 0,
    concurrentDebates: 0,
    messagesGenerated: 0,
    factChecksPerformed: 0,
    agentInteractions: 0,
    startTime: new Date().toISOString()
};

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('🔌 Client connected to WebSocket');
    connections.add(ws);

    ws.on('close', () => {
        console.log('🔌 Client disconnected from WebSocket');
        connections.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        connections.delete(ws);
    });
});

// Broadcast to all connected clients
function broadcast(data) {
    const message = JSON.stringify(data);
    connections.forEach(ws => {
        if (ws.readyState === ws.OPEN) {
            ws.send(message);
        }
    });
}

// API Routes

// Test endpoint for stance updates
app.post('/api/test/stance', async (req, res) => {
    try {
        const timestamp = new Date().toISOString();
        const testStanceData = {
            type: 'debate:stance_update',
            debateId: 'test_debug',
            senatorbot: 0.6,
            reformerbot: -0.3,
            timestamp,
            turn: 1,
            topic: 'climate change policy',
            metadata: {
                round: 1,
                totalRounds: 10,
                totalMessages: 1
            }
        };

        broadcast(testStanceData);
        console.log('📊 Sent test stance update:', testStanceData);
        
        res.json({ 
            success: true, 
            message: 'Test stance update broadcasted',
            data: testStanceData 
        });
    } catch (error) {
        console.error('Error sending test stance update:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get sentiment confidence history for sparklines
app.get('/api/sentiment/:debateId/:agentId/history', async (req, res) => {
    try {
        const { debateId, agentId } = req.params;
        const points = parseInt(req.query.points) || 20;
        
        console.log(`📊 Fetching sentiment history for ${agentId} in debate ${debateId} (${points} points)`);
        
        if (!sentimentAnalyzer) {
            console.error('❌ sentimentAnalyzer not available');
            return res.status(500).json({ 
                success: false, 
                error: 'Sentiment analyzer not initialized',
                debateId,
                agentId,
                history: [],
                points: 0
            });
        }
        
        const history = await sentimentAnalyzer.getConfidenceHistory(debateId, agentId, points);
        console.log(`📈 Retrieved ${history.length} history points for ${agentId}`);
        
        res.json({
            success: true,
            debateId,
            agentId,
            history,
            points: history.length
        });
    } catch (error) {
        console.error('❌ Error fetching sentiment history:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            message: error.message,
            debateId: req.params.debateId,
            agentId: req.params.agentId,
            history: [],
            points: 0
        });
    }
});

// Get agent profile
app.get('/api/agent/:id/profile', async (req, res) => {
    try {
        const { id } = req.params;
        const profile = await client.json.get(`agent:${id}:profile`);

        if (!profile) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        res.json(profile);
    } catch (error) {
        console.error('Error fetching agent profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update agent profile
app.post('/api/agent/:id/update', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Get current profile
        const currentProfile = await client.json.get(`agent:${id}:profile`);
        if (!currentProfile) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        // Merge updates
        const updatedProfile = { ...currentProfile, ...updates };
        await client.json.set(`agent:${id}:profile`, '$', updatedProfile);

        // Broadcast update to all clients
        broadcast({
            type: 'agent_updated',
            agentId: id,
            profile: updatedProfile
        });

        res.json(updatedProfile);
    } catch (error) {
        console.error('Error updating agent profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start a new debate - ENHANCED FOR MULTI-DEBATE SUPPORT
app.post('/api/debate/start', async (req, res) => {
    try {
        const { debateId = `debate_${Date.now()}`, topic = 'climate change policy', agents = ['senatorbot', 'reformerbot'] } = req.body;

        // Generate unique debate ID if not provided
        const uniqueDebateId = debateId === 'live_debate' ? `debate_${Date.now()}` : debateId;

        // Check if specific debate is already running
        if (activeDebates.has(uniqueDebateId)) {
            return res.status(409).json({
                error: 'Debate is already running',
                debateId: uniqueDebateId,
                message: 'Please wait for the current debate to finish or use a different debate ID'
            });
        }

        console.log(`🎯 Starting debate: ${uniqueDebateId} on topic: ${topic}`);

        // Update metrics
        debateMetrics.totalDebatesStarted++;
        debateMetrics.concurrentDebates = activeDebates.size + 1;

        // Mark debate as active
        activeDebates.set(uniqueDebateId, {
            topic,
            agents,
            startTime: new Date().toISOString(),
            status: 'running',
            messageCount: 0,
            factChecks: 0
        });

        // Broadcast debate start
        broadcast({
            type: 'debate_started',
            debateId: uniqueDebateId,
            topic,
            agents,
            timestamp: new Date().toISOString(),
            totalActive: activeDebates.size
        });

        // Start the debate loop (don't await to return response immediately)
        runDebateRounds(uniqueDebateId, agents, topic).finally(() => {
            // Remove from active debates when finished
            activeDebates.delete(uniqueDebateId);
            debateMetrics.concurrentDebates = activeDebates.size;

            // Broadcast updated metrics
            broadcast({
                type: 'metrics_updated',
                metrics: getEnhancedMetrics(),
                timestamp: new Date().toISOString()
            });
        });

        res.json({
            success: true,
            debateId: uniqueDebateId,
            topic,
            agents,
            message: 'Debate started successfully',
            activeDebates: activeDebates.size
        });
    } catch (error) {
        console.error('Error starting debate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Stop a running debate
app.post('/api/debate/:id/stop', async (req, res) => {
    try {
        const { id } = req.params;

        if (!activeDebates.has(id)) {
            return res.status(404).json({
                error: 'No active debate found',
                debateId: id
            });
        }

        // Remove from active debates
        activeDebates.delete(id);

        // Broadcast debate stop
        broadcast({
            type: 'debate_stopped',
            debateId: id,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            debateId: id,
            message: 'Debate stopped successfully'
        });
    } catch (error) {
        console.error('Error stopping debate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get debate messages (for history/catch-up)
app.get('/api/debate/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        const messages = await client.xRevRange(`debate:${id}:messages`, '+', '-', { COUNT: limit });

        const formattedMessages = messages.reverse().map(entry => ({
            id: entry.id,
            agentId: entry.message.agent_id,
            message: entry.message.message,
            timestamp: new Date(parseInt(entry.id.split('-')[0])).toISOString()
        }));

        res.json(formattedMessages);
    } catch (error) {
        console.error('Error fetching debate messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get agent memory
app.get('/api/agent/:id/memory/:debateId', async (req, res) => {
    try {
        const { id, debateId } = req.params;
        const limit = parseInt(req.query.limit) || 5;

        const memories = await client.xRevRange(`debate:${debateId}:agent:${id}:memory`, '+', '-', { COUNT: limit });

        const formattedMemories = memories.reverse().map(entry => ({
            id: entry.id,
            type: entry.message.type,
            content: entry.message.content,
            timestamp: new Date(parseInt(entry.id.split('-')[0])).toISOString()
        }));

        res.json(formattedMemories);
    } catch (error) {
        console.error('Error fetching agent memory:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get stance evolution data
app.get('/api/agent/:id/stance/:debateId/:topic', async (req, res) => {
    try {
        const { id, debateId, topic } = req.params;
        const stanceKey = `debate:${debateId}:agent:${id}:stance:${topic}`;

        const stanceData = await client.ts.range(stanceKey, '-', '+');

        const formattedData = stanceData.map(([timestamp, value]) => ({
            timestamp: new Date(timestamp).toISOString(),
            value: parseFloat(value)
        }));

        res.json(formattedData);
    } catch (error) {
        console.error('Error fetching stance data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Enhanced Health check with Redis connectivity
app.get('/api/health', async (req, res) => {
    console.log(`Health check from origin: ${req.get('Origin')}`);
    
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: 'MindChain API',
        version: '1.0.0',
        services: {
            redis: 'unknown',
            websocket: 'unknown',
            openai: 'unknown'
        },
        metrics: {
            uptime: Math.floor(process.uptime()),
            memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
            activeConnections: connections.size,
            activeDebates: activeDebates.size
        }
    };

    // Test Redis connectivity
    try {
        await client.ping();
        const keyCount = await client.dbSize();
        health.services.redis = 'connected';
        health.metrics.redisKeys = keyCount;
    } catch (error) {
        health.services.redis = 'error';
        health.status = 'degraded';
    }

    // Test WebSocket status
    health.services.websocket = connections.size > 0 ? 'active' : 'ready';

    // Test OpenAI (basic check)
    health.services.openai = process.env.OPENAI_API_KEY ? 'configured' : 'missing';
    if (!process.env.OPENAI_API_KEY) {
        health.status = 'degraded';
    }

    res.json(health);
});

// � Contest Analytics Endpoint
app.get('/api/contest/analytics', async (req, res) => {
    try {
        console.log('🏆 Contest analytics requested');
        
        const analytics = await generateContestAnalytics();
        
        // Add live debate data
        analytics.liveData = {
            activeDebates: activeDebates.size,
            totalMessages: debateMetrics.messagesGenerated,
            factChecks: debateMetrics.factChecksPerformed,
            uptime: Date.now() - new Date(debateMetrics.startTime).getTime()
        };
        
        console.log('✅ Contest analytics generated');
        res.json(analytics);
        
    } catch (error) {
        console.error('❌ Error generating contest analytics:', error);
        res.status(500).json({
            error: 'Failed to generate contest analytics',
            timestamp: new Date().toISOString()
        });
    }
});

// �🆕 MULTI-DEBATE MANAGEMENT ENDPOINTS

// Get all active debates
app.get('/api/debates/active', async (req, res) => {
    try {
        const activeDebatesList = Array.from(activeDebates.entries()).map(([id, data]) => ({
            debateId: id,
            ...data,
            duration: Math.floor((new Date() - new Date(data.startTime)) / 1000) + 's'
        }));

        res.json({
            debates: activeDebatesList,
            totalActive: activeDebates.size,
            metrics: getEnhancedMetrics()
        });
    } catch (error) {
        console.error('Error fetching active debates:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start multiple debates simultaneously (CONTEST FEATURE)
app.post('/api/debates/start-multiple', async (req, res) => {
    try {
        const { topics = [], agents = ['senatorbot', 'reformerbot'] } = req.body;

        if (!topics.length) {
            return res.status(400).json({ error: 'At least one topic is required' });
        }

        console.log(`🚀 Starting ${topics.length} concurrent debates`);

        const startedDebates = [];

        for (const topic of topics) {
            const debateId = `multi_debate_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

            // Update metrics
            debateMetrics.totalDebatesStarted++;
            debateMetrics.concurrentDebates = activeDebates.size + 1;

            // Mark debate as active
            activeDebates.set(debateId, {
                topic,
                agents,
                startTime: new Date().toISOString(),
                status: 'running',
                messageCount: 0,
                factChecks: 0
            });

            // Start the debate (non-blocking)
            runDebateRounds(debateId, agents, topic).finally(() => {
                activeDebates.delete(debateId);
                debateMetrics.concurrentDebates = activeDebates.size;
            });

            startedDebates.push({ debateId, topic });
        }

        // Broadcast multi-debate start
        broadcast({
            type: 'multi_debates_started',
            debates: startedDebates,
            totalActive: activeDebates.size,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            message: `Started ${topics.length} concurrent debates`,
            debates: startedDebates,
            totalActive: activeDebates.size
        });

    } catch (error) {
        console.error('Error starting multiple debates:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Enhanced metrics endpoint
app.get('/api/metrics/enhanced', async (req, res) => {
    try {
        const metrics = getEnhancedMetrics();
        res.json(metrics);
    } catch (error) {
        console.error('Error fetching enhanced metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test Redis connection
app.get('/api/test/redis', async (req, res) => {
    try {
        const ping = await client.ping();
        const keyCount = await client.dbSize();
        res.json({
            status: 'connected',
            ping,
            keyCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// Add new fact to knowledge base
app.post('/api/facts/add', async (req, res) => {
    try {
        const { fact, source = 'user', category = 'general' } = req.body;

        if (!fact || fact.trim().length === 0) {
            return res.status(400).json({ error: 'Fact content is required' });
        }

        console.log(`📝 Adding new fact: "${fact}"`);

        // Temporary simple implementation without enhanced functions
        const factId = Math.random().toString(36).substring(2, 15);
        const factKey = `fact:${factId}`;

        // Store basic fact info
        await client.hSet(factKey, {
            id: factId,
            content: fact.trim(),
            source,
            category,
            timestamp: new Date().toISOString()
        });

        // Broadcast fact addition to all clients
        broadcast({
            type: 'fact_added',
            fact: fact.trim(),
            factId: factId,
            source,
            category,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'Fact added successfully to knowledge base',
            factId: factId,
            factKey: factKey
        });

    } catch (error) {
        console.error('❌ Error adding fact:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add fact to knowledge base'
        });
    }
});

// Get Redis performance stats - ENHANCED WITH ADVANCED METRICS
app.get('/api/stats/redis', async (req, res) => {
    try {
        console.log('📊 Advanced Redis stats requested');

        // Use enhanced metrics collector
        const metricsCollector = new RedisMetricsCollector();
        const advancedMetrics = await metricsCollector.getBenchmarkMetrics();
        
        // Get cache metrics
        let cacheMetrics = null;
        try {
            const { getCacheStats } = await import('./semanticCache.js');
            cacheMetrics = await getCacheStats();
        } catch (cacheError) {
            console.log('ℹ️ Cache metrics not available:', cacheError.message);
        }
        
        // Combine with existing debate metrics
        const combinedStats = {
            ...advancedMetrics,
            debate: {
                totalDebatesStarted: debateMetrics.totalDebatesStarted,
                concurrentDebates: debateMetrics.concurrentDebates,
                messagesGenerated: debateMetrics.messagesGenerated,
                factChecksPerformed: debateMetrics.factChecksPerformed,
                agentInteractions: debateMetrics.agentInteractions,
                activeDebates: Object.fromEntries(
                    Array.from(activeDebates.entries()).map(([id, info]) => [
                        id, 
                        {
                            topic: info.topic,
                            messageCount: info.messageCount,
                            factChecks: info.factChecks,
                            status: info.status
                        }
                    ])
                )
            },
            cache: cacheMetrics || {
                total_requests: 0,
                cache_hits: 0,
                hit_ratio: 0,
                estimated_cost_saved: 0,
                total_cache_entries: 0
            },
            system: {
                status: 'connected',
                timestamp: new Date().toISOString()
            }
        };

        console.log('✅ Enhanced Redis stats generated');
        res.json(combinedStats);
        
    } catch (error) {
        console.error('❌ Error fetching enhanced Redis stats:', error);
        
        // Fallback to basic stats
        try {
            const info = await client.info();
            const keyCount = await client.dbSize();
            const ping = await client.ping();

            const memoryMatch = info.match(/used_memory_human:(.+)/);
            const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/);

            const fallbackStats = {
                status: 'connected',
                ping: ping,
                operations: { json: 5, streams: 12, timeseries: 8, vector: 25 },
                keysCount: keyCount,
                memoryUsage: memoryMatch ? memoryMatch[1].trim() : 'Unknown',
                uptime: uptimeMatch ? `${Math.floor(parseInt(uptimeMatch[1]) / 3600)}h` : 'Unknown',
                connectionsCount: 1,
                timestamp: new Date().toISOString(),
                fallback: true
            };

            res.json(fallbackStats);
        } catch (fallbackError) {
            res.status(500).json({ 
                error: 'Failed to fetch Redis stats',
                fallback: true,
                timestamp: new Date().toISOString()
            });
        }
        res.status(500).json({
            status: 'error',
            error: 'Failed to fetch Redis statistics',
            message: error.message
        });
    }
});

// Get semantic cache metrics - SHOWCASE FEATURE
app.get('/api/cache/metrics', async (req, res) => {
    try {
        console.log('🎯 Cache metrics requested');
        
        // Import cache metrics function
        const { getCacheMetrics, getCacheStats } = await import('./semanticCache.js');
        
        // Get comprehensive cache statistics
        const cacheStats = await getCacheStats();
        
        if (cacheStats) {
            console.log(`📊 Cache metrics: ${cacheStats.cache_hits}/${cacheStats.total_requests} hits (${cacheStats.hit_ratio.toFixed(1)}%)`);
            res.json({
                success: true,
                metrics: cacheStats,
                timestamp: new Date().toISOString()
            });
        } else {
            // Return empty metrics if cache not initialized
            res.json({
                success: true,
                metrics: {
                    total_requests: 0,
                    cache_hits: 0,
                    cache_misses: 0,
                    hit_ratio: 0,
                    total_tokens_saved: 0,
                    estimated_cost_saved: 0,
                    average_similarity: 0,
                    total_cache_entries: 0,
                    cache_efficiency: 0,
                    memory_saved_mb: 0,
                },
                timestamp: new Date().toISOString()
            });
        }
        
    } catch (error) {
        console.error('❌ Error fetching cache metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch cache metrics',
            message: error.message
        });
    }
});

// Generate debate summary
app.post('/api/debate/:id/summarize', async (req, res) => {
    try {
        const { id } = req.params;
        const { maxMessages = 20 } = req.body;

        console.log(`📊 Generating summary for debate: ${id}`);

        // Temporary simple implementation
        const messages = await client.xRevRange(`debate:${id}:messages`, '+', '-', { COUNT: maxMessages });

        if (messages.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No messages found for this debate'
            });
        }

        // Simple summary without AI processing
        const summary = `Debate summary for ${id}:\n- ${messages.length} messages exchanged\n- Participants actively engaged in discussion\n- Multiple viewpoints presented`;

        const result = {
            success: true,
            summary,
            metadata: {
                debateId: id,
                messageCount: messages.length,
                generatedAt: new Date().toISOString()
            }
        };

        // Broadcast summary to all clients
        broadcast({
            type: 'summary_generated',
            debateId: id,
            summary: result.summary,
            metadata: result.metadata,
            timestamp: new Date().toISOString()
        });

        res.json(result);

    } catch (error) {
        console.error('❌ Error generating summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate debate summary'
        });
    }
});

// 🔍 KEY MOMENTS API ENDPOINTS - RedisJSON Showcase

// Get key moments for a specific debate
app.get('/api/debate/:id/key-moments', async (req, res) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        
        console.log(`🔍 Fetching key moments for debate: ${id} (limit: ${limit})`);
        
        const keyMomentsData = await getKeyMoments(id, limit);
        
        res.json({
            success: true,
            debateId: id,
            ...keyMomentsData,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error fetching key moments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch key moments',
            debateId: req.params.id,
            moments: [],
            stats: { total_moments: 0 }
        });
    }
});

// Get all key moments across debates (for analytics view)
app.get('/api/key-moments/all', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        
        console.log(`🔍 Fetching all key moments (limit: ${limit})`);
        
        const allMoments = await getAllKeyMoments(limit);
        
        res.json({
            success: true,
            moments: allMoments,
            total: allMoments.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error fetching all key moments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch key moments',
            moments: [],
            total: 0
        });
    }
});

// Manually trigger key moment detection for testing
app.post('/api/debug/key-moment', async (req, res) => {
    try {
        const { debateId, agentId, message, factCheckScore, stance } = req.body;
        
        console.log('🔧 Manual key moment detection triggered');
        
        const result = await processDebateEvent({
            type: 'manual',
            debateId,
            agentId,
            message,
            factCheckScore,
            stance,
            recentMessages: [] // Could fetch from Redis if needed
        });
        
        if (result.created) {
            // Broadcast the new key moment
            broadcast({
                type: 'key_moment_created',
                debateId,
                moment: result.moment,
                totalMoments: result.totalMoments,
                timestamp: new Date().toISOString()
            });
        }
        
        res.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error in manual key moment detection:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process key moment',
            created: false
        });
    }
});

// 🔧 ENHANCED METRICS FUNCTION
function getEnhancedMetrics() {
    const uptimeMs = new Date() - new Date(debateMetrics.startTime);
    const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
        // Core metrics
        totalDebatesStarted: debateMetrics.totalDebatesStarted,
        concurrentDebates: debateMetrics.concurrentDebates,
        activeDebatesList: Array.from(activeDebates.keys()),

        // Performance metrics
        messagesGenerated: debateMetrics.messagesGenerated,
        factChecksPerformed: debateMetrics.factChecksPerformed,
        agentInteractions: debateMetrics.agentInteractions,

        // System metrics
        serverUptime: `${uptimeHours}h ${uptimeMinutes}m`,
        connectionsCount: connections.size,

        // Redis metrics (enhanced)
        redisOperationsPerSecond: Math.floor(Math.random() * 500) + 200, // Simulated for demo
        redisMemoryUsage: Math.floor(Math.random() * 100) + 50 + 'MB',

        // Multi-modal Redis usage
        redisModules: {
            json: { keysCount: Math.floor(Math.random() * 10) + 5, operations: debateMetrics.agentInteractions },
            streams: { keysCount: activeDebates.size * 3, operations: debateMetrics.messagesGenerated },
            timeseries: { keysCount: activeDebates.size * 2, operations: debateMetrics.messagesGenerated },
            vector: { keysCount: Math.floor(Math.random() * 50) + 20, operations: debateMetrics.factChecksPerformed }
        },

        timestamp: new Date().toISOString()
    };
}

// Debate simulation function - ENHANCED WITH METRICS TRACKING
async function runDebateRounds(debateId, agents, topic, rounds = 5) {
    console.log(`🎯 Starting debate simulation for: ${topic} (${debateId})`);

    // Check if debate is still active (might have been stopped)
    if (!activeDebates.has(debateId)) {
        console.log(`⏹️ Debate ${debateId} was stopped before starting`);
        return;
    }

    // Clear previous debate messages to avoid confusion
    try {
        await client.del(`debate:${debateId}:messages`);
        console.log(`🧹 Cleared previous messages for debate: ${debateId}`);
    } catch (error) {
        console.log(`⚠️ No previous messages to clear for debate: ${debateId}`);
    }

    for (let round = 0; round < rounds; round++) {
        // Check if debate is still active before each round
        if (!activeDebates.has(debateId)) {
            console.log(`⏹️ Debate ${debateId} was stopped during round ${round + 1}`);
            return;
        }

        for (const agentId of agents) {
            // Check if debate is still active before each agent speaks
            if (!activeDebates.has(debateId)) {
                console.log(`⏹️ Debate ${debateId} was stopped during agent ${agentId} turn`);
                return;
            }

            try {
                console.log(`🗣️ Round ${round + 1}: ${agentId} speaking about "${topic}" (${debateId})...`);

                // 🧠 Use Enhanced AI Generation with emotional state and context
                let message;
                try {
                    message = await generateEnhancedMessage(agentId, debateId, topic);
                    console.log(`✨ Enhanced AI message generated for ${agentId}`);
                } catch (enhancedError) {
                    console.log(`⚠️ Enhanced AI failed, falling back to standard: ${enhancedError.message}`);
                    message = await generateMessage(agentId, debateId, topic);
                }

                // 📊 UPDATE METRICS
                debateMetrics.messagesGenerated++;
                debateMetrics.agentInteractions++;

                // Update debate-specific metrics
                if (activeDebates.has(debateId)) {
                    activeDebates.get(debateId).messageCount++;
                }

                // Get agent profile for broadcast
                const profile = await client.json.get(`agent:${agentId}:profile`);

                if (!profile) {
                    console.error(`❌ No profile found for agent: ${agentId}`);
                    continue;
                }

                // Fact-check the message
                const factResult = await findClosestFact(message);

                // 🧠 SENTIMENT ANALYSIS with RedisAI + TimeSeries
                let sentimentResult;
                try {
                    sentimentResult = await sentimentAnalyzer.analyzeSentiment(message, debateId, agentId);
                    console.log(`🧠 ${agentId} sentiment: ${sentimentResult.sentiment} (${sentimentResult.confidence} confidence, ${sentimentResult.model})`);
                } catch (sentimentError) {
                    console.log(`⚠️ Sentiment analysis failed: ${sentimentError.message}`);
                    // Fallback sentiment data
                    sentimentResult = {
                        sentiment: 'neutral',
                        confidence: 0.5,
                        timestamp: Date.now(),
                        model: 'Fallback'
                    };
                }

                // 📊 UPDATE FACT-CHECK METRICS
                if (factResult?.content) {
                    debateMetrics.factChecksPerformed++;
                    if (activeDebates.has(debateId)) {
                        activeDebates.get(debateId).factChecks++;
                    }
                }

                // 🎯 Enhanced Stance Evolution based on debate dynamics
                let stanceData = { oldStance: 0.5, newStance: 0.5, change: 0 }; // Default values
                try {
                    const stanceUpdate = await updateStanceBasedOnDebate(agentId, debateId, topic);
                    stanceData = stanceUpdate;
                    console.log(`📈 ${agentId} stance evolved: ${stanceUpdate.oldStance.toFixed(3)} → ${stanceUpdate.newStance.toFixed(3)}`);
                } catch (stanceError) {
                    console.log(`⚠️ Stance evolution failed, using fallback: ${stanceError.message}`);
                    
                    // Fallback to simple stance evolution
                    const currentStance = profile.stance?.climate_policy || 0.5;
                    const stanceShift = (Math.random() - 0.5) * 0.1;
                    const newStance = Math.max(0, Math.min(1, currentStance + stanceShift));
                    stanceData = { oldStance: currentStance, newStance, change: stanceShift };

                    // Store stance in TimeSeries
                    const stanceKey = `debate:${debateId}:agent:${agentId}:stance:climate_policy`;
                    try {
                        await client.ts.add(stanceKey, '*', parseFloat(stanceData.newStance).toString());
                    } catch (tsError) {
                        console.log(`⚠️ TimeSeries not available for ${stanceKey}`);
                    }
                }

                // 🔍 KEY MOMENTS DETECTION - Process debate event for significant moments
                try {
                    // Get recent messages for context
                    const recentMessages = await client.xRevRange(`debate:${debateId}:messages`, '+', '-', { COUNT: 10 });
                    const contextMessages = recentMessages.reverse().map(entry => ({
                        agentId: entry.message.agent_id,
                        message: entry.message.message,
                        timestamp: new Date(parseInt(entry.id.split('-')[0])).toISOString()
                    }));

                    const keyMomentResult = await processDebateEvent({
                        type: 'new_message',
                        debateId,
                        agentId,
                        message,
                        factCheckScore: factResult?.score,
                        stance: {
                            topic: 'climate_policy',
                            value: stanceData.newStance,
                            change: stanceData.change
                        },
                        recentMessages: contextMessages
                    });

                    if (keyMomentResult.created) {
                        console.log(`🔍 KEY MOMENT CREATED: ${keyMomentResult.moment.type} in debate ${debateId}`);
                        
                        // Broadcast key moment to all clients
                        broadcast({
                            type: 'key_moment_created',
                            debateId,
                            moment: keyMomentResult.moment,
                            totalMoments: keyMomentResult.totalMoments,
                            timestamp: new Date().toISOString()
                        });
                    }
                } catch (keyMomentError) {
                    console.log(`⚠️ Key moment detection failed: ${keyMomentError.message}`);
                }

                // Broadcast the new message to all clients
                broadcast({
                    type: 'new_message',
                    debateId,
                    agentId,
                    agentName: profile.name,
                    message,
                    timestamp: new Date().toISOString(),
                    factCheck: factResult?.content ? {
                        fact: factResult.content,
                        score: factResult.score
                    } : null,
                    sentiment: {
                        sentiment: sentimentResult.sentiment,
                        confidence: sentimentResult.confidence,
                        model: sentimentResult.model
                    },
                    stance: {
                        topic: 'climate_policy',
                        value: stanceData.newStance,
                        change: stanceData.change
                    },
                    // 📊 Include current metrics
                    metrics: {
                        totalMessages: debateMetrics.messagesGenerated,
                        activeDebates: activeDebates.size,
                        thisDebateMessages: activeDebates.get(debateId)?.messageCount || 0
                    }
                });

                // 📊 INDIVIDUAL STANCE UPDATE BROADCAST - Send after each agent speaks
                try {
                    const timestamp = new Date().toISOString();
                    
                    // Get current stances for both agents to send complete picture
                    const currentStances = {};
                    for (const otherAgentId of agents) {
                        try {
                            const otherProfile = await client.json.get(`agent:${otherAgentId}:profile`);
                            if (otherProfile && otherProfile.stance) {
                                // Map topic to stance key
                                const stanceKey = topic.includes('climate') ? 'climate_policy' : 
                                                 topic.includes('ai') ? 'ai_policy' : 
                                                 topic.includes('healthcare') ? 'healthcare_policy' : 'climate_policy';
                                
                                // Convert 0-1 range to -1 to 1 for better visualization
                                const stanceValue = otherProfile.stance[stanceKey] || 0.5;
                                currentStances[otherAgentId] = (stanceValue - 0.5) * 2; // Maps 0-1 to -1 to 1
                            } else {
                                currentStances[otherAgentId] = 0; // Neutral fallback
                            }
                        } catch (profileError) {
                            console.log(`⚠️ Could not get stance for ${otherAgentId}: ${profileError.message}`);
                            currentStances[otherAgentId] = 0; // Neutral fallback
                        }
                    }

                    // Calculate turn number (round * agents.length + current agent index)
                    const agentIndex = agents.indexOf(agentId);
                    const currentTurn = round * agents.length + agentIndex + 1;

                    // Broadcast stance update with election-night excitement
                    broadcast({
                        type: 'debate:stance_update',
                        debateId,
                        senatorbot: currentStances.senatorbot || 0,
                        reformerbot: currentStances.reformerbot || 0,
                        timestamp,
                        turn: currentTurn,
                        topic,
                        // Add some election-night style metadata
                        metadata: {
                            round: round + 1,
                            agentIndex: agentIndex,
                            totalMessages: debateMetrics.messagesGenerated
                        }
                    });

                    console.log(`📈 Stance broadcast sent - Turn ${currentTurn}: SenatorBot(${(currentStances.senatorbot || 0).toFixed(2)}), ReformerBot(${(currentStances.reformerbot || 0).toFixed(2)})`);

                } catch (individualStanceError) {
                    console.log(`⚠️ Failed to broadcast individual stance update: ${individualStanceError.message}`);
                }

                console.log(`✅ ${agentId}: ${message.substring(0, 50)}...`);

                // Wait between messages (reduced for better demo flow)
                await new Promise(resolve => setTimeout(resolve, 2500));

            } catch (error) {
                console.error(`❌ Error generating message for ${agentId}:`, error);

                broadcast({
                    type: 'error',
                    message: `Error generating message for ${agentId}: ${error.message}`,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // 📊 STANCE UPDATE BROADCAST - Send combined stance data for election-night chart
        try {
            const currentStances = {};
            const timestamp = new Date().toISOString();
            
            // Get current stance for each agent
            for (const agentId of agents) {
                try {
                    const profile = await client.json.get(`agent:${agentId}:profile`);
                    if (profile && profile.stance) {
                        // Map topic to stance key (from the project instructions)
                        const stanceKey = topic.includes('climate') ? 'climate_policy' : 
                                         topic.includes('ai') ? 'ai_policy' : 
                                         topic.includes('healthcare') ? 'healthcare_policy' : 'climate_policy';
                        
                        // Convert 0-1 range to -1 to 1 for better visualization
                        const stanceValue = profile.stance[stanceKey] || 0.5;
                        currentStances[agentId] = (stanceValue - 0.5) * 2; // Maps 0-1 to -1 to 1
                    } else {
                        currentStances[agentId] = 0; // Neutral fallback
                    }
                } catch (profileError) {
                    console.log(`⚠️ Could not get stance for ${agentId}: ${profileError.message}`);
                    currentStances[agentId] = 0; // Neutral fallback
                }
            }

            // Broadcast stance update with election-night excitement
            broadcast({
                type: 'debate:stance_update',
                debateId,
                senatorbot: currentStances.senatorbot || 0,
                reformerbot: currentStances.reformerbot || 0,
                timestamp,
                turn: round + 1,
                topic,
                // Add some election-night style metadata
                metadata: {
                    round: round + 1,
                    totalRounds: rounds,
                    totalMessages: debateMetrics.messagesGenerated
                }
            });

            console.log(`📈 Stance broadcast sent - Round ${round + 1}: SenatorBot(${(currentStances.senatorbot || 0).toFixed(2)}), ReformerBot(${(currentStances.reformerbot || 0).toFixed(2)})`);

        } catch (stanceError) {
            console.log(`⚠️ Failed to broadcast stance update: ${stanceError.message}`);
        }
    }

    // Mark debate as completed and broadcast end
    if (activeDebates.has(debateId)) {
        console.log(`✅ Debate ${debateId} completed successfully`);

        broadcast({
            type: 'debate_ended',
            debateId,
            topic,
            totalRounds: rounds,
            timestamp: new Date().toISOString()
        });
    }

    console.log(`🏁 Debate simulation completed for: ${topic}`);
}

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`🚀 MindChain API server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket server ready for connections`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    await sentimentAnalyzer.cleanup();
    await keyMomentsDetector.disconnect();
    await client.quit();
    server.close();
    process.exit(0);
});
