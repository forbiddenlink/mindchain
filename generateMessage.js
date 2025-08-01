import 'dotenv/config';
import { createClient } from 'redis';
import OpenAI from 'openai';
import { getCachedResponse, cacheNewResponse } from './semanticCache.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateMessage(agentId, debateId, topic = 'general policy') {
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();

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

    // 🧠 Step 2: Construct prompt with memory + profile + dynamic topic
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

    // 🎯 Step 2.5: Check semantic cache for similar prompts
    console.log('� Checking semantic cache for similar prompts...');
    const cachedResult = await getCachedResponse(prompt, topic);
    
    let message;
    if (cachedResult) {
        message = cachedResult.response;
        console.log(`🎯 Using cached response (${(cachedResult.similarity * 100).toFixed(1)}% similarity)`);
        console.log(`💰 Saved OpenAI API call - Cache hit!`);
    } else {
        // �💬 Step 3: Generate AI message (cache miss)
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

    const debateStreamKey = `debate:${debateId}:messages`;

    // 💾 Step 4: Save to full debate stream
    await client.xAdd(debateStreamKey, '*', {
        agent_id: agentId,
        message,
    });

    // 💾 Step 5: Save to agent's memory stream
    await client.xAdd(memoryStreamKey, '*', {
        type: 'statement',
        content: message,
    });

    await client.quit();
    return message;
}
