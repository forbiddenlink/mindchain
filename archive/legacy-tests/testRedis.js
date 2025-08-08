import 'dotenv/config';
import { createClient } from 'redis';

async function testRedisConnection() {
    console.log('🔧 Testing Redis Cloud connection...');
    console.log('Redis URL:', process.env.REDIS_URL ? 'Set (hidden for security)' : 'NOT SET');
    
    try {
        const client = createClient({ 
            url: process.env.REDIS_URL,
            socket: {
                connectTimeout: 10000,
                commandTimeout: 5000
            }
        });

        client.on('error', (err) => {
            console.error('❌ Redis Client Error:', err.message);
        });

        console.log('🔌 Attempting to connect to Redis Cloud...');
        await client.connect();
        console.log('✅ Redis Cloud connected successfully!');
        
        const pong = await client.ping();
        console.log('🏓 Ping result:', pong);
        
        // Test basic operations
        await client.set('test:connection', 'working');
        const result = await client.get('test:connection');
        console.log('📝 Test write/read:', result);
        
        await client.quit();
        console.log('🔌 Redis connection closed');
        
    } catch (error) {
        console.error('❌ Redis connection failed:');
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error stack:', error.stack);
    }
}

testRedisConnection();
