// Multi-debate stress test for contest readiness
import 'dotenv/config';
import { createClient } from 'redis';

async function testMultiDebateStress() {
  console.log('🎯 Testing multi-debate concurrent processing...');
  
  // Use environment variable for Redis URL
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  console.log('📡 Connecting to Redis:', redisUrl.replace(/:[^:]*@/, ':***@')); // Hide password in logs
  
  const client = createClient({ url: redisUrl });
  await client.connect();
  
  try {
    // Simulate multiple debates running concurrently
    const topics = [
      'environmental_regulations',
      'healthcare_policy', 
      'ai_governance',
      'economic_policy'
    ];
    
    console.log('📊 Checking active debates...');
    const activeDebates = await client.hGetAll('active_debates');
    console.log('   - Current active debates:', Object.keys(activeDebates).length);
    
    console.log('🗄️ Checking Redis streams capacity...');
    let totalStreams = 0;
    for (const topic of topics) {
      const testKey = `debate:test_${topic}:messages`;
      try {
        const streamInfo = await client.xInfoStream(testKey);
        console.log(`   - ${topic}: ${streamInfo.length} messages`);
        totalStreams++;
      } catch (e) {
        // Stream doesn't exist yet - that's okay
        console.log(`   - ${topic}: No messages yet (ready for new debate)`);
      }
    }
    
    console.log('⚡ Testing Redis performance under concurrent load...');
    const startTime = Date.now();
    
    // Simulate concurrent operations
    const operations = [];
    for (let i = 0; i < 20; i++) {
      operations.push(
        client.set(`stress_test:${i}`, `concurrent_op_${Date.now()}_${i}`)
      );
    }
    
    await Promise.all(operations);
    const endTime = Date.now();
    
    console.log(`✅ Completed 20 concurrent Redis operations in ${endTime - startTime}ms`);
    
    if (endTime - startTime < 1000) {
      console.log('🏆 EXCELLENT: <1s for 20 concurrent operations - ready for multi-debate!');
    } else if (endTime - startTime < 3000) {
      console.log('✅ GOOD: <3s response time - acceptable for contest demo');
    } else {
      console.log('⚠️ SLOW: >3s response time - may need optimization');
    }
    
    // Cleanup test data
    for (let i = 0; i < 20; i++) {
      await client.del(`stress_test:${i}`);
    }
    
    console.log('🎯 Multi-debate stress test complete!');
    
  } finally {
    await client.quit();
  }
}

testMultiDebateStress().catch(console.error);
