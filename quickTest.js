// Quick test to verify core StanceStream functionality
import 'dotenv/config';
import { createClient } from 'redis';

async function quickTest() {
    console.log('🧪 Running StanceStream Quick Test\n');
    
    try {
        // Test 1: Redis Connection
        console.log('1️⃣ Testing Redis connection...');
        const client = createClient({ url: process.env.REDIS_URL });
        await client.connect();
        const ping = await client.ping();
        console.log(`✅ Redis connected: ${ping}\n`);
        
        // Test 2: Agent Profile Access
        console.log('2️⃣ Testing agent profile access...');
        const profile = await client.json.get('agent:senatorbot:profile');
        if (profile) {
            console.log(`✅ SenatorBot profile loaded: ${profile.name}`);
        } else {
            console.log('❌ SenatorBot profile not found - run: node index.js');
        }
        
        const reformerProfile = await client.json.get('agent:reformerbot:profile');
        if (reformerProfile) {
            console.log(`✅ ReformerBot profile loaded: ${reformerProfile.name}`);
        } else {
            console.log('❌ ReformerBot profile not found - run: node addReformer.js');
        }
        console.log('');
        
        // Test 3: Vector Indices
        console.log('3️⃣ Testing vector indices...');
        try {
            const factsIndex = await client.ft.info('facts-index');
            console.log(`✅ Facts index exists: ${factsIndex[1]} fields`);
        } catch (error) {
            console.log('❌ Facts index missing - run: node vectorsearch.js');
        }
        
        try {
            const cacheIndex = await client.ft.info('cache-index');
            console.log(`✅ Cache index exists: ${cacheIndex[1]} fields`);
        } catch (error) {
            console.log('❌ Cache index missing - run: node setupCacheIndex.js');
        }
        console.log('');
        
        // Test 4: Cache Metrics
        console.log('4️⃣ Testing cache metrics...');
        try {
            const cacheMetrics = await client.json.get('cache:metrics');
            if (cacheMetrics) {
                console.log(`✅ Cache metrics: ${cacheMetrics.cache_hits}/${cacheMetrics.total_requests} hits (${cacheMetrics.hit_ratio.toFixed(1)}%)`);
            } else {
                console.log('ℹ️ Cache metrics not initialized yet');
            }
        } catch (error) {
            console.log('ℹ️ Cache metrics not available');
        }
        console.log('');
        
        // Test 5: Basic Message Generation
        console.log('5️⃣ Testing message generation...');
        try {
            const { generateMessage } = await import('./generateMessage.js');
            const testMessage = await generateMessage('senatorbot', 'quick-test', 'climate policy');
            console.log(`✅ Message generated: "${testMessage.substring(0, 50)}..."`);
        } catch (error) {
            console.log(`❌ Message generation failed: ${error.message}`);
        }
        
        await client.quit();
        console.log('\n🎉 Quick test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

quickTest();
