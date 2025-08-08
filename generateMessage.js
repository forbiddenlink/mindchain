import 'dotenv/config';
import redisManager from './redisManager.js';
import OpenAI from 'openai';
import { getCachedResponse, cacheNewResponse } from './semanticCache.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateMessage(agentId, debateId, topic = 'general policy') {
    try {
        console.log('📝 Starting message generation...', { agentId, debateId, topic });

        const profileKey = `agent:${agentId}:profile`;
        const memoryStreamKey = `debate:${debateId}:agent:${agentId}:memory`;

        // Get agent profile using Redis manager
        const profile = await redisManager.execute(async (client) => {
            return await client.json.get(profileKey);
        });

        if (!profile) {
            throw new Error(`Agent profile not found for ${agentId}`);
        }

        // Get last 3 entries from this agent's private memory
        const memories = await redisManager.execute(async (client) => {
            return await client.xRevRange(memoryStreamKey, '+', '-', { COUNT: 3 });
        });

        const memoryContext = memories
            .reverse()
            .map(entry => entry.message.content)
            .map((msg, i) => `Memory ${i + 1}: ${msg}`)
            .join('\n');

        // Construct prompt with memory + profile + dynamic topic
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

        // Check semantic cache for similar prompts (agent-specific)
        console.log(`🔍 Checking semantic cache for similar prompts (${agentId})...`);
        const agentSpecificTopic = `${agentId}:${topic}:${profile.name}`; // Make cache agent-specific
        const cachedResult = await getCachedResponse(prompt, agentSpecificTopic);

        let message;
        if (cachedResult) {
            message = cachedResult.response;
            console.log(`🎯 Using cached response (${(cachedResult.similarity * 100).toFixed(1)}% similarity)`);
            console.log(`💰 Saved OpenAI API call - Cache hit!`);
        } else {
            // Generate AI message (cache miss)
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

            // Cache the new response for future similarity searches (agent-specific)
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

        // Save to full debate stream and agent's memory stream
        await redisManager.execute(async (client) => {
            // Save to full debate stream
            await client.xAdd(debateStreamKey, '*', {
                agent_id: agentId,
                message,
                cached: (cachedResult ? 'true' : 'false'),
                similarity: (cachedResult ? cachedResult.similarity.toString() : '0')
            });

            // Save to agent's memory stream
            await client.xAdd(memoryStreamKey, '*', {
                type: 'statement',
                content: message,
            });
        });

        return {
            message,
            cacheHit: !!cachedResult,
            similarity: cachedResult ? cachedResult.similarity : 0,
            costSaved: cachedResult ? 0.002 : 0 // Estimate cost per API call
        };

    } catch (error) {
        console.error('❌ Error in generateMessage:', error);
        // Fallback response
        return {
            message: `I apologize, but I'm having trouble formulating a response right now. Let me gather my thoughts on ${topic}.`,
            cacheHit: false,
            similarity: 0,
            costSaved: 0
        };
    }
}

