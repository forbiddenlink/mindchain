import 'dotenv/config';
import { createClient } from 'redis';

async function checkRedisModules() {
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();
    
    try {
        console.log('\n🔍 REDIS MODULE VERIFICATION');
        console.log('==========================\n');
        
        // Check Redis JSON
        try {
            await client.json.set('test:json', '$', { test: true });
            console.log('✅ RedisJSON: AVAILABLE');
            await client.del('test:json');
        } catch (e) {
            console.log('❌ RedisJSON: NOT AVAILABLE -', e.message);
        }
        
        // Check TimeSeries
        try {
            const testKey = 'test:timeseries';
            await client.ts.add(testKey, Date.now(), 1.0);
            console.log('✅ RedisTimeSeries: AVAILABLE');
            await client.del(testKey);
        } catch (e) {
            console.log('❌ RedisTimeSeries: NOT AVAILABLE -', e.message);
        }
        
        // Check Redis Search/Vector
        try {
            await client.ft.create('test:index', {
                name: { type: 'TEXT' }
            });
            console.log('✅ RediSearch: AVAILABLE');
            await client.ft.dropIndex('test:index');
        } catch (e) {
            console.log('❌ RediSearch: NOT AVAILABLE -', e.message);
            console.log('\n⚠️  CRITICAL: RediSearch module is required for vector operations!');
            console.log('   Please ensure Redis Stack is installed with all modules.');
        }
        
        // List all modules
        try {
            const modules = await client.sendCommand(['MODULE', 'LIST']);
            console.log('\n📊 Installed Redis Modules:');
            console.log('------------------------');
            modules.forEach(module => {
                console.log(`   - ${module[1]} (v${module[3]})`);
            });
        } catch (e) {
            console.log('\n❌ Could not list modules:', e.message);
        }
        
        // Check system info
        const info = await client.info();
        console.log('\n🔧 Redis System Info:');
        console.log('------------------');
        console.log(`   Version: ${info.split('\n').find(line => line.startsWith('redis_version'))?.split(':')[1]}`);
        console.log(`   Memory: ${info.split('\n').find(line => line.startsWith('used_memory_human'))?.split(':')[1]}`);
        console.log(`   Clients: ${info.split('\n').find(line => line.startsWith('connected_clients'))?.split(':')[1]}`);
        
        console.log('\n✨ Module Check Complete!\n');
        
    } catch (error) {
        console.error('Error:', error);
    }
    
    await client.quit();
}

checkRedisModules();
