// Simple StanceStream System Test
import axios from 'axios';
import WebSocket from 'ws';

const API_BASE = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

async function runSimpleTests() {
    console.log('🧪 StanceStream Simple System Test\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    // Test 1: Health Check
    totalTests++;
    try {
        const health = await axios.get(`${API_BASE}/api/health`);
        console.log('✅ Health Check: PASSED');
        console.log(`   Redis: ${health.data.redis_status}`);
        console.log(`   Server: ${health.data.status}\n`);
        passedTests++;
    } catch (error) {
        console.log('❌ Health Check: FAILED');
        console.log(`   Error: ${error.message}\n`);
    }
    
    // Test 2: Cache Metrics
    totalTests++;
    try {
        const cache = await axios.get(`${API_BASE}/api/cache/metrics`);
        console.log('✅ Cache Metrics: PASSED');
        console.log(`   Requests: ${cache.data.total_requests || 0}`);
        console.log(`   Hit Rate: ${((cache.data.hit_ratio || 0) * 100).toFixed(1)}%\n`);
        passedTests++;
    } catch (error) {
        console.log('❌ Cache Metrics: FAILED');
        console.log(`   Error: ${error.message}\n`);
    }
    
    // Test 3: Agent Profiles
    totalTests++;
    try {
        const senator = await axios.get(`${API_BASE}/api/agent/senatorbot/profile`);
        const reformer = await axios.get(`${API_BASE}/api/agent/reformerbot/profile`);
        
        if (senator.data.name && reformer.data.name) {
            console.log('✅ Agent Profiles: PASSED');
            console.log(`   SenatorBot: ${senator.data.name}`);
            console.log(`   ReformerBot: ${reformer.data.name}\n`);
            passedTests++;
        } else {
            throw new Error('Agent profiles missing name field');
        }
    } catch (error) {
        console.log('❌ Agent Profiles: FAILED');
        console.log(`   Error: ${error.message}\n`);
    }
    
    // Test 4: WebSocket Connection
    totalTests++;
    try {
        await testWebSocket();
        console.log('✅ WebSocket Connection: PASSED\n');
        passedTests++;
    } catch (error) {
        console.log('❌ WebSocket Connection: FAILED');
        console.log(`   Error: ${error.message}\n`);
    }
    
    // Test 5: Debate Operations
    totalTests++;
    try {
        const debate = await axios.post(`${API_BASE}/api/debate/start`, {
            topic: 'system test',
            agents: ['senatorbot', 'reformerbot']
        });
        
        if (debate.data.debateId) {
            console.log('✅ Debate Operations: PASSED');
            console.log(`   Debate ID: ${debate.data.debateId}`);
            
            // Stop the debate
            await axios.post(`${API_BASE}/api/debate/${debate.data.debateId}/stop`);
            console.log(`   Debate stopped successfully\n`);
            passedTests++;
        } else {
            throw new Error('No debate ID returned');
        }
    } catch (error) {
        console.log('❌ Debate Operations: FAILED');
        console.log(`   Error: ${error.message}\n`);
    }
    
    // Test 6: Redis Performance
    totalTests++;
    try {
        const redis = await axios.get(`${API_BASE}/api/test/redis`);
        console.log('✅ Redis Performance: PASSED');
        console.log(`   Status: ${redis.data.status}\n`);
        passedTests++;
    } catch (error) {
        console.log('❌ Redis Performance: FAILED');
        console.log(`   Error: ${error.message}\n`);
    }
    
    // Final Results
    console.log('='.repeat(50));
    console.log('🏆 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.log(`Passed: ${passedTests}/${totalTests} (${(passedTests/totalTests*100).toFixed(1)}%)`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED - System is ready for contest!');
    } else if (passedTests >= totalTests * 0.8) {
        console.log('⚠️ MOSTLY WORKING - Minor issues detected');
    } else {
        console.log('❌ NEEDS ATTENTION - Multiple failures detected');
    }
    
    // Contest readiness assessment
    console.log('\n📋 CONTEST READINESS CHECKLIST:');
    console.log(`✅ Server Running: ${passedTests > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Redis Connected: ${passedTests >= 2 ? 'YES' : 'NO'}`);
    console.log(`✅ Agent Profiles: ${passedTests >= 3 ? 'YES' : 'NO'}`);
    console.log(`✅ Real-time Updates: ${passedTests >= 4 ? 'YES' : 'NO'}`);
    console.log(`✅ Core Features: ${passedTests >= 5 ? 'YES' : 'NO'}`);
    
    const contestReady = passedTests >= 5;
    console.log(`\n🎯 CONTEST STATUS: ${contestReady ? 'READY ✅' : 'NEEDS WORK ⚠️'}`);
}

function testWebSocket() {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(WS_URL, {
            origin: 'http://localhost:5174'
        });
        
        const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Connection timeout'));
        }, 5000);
        
        ws.on('open', () => {
            clearTimeout(timeout);
            console.log('   Connected to WebSocket successfully');
            ws.close();
            resolve();
        });
        
        ws.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
        });
    });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⏹️ Test interrupted by user');
    process.exit(0);
});

// Run tests
runSimpleTests().catch(console.error);
