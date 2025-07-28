import 'dotenv/config';
import { createClient } from 'redis';
import { generateMessage } from './generateMessage.js';
import { findClosestFact } from './factChecker.js'; // ✅ match function name

const client = createClient({ url: process.env.REDIS_URL });
await client.connect();

const debateId = 'climatebill2025';
const testTopic = 'Climate Policy'; // Explicit topic for simulation
const agents = ['senatorbot', 'reformerbot'];

for (const agent of agents) {
    const message = await generateMessage(agent, debateId, testTopic); // Include topic parameter

    console.log(`🗣️ ${agent}: ${message}`);

    // Save to shared stream
    await client.xAdd(`debate:${debateId}:messages`, '*', {
        agent_id: agent,
        message,
    });

    // Save to agent memory
    await client.xAdd(`debate:${debateId}:agent:${agent}:memory`, '*', {
        type: 'statement',
        content: message,
    });

    // Fact check this message
    const result = await findClosestFact(message); // ✅ match function name
    if (result?.content) {
        console.log(`🔍 Closest fact: "${result.content}"`);
        console.log(`📊 Score: ${result.score}\n`);
    } else {
        console.log(`⚠️ No relevant fact found.\n`);
    }
}

await client.quit();
