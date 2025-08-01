import 'dotenv/config';
import sentimentAnalyzer from './sentimentAnalysis.js';

async function testSentimentWithRedis() {
    console.log('🧪 Testing sentiment analyzer with Redis connection...');
    
    // Force re-initialization
    console.log('🔄 Re-initializing sentiment analyzer...');
    const initResult = await sentimentAnalyzer.initialize();
    console.log('Init result:', initResult);
    
    // Test sentiment analysis
    console.log('\n🧠 Testing sentiment analysis...');
    const result = await sentimentAnalyzer.analyzeSentiment(
        'This is an excellent proposal that I strongly support!', 
        'test-sentiment-debate', 
        'senatorbot'
    );
    console.log('Sentiment result:', result);
    
    // Test getting history
    console.log('\n📈 Testing history retrieval...');
    const history = await sentimentAnalyzer.getConfidenceHistory('test-sentiment-debate', 'senatorbot', 10);
    console.log('History:', history);
    
    await sentimentAnalyzer.cleanup();
}

testSentimentWithRedis().catch(console.error);
