import 'dotenv/config';
import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL });
client.on('error', (err) => console.error('Redis Client Error', err));

async function run() {
    await client.connect();

    // ✅ 1. Drop the index if it exists (optional)
    try {
        await client.ft.dropIndex('facts-index');
        console.log('Dropped existing index.');
    } catch (err) {
        console.log('Index did not exist, continuing...');
    }

    // ✅ 2. Create the new vector index
    await client.ft.create('facts-index', {
        content: {
            type: 'TEXT',
        },
        embedding: {
            type: 'VECTOR',
            ALGORITHM: 'FLAT',
            TYPE: 'FLOAT32',
            DIM: 1536, // OpenAI embedding size
            DISTANCE_METRIC: 'COSINE'
        }
    }, {
        ON: 'HASH',
        PREFIX: 'fact:'
    });

    console.log('✅ Redis Vector index created (facts-index).');

    await client.quit();
}

run();
