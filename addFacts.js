import 'dotenv/config';
import { createClient } from 'redis';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createHash } from 'crypto';

const client = createClient({ url: process.env.REDIS_URL });
const embeddings = new OpenAIEmbeddings();

async function run() {
    await client.connect();

    const facts = [
        "Earth's average temperature has increased by about 1.2°C since 1880.",
        "CO2 levels have reached 419 ppm as of 2023, the highest in 800,000 years.",
        "Solar and wind energy are now cheaper than coal in many regions.",
        "95% of climate scientists agree that human activity is the primary cause of global warming.",
    ];

    for (const fact of facts) {
        const vector = await embeddings.embedQuery(fact);
        const key = 'fact:' + createHash('sha1').update(fact).digest('hex');

        await client.hSet(key, {
            content: fact,
            embedding: Buffer.from(new Float32Array(vector).buffer),
        });

        console.log(`✅ Stored: ${fact}`);
    }

    await client.quit();
}

run();
