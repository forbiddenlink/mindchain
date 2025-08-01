// Enhanced Semantic Cache with Topic-Aware Similarity
// Contest Enhancement: Better cache diversity for different topics

import { SemanticCache } from './semanticCache.js';

class EnhancedSemanticCache extends SemanticCache {
    constructor() {
        super();
        // More sophisticated similarity thresholds based on context
        this.topicSimilarityConfig = {
            'healthcare': { threshold: 0.90, weight: 1.2 },
            'climate_policy': { threshold: 0.88, weight: 1.1 },
            'ai_policy': { threshold: 0.92, weight: 1.3 },
            'economic_policy': { threshold: 0.89, weight: 1.1 },
            'default': { threshold: 0.87, weight: 1.0 }
        };
    }

    // Enhanced similarity calculation with topic weighting
    async findSimilarCachedResponse(prompt, topic = 'general', agentId = 'unknown') {
        try {
            await this.connect();
            
            const topicKey = this.normalizeTopicKey(topic);
            const config = this.topicSimilarityConfig[topicKey] || this.topicSimilarityConfig.default;
            
            // Include agent personality in prompt context for better matching
            const contextualPrompt = `Agent: ${agentId}, Topic: ${topic}, Prompt: ${prompt}`;
            console.log('🔍 Checking semantic cache for similar prompts...');
            
            const queryEmbedding = await this.generateEmbedding(contextualPrompt);
            const queryVector = Buffer.from(new Float32Array(queryEmbedding).buffer);

            // Search with topic-specific threshold
            const results = await this.client.ft.search('cache-index', 
                `*=>[KNN 5 @vector $query_vector]`, {
                PARAMS: { query_vector: queryVector },
                RETURN: ['content', 'response', 'topic', 'original_prompt', 'created_at'],
                LIMIT: { from: 0, size: 5 }
            });

            if (results.documents && results.documents.length > 0) {
                for (const doc of results.documents) {
                    const similarity = parseFloat(doc.value['$score'] || 0);
                    const cachedTopic = doc.value.topic || 'general';
                    
                    // Apply topic-specific threshold and cross-topic penalty
                    let adjustedThreshold = config.threshold;
                    if (this.normalizeTopicKey(cachedTopic) !== topicKey) {
                        adjustedThreshold += 0.05; // Higher bar for cross-topic matches
                    }
                    
                    if (similarity >= adjustedThreshold) {
                        console.log(`🎯 Cache HIT! Similarity: ${(similarity * 100).toFixed(1)}% (Topic: ${cachedTopic})`);
                        
                        await this.updateMetrics(true, similarity);
                        return {
                            response: doc.value.response,
                            similarity: similarity,
                            topic: cachedTopic,
                            cached_at: doc.value.created_at
                        };
                    }
                }
            }

            console.log(`❌ Cache MISS - No similar prompts found above ${(config.threshold * 100).toFixed(1)}% threshold for topic: ${topic}`);
            await this.updateMetrics(false, 0);
            return null;

        } catch (error) {
            console.error('Error searching enhanced cache:', error);
            await this.updateMetrics(false, 0);
            return null;
        }
    }

    // Normalize topic keys for consistent matching
    normalizeTopicKey(topic) {
        const topicMap = {
            'healthcare': 'healthcare',
            'health': 'healthcare', 
            'medical': 'healthcare',
            'climate': 'climate_policy',
            'environment': 'climate_policy',
            'environmental': 'climate_policy',
            'ai': 'ai_policy',
            'artificial intelligence': 'ai_policy',
            'technology': 'ai_policy',
            'economy': 'economic_policy',
            'economic': 'economic_policy',
            'finance': 'economic_policy'
        };
        
        const normalizedTopic = topic.toLowerCase().trim();
        return topicMap[normalizedTopic] || 'default';
    }

    // Enhanced cache metrics with topic breakdown
    async getDetailedMetrics() {
        try {
            await this.connect();
            const metrics = await this.client.json.get(this.metricsKey);
            
            if (!metrics) return null;
            
            // Add topic-specific performance metrics
            const topicMetrics = await this.getTopicMetrics();
            
            return {
                ...metrics,
                topic_performance: topicMetrics,
                cache_efficiency_rating: this.calculateEfficiencyRating(metrics),
                recommendation: this.generateOptimizationRecommendation(metrics)
            };
        } catch (error) {
            console.error('Error getting detailed metrics:', error);
            return null;
        }
    }

    // Calculate cache efficiency rating for contest presentation
    calculateEfficiencyRating(metrics) {
        const hitRate = metrics.hit_ratio || 0;
        if (hitRate >= 95) return "Exceptional";
        if (hitRate >= 85) return "Excellent"; 
        if (hitRate >= 70) return "Good";
        if (hitRate >= 50) return "Acceptable";
        return "Needs Optimization";
    }

    // Generate optimization recommendations for enterprise value
    generateOptimizationRecommendation(metrics) {
        const hitRate = metrics.hit_ratio || 0;
        const avgSimilarity = metrics.average_similarity || 0;
        
        if (hitRate > 95 && avgSimilarity > 0.90) {
            return "Cache performing exceptionally. Consider expanding to more topics.";
        } else if (hitRate > 85) {
            return "Excellent performance. Monitor for topic diversity.";
        } else if (hitRate > 70) {
            return "Good performance. Consider lowering similarity threshold.";
        } else {
            return "Optimize similarity threshold and topic matching algorithms.";
        }
    }
}

export { EnhancedSemanticCache };
