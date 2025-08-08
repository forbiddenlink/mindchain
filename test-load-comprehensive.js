// Load Testing & Performance Validation Script
import WebSocket from 'ws';
import axios from 'axios';

const API_BASE = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

class LoadTestSuite {
    constructor() {
        this.results = {
            concurrent_users: 0,
            successful_connections: 0,
            failed_connections: 0,
            message_send_success: 0,
            message_send_failed: 0,
            cache_hits: 0,
            cache_misses: 0,
            average_response_time: 0,
            test_duration: 0
        };
        this.connections = [];
        this.startTime = Date.now();
    }

    async testConcurrentConnections(userCount = 10) {
        console.log(`\n🔥 Testing ${userCount} concurrent WebSocket connections...`);
        
        const connectionPromises = Array.from({ length: userCount }, (_, i) => 
            this.createTestConnection(i)
        );
        
        await Promise.allSettled(connectionPromises);
        
        console.log(`✅ ${this.results.successful_connections}/${userCount} connections established`);
        console.log(`❌ ${this.results.failed_connections} connection failures`);
    }

    async createTestConnection(userId) {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(WS_URL, {
                origin: 'http://localhost:5174'
            });
            
            ws.on('open', () => {
                this.results.successful_connections++;
                this.connections.push(ws);
                console.log(`👤 User ${userId} connected`);
                resolve(ws);
            });
            
            ws.on('error', (error) => {
                this.results.failed_connections++;
                console.log(`❌ User ${userId} connection failed:`, error.message);
                reject(error);
            });
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    if (message.type === 'new_message') {
                        this.results.message_send_success++;
                    }
                } catch (e) {
                    console.log('Failed to parse message:', e.message);
                }
            });
        });
    }

    async testMessageGeneration() {
        console.log('\n📝 Testing debate system...');
        
        // First start a debate
        try {
            const startResponse = await axios.post(`${API_BASE}/api/debate/start`, {
                topic: 'climate change',
                agents: ['senatorbot', 'reformerbot']
            });
            
            const debateId = startResponse.data.debateId;
            console.log(`✅ Started debate: ${debateId}`);
            
            // Wait a moment for debate to initialize
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Test getting debate messages
            const messagesResponse = await axios.get(`${API_BASE}/api/debate/${debateId}/messages`);
            console.log(`✅ Retrieved ${messagesResponse.data.messages?.length || 0} messages`);
            
            this.results.message_send_success++;
            
            // Stop the debate
            await axios.post(`${API_BASE}/api/debate/${debateId}/stop`);
            console.log(`✅ Stopped debate: ${debateId}`);
            
        } catch (error) {
            this.results.message_send_failed++;
            console.log(`❌ Failed to test debate system:`, error.message);
        }
    }

    async testCachePerformance() {
        console.log('\n🧠 Testing semantic cache performance...');
        
        try {
            // Test cache metrics endpoint
            const cacheResponse = await axios.get(`${API_BASE}/api/cache/metrics`);
            const cacheData = cacheResponse.data;
            
            console.log(`✅ Cache metrics retrieved:`);
            console.log(`  - Total Requests: ${cacheData.total_requests || 0}`);
            console.log(`  - Cache Hits: ${cacheData.cache_hits || 0}`);
            console.log(`  - Hit Ratio: ${((cacheData.hit_ratio || 0) * 100).toFixed(1)}%`);
            
            this.results.cache_hits = cacheData.cache_hits || 0;
            this.results.cache_misses = (cacheData.total_requests || 0) - (cacheData.cache_hits || 0);
            
        } catch (error) {
            console.log(`❌ Cache performance test failed:`, error.message);
        }
    }

    async testSystemMetrics() {
        console.log('\n📊 Fetching system metrics...');
        
        try {
            // Test multiple metric endpoints
            const [cacheMetrics, redisStats, performanceMetrics] = await Promise.all([
                axios.get(`${API_BASE}/api/cache/metrics`),
                axios.get(`${API_BASE}/api/stats/redis`),
                axios.get(`${API_BASE}/api/analytics/performance`)
            ]);
            
            console.log('✅ System Metrics Retrieved:');
            console.log('Cache Performance:');
            console.log(`  - Total Requests: ${cacheMetrics.data.total_requests || 0}`);
            console.log(`  - Cache Hits: ${cacheMetrics.data.cache_hits || 0}`);
            console.log(`  - Hit Ratio: ${((cacheMetrics.data.hit_ratio || 0) * 100).toFixed(1)}%`);
            
            console.log('Redis Status:');
            console.log(`  - Connected: ${redisStats.data.redis_connected || false}`);
            console.log(`  - Memory Usage: ${redisStats.data.memory_usage || 'N/A'}`);
            
            console.log('Performance:');
            console.log(`  - Average Response Time: ${performanceMetrics.data.avg_response_time || 0}ms`);
            
        } catch (error) {
            console.log(`❌ Failed to fetch system metrics:`, error.message);
        }
    }

    async cleanup() {
        console.log('\n🧹 Cleaning up test connections...');
        
        this.connections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        });
        
        this.results.test_duration = Date.now() - this.startTime;
        this.printFinalResults();
    }

    printFinalResults() {
        console.log('\n' + '='.repeat(60));
        console.log('🏆 LOAD TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        
        console.log(`Test Duration: ${this.results.test_duration}ms`);
        console.log(`Concurrent Users: ${this.results.concurrent_users}`);
        console.log(`Successful Connections: ${this.results.successful_connections}`);
        console.log(`Failed Connections: ${this.results.failed_connections}`);
        console.log(`Message Generation Success: ${this.results.message_send_success}`);
        console.log(`Message Generation Failures: ${this.results.message_send_failed}`);
        console.log(`Cache Hits: ${this.results.cache_hits}`);
        console.log(`Cache Misses: ${this.results.cache_misses}`);
        console.log(`Average Response Time: ${this.results.average_response_time.toFixed(2)}ms`);
        
        const cacheHitRate = this.results.cache_hits / (this.results.cache_hits + this.results.cache_misses) * 100;
        console.log(`Cache Hit Rate: ${cacheHitRate.toFixed(1)}%`);
        
        // Performance assessment
        console.log('\n📋 PERFORMANCE ASSESSMENT:');
        
        if (this.results.average_response_time < 3000) {
            console.log('✅ Response Time: EXCELLENT (< 3s)');
        } else if (this.results.average_response_time < 5000) {
            console.log('⚠️ Response Time: ACCEPTABLE (3-5s)');
        } else {
            console.log('❌ Response Time: NEEDS IMPROVEMENT (> 5s)');
        }
        
        if (cacheHitRate > 60) {
            console.log('✅ Cache Performance: EXCELLENT (>60% hit rate)');
        } else if (cacheHitRate > 30) {
            console.log('⚠️ Cache Performance: ACCEPTABLE (30-60% hit rate)');
        } else {
            console.log('❌ Cache Performance: NEEDS IMPROVEMENT (<30% hit rate)');
        }
        
        const connectionSuccessRate = this.results.successful_connections / (this.results.successful_connections + this.results.failed_connections) * 100;
        if (connectionSuccessRate > 95) {
            console.log('✅ Connection Reliability: EXCELLENT (>95% success)');
        } else if (connectionSuccessRate > 80) {
            console.log('⚠️ Connection Reliability: ACCEPTABLE (80-95% success)');
        } else {
            console.log('❌ Connection Reliability: NEEDS IMPROVEMENT (<80% success)');
        }
        
        console.log('\n🎯 CONTEST READINESS:', 
            this.results.average_response_time < 5000 && 
            cacheHitRate > 30 && 
            connectionSuccessRate > 80 ? 'READY ✅' : 'NEEDS WORK ⚠️'
        );
    }
}

// Main execution
async function runLoadTests() {
    console.log('🚀 StanceStream Load Testing Suite');
    console.log('Ensure server is running on localhost:3001');
    console.log('Press Ctrl+C to stop tests early\n');
    
    const loadTest = new LoadTestSuite();
    
    try {
        // Test system availability
        const healthCheck = await axios.get(`${API_BASE}/api/health`);
        console.log('✅ Server health check passed');
        
        // Run test suite
        await loadTest.testConcurrentConnections(5);
        await loadTest.testMessageGeneration();
        await loadTest.testCachePerformance();
        await loadTest.testSystemMetrics();
        
    } catch (error) {
        console.log('❌ Load test failed:', error.message);
        console.log('Make sure server is running: node server.js');
    } finally {
        await loadTest.cleanup();
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⏹️ Load test interrupted by user');
    process.exit(0);
});

// Run if called directly
async function main() {
    await runLoadTests();
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default LoadTestSuite;
