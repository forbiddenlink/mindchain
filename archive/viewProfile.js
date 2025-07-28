import 'dotenv/config';
import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL });

async function run() {
    await client.connect();
    const profile = await client.json.get('agent:reformerbot:profile');
    console.log(profile);
    await client.quit();
}

run();
