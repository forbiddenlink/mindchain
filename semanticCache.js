// Semantic Cache System - Redis Vector Showcase Feature
// Caches AI responses based on prompt similarity using OpenAI embeddings
import 'dotenv/config';
import { createClient } from 'redis';
import OpenAI from 'openai';
import crypto from 'crypto';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Cache configuration
const CACHE_CONFIG = {
    SIMILARITY_THRESHOLD: 0.85, // 85% similarity threshold
    EMBEDDING_MODEL: 'text-embedding-ada-002',
    CACHE_TTL: 86400, // 24 hours in seconds
    MAX_CACHE_ENTRIES: 10000,
    OPENAI_COST_PER_1K_TOKENS: 0.002, // Approximate GPT-4 cost
};

class SemanticCache {
    constructor() {
        this.client = null;
        this.metricsKey = 'cache:metrics';
    }

    async connect() {
        if (!this.client) {
            this.client = createClient({ url: process.env.REDIS_URL });
            await this.client.connect();
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.client = null;
        }
    }

    // Generate embedding for prompt
    async generateEmbedding(text) {
        try {
            const response = await openai.embeddings.create({
                model: CACHE_CONFIG.EMBEDDING_MODEL,
                input: text.substring(0, 8000), // Limit to avoid token limits
            });
            return response.data[0].embedding;
        } catch (error) {
            console.error('Error generating embedding:', error);
            throw error;
        }
    }

    // Create unique cache key from prompt including topic context
    createCacheKey(prompt, topic = 'general') {
        const contextualPrompt = `${topic}::${prompt}`;
        const hash = crypto.createHash('sha256').update(contextualPrompt).digest('hex');
        return `cache:prompt:${hash.substring(0, 16)}`;
    }

    // Search for similar cached prompts with topic awareness
    async findSimilarCachedResponse(prompt, topic = 'general') {
        try {
            await this.connect();

            // Include topic in embedding generation for better context
            const contextualPrompt = `Topic: ${topic}. ${prompt}`;
            const embedding = await this.generateEmbedding(contextualPrompt);
            const vectorBuffer = Buffer.from(new Float32Array(embedding).buffer);

            // Search for similar prompts using Redis Vector Search
            const searchResults = await this.client.ft.search(
                'cache-index',
                '*=>[KNN 5 @vector $query_vector AS score]',
                {
                    PARAMS: {
                        query_vector: vectorBuffer,
                    },
                    SORTBY: 'score',
                    DIALECT: 2,
                    RETURN: ['content', 'response', 'created_at', 'score'],
                }
            );

            if (searchResults.total > 0) {
                const bestMatch = searchResults.documents[0];
                const similarity = 1 - parseFloat(bestMatch.value.score); // Convert distance to similarity

                if (similarity >= CACHE_CONFIG.SIMILARITY_THRESHOLD) {
                    console.log(`🎯 Cache HIT! Similarity: ${(similarity * 100).toFixed(1)}%`);
                    
                    // Update hit metrics
                    await this.updateMetrics(true, similarity);
                    
                    return {
                        response: bestMatch.value.response,
                        similarity,
                        cached: true,
                        originalPrompt: bestMatch.value.content,
                    };
                }
            }

            console.log('❌ Cache MISS - No similar prompts found');
            await this.updateMetrics(false, 0);
            return null;

        } catch (error) {
            console.error('Error searching cache:', error);
            await this.updateMetrics(false, 0);
            return null;
        }
    }

    // Cache new response with embedding and topic context
    async cacheResponse(prompt, response, metadata = {}) {
        try {
            await this.connect();

            const topic = metadata.topic || 'general';
            const cacheKey = this.createCacheKey(prompt, topic);
            
            // Include topic in embedding for better matching
            const contextualPrompt = `Topic: ${topic}. ${prompt}`;
            const embedding = await this.generateEmbedding(contextualPrompt);
            const vectorBuffer = Buffer.from(new Float32Array(embedding).buffer);

            // Store in Redis with both hash and vector data
            const cacheData = {
                content: contextualPrompt,
                original_prompt: prompt,
                topic: topic,
                response: response,
                vector: vectorBuffer,
                created_at: new Date().toISOString(),
                metadata: JSON.stringify(metadata),
                tokens_saved: this.estimateTokens(response),
            };

            await this.client.hSet(cacheKey, cacheData);
            
            // Set TTL
            await this.client.expire(cacheKey, CACHE_CONFIG.CACHE_TTL);

            console.log(`💾 Response cached with key: ${cacheKey}`);
            
            return cacheKey;

        } catch (error) {
            console.error('Error caching response:', error);
            throw error;
        }
    }

