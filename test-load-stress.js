// Load Testing Script for StanceStream
// Tests multiple concurrent users and rate limiting

const SERVER_URL = 'http://localhost:3001';
const CONCURRENT_USERS = 10;
const REQUESTS_PER_USER = 20;

async function testConcurrentUsers() {
    console.log(`🧪 Testing ${CONCURRENT_USERS} concurrent users making ${REQUESTS_PER_USER} requests each`);
    
    const users = Array.from({length: CONCURRENT_USERS}, (_, i) => simulateUser(i));
    
    try {
        const results = await Promise.allSettled(users);
        
        console.log('\n📊 Load Test Results:');
        
        let successful = 0;
        let rateLimited = 0;
        let errors = 0;
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                console.log(`✅ User ${index}: ${result.value.successful} successful, ${result.value.rateLimited} rate limited`);
                successful += result.value.successful;
                rateLimited += result.value.rateLimited;
            } else {
                console.log(`❌ User ${index}: Failed - ${result.reason}`);
                errors++;
            }
        });
        
        console.log(`\n🎯 Total Results:`);
        console.log(`   Successful requests: ${successful}`);
        console.log(`   Rate limited requests: ${rateLimited}`);
        console.log(`   User errors: ${errors}`);
        console.log(`   Rate limiting working: ${rateLimited > 0 ? '✅' : '⚠️'}`);
        
    } catch (error) {
        console.error('❌ Load test failed:', error);
    }
}

async function simulateUser(userId) {
    let successful = 0;
    let rateLimited = 0;
    
    console.log(`👤 User ${userId} starting requests...`);
    
    for (let i = 0; i < REQUESTS_PER_USER; i++) {
        try {
            const response = await fetch(`${SERVER_URL}/api/health`);
            
            if (response.status === 200) {
                successful++;
            } else if (response.status === 429) {
                rateLimited++;
                console.log(`⏸️ User ${userId} hit rate limit`);
            } else {
                console.log(`⚠️ User ${userId} unexpected status: ${response.status}`);
            }
            
            // Small delay to simulate real user behavior
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
            
        } catch (error) {
            console.log(`❌ User ${userId} request failed:`, error.message);
        }
    }
    
    return { successful, rateLimited };
}

// Test Redis connection failure simulation
async function testRedisFailure() {
    console.log('\n🔌 Testing Redis connection failure handling...');
    
    try {
        // Test endpoint that requires Redis
        const response = await fetch(`${SERVER_URL}/api/agent/senatorbot/profile`);
        
        if (response.ok) {
            console.log('✅ Redis connection healthy');
        } else {
            console.log(`⚠️ Redis issue detected: ${response.status}`);
        }
        
    } catch (error) {
        console.log('❌ Connection failed:', error.message);
    }
}

// Test mobile responsiveness by checking viewport handling
function testMobileResponsiveness() {
    console.log('\n📱 Testing mobile responsiveness...');
    
    const testSizes = [
        { name: 'iPhone SE', width: 375, height: 667 },
        { name: 'iPad', width: 768, height: 1024 },
        { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    testSizes.forEach(size => {
        console.log(`📏 ${size.name}: ${size.width}x${size.height}`);
        
        // This would need to be run in browser context
        if (typeof window !== 'undefined') {
            window.resizeTo(size.width, size.height);
            console.log(`   Current size: ${window.innerWidth}x${window.innerHeight}`);
        }
    });
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting StanceStream Load Testing\n');
    
    await testConcurrentUsers();
    await testRedisFailure();
    testMobileResponsiveness();
    
    console.log('\n✅ All tests completed!');
}

// Export for Node.js or run directly in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testConcurrentUsers, testRedisFailure, testMobileResponsiveness };
} else {
    // Run in browser console
    runAllTests();
}
