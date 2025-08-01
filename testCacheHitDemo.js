// Test Cache Hit Demo - Showcase MindChain's Semantic Caching Business Value
// Run this to see the enhanced LivePerformanceOverlay in action

async function testCacheHitDemo() {
    const baseUrl = 'http://localhost:3000';
    
    console.log('🎯 Testing MindChain Cache Hit Celebrations...\n');
    
    // Test scenarios with different similarity scores and cost savings
    const scenarios = [
        { similarity: 0.95, cost_saved: 0.003, desc: 'High similarity match' },
        { similarity: 0.87, cost_saved: 0.002, desc: 'Good similarity match' },
        { similarity: 0.92, cost_saved: 0.0025, desc: 'Excellent similarity match' },
        { similarity: 0.89, cost_saved: 0.0018, desc: 'Strong similarity match' },
        { similarity: 0.96, cost_saved: 0.0035, desc: 'Near-perfect match' }
    ];
    
    console.log('🚀 Starting cache hit demo sequence...\n');
    
    for (let i = 0; i < scenarios.length; i++) {
        const scenario = scenarios[i];
        
        try {
            console.log(`📊 Scenario ${i + 1}: ${scenario.desc}`);
            console.log(`   Similarity: ${(scenario.similarity * 100).toFixed(1)}%`);
            console.log(`   Cost Saved: $${scenario.cost_saved.toFixed(3)}`);
            
            const response = await fetch(`${baseUrl}/api/demo/cache-hit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    similarity: scenario.similarity,
                    cost_saved: scenario.cost_saved
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log(`   ✅ Cache hit celebration triggered!`);
                console.log(`   🎯 Business Value: ${result.data.percentage} match, $${result.data.cost_saved.toFixed(3)} saved\n`);
            } else {
                console.log(`   ❌ Failed: ${result.message}\n`);
            }
            
            // Wait 4 seconds between demonstrations to show the celebrations
            await new Promise(resolve => setTimeout(resolve, 4000));
            
        } catch (error) {
            console.error(`   ❌ Error in scenario ${i + 1}:`, error.message);
        }
    }
    
    console.log('🎯 Demo complete! Check your LivePerformanceOverlay for the celebrations.');
    console.log('💰 Business Value Summary:');
    console.log('   • Real-time cache hit celebrations');
    console.log('   • Live similarity score tracking');
    console.log('   • Running cost savings counter');
    console.log('   • Traditional AI vs MindChain comparison');
    console.log('   • Enterprise projection displays');
    console.log('   • Mission control dashboard aesthetics');
}

// Run the demo
if (import.meta.main) {
    testCacheHitDemo().catch(console.error);
}

export { testCacheHitDemo };
