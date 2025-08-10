// Debug version of test orchestrator
import 'dotenv/config';
import axios from 'axios';

console.log('🔍 Running debug test orchestrator...');

async function runDebugTest() {
    try {
        // Test server health
        console.log('\nTesting server health...');
        const healthResponse = await axios.get('http://localhost:3001/api/health', { timeout: 5000 });
        console.log('✅ Server health check response:', healthResponse.data);

        // Test Redis connection
        console.log('\nTesting Redis connection...');
        if (healthResponse.data.redis_connected !== false) {
            console.log('✅ Redis connection is active');
        } else {
            throw new Error('Redis connection not available');
        }

        console.log('\n✅ All debug tests passed!');
    } catch (error) {
        console.error('\n❌ Debug test failed:', error.message);
        console.error('\nError stack:');
        console.error(error.stack);
        process.exit(1);
    }
}

runDebugTest();
