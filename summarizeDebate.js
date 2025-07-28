import 'dotenv/config';
import { createClient } from 'redis';
import OpenAI from 'openai';

const client = createClient({ url: process.env.REDIS_URL });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function summarizeDebate(debateId) {
    await client.connect();

    const streamKey = `debate:${debateId}:messages`;
    const entries = await client.xRange(streamKey, '-', '+');

    const transcript = entries.map(entry => {
        const { agent_id, message } = entry.message;
        return `${agent_id}: ${message}`;
    }).join('\n');

    const prompt = `
This is a debate between two AI agents about climate policy. Each message is labeled with the agent's name.

Debate transcript:
${transcript}

Summarize the main points of the debate in 1 objective paragraph:
`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
            { role: 'system', content: prompt }
        ]
    });

    const summary = response.choices[0].message.content.trim();
    console.log(`📝 Debate Summary:\n${summary}`);

    await client.quit();
}

summarizeDebate('climatebill2025');
