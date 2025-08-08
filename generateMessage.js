import 'dotenv/config';
import { createClient } from 'redis';
import OpenAI from 'openai';
import { getCachedResponse, cacheNewResponse } from './semanticCache.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Redis connection pool singleton to prevent memory leaks
class RedisPool {
    constructor() {
        this.client = null;
        this.connectionPromise = null;
    }

    async getClient() {
        if (this.client && this.client.isReady) {
            return this.client;
        }

        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = this.createConnection();
        return this.connectionPromise;
    }

    async createConnection() {
        try {
            this.client = createClient({ 
                url: process.env.REDIS_URL,
                socket: {
                    reconnectDelay: Math.min(1000, 50),
                    connectTimeout: 5000
                }
            });
            
            await this.client.connect();
            console.log('🔗 Redis connection pool established');
            
            // Handle connection errors
            this.client.on('error', (err) => {
                console.error('❌ Redis pool client error:', err);
                this.client = null;
                this.connectionPromise = null;
            });

            this.connectionPromise = null;
            return this.client;
        } catch (error) {
            console.error('❌ Failed to create Redis connection:', error);
            this.connectionPromise = null;
            throw error;
        }
    }

    async disconnect() {
        if (this.client) {
            try {
                await this.client.quit();
                console.log('🔌 Redis connection pool disconnected');
            } catch (error) {
                console.error('❌ Error disconnecting Redis pool:', error);
            }
            this.client = null;
            this.connectionPromise = null;
        }
    }
}

const redisPool = new RedisPool();

export async function generateMessage(agentId, debateId, topic = 'general policy') {
    const client = await redisPool.getClient();

    const profileKey = `agent:${agentId}:profile`;
    const profile = await client.json.get(profileKey);

    const memoryStreamKey = `debate:${debateId}:agent:${agentId}:memory`;

    // ⏪ Step 1: Get last 3 entries from this agent's private memory
    const memories = await client.xRevRange(memoryStreamKey, '+', '-', { COUNT: 3 });

    const memoryContext = memories
        .reverse()
        .map(entry => entry.message.content)
        .map((msg, i) => `Memory ${i + 1}: ${msg}`)
        .join('\n');

    // 📊 Step 2: Construct prompt with memory + profile + dynamic topic
    const prompt = `
You are ${profile.name}, a ${profile.tone} ${profile.role}.
You believe in ${profile.biases.join(', ')}.
Debate topic: ${topic}.

${memoryContext
            ? `Previously, you said:\n${memoryContext}\n\n`
            : ''
        }Reply with a short statement (1–2 sentences) to continue the debate on "${topic}".
Stay focused on this specific topic and maintain your character's perspective.
`;

    // 🎯 Step 2.5: Check semantic cache for similar prompts (agent-specific)
    console.log(`🔍 Checking semantic cache for similar prompts (${agentId})...`);
    const agentSpecificTopic = `${agentId}:${topic}:${profile.name}`; // Make cache agent-specific
    const cachedResult = await getCachedResponse(prompt, agentSpecificTopic);
    
    let message;
    if (cachedResult) {
        message = cachedResult.response;
        console.log(`🎯 Using cached response (${(cachedResult.similarity * 100).toFixed(1)}% similarity)`);
        console.log(`💰 Saved OpenAI API call - Cache hit!`);
    } else {
        // 💬 Step 3: Generate AI message (cache miss)
        console.log('🤖 Generating new AI response...');
        const chatResponse = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: `What's your perspective on "${topic}"? Keep it brief and in character.` },
            ],
            temperature: 0.8, // Add some randomness to prevent repetition
        });

        message = chatResponse.choices[0].message.content.trim();
        
        // 💾 Cache the new response for future similarity searches (agent-specific)
        await cacheNewResponse(prompt, message, {
            agentId,
            debateId,
            topic: agentSpecificTopic, // Use agent-specific topic
            timestamp: new Date().toISOString(),
        });
        console.log('💾 Response cached for future similarity matching');
    }
    console.log(`${agentId}: ${message}`);

    const debateStreamKey = `debate:${debateId}:messages`;

    // 💾 Step 4: Save to full debate stream
    await client.xAdd(debateStreamKey, '*', {
        agent_id: agentId,
        message,
        cached: (cachedResult ? 'true' : 'false'),
        similarity: (cachedResult ? cachedResult.similarity.toString() : '0')
    });

    // 💾 Step 5: Save to agent's memory stream
    await client.xAdd(memoryStreamKey, '*', {
        type: 'statement',
        content: message,
    });

    // ✅ No longer calling client.quit() - connection pool manages this
    
    return {
        message,
        cacheHit: !!cachedResult,
        similarity: cachedResult ? cachedResult.similarity : 0,
        costSaved: cachedResult ? 0.002 : 0 // Estimate cost per API call
    };
}

