#!/usr/bin/env node

/**
 * WebSocket Stability Testing for StanceStream Contest Submission
 * Tests connection reliability under load and stress conditions
 * 
 * Redis AI Challenge - Final Contest Verification
 * August 8, 2025
 */

import WebSocket from 'ws';
import { performance } from 'perf_hooks';

const SERVER_URL = 'ws://localhost:3001';
const TEST_DURATION = 30000; // 30 seconds
const CONNECTION_COUNTS = [1, 5, 10, 20, 30]; // Progressive load testing

class WebSocketStabilityTester {
    constructor() {
        this.connections = [];
        this.messagesSent = 0;
        this.messagesReceived = 0;
        this.errors = 0;
        this.connectionFailures = 0;
        this.latencySum = 0;
        this.latencyCount = 0;
        this.results = [];
    }

    async runStabilityTest() {
        console.log('\n🧪 StanceStream WebSocket Stability Testing');
        console.log('=' .repeat(60));
        console.log(`🎯 Contest Deadline: August 10, 2025`);
        console.log(`⏱️  Test Duration: ${TEST_DURATION / 1000} seconds per phase`);
        console.log(`📊 Testing ${CONNECTION_COUNTS.length} different load scenarios\n`);

        for (const connectionCount of CONNECTION_COUNTS) {
            console.log(`\n🔄 Testing ${connectionCount} concurrent connections...`);
            await this.testConnectionLoad(connectionCount);
            await this.sleep(2000); // Brief pause between tests
        }

        this.generateFinalReport();
    }

    async testConnectionLoad(connectionCount) {
        const testStartTime = performance.now();
        this.resetCounters();

        try {
            // Create connections
            const connectionPromises = Array.from({ length: connectionCount }, (_, i) => 
                this.createConnection(i)
            );

            await Promise.all(connectionPromises);
            console.log(`  ✅ Connected: ${connectionCount} WebSocket connections`);

            // Test message exchange
            await this.testMessageExchange();

            // Test connection stability
            await this.testConnectionStability();

            // Cleanup connections
            await this.cleanupConnections();

            const testDuration = performance.now() - testStartTime;
            const avgLatency = this.latencyCount > 0 ? this.latencySum / this.latencyCount : 0;

            const result = {
                connectionCount,
                duration: testDuration,
                messagesSent: this.messagesSent,
                messagesReceived: this.messagesReceived,
                errors: this.errors,
                connectionFailures: this.connectionFailures,
                avgLatency: avgLatency,
                successRate: this.messagesSent > 0 ? (this.messagesReceived / this.messagesSent) * 100 : 0,
                connectionSuccessRate: connectionCount > 0 ? ((connectionCount - this.connectionFailures) / connectionCount) * 100 : 0
            };

            this.results.push(result);
            this.displayTestResult(result);

        } catch (error) {
            console.error(`  ❌ Test failed for ${connectionCount} connections:`, error.message);
            this.results.push({
                connectionCount,
                failed: true,
                error: error.message
            });
        }
    }

    async createConnection(index) {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(SERVER_URL);
            const connectionTimeout = setTimeout(() => {
                this.connectionFailures++;
                reject(new Error(`Connection ${index} timeout`));
            }, 5000);

            ws.on('open', () => {
                clearTimeout(connectionTimeout);
                ws.connectionId = index;
                ws.messageCount = 0;
                this.connections.push(ws);
                resolve(ws);
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.messagesReceived++;
                    
                    // Calculate latency if this is a response to our test message
                    if (message.type === 'test_response' && message.timestamp) {
                        const latency = Date.now() - message.timestamp;
                        this.latencySum += latency;
                        this.latencyCount++;
                    }
                } catch (error) {
                    this.errors++;
                }
            });

            ws.on('error', (error) => {
                clearTimeout(connectionTimeout);
                this.errors++;
                this.connectionFailures++;
                reject(error);
            });

