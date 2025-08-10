// demoCache.js - Semantic Cache Demonstration Module
import { getCacheStats, getCachedResponse, cacheNewResponse } from './semanticCache.js';

// Demo prompts that should trigger cache hits
const demoPhrases = [
    "What are your thoughts on climate change policy?",
    "How do you view environmental regulations?",
    "What's your stance on climate change?",
    "Tell me about your position on environmental policy",
    "Share your perspective on climate change",
    // Varied phrasing for same concept
    "What do you think about carbon emissions?",
    "Your opinion on global warming?",
    "Views on environmental protection?",
    "Thoughts on climate policy?",
    "Position on climate action?"
];

// Example agent responses for demo
const demoResponses = [
    "Climate change is a critical issue requiring immediate action. We must implement strong environmental regulations while ensuring economic stability.",
    "Environmental protection and economic growth can coexist. We need smart policies that address climate challenges without overburdening businesses.",
    "Climate change demands a balanced approach. We should embrace innovation and market-driven solutions while maintaining environmental standards.",
];

/**
 * Run a cache efficiency demonstration
 * @returns {Promise<{totalOperations: number, cacheHits: number, cacheMisses: number, hitRatio: number, costSaved: number, duration: number}>}
 */
export async function runCacheDemo() {
    console.log('🚀 Starting cache efficiency demo...');
    const startTime = Date.now();
    
    const metrics = {
        totalOperations: 0,
        cacheHits: 0,
        cacheMisses: 0,
        hitRatio: 0,
        costSaved: 0
    };

    try {
        // First pass: Store initial cache entries
        console.log('📝 Storing initial cache entries...');
        for (let i = 0; i < 3; i++) {
            const prompt = demoPhrases[i];
            const response = demoResponses[i];
            
            // Store in cache
            await cacheNewResponse(prompt, response, { demo: true });
            metrics.totalOperations++;
            metrics.cacheMisses++;
        }
        
        // Second pass: Check for cache hits with similar phrases
        console.log('🔍 Testing cache efficiency with similar phrases...');
        for (const prompt of demoPhrases) {
            metrics.totalOperations++;
            
            // Check cache with similarity threshold
            const cacheResult = await getCachedResponse(prompt);
            
            if (cacheResult) {
                console.log(`✅ Cache hit for: "${prompt}" (${(cacheResult.similarity * 100).toFixed(1)}% similar)`);
                metrics.cacheHits++;
                metrics.costSaved += 0.0004; // Approximate cost per GPT response saved
            } else {
                console.log(`❌ Cache miss for: "${prompt}"`);
                metrics.cacheMisses++;
                
                // In real operation we'd generate a new response here
                // For demo, just use a sample response
                const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
                await cacheNewResponse(prompt, randomResponse, { demo: true });
            }
        }
        
        // Calculate final metrics
        metrics.hitRatio = (metrics.cacheHits / metrics.totalOperations) * 100;
        metrics.duration = Date.now() - startTime;
        
        console.log('✨ Demo completed!', {
            operations: metrics.totalOperations,
            hits: metrics.cacheHits,
            ratio: `${metrics.hitRatio.toFixed(1)}%`,
            saved: `$${metrics.costSaved.toFixed(4)}`,
            time: `${metrics.duration}ms`
        });

        return metrics;
        
    } catch (error) {
        console.error('❌ Cache demo error:', error);
        throw error;
    }
}
