import 'dotenv/config';
import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL });

async function testConnection() {
    try {
        await client.connect();
        console.log('✅ Redis connected successfully');
        
        // Test if agent profiles exist
        const senatorProfile = await client.json.get('agent:senatorbot:profile');
        const reformerProfile = await client.json.get('agent:reformerbot:profile');
        
        console.log('✅ SenatorBot profile:', senatorProfile ? 'EXISTS' : 'MISSING');
        console.log('✅ ReformerBot profile:', reformerProfile ? 'EXISTS' : 'MISSING');
        
        await client.quit();
        console.log('🎯 System ready for real-time debates!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testConnection();
