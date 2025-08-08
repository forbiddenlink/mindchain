import 'dotenv/config';
import { createClient } from 'redis';

async function testAgents() {
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();
    
    try {
        console.log('🔍 Checking agent profiles...');
        
        // Check SenatorBot
        const senatorProfile = await client.json.get('agent:senatorbot:profile');
        console.log('📊 SenatorBot exists:', !!senatorProfile);
        if (senatorProfile) {
            console.log('  Name:', senatorProfile.name);
            console.log('  Role:', senatorProfile.role);
        }
        
        // Check ReformerBot  
        const reformerProfile = await client.json.get('agent:reformerbot:profile');
        console.log('📊 ReformerBot exists:', !!reformerProfile);
        if (reformerProfile) {
            console.log('  Name:', reformerProfile.name);
            console.log('  Role:', reformerProfile.role);
        }
        
        // Check current debates
        const keys = await client.keys('debate:*:messages');
        console.log('📊 Active debate streams:', keys.length);
        for (const key of keys) {
            const messages = await client.xLen(key);
            console.log(`  ${key}: ${messages} messages`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.quit();
    }
}

testAgents();
