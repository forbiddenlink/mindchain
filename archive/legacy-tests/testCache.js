// Test semantic cache functionality
import { generateMessage } from './generateMessage.js';

async function testSemanticCache() {
    console.log('🧪 Testing Semantic Cache System\n');

    try {
        // Test 1: Generate first message
        console.log('1️⃣ Generating first message about healthcare...');
        const message1 = await generateMessage('senatorbot', 'test-debate-1', 'healthcare reform policy');
        console.log(`First response: "${message1}"\n`);

        // Test 2: Generate similar message (should hit cache)
        console.log('2️⃣ Generating similar message about healthcare...');
        const message2 = await generateMessage('senatorbot', 'test-debate-1', 'healthcare reform policies');
        console.log(`Second response: "${message2}"\n`);

        // Test 3: Generate different message (should miss cache)
        console.log('3️⃣ Generating different message about education...');
        const message3 = await generateMessage('senatorbot', 'test-debate-1', 'education funding and reform');
        console.log(`Third response: "${message3}"\n`);

        // Test 4: Check cache metrics
        console.log('4️⃣ Checking cache metrics...');
        const { getCacheStats } = await import('./semanticCache.js');
        const stats = await getCacheStats();
        
        if (stats) {
            console.log('📊 Cache Statistics:');
            console.log(`   Total Requests: ${stats.total_requests}`);
            console.log(`   Cache Hits: ${stats.cache_hits}`);
            console.log(`   Cache Misses: ${stats.cache_misses}`);
            console.log(`   Hit Ratio: ${stats.hit_ratio.toFixed(1)}%`);
            console.log(`   Tokens Saved: ${stats.total_tokens_saved}`);
            console.log(`   Cost Saved: $${stats.estimated_cost_saved.toFixed(4)}`);
            console.log(`   Average Similarity: ${(stats.average_similarity * 100).toFixed(1)}%`);
            console.log(`   Cache Entries: ${stats.total_cache_entries}`);
        }

        console.log('\n✅ Semantic cache test completed!');

    } catch (error) {
        console.error('❌ Error testing semantic cache:', error);
    }
}

testSemanticCache();
