import 'dotenv/config';
import { createClient } from 'redis';
import { OpenAIEmbeddings } from '@langchain/openai';

const client = createClient({ url: process.env.REDIS_URL });
const embeddings = new OpenAIEmbeddings();

async function searchClaim(claim) {
    await client.connect();

    const queryVector = await embeddings.embedQuery(claim);
    const vectorBuffer = Buffer.from(new Float32Array(queryVector).buffer);

    const result = await client.ft.search('facts-index', '*=>[KNN 1 @embedding $BLOB AS score]', {
        PARAMS: { BLOB: vectorBuffer },
        RETURN: ['content', 'score'],
        DIALECT: 2,
    });

    await client.quit();

    return result.documents?.[0] || null;
}

// For testing:
searchClaim("Global temperature has risen by 1.5 degrees")
    .then(res => {
        if (res) {
            console.log(`🔍 Closest match: "${res.value.content}" (score: ${res.value.score})`);
        } else {
            console.log("❌ No close factual match found.");
        }
    });