    // Update cache metrics
    async updateMetrics(isHit, similarity = 0) {
        try {
            await this.connect();

            const now = new Date().toISOString();
            
            // Get current metrics or initialize
            let metrics = await this.client.json.get(this.metricsKey);
            if (!metrics) {
                metrics = {
                    total_requests: 0,
                    cache_hits: 0,
                    cache_misses: 0,
                    hit_ratio: 0,
                    total_tokens_saved: 0,
                    estimated_cost_saved: 0,
                    average_similarity: 0,
                    last_updated: now,
                    created_at: now,
                };
            }

            // Update counters
            metrics.total_requests++;
            
            if (isHit) {
                metrics.cache_hits++;
                // Estimate tokens saved (rough calculation)
                const tokensSaved = 100; // Conservative estimate per cached response
                metrics.total_tokens_saved += tokensSaved;
                metrics.estimated_cost_saved = (metrics.total_tokens_saved / 1000) * CACHE_CONFIG.OPENAI_COST_PER_1K_TOKENS;
                
                // Update average similarity
                metrics.average_similarity = ((metrics.average_similarity * (metrics.cache_hits - 1)) + similarity) / metrics.cache_hits;
            } else {
                metrics.cache_misses++;
            }

            // Calculate hit ratio
            metrics.hit_ratio = (metrics.cache_hits / metrics.total_requests) * 100;
            metrics.last_updated = now;

            // Store updated metrics
            await this.client.json.set(this.metricsKey, '.', metrics);

            console.log(`📊 Cache metrics updated: ${metrics.cache_hits}/${metrics.total_requests} (${metrics.hit_ratio.toFixed(1)}%)`);

        } catch (error) {
            console.error('Error updating cache metrics:', error);
        }
    }

    // Get current cache metrics
    async getMetrics() {
        try {
            await this.connect();
            const metrics = await this.client.json.get(this.metricsKey);
            return metrics || {
                total_requests: 0,
                cache_hits: 0,
                cache_misses: 0,
                hit_ratio: 0,
                total_tokens_saved: 0,
                estimated_cost_saved: 0,
                average_similarity: 0,
                last_updated: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Error getting cache metrics:', error);
            return null;
        }
    }

    // Estimate token count (rough approximation)
    estimateTokens(text) {
        // Rough estimate: 1 token ≈ 4 characters for English text
        return Math.ceil(text.length / 4);
    }

    // Clean up old cache entries
    async cleanupCache() {
        try {
            await this.connect();
            
            // Find expired entries (Redis TTL handles this automatically)
            // This method can be used for additional cleanup logic
            console.log('🧹 Cache cleanup completed');
            
        } catch (error) {
            console.error('Error during cache cleanup:', error);
        }
    }

    // Get cache statistics
    async getCacheStats() {
        try {
            await this.connect();
            
            const metrics = await this.getMetrics();
            const totalKeys = await this.client.eval(`
                local keys = redis.call('KEYS', 'cache:prompt:*')
                return #keys
            `, 0);

            return {
                ...metrics,
                total_cache_entries: totalKeys,
                cache_efficiency: metrics.hit_ratio,
                memory_saved_mb: (metrics.total_tokens_saved * 4) / (1024 * 1024), // Rough calculation
            };

        } catch (error) {
            console.error('Error getting cache stats:', error);
            return null;
        }
    }
}

// Export singleton instance
const semanticCache = new SemanticCache();

export default semanticCache;

// Helper functions for easy integration
export async function getCachedResponse(prompt, topic = 'general') {
    return await semanticCache.findSimilarCachedResponse(prompt, topic);
}

export async function cacheNewResponse(prompt, response, metadata = {}) {
    return await semanticCache.cacheResponse(prompt, response, metadata);
}

export async function getCacheMetrics() {
    return await semanticCache.getMetrics();
}

export async function getCacheStats() {
    return await semanticCache.getCacheStats();
}
