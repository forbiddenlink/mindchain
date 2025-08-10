/**
 * Semantic Cache System Tests
 */
import { expect, sinon, redis, TEST_CONFIG } from '../test-env.js';
import { 
    findSimilarPrompt, 
    addToCache, 
    getCacheStats,
    clearCache,
    optimizeCache,
    validateCacheEntry
} from '../../semanticCache.js';

describe('Semantic Cache System', () => {
    let redisClient;
    let sandbox;

    before(async () => {
        // Create Redis client for testing
        redisClient = redis.createClient({ url: TEST_CONFIG.REDIS_URL });
        await redisClient.connect();
        sandbox = sinon.createSandbox();
        
        // Setup test environment
        await clearCache();
    });

    after(async () => {
        await redisClient.quit();
        sandbox.restore();
    });

    beforeEach(async () => {
        await clearCache();
    });

    describe('Cache Operations', () => {
        it('should add entries to cache with vector embeddings', async () => {
            const prompt = 'Test prompt for vector embedding';
            const response = 'Test response';
            const embedding = new Float32Array(1536).fill(0.1);

            const result = await addToCache(prompt, response, embedding);
            expect(result.success).to.be.true;
            expect(result.cacheKey).to.be.a('string');
        });

        it('should find similar prompts above threshold', async () => {
            const prompt1 = 'What is the capital of France?';
            const response1 = 'The capital of France is Paris.';
            const embedding1 = new Float32Array(1536).fill(0.1);

            await addToCache(prompt1, response1, embedding1);

            const similar = await findSimilarPrompt(prompt1);
            expect(similar).to.exist;
            expect(similar.similarity).to.be.above(0.85);
        });

        it('should track cache statistics', async () => {
            // Add some test entries
            const prompt1 = 'Test prompt 1';
            const prompt2 = 'Test prompt 2';
            const response = 'Test response';
            const embedding = new Float32Array(1536).fill(0.1);

            await addToCache(prompt1, response, embedding);
            await addToCache(prompt2, response, embedding);

            // Get stats
            const stats = await getCacheStats();
            expect(stats).to.exist;
            expect(stats.total_cache_entries).to.equal(2);
        });

        it('should validate cache entries', () => {
            const validEntry = {
                prompt: 'Valid prompt',
                response: 'Valid response',
                embedding: new Float32Array(1536).fill(0.1),
                timestamp: Date.now()
            };

            const invalidEntry = {
                prompt: '', // Empty prompt
                response: 'Response',
                embedding: null // Missing embedding
            };

            expect(validateCacheEntry(validEntry)).to.be.true;
            expect(validateCacheEntry(invalidEntry)).to.be.false;
        });

        it('should optimize cache when reaching capacity', async () => {
            // Add many entries
            const embedding = new Float32Array(1536).fill(0.1);
            for (let i = 0; i < 100; i++) {
                await addToCache(
                    `Prompt ${i}`,
                    `Response ${i}`,
                    embedding
                );
            }

            const beforeStats = await getCacheStats();
            await optimizeCache();
            const afterStats = await getCacheStats();

            expect(afterStats.total_cache_entries).to.be.at.most(beforeStats.total_cache_entries);
        });
    });

    describe('Error Handling', () => {
        it('should handle Redis connection errors', async () => {
            // Simulate Redis error
            sandbox.stub(redisClient, 'ft.search').rejects(new Error('Redis error'));

            try {
                await findSimilarPrompt('test prompt');
            } catch (error) {
                expect(error.message).to.include('Redis error');
            }
        });

        it('should handle invalid embeddings', async () => {
            const prompt = 'Test prompt';
            const response = 'Test response';
            const invalidEmbedding = new Float32Array(10); // Wrong size

            try {
                await addToCache(prompt, response, invalidEmbedding);
            } catch (error) {
                expect(error.message).to.include('Invalid embedding');
            }
        });
    });

    describe('Performance', () => {
        it('should maintain high cache hit rate', async () => {
            const embedding = new Float32Array(1536).fill(0.1);
            const basePrompt = 'What is the impact of climate change on ';

            // Add variations of similar prompts
            for (let i = 0; i < 10; i++) {
                await addToCache(
                    basePrompt + ['oceans', 'forests', 'agriculture'][i % 3],
                    'Response about climate change impact',
                    embedding
                );
            }

            // Test similar but not identical prompts
            const testPrompt = basePrompt + 'marine life';
            const result = await findSimilarPrompt(testPrompt);

            expect(result).to.exist;
            expect(result.similarity).to.be.above(0.8);
        });

        it('should optimize memory usage', async () => {
            const beforeStats = await getCacheStats();
            
            // Add many entries
            const embedding = new Float32Array(1536).fill(0.1);
            for (let i = 0; i < 50; i++) {
                await addToCache(
                    `Memory test prompt ${i}`,
                    'Memory test response',
                    embedding
                );
            }

            await optimizeCache();
            const afterStats = await getCacheStats();

            // Memory usage should be reasonable
            expect(afterStats.memory_used_mb).to.be.at.most(beforeStats.memory_used_mb * 2);
        });
    });

    describe('Integration with Redis Vector Search', () => {
        it('should perform vector similarity search', async () => {
            const prompt = 'Test vector similarity';
            const response = 'Vector test response';
            const embedding = new Float32Array(1536).fill(0.1);

            await addToCache(prompt, response, embedding);

            // Search with same vector
            const searchResult = await redisClient.ft.search(
                'cache-index',
                '*=>[KNN 1 @vector $query_vector]',
                {
                    PARAMS: {
                        query_vector: Buffer.from(embedding.buffer)
                    },
                    RETURN: ['prompt', 'response', 'vector_score']
                }
            );

            expect(searchResult.total).to.be.above(0);
            expect(searchResult.documents[0].value.prompt).to.equal(prompt);
        });

        it('should maintain index efficiency', async () => {
            const startTime = Date.now();
            const embedding = new Float32Array(1536).fill(0.1);

            // Add test entries
            for (let i = 0; i < 10; i++) {
                await addToCache(
                    `Index test ${i}`,
                    'Index test response',
                    embedding
                );
            }

            // Test search performance
            const searchTime = Date.now();
            await findSimilarPrompt('Index performance test');
            const endTime = Date.now();

            // Search should be fast
            expect(endTime - searchTime).to.be.below(100); // 100ms max
        });
    });
});
