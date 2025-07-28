import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createClient } from 'redis';
import { generateMessage } from './generateMessage.js';
import { findClosestFact } from './factChecker.js';
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

        console.log(`🎯 Starting debate: ${debateId} on topic: ${topic}`);

        // Broadcast debate start
        broadcast({
            type: 'debate_started',
            debateId,
            topic,
            agents,
            timestamp: new Date().toISOString()
        });

        // Start the debate loop
        runDebateRounds(debateId, agents, topic);

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

// Debate simulation function
async function runDebateRounds(debateId, agents, topic, rounds = 5) {
    for (let round = 0; round < rounds; round++) {
        for (const agentId of agents) {
            try {
                console.log(`🗣️ Round ${round + 1}: ${agentId} speaking...`);

                // Generate message
                const message = await generateMessage(agentId, debateId);

                // Get agent profile for broadcast
                const profile = await client.json.get(`agent:${agentId}:profile`);

                // Fact-check the message
                const factResult = await findClosestFact(message);

                // Update stance (simulate evolution)
                const currentStance = profile.stance.climate_policy || 0.5;
                const stanceShift = (Math.random() - 0.5) * 0.1; // Small random shift
                const newStance = Math.max(0, Math.min(1, currentStance + stanceShift));

                // Store stance in TimeSeries
                const stanceKey = `debate:${debateId}:agent:${agentId}:stance:climate_policy`;
                await client.ts.add(stanceKey, '*', newStance);

                // Broadcast the new message to all clients
                broadcast({
                    type: 'new_message',
                    debateId,
                    agentId,
                    agentName: profile.name,
                    message,
                    timestamp: new Date().toISOString(),
                    factCheck: factResult.content ? {
                        fact: factResult.content,
                        score: factResult.score
                    } : null,
                    stance: {
                        topic: 'climate_policy',
                        value: newStance,
                        change: stanceShift
                    }
                });

                // Wait between messages
                await new Promise(resolve => setTimeout(resolve, 3000));

            } catch (error) {
                console.error(`Error generating message for ${agentId}:`, error);

                broadcast({
                    type: 'error',
                    message: `Error generating message for ${agentId}`,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    // Broadcast debate end
    broadcast({
        type: 'debate_ended',
        debateId,
        timestamp: new Date().toISOString()
    });
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
