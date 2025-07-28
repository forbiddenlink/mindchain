import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createClient } from 'redis';
import { generateMessage } from './generateMessage.js';
import { findClosestFact } from './factChecker.js';
// import { addFactToDatabase } from './addFactsEnhanced.js';
// import { summarizeDebate } from './summarizeDebateEnhanced.js';
import { createServer } from 'http';

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

// Store active WebSocket connections
const connections = new Set();

// Store active debate state to prevent concurrent debates
const activeDebates = new Map();

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

// Start a new debate
app.post('/api/debate/start', async (req, res) => {
    try {
        const { debateId = 'live_debate', topic = 'climate change policy', agents = ['senatorbot', 'reformerbot'] } = req.body;

        // Check if debate is already running
        if (activeDebates.has(debateId)) {
            return res.status(409).json({
                error: 'Debate is already running',
                debateId,
                message: 'Please wait for the current debate to finish or use a different debate ID'
            });
        }

        console.log(`🎯 Starting debate: ${debateId} on topic: ${topic}`);

        // Mark debate as active
        activeDebates.set(debateId, {
            topic,
            agents,
            startTime: new Date().toISOString(),
            status: 'running'
        });

        // Broadcast debate start
        broadcast({
            type: 'debate_started',
            debateId,
            topic,
            agents,
            timestamp: new Date().toISOString()
        });

        // Start the debate loop (don't await to return response immediately)
        runDebateRounds(debateId, agents, topic).finally(() => {
            // Remove from active debates when finished
            activeDebates.delete(debateId);
        });

        res.json({
            success: true,
            debateId,
            topic,
            agents,
            message: 'Debate started successfully'
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

// Health check
app.get('/api/health', (req, res) => {
    console.log(`Health check from origin: ${req.get('Origin')}`);
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: 'MindChain API',
        version: '1.0.0'
    });
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

// Get Redis performance stats
app.get('/api/stats/redis', async (req, res) => {
    try {
        console.log('📊 Redis stats requested');
        
        // Get basic Redis info
        const info = await client.info();
        const keyCount = await client.dbSize();
        const ping = await client.ping();

        // Parse memory usage from info
        const memoryMatch = info.match(/used_memory_human:(.+)/);
        const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/);

        const stats = {
            status: 'connected',
            ping: ping,
            operations: Math.floor(Math.random() * 1000) + 500, // Simulated for demo
            keysCount: keyCount,
            memoryUsage: memoryMatch ? memoryMatch[1].trim() : 'Unknown',
            uptime: uptimeMatch ? `${Math.floor(parseInt(uptimeMatch[1]) / 3600)}h` : 'Unknown',
            connectionsCount: 1,
            timestamp: new Date().toISOString()
        };

        console.log('✅ Redis stats generated:', stats);
        res.json(stats);
    } catch (error) {
        console.error('❌ Error fetching Redis stats:', error);
        res.status(500).json({ 
            status: 'error',
            error: 'Failed to fetch Redis statistics',
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

// Debate simulation function
async function runDebateRounds(debateId, agents, topic, rounds = 5) {
    console.log(`🎯 Starting debate simulation for: ${topic}`);

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
                console.log(`🗣️ Round ${round + 1}: ${agentId} speaking about "${topic}"...`);

                // Generate message with topic context
                const message = await generateMessage(agentId, debateId, topic);

                // Get agent profile for broadcast
                const profile = await client.json.get(`agent:${agentId}:profile`);

                if (!profile) {
                    console.error(`❌ No profile found for agent: ${agentId}`);
                    continue;
                }

                // Fact-check the message
                const factResult = await findClosestFact(message);

                // Update stance (simulate evolution)
                const currentStance = profile.stance?.climate_policy || 0.5;
                const stanceShift = (Math.random() - 0.5) * 0.1; // Small random shift
                const newStance = Math.max(0, Math.min(1, currentStance + stanceShift));

                // Store stance in TimeSeries
                const stanceKey = `debate:${debateId}:agent:${agentId}:stance:climate_policy`;
                try {
                    await client.ts.add(stanceKey, '*', newStance);
                } catch (tsError) {
                    console.log(`⚠️ TimeSeries not available for ${stanceKey}`);
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
                    stance: {
                        topic: 'climate_policy',
                        value: newStance,
                        change: stanceShift
                    }
                });

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
    await client.quit();
    server.close();
    process.exit(0);
});
