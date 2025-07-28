import 'dotenv/config';
import { createClient } from 'redis';
import { OpenAIEmbeddings } from '@langchain/openai';
import crypto from 'crypto';

const client = createClient({ url: process.env.REDIS_URL });
await client.connect();

const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    batchSize: 512,
    model: "text-embedding-ada-002",
});

export async function addFactToDatabase(factContent, source = 'user', category = 'general') {
    try {
        console.log(`📝 Adding fact to database: "${factContent.substring(0, 50)}..."`);

        // Generate embedding for the fact
        const embedding = await embeddings.embedQuery(factContent);
        
        // Create unique ID for the fact
        const factId = crypto.randomBytes(8).toString('hex');
        const factKey = `fact:${factId}`;

        // Convert embedding to buffer for Redis
        const vectorBuffer = Buffer.from(new Float32Array(embedding).buffer);

        // Store fact in Redis with vector embedding
        await client.hSet(factKey, {
            id: factId,
            content: factContent,
            source: source,
            category: category,
            timestamp: new Date().toISOString(),
            vector: vectorBuffer,
            embedding_model: 'text-embedding-ada-002'
        });

        console.log(`✅ Fact stored successfully with key: ${factKey}`);

        return {
            success: true,
            id: factId,
            key: factKey,
            message: 'Fact added to knowledge base successfully'
        };

    } catch (error) {
        console.error('❌ Error adding fact to database:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Helper function to add multiple facts
export async function addMultipleFacts(facts) {
    const results = [];
    
    for (const fact of facts) {
        if (typeof fact === 'string') {
            const result = await addFactToDatabase(fact);
            results.push(result);
        } else if (fact.content) {
            const result = await addFactToDatabase(fact.content, fact.source, fact.category);
            results.push(result);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
}

// Close connection when module is done
process.on('exit', async () => {
    await client.quit();
});
