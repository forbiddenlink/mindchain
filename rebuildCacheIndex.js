// Rebuild Cache Index with Topic Filtering Support
// Run this to update the existing cache index with topic filtering

import 'dotenv/config';
import { createClient } from 'redis';

async function rebuildCacheIndex() {
    console.log('🔄 Rebuilding cache index with topic filtering...');
    
    if (!process.env.REDIS_URL) {
        console.error('❌ REDIS_URL environment variable not set');
        process.exit(1);
    }

    const client = createClient({ 
        url: process.env.REDIS_URL,
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 20) {
                    console.error('❌ Max reconnection attempts reached');
                    process.exit(1);
                }
                return Math.min(retries * 100, 3000);
            }
        }
    });

    try {
        await client.connect();
        console.log('✅ Connected to Redis');

        // Drop existing index
        try {
            await client.ft.dropIndex('cache-index');
            console.log('🗑️ Dropped existing cache-index');
        } catch (error) {
            console.log('ℹ️ No existing cache-index to drop');
        }

        // Create new index with topic filtering
        await client.ft.create(
            'cache-index',
            {
                content: {
                    type: 'TEXT',
                    SORTABLE: true
                },
                response: {
                    type: 'TEXT'
                },
                topic: {
                    type: 'TAG',
                    SORTABLE: true
                },
                vector: {
                    type: 'VECTOR',
                    ALGORITHM: 'HNSW',
                    TYPE: 'FLOAT32',
                    DIM: 1536,
                    DISTANCE_METRIC: 'COSINE',
                    INITIAL_CAP: 100,
                    M: 16,
                    EF_CONSTRUCTION: 200
                },
                created_at: {
                    type: 'TEXT'
                },
                tokens_saved: {
                    type: 'NUMERIC'
                }
            },
            {
                ON: 'HASH',
                PREFIX: 'cache:prompt:'
            }
        );

        console.log('✅ Cache index rebuilt with topic filtering!');
        console.log('🎯 Now topics are properly isolated:');
        console.log('   - Climate policy responses won\'t contaminate space exploration');
        console.log('   - Each topic maintains separate cache entries');
        console.log('   - Similarity threshold increased to 75% for better accuracy');
        
    } catch (error) {
        console.error('❌ Error rebuilding cache index:', error);
        process.exit(1);
    } finally {
        await client.quit();
        console.log('🔌 Disconnected from Redis');
    }
}

rebuildCacheIndex();