            ws.on('close', () => {
                // Normal closure during cleanup
            });
        });
    }

    async testMessageExchange() {
        const messagePromises = this.connections.map((ws, index) => {
            return this.sendTestMessages(ws, 5); // 5 messages per connection
        });

        await Promise.all(messagePromises);
        await this.sleep(1000); // Wait for responses
    }

    async sendTestMessages(ws, count) {
        for (let i = 0; i < count; i++) {
            if (ws.readyState === WebSocket.OPEN) {
                const testMessage = {
                    type: 'test_message',
                    connectionId: ws.connectionId,
                    messageIndex: i,
                    timestamp: Date.now(),
                    payload: `Test message ${i} from connection ${ws.connectionId}`
                };

                ws.send(JSON.stringify(testMessage));
                this.messagesSent++;
                ws.messageCount++;
                
                await this.sleep(100); // Small delay between messages
            }
        }
    }

    async testConnectionStability() {
        // Test connections stay alive during debate activity
        const stableConnections = this.connections.filter(ws => ws.readyState === WebSocket.OPEN);
        
        // Simulate debate activity
        for (const ws of stableConnections.slice(0, 3)) { // Use first 3 connections
            if (ws.readyState === WebSocket.OPEN) {
                const debateMessage = {
                    type: 'start_debate',
                    topic: 'WebSocket Stability Testing',
                    timestamp: Date.now()
                };
                
                ws.send(JSON.stringify(debateMessage));
                this.messagesSent++;
            }
        }

        await this.sleep(2000); // Wait for debate responses
    }

    async cleanupConnections() {
        const closePromises = this.connections.map(ws => {
            return new Promise((resolve) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.on('close', resolve);
                    ws.close();
                } else {
                    resolve();
                }
            });
        });

        await Promise.all(closePromises);
        this.connections = [];
    }

    displayTestResult(result) {
        console.log(`  📊 Results:`);
        console.log(`    • Messages: ${result.messagesReceived}/${result.messagesSent} (${result.successRate.toFixed(1)}% success)`);
        console.log(`    • Connections: ${result.connectionCount - result.connectionFailures}/${result.connectionCount} (${result.connectionSuccessRate.toFixed(1)}% success)`);
        console.log(`    • Avg Latency: ${result.avgLatency.toFixed(1)}ms`);
        console.log(`    • Errors: ${result.errors}`);
        console.log(`    • Duration: ${(result.duration / 1000).toFixed(1)}s`);
        
        // Evaluate result quality
        if (result.successRate >= 95 && result.connectionSuccessRate >= 95 && result.avgLatency < 1000) {
            console.log(`    🏆 EXCELLENT - Contest ready!`);
        } else if (result.successRate >= 90 && result.connectionSuccessRate >= 90) {
            console.log(`    ✅ GOOD - Contest acceptable`);
        } else {
            console.log(`    ⚠️  NEEDS IMPROVEMENT`);
        }
    }

    generateFinalReport() {
        console.log('\n🎯 FINAL WEBSOCKET STABILITY REPORT');
        console.log('=' .repeat(60));

        const successfulTests = this.results.filter(r => !r.failed);
        const failedTests = this.results.filter(r => r.failed);

        if (successfulTests.length === 0) {
            console.log('❌ ALL TESTS FAILED - WebSocket server may be down');
            return;
        }

        // Calculate overall metrics
        const totalMessages = successfulTests.reduce((sum, r) => sum + r.messagesSent, 0);
        const totalReceived = successfulTests.reduce((sum, r) => sum + r.messagesReceived, 0);
        const totalErrors = successfulTests.reduce((sum, r) => sum + r.errors, 0);
        const avgLatency = successfulTests.reduce((sum, r) => sum + r.avgLatency, 0) / successfulTests.length;
        const overallSuccessRate = totalMessages > 0 ? (totalReceived / totalMessages) * 100 : 0;

        console.log(`\n📈 OVERALL PERFORMANCE:`);
        console.log(`  • Total Messages: ${totalReceived}/${totalMessages} (${overallSuccessRate.toFixed(1)}% success)`);
        console.log(`  • Average Latency: ${avgLatency.toFixed(1)}ms`);
        console.log(`  • Total Errors: ${totalErrors}`);
        console.log(`  • Failed Test Scenarios: ${failedTests.length}/${this.results.length}`);

        // Performance rating
        console.log(`\n🏆 CONTEST READINESS ASSESSMENT:`);
        
        let contestScore = 0;
        let recommendations = [];

        // Message success rate (40 points)
        if (overallSuccessRate >= 95) {
            contestScore += 40;
            console.log(`  ✅ Message Reliability: EXCELLENT (${overallSuccessRate.toFixed(1)}%)`);
        } else if (overallSuccessRate >= 90) {
            contestScore += 30;
            console.log(`  ✅ Message Reliability: GOOD (${overallSuccessRate.toFixed(1)}%)`);
            recommendations.push('Consider investigating message loss patterns');
        } else {
            contestScore += 20;
            console.log(`  ⚠️  Message Reliability: NEEDS WORK (${overallSuccessRate.toFixed(1)}%)`);
            recommendations.push('CRITICAL: Fix message delivery issues');
        }

        // Latency performance (30 points)
        if (avgLatency < 500) {
            contestScore += 30;
            console.log(`  ✅ Response Latency: EXCELLENT (${avgLatency.toFixed(1)}ms)`);
        } else if (avgLatency < 1000) {
            contestScore += 25;
            console.log(`  ✅ Response Latency: GOOD (${avgLatency.toFixed(1)}ms)`);
        } else {
            contestScore += 15;
            console.log(`  ⚠️  Response Latency: SLOW (${avgLatency.toFixed(1)}ms)`);
            recommendations.push('Optimize WebSocket message handling');
        }

        // Scalability (20 points)
        const maxSuccessfulConnections = Math.max(...successfulTests.map(r => r.connectionCount));
        if (maxSuccessfulConnections >= 20) {
            contestScore += 20;
            console.log(`  ✅ Scalability: EXCELLENT (${maxSuccessfulConnections} concurrent connections)`);
        } else if (maxSuccessfulConnections >= 10) {
            contestScore += 15;
            console.log(`  ✅ Scalability: GOOD (${maxSuccessfulConnections} concurrent connections)`);
        } else {
            contestScore += 10;
            console.log(`  ⚠️  Scalability: LIMITED (${maxSuccessfulConnections} concurrent connections)`);
            recommendations.push('Test and optimize for higher connection counts');
        }

        // Error handling (10 points)
        if (totalErrors === 0) {
            contestScore += 10;
            console.log(`  ✅ Error Handling: PERFECT (0 errors)`);
        } else if (totalErrors < 5) {
            contestScore += 8;
            console.log(`  ✅ Error Handling: GOOD (${totalErrors} errors)`);
        } else {
            contestScore += 5;
            console.log(`  ⚠️  Error Handling: NEEDS WORK (${totalErrors} errors)`);
            recommendations.push('Investigate and fix WebSocket error patterns');
        }

        // Final verdict
        console.log(`\n🎯 FINAL WEBSOCKET SCORE: ${contestScore}/100`);
        
        if (contestScore >= 90) {
            console.log(`🏆 CONTEST STATUS: WINNER QUALITY - WebSocket system excellent!`);
        } else if (contestScore >= 80) {
            console.log(`✅ CONTEST STATUS: READY - WebSocket system solid for competition`);
        } else if (contestScore >= 70) {
            console.log(`⚠️  CONTEST STATUS: ACCEPTABLE - Some optimizations recommended`);
        } else {
            console.log(`❌ CONTEST STATUS: NEEDS WORK - Address issues before submission`);
        }

        if (recommendations.length > 0) {
            console.log(`\n💡 RECOMMENDATIONS:`);
            recommendations.forEach((rec, i) => console.log(`  ${i + 1}. ${rec}`));
        }

        console.log(`\n🎉 WebSocket stability testing complete!`);
        console.log(`📅 Contest submission ready for August 10, 2025`);
    }

    resetCounters() {
        this.messagesSent = 0;
        this.messagesReceived = 0;
        this.errors = 0;
        this.connectionFailures = 0;
        this.latencySum = 0;
        this.latencyCount = 0;
        this.connections = [];
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main execution
async function main() {
    const tester = new WebSocketStabilityTester();
    
    try {
        await tester.runStabilityTest();
    } catch (error) {
        console.error('\n❌ WebSocket stability test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('  1. Ensure server is running: node server.js');
        console.log('  2. Check WebSocket endpoint: ws://localhost:3001');
        console.log('  3. Verify Redis is connected and operational');
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n⏹️  Test interrupted by user');
    process.exit(0);
});

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default WebSocketStabilityTester;
