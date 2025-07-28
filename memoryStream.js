import { createClient } from 'redis';
import 'dotenv/config';

const client = createClient({ url: process.env.REDIS_URL });
await client.connect();

const debateId = 'climatebill2025';
const messages = await client.xRange(`debate:${debateId}:messages`, '-', '+');

const memory = messages.map(msg => `${msg.message.agent_id}: ${msg.message.message}`).join('\n');

console.log('🧠 Memory Snapshot:\n', memory);

await client.quit();
