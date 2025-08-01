// Quick demo of semantic cache working
import { getCacheStats, getCachedResponse, cacheNewResponse } from './semanticCache.js';

async function demoCache() {
    console.log('🎯 Semantic Cache Demo\n');

    try {
        // Check current stats
        console.log('📊 Current cache stats:');
        const stats = await getCacheStats();
        if (stats) {
            console.log(`   Requests: ${stats.total_requests}`);
            console.log(`   Hit Rate: ${stats.hit_ratio.toFixed(1)}%`);
            console.log(`   Cost Saved: $${stats.estimated_cost_saved.toFixed(4)}`);
        }

        // Test similarity search
        console.log('\n🔍 Testing similarity search...');
        const testPrompt = "What is your stance on healthcare policy reform?";
        const cached = await getCachedResponse(testPrompt);
        
        if (cached) {
            console.log(`✅ Found cached response (${(cached.similarity * 100).toFixed(1)}% similarity)`);
            console.log(`📝 Response: "${cached.response}"`);
        } else {
            console.log('❌ No cached response found');
            
            // Cache a test response
            await cacheNewResponse(testPrompt, "I support comprehensive healthcare reform with bipartisan solutions.", {
                test: true
            });
            console.log('💾 Test response cached');
        }

        // Check final stats
        const finalStats = await getCacheStats();
        console.log(`\n📈 Final stats: ${finalStats.cache_hits}/${finalStats.total_requests} hits (${finalStats.hit_ratio.toFixed(1)}%)`);

    } catch (error) {
        console.error('❌ Demo error:', error.message);
    }
}

demoCache();
