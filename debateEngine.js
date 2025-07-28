import 'dotenv/config';
import { createClient } from 'redis';
import OpenAI from 'openai';

const client = createClient({ url: process.env.REDIS_URL });
await client.connect();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const AGENTS = ['senatorbot', 'reformerbot'];
const DEBATE_ID = 'climatebill2025';
const TOPIC = 'climate change legislation';

async function getProfile(agentId) {
    return await client.json.get(`agent:${agentId}:profile`);
}

async function postMessage(agentId, message) {
    const key = `debate:${DEBATE_ID}:messages`;
    await client.xAdd(key, '*', { agent_id: agentId, message });
}

async function generateResponse(agent) {
    const profile = await getProfile(agent);

    const systemPrompt = `
You are ${profile.name}, a ${profile.tone} ${profile.role}.
You believe in ${profile.biases.join(", ")}.
Stay in character. Reply to this prompt as if you are in a live Senate debate on the topic: "${TOPIC}".
`;

    const userPrompt = 'What is your next statement? Respond in 1–2 sentences.';

    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]
    });

    const content = response.choices[0].message.content;
    console.log(`${agent}: ${content}`);
    await postMessage(agent, content);
}

async function runDebate(rounds = 3, delay = 3000) {
    for (let i = 0; i < rounds; i++) {
        for (const agent of AGENTS) {
            await generateResponse(agent);
            await new Promise(r => setTimeout(r, delay));
        }
    }
    await client.quit();
}

runDebate();
