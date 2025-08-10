// Cache Initialization Script
import redisManager from './redisManager.js';
import { CACHE_CONFIG } from './cacheConfig.js';

const config = CACHE_CONFIG.getConfig();

async function initializeCache() {
    try {
        console.log('🚀 Initializing semantic cache system...');

        // Initialize Redis JSON structure for metrics
        const metricsKey = 'cache:metrics';
        
        // Get Redis client
        const client = await redisManager.getClient();

        // Check if metrics already exist
        const existingMetrics = await client.json.get(metricsKey);
        
        if (!existingMetrics) {
            // Create initial metrics structure
            const initialMetrics = {
                total_requests: 0,
                cache_hits: 0,
                cache_misses: 0,
                hit_ratio: 0,
                total_tokens_saved: 0,
                estimated_cost_saved: 0,
                average_similarity: 0,
                total_cache_entries: 0,
                cache_efficiency: 0,
                memory_saved_mb: 0,
                last_updated: new Date().toISOString(),
                created_at: new Date().toISOString()
            };

            await client.json.set(metricsKey, '$', initialMetrics);
            console.log('✅ Cache metrics initialized');
        } else {
            console.log('✅ Cache metrics already exist');
        }

        // Verify cache index exists
        try {
            await client.ft.info(config.VECTOR_INDEX_NAME);
            console.log('✅ Cache vector index verified');
        } catch (error) {
            if (error.message.includes('unknown command')) {
                throw new Error('RediSearch module not loaded');
            }
            if (error.message.includes('no such index')) {
                console.log('⚠️ Cache index missing - will be created by setupCacheIndex.js');
            }
        }

        console.log('✅ Cache system initialization complete');
        return true;

    } catch (error) {
        console.error('❌ Error initializing cache:', error);
        return false;
    }
}

// Run initialization if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    initializeCache()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export default initializeCache;
