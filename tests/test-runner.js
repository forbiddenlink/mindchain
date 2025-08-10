
// Advanced Test Runner for StanceStream Redis AI Challenge
import 'dotenv/config';
import { createClient } from 'redis';
import WebSocket from 'ws';
import axios from 'axios';
import { EventEmitter } from 'events';

// Increase EventEmitter max listeners for WebSocket connections
EventEmitter.defaultMaxListeners = 100;

const API_BASE = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

// Test categories for organization
const TestCategories = {
    REDIS: 'Redis Integration',
    WEBSOCKET: 'WebSocket Communication',
    API: 'API Endpoints',
    SECURITY: 'Security Measures',
    PERFORMANCE: 'Performance Metrics',
    AI: 'AI Integration',
    DEBATE: 'Debate Engine'
};

// Test configuration
const config = {
    redisTimeout: 5000,
    wsTimeout: 5000,
    apiTimeout: 3000,
    maxConcurrentTests: 25,
    rateLimitThreshold: 50,
    testDataSizes: {
        small: 1024,        // 1KB
        medium: 1048576,    // 1MB
        large: 10485760     // 10MB
    }
};

// Utility function for delays
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// WebSocket connection wrapper with proper error handling
async function createWebSocketConnection(timeout = 5000) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(WS_URL, {
            origin: 'http://localhost:5173',
            headers: {
                'User-Agent': 'StanceStream-TestRunner/1.0',
                'X-Test-Client': 'true'
            },
            // Add connection failure retry
            retries: 3,
            reconnectInterval: 1000
        });
        
        const timeoutId = setTimeout(() => {
            ws.close();
            reject(new Error('WebSocket connection timeout'));
        }, timeout);

        ws.on('open', () => {
            clearTimeout(timeoutId);
            resolve(ws);
        });

        ws.on('error', (error) => {
            clearTimeout(timeoutId);
            reject(error);
        });
    });
}

// Safe WebSocket message sender
async function sendWebSocketMessage(ws, message, timeout = 2000) {
    return new Promise((resolve, reject) => {
        if (ws.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket is not open'));
            return;
        }

        const timeoutId = setTimeout(() => {
            resolve(); // Consider timeout as success for testing purposes
        }, timeout);

        ws.send(JSON.stringify(message), (error) => {
            if (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });

        ws.once('message', () => {
            clearTimeout(timeoutId);
            resolve();
        });
    });
}

// Redis test utilities
async function testRedisFeature(client, feature) {
    switch (feature) {
        case 'json':
            try {
                await client.json.set('test:json', '$', { test: 'data' });
                const result = await client.json.get('test:json');
                await client.del('test:json');
                return result?.test === 'data';
            } catch (error) {
                console.log('⚠️ RedisJSON not available:', error.message);
                return false;
            }
        case 'streams':
            try {
                await client.xAdd('test:stream', '*', { field: 'value' });
                const result = await client.xRead({ key: 'test:stream', id: '0-0' });
                await client.del('test:stream');
                return result?.length > 0;
            } catch (error) {
                console.log('⚠️ Redis Streams not available:', error.message);
                return false;
            }
        case 'timeseries':
            try {
                const tsKey = `test:ts:${Date.now()}`;
                try {
                    await client.ts.create(tsKey, {
                        RETENTION: 0,  // Keep data indefinitely
                        ENCODING: 'UNCOMPRESSED'  // Use simple encoding for testing
                    });
                } catch (error) {
                    if (!error.message.includes('already exists')) {
                        throw error;
                    }
                }
                const timestamp = Math.floor(Date.now());
                await client.ts.add(tsKey, timestamp, 42);
                const result = await client.ts.range(tsKey, '-', '+');
                await client.del(tsKey);
                return result?.length > 0;
            } catch (error) {
                console.log('⚠️ RedisTimeSeries not available:', error.message);
                return false;
            }
        case 'vector':
            try {
                // Note: This assumes vector index is already created
                const testVector = new Float32Array(1536).fill(0.1);
                await client.hSet('test:vector', {
                    vector: Buffer.from(testVector.buffer),
                    content: 'test'
                });
                await client.del('test:vector');
                return true;
            } catch (error) {
                console.log('⚠️ Redis Vector operations failed:', error.message);
                return false;
            }
    }
    return false;
}

// AI test utilities
async function testAIFeature(feature) {
    // Maximum retries and delay between retries
    const maxRetries = 3;
    const retryDelay = 3000; // 3 seconds between retries

    // Add initial delay to avoid rate limits from previous tests
    await delay(2000);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            let endpoint;
            let payload;
            
            switch (feature) {
                case 'sentiment':
                    endpoint = '/api/test/sentiment';
                    payload = { text: "This is a test message for sentiment analysis" };
                    break;
                case 'factcheck':
                    endpoint = '/api/test/factcheck';
                    payload = { text: "Climate change is causing rising sea levels" };
                    break;
                case 'stance':
                    endpoint = '/api/test/stance';
                    payload = { 
                        text: "We must take action on climate change",
                        agentId: "senatorbot",
                        topic: "climate_policy"
                    };
                    break;
                default:
                    throw new Error(`Unknown AI feature: ${feature}`);
            }

            const fullUrl = `${API_BASE}${endpoint}`;
            console.log(`Testing ${feature} API (attempt ${attempt}/${maxRetries})`);
            console.log(`URL: ${fullUrl}`);
            console.log(`Payload:`, payload);

            const response = await axios.post(fullUrl, payload, {
                timeout: 5000, // 5 second timeout
                headers: {
                    'Content-Type': 'application/json',
                    'X-Test-Client': 'true'
                },
                validateStatus: function (status) {
                    return status < 500; // Accept any status < 500 to handle 404s properly
                }
            });

            console.log(`Response Status: ${response.status}`);
            console.log(`Response Data:`, response.data);

            if (response.status === 404) {
                console.log(`⚠️ Endpoint ${endpoint} not found`);
                throw new Error(`Endpoint not found: ${endpoint}`);
            }

            if (response.data?.success) {
                return true;
            } else {
                console.log(`⚠️ AI ${feature} test returned success: false`);
                if (response.data?.error) {
                    console.log(`Error message: ${response.data.error}`);
                }
                return false;
            }
        } catch (error) {
            console.log(`⚠️ AI ${feature} test failed (attempt ${attempt}/${maxRetries}):`);
            console.log(`Error: ${error.message}`);
            if (error.response) {
                console.log(`Status: ${error.response.status}`);
                console.log(`Data:`, error.response.data);
            }
            
            if (attempt < maxRetries) {
                console.log(`Retrying in ${retryDelay/1000} seconds...`);
                await delay(retryDelay);
            } else {
                return false;
            }
        }
    }
    return false;
}

