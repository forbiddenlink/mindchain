import { createClient } from 'redis';

async function checkIndices() {
    console.log('\n🔎 CHECKING REDIS INDICES');
    console.log('=====================\n');

    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();
    
    try {
        // List all indices
        const indices = await client.ft._list();
        console.log('📑 Available Indices:');
        console.log('------------------');
        if (indices.length === 0) {
            console.log('   No indices found');
        } else {
            indices.forEach(index => {
                console.log(`   - ${index}`);
            });
        }

        // Check facts-index (vector search)
        try {
            const factsInfo = await client.ft.info('facts-index');
            console.log('\n✅ facts-index:');
            console.log('   Type:', factsInfo.index_definition[3][1]);
            console.log('   Fields:', factsInfo.attributes.length);
            console.log('   Records:', factsInfo.num_docs);
        } catch (e) {
            console.log('\n❌ facts-index not found');
            console.log('   Run: node vectorsearch.js to create');
        }

        // Check cache-index (semantic cache)
        try {
            const cacheInfo = await client.ft.info('cache-index');
            console.log('\n✅ cache-index:');
            console.log('   Type:', cacheInfo.index_definition[3][1]);
            console.log('   Fields:', cacheInfo.attributes.length);
            console.log('   Cached Items:', cacheInfo.num_docs);
        } catch (e) {
            console.log('\n❌ cache-index not found');
            console.log('   Run: node setupCacheIndex.js to create');
        }

        // Check if Search module is available
        try {
            await client.ft.create('test:index', {
                '$.name': { type: 'TEXT', AS: 'name' }
            }, { ON: 'JSON', PREFIX: 'test:' });
            console.log('\n✅ Redis Search module is working');
            await client.ft.dropIndex('test:index');
        } catch (e) {
            console.log('\n❌ Redis Search module error:', e.message);
        }

    } catch (error) {
        console.error('\n❌ Error checking indices:', error.message);
        if (error.message.includes('unknown command')) {
            console.log('\n⚠️  Redis Search module may not be installed!');
            console.log('   Please ensure you have Redis Stack with all modules.');
        }
    } finally {
        await client.quit();
    }
}

checkIndices();
