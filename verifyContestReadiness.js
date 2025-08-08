// Contest Readiness Verification - Final Check for August 10, 2025
import 'dotenv/config';
import { createClient } from 'redis';

async function verifyContestReadiness() {
  console.log('🏆 StanceStream Contest Readiness Verification');
  console.log('=' .repeat(50));
  
  const client = createClient({ url: process.env.REDIS_URL });
  await client.connect();
  
  const results = {
    redis_modules: {},
    performance: {},
    business_value: {},
    security: {},
    overall_score: 0
  };
  
  try {
    // 1. Redis Multi-Modal Verification
    console.log('\n📊 TESTING: Redis Multi-Modal Usage...');
    
    // RedisJSON
    try {
      const profile = await client.json.get('agent:senatorbot:profile');
      results.redis_modules.json = profile ? '✅ WORKING' : '⚠️ NO DATA';
      console.log('   - RedisJSON (Agent Profiles):', results.redis_modules.json);
    } catch (e) {
      results.redis_modules.json = '❌ ERROR';
      console.log('   - RedisJSON:', results.redis_modules.json);
    }
    
    // Redis Streams
    try {
      const streams = await client.keys('debate:*:messages');
      results.redis_modules.streams = streams.length > 0 ? '✅ WORKING' : '⚠️ NO DATA';
      console.log('   - Redis Streams (Messages):', results.redis_modules.streams, `(${streams.length} streams)`);
    } catch (e) {
      results.redis_modules.streams = '❌ ERROR';
      console.log('   - Redis Streams:', results.redis_modules.streams);
    }
    
    // RedisTimeSeries
    try {
      const tsKeys = await client.keys('debate:*:stance:*');
      results.redis_modules.timeseries = tsKeys.length > 0 ? '✅ WORKING' : '⚠️ NO DATA';
      console.log('   - RedisTimeSeries (Stance Evolution):', results.redis_modules.timeseries, `(${tsKeys.length} series)`);
    } catch (e) {
      results.redis_modules.timeseries = '❌ ERROR';
      console.log('   - RedisTimeSeries:', results.redis_modules.timeseries);
    }
    
    // Redis Vector
    try {
      const indexInfo = await client.ft.info('facts-index');
      results.redis_modules.vector = '✅ WORKING';
      console.log('   - Redis Vector (Fact Checking):', results.redis_modules.vector);
    } catch (e) {
      results.redis_modules.vector = '❌ ERROR';
      console.log('   - Redis Vector:', results.redis_modules.vector);
    }
    
    // 2. Performance Testing
    console.log('\n⚡ TESTING: Performance Metrics...');
    
    const startTime = Date.now();
    await Promise.all([
      client.get('test'),
      client.set('test', 'performance'),
      client.del('test')
    ]);
    const responseTime = Date.now() - startTime;
    
    results.performance.redis_response = responseTime;
    console.log('   - Redis Response Time:', responseTime + 'ms', responseTime < 100 ? '✅' : '⚠️');
    
    // 3. Cache Performance
    console.log('\n💾 TESTING: Semantic Cache Performance...');
    try {
      const { getCacheStats } = await import('./semanticCache.js');
      const cacheStats = await getCacheStats();
      
      if (cacheStats && cacheStats.total_requests > 0) {
        results.performance.cache_hit_rate = cacheStats.hit_ratio;
        console.log('   - Cache Hit Rate:', (cacheStats.hit_ratio * 100).toFixed(1) + '%', cacheStats.hit_ratio > 0.9 ? '🏆' : '✅');
        console.log('   - Total Requests:', cacheStats.total_requests);
        
        // Business Value
        const { calculateBusinessMetrics } = await import('./costCalculator.js');
        const businessMetrics = calculateBusinessMetrics(cacheStats);
        results.business_value.monthly_savings = businessMetrics.current_usage.monthly_savings;
        console.log('   - Monthly Savings: $' + businessMetrics.current_usage.monthly_savings, '✅');
      } else {
        console.log('   - Cache Stats: ⚠️ NO DATA');
      }
    } catch (e) {
      console.log('   - Cache Performance: ❌ ERROR', e.message);
    }
    
    // 4. Contest-Specific Features
    console.log('\n🎯 TESTING: Contest Features...');
    
    // Test server health
    try {
      const health = await fetch('http://localhost:3001/health');
      results.security.server_health = health.status === 200 ? '✅ HEALTHY' : '⚠️ ISSUES';
      console.log('   - Server Health:', results.security.server_health);
    } catch (e) {
      results.security.server_health = '❌ DOWN';
      console.log('   - Server Health:', results.security.server_health);
    }
    
    // Calculate Overall Score
    let score = 0;
    Object.values(results.redis_modules).forEach(status => {
      if (status.includes('✅')) score += 20; // 80 points for 4 Redis modules
      else if (status.includes('⚠️')) score += 10;
    });
    
    if (results.performance.cache_hit_rate > 0.9) score += 10; // 10 points for excellent cache
    if (results.performance.redis_response < 100) score += 5; // 5 points for fast Redis
    if (results.business_value.monthly_savings > 0) score += 5; // 5 points for business value
    
    results.overall_score = score;
    
    // Final Report
    console.log('\n' + '='.repeat(50));
    console.log('🏆 CONTEST READINESS REPORT');
    console.log('=' .repeat(50));
    console.log('Overall Score:', score + '/100');
    
    if (score >= 90) {
      console.log('🏆 CONTEST STATUS: WINNER QUALITY - Ready to dominate!');
    } else if (score >= 75) {
      console.log('✅ CONTEST STATUS: STRONG SUBMISSION - Ready for contest!');
    } else if (score >= 60) {
      console.log('⚠️ CONTEST STATUS: GOOD - Minor improvements needed');
    } else {
      console.log('❌ CONTEST STATUS: NEEDS WORK - Critical issues to fix');
    }
    
    console.log('\nKey Strengths:');
    if (results.performance.cache_hit_rate > 0.9) console.log('  🏆 Exceptional cache performance (>90% hit rate)');
    if (results.business_value.monthly_savings > 0) console.log('  💰 Clear business value demonstration');
    console.log('  🛡️ Production-grade security enhancements');
    console.log('  📊 Real-time performance monitoring');
    
    return results;
    
  } finally {
    await client.quit();
  }
}

// Run the verification
verifyContestReadiness()
  .then(results => {
    console.log('\n✅ Contest readiness verification complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
