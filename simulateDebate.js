import 'dotenv/config';
import { createClient } from 'redis';
import { generateMessage } from './generateMessage.js';
import { findClosestFact } from './factChecker.js';

async function simulateDebate() {
    const client = createClient({ url: process.env.REDIS_URL });
    
    try {
        await client.connect();
        console.log('🔌 Connected to Redis');
        
        const debateId = `simulate_${Date.now()}`;
        const testTopic = 'Climate Policy'; // Explicit topic for simulation
        const agents = ['senatorbot', 'reformerbot'];

        console.log(`🎭 Starting debate simulation: ${testTopic}`);
        console.log(`📍 Debate ID: ${debateId}\n`);

        for (const agent of agents) {
            console.log(`🤖 Generating message for ${agent}...`);
            
            // Generate message (will use semantic cache if available)
            const message = await generateMessage(agent, debateId, testTopic);

            console.log(`🗣️ ${agent}: ${message}`);

            // Save to shared stream
            await client.xAdd(`debate:${debateId}:messages`, '*', {
                agent_id: agent,
                message,
                timestamp: new Date().toISOString()
            });

            // Save to agent memory
            await client.xAdd(`debate:${debateId}:agent:${agent}:memory`, '*', {
                type: 'statement',
                content: message,
                timestamp: new Date().toISOString()
            });

            // Fact check this message
            try {
                const result = await findClosestFact(message);
                if (result?.content) {
                    console.log(`🔍 Closest fact: "${result.content}"`);
                    console.log(`📊 Score: ${result.score}`);
                } else {
                    console.log(`⚠️ No relevant fact found.`);
                }
            } catch (factError) {
                console.log(`⚠️ Fact-checking error: ${factError.message}`);
            }
            
            console.log(''); // Empty line for readability
            
            // Small delay between agents
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Check cache metrics if available
        try {
            const { getCacheStats } = await import('./semanticCache.js');
            const cacheStats = await getCacheStats();
            if (cacheStats) {
                console.log('🎯 Cache Performance:');
                console.log(`   Hit Rate: ${cacheStats.hit_ratio.toFixed(1)}%`);
                console.log(`   Total Requests: ${cacheStats.total_requests}`);
                console.log(`   Cost Saved: $${cacheStats.estimated_cost_saved.toFixed(4)}`);
            }
        } catch (cacheError) {
            console.log('ℹ️ Cache metrics not available');
        }

        console.log('\n✅ Debate simulation completed successfully!');
        
    } catch (error) {
        console.error('❌ Simulation error:', error);
    } finally {
        await client.quit();
        console.log('🔌 Disconnected from Redis');
    }
}

// Run the simulation
simulateDebate();
