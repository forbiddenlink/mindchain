// testSentiment.js - Test the RedisAI sentiment analysis
import sentimentAnalyzer from './sentimentAnalysis.js';

async function testSentimentAnalysis() {
    console.log('🧠 Testing RedisAI Sentiment Analysis...');
    
    // Initialize the analyzer
    const initialized = await sentimentAnalyzer.initialize();
    if (!initialized) {
        console.error('❌ Failed to initialize sentiment analyzer');
        return;
    }

    // Test messages with different sentiments
    const testMessages = [
        {
            text: "I strongly support this excellent policy initiative. It's fantastic and will bring great benefits to our community.",
            expected: "positive"
        },
        {
            text: "This is a terrible idea that will cause major problems. I completely disagree with this awful proposal.",
            expected: "negative"
        },
        {
            text: "The weather is quite nice today. I had lunch at the restaurant.",
            expected: "neutral"
        },
        {
            text: "This policy has both advantages and disadvantages that we should consider carefully.",
            expected: "neutral"
        },
        {
            text: "We're making wonderful progress on this amazing initiative. The results have been truly successful!",
            expected: "positive"
        }
    ];

    console.log('\n📊 Testing sentiment analysis on sample messages...\n');

    for (let i = 0; i < testMessages.length; i++) {
        const { text, expected } = testMessages[i];
        
        try {
            const result = await sentimentAnalyzer.analyzeSentiment(
                text, 
                'test_debate_123', 
                'test_agent'
            );

            const isCorrect = result.sentiment === expected;
            const status = isCorrect ? '✅' : '⚠️';
            
            console.log(`${status} Test ${i + 1}:`);
            console.log(`   Message: "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`);
            console.log(`   Expected: ${expected}`);
            console.log(`   Result: ${result.sentiment} (${result.confidence} confidence)`);
            console.log(`   Model: ${result.model}`);
            console.log('');
            
        } catch (error) {
            console.error(`❌ Test ${i + 1} failed:`, error.message);
        }
    }

    // Test confidence history
    console.log('📈 Testing confidence history retrieval...');
    try {
        const history = await sentimentAnalyzer.getConfidenceHistory('test_debate_123', 'test_agent');
        console.log(`✅ Retrieved ${history.length} confidence history points`);
        if (history.length > 0) {
            console.log('   Sample history:', history.slice(-3));
        }
    } catch (error) {
        console.error('❌ Failed to retrieve confidence history:', error.message);
    }

    // Cleanup
    await sentimentAnalyzer.cleanup();
    console.log('\n🧠 Sentiment analysis test completed!');
}

// Run the test
testSentimentAnalysis().catch(console.error);