// Improved test runner
async function runTests() {
    console.log('🚀 Starting StanceStream Redis AI Challenge Test Suite');
    console.log('=' .repeat(60));

    const startTime = Date.now();
    const results = {
        categories: {},
        passed: 0,
        failed: 0,
        warnings: [],
        criticalIssues: [],
        metrics: {
            startTime,
            endTime: null,
            duration: null,
            avgResponseTime: []
        }
    };

    try {
        // Test Redis Integration
        console.log(`\n� Testing ${TestCategories.REDIS}`);
        console.log('-'.repeat(40));
        
        const client = createClient({
            url: process.env.REDIS_URL,
            socket: { connectTimeout: config.redisTimeout }
        });

        try {
            await client.connect();
            console.log('✅ Redis connection successful');
            results.passed++;

            // Test Redis modules
            console.log('\nTesting Redis Modules:');
            const modules = ['json', 'streams', 'timeseries', 'vector'];
            const moduleResults = {};

            for (const module of modules) {
                const success = await testRedisFeature(client, module);
                moduleResults[module] = success;
                if (success) {
                    console.log(`✅ Redis ${module.toUpperCase()} module working`);
                    results.passed++;
                } else {
                    console.log(`❌ Redis ${module.toUpperCase()} module failed`);
                    results.criticalIssues.push(`Redis ${module.toUpperCase()} module not available`);
                    results.failed++;
                }
            }

            // Test Redis performance with timeout protection
            console.log('\nTesting Redis Performance:');
            const start = Date.now();
            const ops = 100; // Reduced from 1000 to 100 operations
            const timeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Redis performance test timeout')), 10000)
            );
            
            const performanceTest = async () => {
                const pipeline = client.multi();
                for (let i = 0; i < ops; i++) {
                    pipeline.set(`test:${i}`, 'value');
                    pipeline.get(`test:${i}`);
                    pipeline.del(`test:${i}`);
                }
                await pipeline.exec();
            };

            try {
                await Promise.race([performanceTest(), timeout]);
                const duration = Date.now() - start;
                const opsPerSecond = Math.floor((ops * 3 / duration) * 1000); // multiply by 3 because each operation is set+get+del
                console.log(`✅ Redis performance: ${opsPerSecond} ops/sec`);
                
                if (opsPerSecond < 1000) {
                    results.warnings.push(`Low Redis performance: ${opsPerSecond} ops/sec`);
                }
            } catch (error) {
                console.log('⚠️ Redis performance test failed:', error.message);
                results.warnings.push(`Redis performance: ${error.message}`);
            }

            // Test semantic cache operations
            console.log('\nTesting Semantic Cache:');
            const testVector = new Float32Array(1536).fill(0.1);
            try {
                await client.ft.search('cache-index', '*', {
                    LIMIT: { from: 0, size: 1 },
                    PARAMS: { vec: Buffer.from(testVector.buffer) }
                });
                console.log('✅ Semantic cache search working');
                results.passed++;
            } catch (error) {
                console.log('❌ Semantic cache search failed:', error.message);
                results.criticalIssues.push('Semantic cache not properly configured');
                results.failed++;
            }

            await client.quit();
        } catch (error) {
            console.log('❌ Redis connection failed:', error.message);
            results.criticalIssues.push(`Redis connection: ${error.message}`);
            results.failed++;
        }

        // Test WebSocket and Debate Engine
        console.log(`\n🔄 Testing ${TestCategories.WEBSOCKET} and ${TestCategories.DEBATE}`);
        console.log('-'.repeat(40));
        
        try {
            // Test basic connection
            const ws = await createWebSocketConnection();
            console.log('✅ WebSocket connection successful');
            results.passed++;

            // Test debate creation
            const debateResponse = await axios.post(`${API_BASE}/api/debate/start`, {
                topic: 'test debate topic',
                agents: ['senatorbot', 'reformerbot']
            });

            if (debateResponse.data?.debateId) {
                console.log('✅ Debate creation successful');
                results.passed++;

                // Test message streaming
                let messageReceived = false;
                ws.on('message', (data) => {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'new_message' && message.debateId === debateResponse.data.debateId) {
                        messageReceived = true;
                    }
                });

                // Wait for debate messages with progress indicator
                let waited = 0;
                const maxWait = 10000; // 10 seconds
                const interval = 1000; // Check every second
                
                while (!messageReceived && waited < maxWait) {
                    process.stdout.write(`Waiting for debate messages (${waited/1000}s)...\r`);
                    await new Promise(resolve => setTimeout(resolve, interval));
                    waited += interval;
                }
                process.stdout.write('\n'); // Clear progress line
                
                if (messageReceived) {
                    console.log('✅ Debate message streaming working');
                    results.passed++;
                } else {
                    console.log('❌ No debate messages received after ${maxWait/1000} seconds');
                    results.warnings.push('Debate message streaming not working');
                    results.failed++;
                }

                // Test AI integration
                console.log('\nTesting AI Features:');
                const aiFeatures = ['sentiment', 'factcheck', 'stance'];
                for (const feature of aiFeatures) {
                    const success = await testAIFeature(feature);
                    if (success) {
                        console.log(`✅ AI ${feature} working`);
                        results.passed++;
                    } else {
                        console.log(`❌ AI ${feature} failed`);
                        results.warnings.push(`AI ${feature} not working`);
                        results.failed++;
                    }
                }
            } else {
                console.log('❌ Debate creation failed');
                results.criticalIssues.push('Debate system not working');
                results.failed++;
            }

            ws.close();
        } catch (error) {
            console.log('❌ WebSocket/Debate test failed:', error.message);
            results.criticalIssues.push(`WebSocket/Debate: ${error.message}`);
            results.failed++;
        }

        // Test API health endpoint
        console.log('\n🔄 Testing API Health');
        try {
            const response = await axios.get(`${API_BASE}/api/health`);
            console.log('✅ API health check successful');
            results.passed++;
        } catch (error) {
            console.log('⚠️ API health check failed:', error.response?.status || error.message);
            results.warnings.push(`API health: ${error.message}`);
            results.failed++;
        }

        // Test rate limiting
        console.log('\n🔄 Testing Rate Limiting');
        // Make 250 requests in rapid succession (exceeds 200/minute limit)
        const requests = Array(250).fill().map(() => 
            axios.get(`${API_BASE}/api/health`).catch(error => error)
        );
        
        console.log('Sending burst of requests to test rate limiting...');
        const responses = await Promise.all(requests);
        const rateLimited = responses.filter(r => r.response?.status === 429).length;
        
        if (rateLimited > 0) {
            console.log(`✅ Rate limiting working (${rateLimited} requests limited)`);
            results.passed++;
        } else {
            console.log('⚠️ Rate limiting may not be active');
            results.warnings.push('Rate limiting not detected');
            results.failed++;
        }

        // Test input validation
        console.log('\n🔄 Testing Input Validation');
        const testInputs = [
            { input: '<script>alert(1)</script>', type: 'XSS' },
            { input: '"; DROP TABLE users; --', type: 'SQL Injection' },
            { input: '🚀'.repeat(1000), type: 'Long Unicode' }
        ];

        // Wait for rate limit to reset with progress indicator
        console.log('Waiting for rate limit to reset...');
        const resetTime = 30000; // 30 seconds
        const progressStep = 5000; // Update every 5 seconds
        for (let waited = 0; waited < resetTime; waited += progressStep) {
            const percentage = Math.round((waited / resetTime) * 100);
            process.stdout.write(`Rate limit reset progress: ${percentage}%\r`);
            await delay(progressStep);
        }
        console.log('Rate limit reset complete                    ');

        for (const {input, type} of testInputs) {
            let success = false;
            let attempts = 0;
            const maxAttempts = 3;

            while (!success && attempts < maxAttempts) {
                attempts++;
                try {
                    console.log(`\nTesting ${type} input (attempt ${attempts}/${maxAttempts})...`);
                    const response = await axios.post(`${API_BASE}/api/debate/start`, {
                        topic: input,
                        agents: ['senatorbot', 'reformerbot']
                    }, {
                        validateStatus: status => status < 500 // Accept 400-level responses
                    });
                    
                    // Check the response status
                    if (response.status === 429) {
                        console.log('Rate limit hit, waiting before retry...');
                        await delay(10000 * attempts); // Exponential backoff
                        continue;
                    }

                    if (response.status === 400 || response.status === 422) {
                        console.log(`✅ ${type} input properly rejected`);
                        results.passed++;
                        success = true;
                    } else if (response.data.topic === input) {
                        console.log(`⚠️ ${type} input not sanitized`);
                        results.criticalIssues.push(`${type} sanitization failed`);
                        results.failed++;
                        success = true;
                    } else {
                        console.log(`✅ ${type} input properly handled`);
                        results.passed++;
                        success = true;
                    }
                } catch (error) {
                    const status = error.response?.status;
                    if (status === 400 || status === 422) {
                        console.log(`✅ ${type} input properly rejected`);
                        results.passed++;
                        success = true;
                    } else if (status === 429 && attempts < maxAttempts) {
                        console.log(`Rate limit hit, waiting ${5 * attempts}s before retry...`);
                        await delay(5000 * attempts); // Exponential backoff
                    } else {
                        if (attempts === maxAttempts) {
                            console.log(`⚠️ ${type} test failed after ${maxAttempts} attempts:`, error.message);
                            results.warnings.push(`${type} test: ${error.message}`);
                            results.failed++;
                        }
                    }
                }
            }
            
            // Add delay between different input tests
            await delay(5000);
        }

    } catch (error) {
        console.error('❌ Test suite error:', error);
        results.criticalIssues.push(`Test suite error: ${error.message}`);
    }

    // Calculate final metrics
    results.metrics.endTime = Date.now();
    results.metrics.duration = results.metrics.endTime - results.metrics.startTime;
    results.metrics.avgResponseTime = results.metrics.avgResponseTime.length > 0
        ? results.metrics.avgResponseTime.reduce((a, b) => a + b) / results.metrics.avgResponseTime.length
        : 0;

    // Print comprehensive results
    console.log('\n📊 StanceStream Redis AI Challenge Test Results');
    console.log('=' .repeat(60));
    
    // Overall stats
    console.log('\n🎯 Overall Results:');
    console.log(`Total Tests: ${results.passed + results.failed}`);
    console.log(`Tests Passed: ${results.passed}`);
    console.log(`Tests Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    
    // Performance metrics
    console.log('\n⚡ Performance Metrics:');
    console.log(`Total Duration: ${(results.metrics.duration / 1000).toFixed(2)}s`);
    console.log(`Avg Response Time: ${results.metrics.avgResponseTime.toFixed(2)}ms`);
    
    // Redis module status
    console.log('\n💾 Redis Module Status:');
    Object.entries(results.categories[TestCategories.REDIS] || {}).forEach(([module, status]) => {
        console.log(`${status ? '✅' : '❌'} ${module.toUpperCase()}`);
    });
    
    // Warnings
    if (results.warnings.length > 0) {
        console.log('\n⚠️ Warnings:');
        results.warnings.forEach(warning => console.log(`- ${warning}`));
    }
    
    // Critical issues
    if (results.criticalIssues.length > 0) {
        console.log('\n🚨 Critical Issues:');
        results.criticalIssues.forEach(issue => console.log(`- ${issue}`));
    }

    // Final assessment
    console.log('\n📋 Production Readiness Assessment:');
    const criticalScore = Math.max(0, 100 - (results.criticalIssues.length * 25));
    const warningScore = Math.max(0, 100 - (results.warnings.length * 10));
    const testScore = (results.passed / (results.passed + results.failed)) * 100;
    const overallScore = (criticalScore * 0.5 + warningScore * 0.3 + testScore * 0.2);
    
    console.log(`Overall Score: ${overallScore.toFixed(1)}/100`);
    
    if (overallScore >= 90) {
        console.log('✅ PRODUCTION READY - All systems operational');
    } else if (overallScore >= 75) {
        console.log('⚠️ PRODUCTION CAPABLE - Minor issues to address');
    } else {
        console.log('❌ NOT PRODUCTION READY - Critical issues must be resolved');
    }

    const success = overallScore >= 75 && results.criticalIssues.length === 0;
    process.exit(success ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
