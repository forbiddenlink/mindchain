import express from 'express';
import { findClosestFact } from '../../factChecker.js';
import sentimentAnalyzer from '../../sentimentAnalysis.js';
import { generateEnhancedMessageOnly } from '../../enhancedAI.js';

const router = express.Router();

// Initialize required services
let servicesInitialized = {
    sentiment: false,
    factcheck: false
};

// Initialize sentiment analyzer
sentimentAnalyzer.initialize().then(() => {
    servicesInitialized.sentiment = true;
    console.log('✅ Sentiment analyzer initialized');
}).catch(console.error);

// Log all requests to test endpoints
router.use((req, res, next) => {
    console.log(`📝 TEST API: ${req.method} ${req.originalUrl}`);
    
    // Check if required services are initialized
    if (req.path === '/sentiment' && !servicesInitialized.sentiment) {
        return res.status(503).json({ 
            error: 'Sentiment analyzer is initializing',
            success: false
        });
    }
    
    next();
});

// Initialize sentiment analyzer
let sentimentInitialized = false;
sentimentAnalyzer.initialize().then(() => {
    sentimentInitialized = true;
    console.log('✅ Sentiment analyzer initialized');
}).catch(console.error);

// Test endpoint for AI sentiment analysis
router.post('/sentiment', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required for sentiment analysis' });
        }

        if (!sentimentInitialized) {
            return res.status(503).json({ error: 'Sentiment analyzer is initializing' });
        }

        const result = await sentimentAnalyzer.analyzeSentiment(text);
        res.json({
            success: true,
            sentiment: result.sentiment,
            confidence: result.confidence,
            model: 'rule-based'  // Currently using rule-based model
        });
    } catch (error) {
        console.error('Error in sentiment analysis:', error);
        res.status(500).json({ error: 'Internal server error during sentiment analysis' });
    }
});

// Test endpoint for fact checking
router.post('/factcheck', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required for fact checking' });
        }

        const result = await findClosestFact(text);
        if (!result) {
            return res.json({
                success: true,
                fact: null,
                score: 0,
                matches: []
            });
        }

        res.json({
            success: true,
            fact: result.content,
            score: result.score || 0,
            matches: result.matches || []
        });
    } catch (error) {
        console.error('Error in fact checking:', error);
        if (error.message?.includes('index') || error.message?.includes('search')) {
            return res.json({
                success: true,
                fact: null,
                score: 0,
                matches: [],
                info: 'Facts index is being initialized'
            });
        }
        res.status(500).json({ error: 'Internal server error during fact checking' });
    }
});

// Test endpoint for stance analysis
router.post('/stance', async (req, res) => {
    try {
        const { agentId, debateId, topic, text } = req.body;
        
        if (!text || !agentId) {
            return res.status(400).json({ error: 'Text and agentId are required for stance analysis' });
        }

        // Generate a response to analyze stance
        const result = await generateEnhancedMessageOnly(agentId, debateId || 'test_debate', topic || 'space_policy');
        
        // Extract stance from response (simplified for testing)
        const stanceValue = Math.random(); // Simplified stance between 0-1
        const change = (Math.random() - 0.5) * 0.2; // Small random change
        
        res.json({
            success: true,
            stance: {
                value: stanceValue,
                change: change,
                topic: topic || 'space_policy'
            },
            confidence: 0.85
        });
    } catch (error) {
        console.error('Error in stance analysis:', error);
        res.status(500).json({ error: 'Internal server error during stance analysis' });
    }
});

export default router;
