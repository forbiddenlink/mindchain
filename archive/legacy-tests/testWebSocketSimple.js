#!/usr/bin/env node

/**
 * Simple WebSocket Connection Test for StanceStream
 * Quick verification that WebSocket connectivity works
 */

import WebSocket from 'ws';

const SERVER_URL = 'ws://localhost:3001';

async function simpleWebSocketTest() {
    console.log('\n🧪 Simple WebSocket Connection Test');
    console.log('='.repeat(50));
    console.log(`🎯 Connecting to: ${SERVER_URL}`);
    
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(SERVER_URL);
        
        // Set a timeout to prevent hanging
        const timeout = setTimeout(() => {
            console.log('❌ Connection timeout after 10 seconds');
            ws.close();
            reject(new Error('Connection timeout'));
        }, 10000);
        
        ws.on('open', () => {
            clearTimeout(timeout);
            console.log('✅ WebSocket connected successfully');
            
            // Send a test message
            const testMessage = {
                type: 'test_message',
                content: 'Hello WebSocket server!',
                timestamp: Date.now()
            };
            
            console.log('📤 Sending test message...');
            ws.send(JSON.stringify(testMessage));
            
            // Wait for response or close after 3 seconds
            setTimeout(() => {
                console.log('🔚 Closing connection...');
                ws.close();
                resolve({ success: true, message: 'Test completed successfully' });
            }, 3000);
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                console.log('📥 Received message:', {
                    type: message.type,
                    hasContent: !!message.content,
                    timestamp: message.timestamp
                });
            } catch (error) {
                console.log('📥 Received raw data:', data.toString().substring(0, 100));
            }
        });
        
        ws.on('error', (error) => {
            clearTimeout(timeout);
            console.log('❌ WebSocket error:', error.message);
            reject(error);
        });
        
        ws.on('close', (code, reason) => {
            clearTimeout(timeout);
            console.log(`🔚 WebSocket closed: ${code} ${reason}`);
            resolve({ success: true, message: 'Connection closed normally' });
        });
    });
}

// Main execution
async function main() {
    try {
        console.log('🚀 Starting simple WebSocket test...');
        const result = await simpleWebSocketTest();
        console.log('✅ Test result:', result.message);
        console.log('\n🎉 Simple WebSocket test completed!');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('  1. Ensure server is running: node server.js');
        console.log('  2. Check if port 3001 is available');
        console.log('  3. Verify WebSocket endpoint is working');
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default simpleWebSocketTest;
