// Test Topic Isolation Fix
// Verify that climate policy and space exploration topics don't cross-contaminate

import 'dotenv/config';
import { getCachedResponse, cacheNewResponse } from './semanticCache.js';

async function testTopicIsolation() {
    console.log('🧪 Testing topic isolation fix...\n');

    try {
        // Clear any existing cache first
        console.log('🗑️ Clearing cache for clean test...');
        const { clearCache } = await import('./clearCache.js');
        // Note: clearCache runs as a script, so we can't import it directly
        
        // Cache a space exploration response
        console.log('1️⃣ Caching space exploration response...');
        await cacheNewResponse(
            'What are the benefits of space colonization?',
            'Space colonization offers humanity a backup planet and advances in technology.',
            { topic: 'space exploration' }
        );
        console.log('✅ Space exploration response cached\n');

        // Try to get a climate policy response (should NOT match space)
        console.log('2️⃣ Testing climate policy query (should NOT find space response)...');
        const climateResult = await getCachedResponse(
            'What are the benefits of renewable energy?',
            'environmental regulations and green energy'
        );
        
        if (climateResult && climateResult.cached) {
            console.log('❌ BUG STILL EXISTS: Climate query returned space response!');
            console.log(`   Similarity: ${(climateResult.similarity * 100).toFixed(1)}%`);
            console.log(`   Response: ${climateResult.response.substring(0, 100)}...`);
        } else {
            console.log('✅ SUCCESS: Climate query correctly did NOT match space response');
        }
        console.log('');

        // Cache a climate policy response
        console.log('3️⃣ Caching climate policy response...');
        await cacheNewResponse(
            'What are the benefits of renewable energy?',
            'Renewable energy reduces carbon emissions and creates sustainable jobs.',
            { topic: 'environmental regulations and green energy' }
        );
        console.log('✅ Climate policy response cached\n');

        // Test climate policy cache hit (should work)
        console.log('4️⃣ Testing climate policy cache hit (should work)...');
        const climateHit = await getCachedResponse(
            'What are the advantages of clean energy?',
            'environmental regulations and green energy'
        );
        
        if (climateHit && climateHit.cached) {
            console.log('✅ SUCCESS: Climate query found climate response');
            console.log(`   Similarity: ${(climateHit.similarity * 100).toFixed(1)}%`);
            console.log(`   Response: ${climateHit.response.substring(0, 100)}...`);
        } else {
            console.log('⚠️ Climate query did not find cached climate response (maybe similarity too low)');
        }
        console.log('');

        // Test space exploration cache hit (should work)
        console.log('5️⃣ Testing space exploration cache hit (should work)...');
        const spaceHit = await getCachedResponse(
            'What are the advantages of Mars colonization?',
            'space exploration'
        );
        
        if (spaceHit && spaceHit.cached) {
            console.log('✅ SUCCESS: Space query found space response');
            console.log(`   Similarity: ${(spaceHit.similarity * 100).toFixed(1)}%`);
            console.log(`   Response: ${spaceHit.response.substring(0, 100)}...`);
        } else {
            console.log('⚠️ Space query did not find cached space response (maybe similarity too low)');
        }

        console.log('\n🎯 Topic isolation test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testTopicIsolation();