// Generate message without storing to streams (for server-controlled storage)
export async function generateMessageOnly(agentId, debateId, topic = 'general policy') {
    try {
        const profileKey = `agent:${agentId}:profile`;
        const memoryStreamKey = `debate:${debateId}:agent:${agentId}:memory`;

        // Get agent profile using Redis manager
        const profile = await redisManager.execute(async (client) => {
            return await client.json.get(profileKey);
        });

        if (!profile) {
            throw new Error(`Agent profile not found for ${agentId}`);
        }

        // Get last 3 entries from this agent's private memory
        const memories = await redisManager.execute(async (client) => {
            return await client.xRevRange(memoryStreamKey, '+', '-', { COUNT: 3 });
        });

        const memoryContext = memories
            .reverse()
            .map(entry => entry.message.content)
            .map((msg, i) => `Memory ${i + 1}: ${msg}`)
            .join('\n');

        // Get enhanced context for better variety
        const messageStream = await redisManager.execute(async (client) => {
            return await client.xRevRange(`debate:${debateId}:messages`, '+', '-', { COUNT: 50 });
        });

        const totalMessages = messageStream.length;
        const turnNumber = Math.floor(totalMessages / 2) + 1;

        // Add randomization elements
        const randomSeed = Math.floor(Math.random() * 1000);
        const conversationalCues = [
            "Let me address this directly:",
            "I want to emphasize:",
            "My position is clear:",
            "Here's what I believe:",
            "From my perspective:",
        ];
        const randomCue = conversationalCues[randomSeed % conversationalCues.length];

        // Construct prompt with memory + profile + dynamic topic
        const prompt = `
You are ${profile.name}, a ${profile.tone} ${profile.role}.
You believe in ${profile.biases.join(', ')}.
Debate topic: ${topic}.
Turn: ${turnNumber}
Conversational style: ${randomCue}

${memoryContext
                ? `Previously, you said:\n${memoryContext}\n\n`
                : ''
            }Reply with a short statement (1–2 sentences) to continue the debate on "${topic}".
Stay focused on this specific topic and maintain your character's perspective.
Avoid repeating previous arguments. Seed: ${randomSeed}
`;

        // Check semantic cache for similar prompts (agent-specific)
        console.log(`🔍 Checking semantic cache for similar prompts (${agentId})...`);
        const agentSpecificTopic = `${agentId}:${topic}:${profile.name}`;
        const cachedResult = await getCachedResponse(prompt, agentSpecificTopic);

        let message;
        if (cachedResult) {
            message = cachedResult.response;
            console.log(`🎯 Using cached response (${(cachedResult.similarity * 100).toFixed(1)}% similarity)`);
        } else {
            // Generate AI message (cache miss)
            console.log('🤖 Generating new AI response...');
            const chatResponse = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: prompt },
                    { role: 'user', content: `What's your perspective on "${topic}"? Keep it brief and in character. ${randomCue}` },
                ],
                temperature: 0.8,
            });

            message = chatResponse.choices[0].message.content.trim();

            // Cache the new response
            await cacheNewResponse(prompt, message, {
                agentId,
                debateId,
                topic: agentSpecificTopic,
                timestamp: new Date().toISOString(),
            });
        }

        return {
            message,
            cacheHit: !!cachedResult,
            similarity: cachedResult ? cachedResult.similarity : 0,
            costSaved: cachedResult ? 0.002 : 0
        };

    } catch (error) {
        console.error('❌ Error in generateMessageOnly:', error);
        return {
            message: `I apologize, but I'm having trouble formulating a response right now. Let me gather my thoughts on ${topic}.`,
            cacheHit: false,
            similarity: 0,
            costSaved: 0
        };
    }
}

// Enhanced message generation with better AI context
export async function generateEnhancedMessage(agentId, debateId, topic = 'general policy', conversationHistory = []) {
    try {
        console.log('📝 Starting enhanced message generation...', { agentId, debateId, topic });

        // Check cache first
        const promptForCache = `Generate a political debate message for agent ${agentId} on topic: ${topic}`;
        const cachedResponse = await getCachedResponse(promptForCache);

        if (cachedResponse) {
            console.log('🎯 Cache hit! Using cached response');
            return cachedResponse;
        }

        console.log('💭 Cache miss - generating new response');

        const profileKey = `agent:${agentId}:profile`;
        const messagesKey = `debate:${debateId}:messages`;

        // Get agent profile and recent conversation
        const [profile, messages] = await Promise.all([
            redisManager.execute(async (client) => {
                return await client.json.get(profileKey);
            }),
            redisManager.execute(async (client) => {
                return await client.xRevRange(messagesKey, '+', '-', { COUNT: 10 });
            })
        ]);

        if (!profile) {
            throw new Error(`Agent profile not found for ${agentId}`);
        }

        // Build conversation context
        const recentMessages = messages.map(msg => {
            const data = msg.message;
            return `${data.agent_id}: ${data.message}`;
        }).reverse().join('\n');

        // Generate response
        const systemPrompt = `You are ${profile.name}, a ${profile.role}. Your political stance: ${profile.stance || 'moderate'}. 
Political positions: ${JSON.stringify(profile.positions || {}, null, 2)}
Your personality: ${profile.personality || 'analytical and thoughtful'}
Your speaking style: ${profile.speaking_style || 'formal and measured'}
Debate style: ${profile.debate_style || 'evidence-based and respectful'}

IMPORTANT: Keep responses under 200 words. Be engaging but concise. Reference your political positions when relevant.`;

        const userPrompt = `Topic: ${topic}

Recent conversation:
${recentMessages}

Respond as ${profile.name} with your unique perspective on this topic. Stay true to your political positions and personality.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            max_tokens: 300,
            temperature: 0.8
        });

        const response = completion.choices[0].message.content;
        console.log('✅ Generated new response');

        // Cache the new response
        await cacheNewResponse(promptForCache, response);

        return response;

    } catch (error) {
        console.error('❌ Error in generateEnhancedMessage:', error);
        // Fallback response
        return `I apologize, but I'm having trouble formulating a response right now. Let me gather my thoughts on ${topic}.`;
    }
}

export default generateMessage;
