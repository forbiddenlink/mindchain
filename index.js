import 'dotenv/config';
import { createClient } from 'redis';

const client = createClient({
    url: process.env.REDIS_URL
});

client.on('error', (err) => console.error('Redis Client Error', err));

async function run() {
    await client.connect();

    // ✅ Simple test
            await client.set('stancestream:test', 'Hello Redis!');
        const testValue = await client.get('stancestream:test');
    console.log('Value from Redis:', testValue);

    // ✅ Create Agent Profile (RedisJSON)
    await client.json.set('agent:senatorbot:profile', '$', {
        name: 'SenatorBot',
        role: 'Moderate US Senator',
        tone: 'measured',
        stance: {
            climate_policy: 0.4,
            economic_risk: 0.8
        },
        biases: ['fiscal responsibility', 'bipartisan compromise']
    });
    console.log('✅ SenatorBot profile created.');

    // ✅ Add a Debate Message (shared stream)
    await client.xAdd('debate:climatebill2025:messages', '*', {
        agent_id: 'senatorbot',
        message: 'We must balance environmental protection with economic growth.'
    });
    console.log('✅ Debate message added.');

    // ✅ Add Agent Memory (private stream)
    await client.xAdd('debate:climatebill2025:agent:senatorbot:memory', '*', {
        type: 'statement',
        content: 'We’ve seen carbon tax legislation fail in the past due to lack of public support.'
    });
    console.log('✅ SenatorBot memory added.');

    // ✅ NEW: Track stance score over time (TimeSeries)
    const topic = 'climate_policy';
    const stanceKey = `debate:climatebill2025:agent:senatorbot:stance:${topic}`;
    const stanceValue = 0.4;

    await client.ts.add(stanceKey, '*', stanceValue); // * = use current timestamp
    console.log(`✅ TimeSeries added: ${topic} = ${stanceValue}`);

    await client.quit();
}

run();
