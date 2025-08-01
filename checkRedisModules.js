import 'dotenv/config';
import { createClient } from 'redis';

async function checkRedisModules() {
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();
    
    try {
        console.log('🔍 Checking Redis capabilities...');
        
        // Check what keys exist
        const allKeys = await client.keys('*');
        console.log('Total keys in Redis:', allKeys.length);
        
        const sentimentKeys = await client.keys('sentiment:*');
        console.log('Sentiment keys:', sentimentKeys);
        
        // Try to check modules
        try {
            const modules = await client.sendCommand(['MODULE', 'LIST']);
            console.log('Available modules:', modules);
        } catch (e) {
            console.log('MODULE LIST not supported');
        }
        
        // Try TimeSeries operations
        try {
            const testKey = 'test:timeseries';
            await client.ts.add(testKey, Date.now(), '1.0');
            console.log('✅ TimeSeries module is available');
            
            const range = await client.ts.range(testKey, '-', '+');
            console.log('TimeSeries data:', range);
            
            await client.del(testKey);
        } catch (e) {
            console.log('❌ TimeSeries module not available:', e.message);
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
    
    await client.quit();
}

checkRedisModules();
