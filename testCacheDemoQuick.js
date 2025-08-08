// Quick cache demo test for contest readiness
import 'dotenv/config';
import { getCacheStats } from './semanticCache.js';

async function testCacheDemo() {
  try {
    console.log('🎯 Testing semantic cache demonstration...');
    console.log('📡 Using Redis URL:', process.env.REDIS_URL ? 'Environment configured ✅' : 'Using default ⚠️');
    const stats = await getCacheStats();
    
    if (stats && stats.total_requests > 0) {
      console.log('✅ Cache stats retrieved successfully:');
      console.log('   - Total requests:', stats.total_requests);
      console.log('   - Cache hits:', stats.cache_hits);
      console.log('   - Hit ratio:', (stats.hit_ratio * 100).toFixed(1) + '%');
      console.log('   - Cache entries:', stats.cache_entries);
      console.log('   - Business value ready: ✅');
      
      if (stats.hit_ratio > 0.9) {
        console.log('🏆 EXCELLENT: >90% cache hit rate - contest winning performance!');
      } else if (stats.hit_ratio > 0.6) {
        console.log('✅ GOOD: >60% cache hit rate - solid demonstration');
      } else {
        console.log('⚠️ LOW: Cache hit rate may need improvement for demo');
      }
    } else {
      console.log('⚠️ No cache stats found - may need to populate cache first');
      console.log('💡 Suggestion: Run some AI generations to build cache data');
    }
  } catch (error) {
    console.log('❌ Cache demo test failed:', error.message);
    console.log('💡 Make sure Redis is running and cache index is set up');
  }
}

testCacheDemo();