// Generate message without storing to streams (for server-controlled storage)
export async function generateMessageOnly(agentId, debateId, topic = 'general policy') {
    const client = await redisPool.getClient();

    const profileKey = `agent:${agentId}:profile`;
    const profile = await client.json.get(profileKey);

    const memoryStreamKey = `debate:${debateId}:agent:${agentId}:memory`;

    // ⏪ Step 1: Get last 3 entries from this agent's private memory
    const memories = await client.xRevRange(memoryStreamKey, '+', '-', { COUNT: 3 });

    const memoryContext = memories
        .reverse()
        .map(entry => entry.message.content)
        .map((msg, i) => `Memory ${i + 1}: ${msg}`)
        .join('\n');

    // 📊 Step 2: Construct enhanced prompt with variety mechanisms to prevent cache collisions
    const messageStream = await client.xRevRange(`debate:${debateId}:messages`, '+', '-', { COUNT: 50 });
    const totalMessages = messageStream.length;
    const turnNumber = Math.floor(totalMessages / 2) + 1;
    
    // Add randomization elements
    const randomSeed = Math.floor(Math.random() * 1000);
    const conversationalCues = [
        "Let me address this directly:",
        "I want to emphasize:",
        "My position is clear:",
        "Here's what I believe:",
        "Allow me to explain:",
        "I must point out:",
        "Consider this perspective:",
        "The reality is:"
    ];
    const randomCue = conversationalCues[Math.floor(Math.random() * conversationalCues.length)];
    
    const prompt = `
You are ${profile.name}, a ${profile.tone} ${profile.role}.
You believe in ${profile.biases.join(', ')}.
Debate topic: ${topic}.
Turn #${turnNumber} | Message Count: ${totalMessages} | Seed: ${randomSeed}

${randomCue}

Your recent memories:
${memoryContext || 'This is the start of the debate.'}

Generate a unique, varied response about ${topic}. Stay in character but ensure this response differs from previous ones. Keep under 200 words.
IMPORTANT: Even if discussing similar points, phrase them differently and add new angles or examples.`;

    // 🎯 Step 3: Check semantic cache for similar prompts
    const cachedResult = await getCachedResponse(prompt, topic);

    let message;
    if (cachedResult) {
        message = cachedResult.response;
        console.log(`🎯 Using cached response (${(cachedResult.similarity * 100).toFixed(1)}% similarity)`);
    } else {
        console.log('💭 No cache hit, generating new AI response...');

        // Add temperature variation based on turn number and randomness
        const baseTemperature = 0.7;
        const turnVariation = (turnNumber % 5) * 0.05; // 0.0 to 0.2
        const randomVariation = (Math.random() - 0.5) * 0.2; // -0.1 to +0.1
        const dynamicTemperature = Math.max(0.3, Math.min(1.0, baseTemperature + turnVariation + randomVariation));

        const chatResponse = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 300,
            temperature: dynamicTemperature,
        });

        message = chatResponse.choices[0].message.content.trim();
        
        // 💾 Cache the new response for future similarity searches
        await cacheNewResponse(prompt, message, {
            agentId,
            debateId,
            topic,
            timestamp: new Date().toISOString(),
        });
        console.log('💾 Response cached for future similarity matching');
    }
    console.log(`${agentId}: ${message}`);

    // ✅ No longer calling client.quit() - connection pool manages this
    
    return {
        message,
        cacheHit: !!cachedResult,
        similarity: cachedResult ? cachedResult.similarity : 0,
        costSaved: cachedResult ? 0.002 : 0
    };
}

// Export cleanup function for graceful shutdown
export async function cleanup() {
    await redisPool.disconnect();
}
