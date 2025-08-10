// OpenAI API Middleware
import openAIValidator from '../services/openAIValidator.js';

export const validateOpenAI = async (req, res, next) => {
    const validation = await openAIValidator.validateApiKey();
    
    if (!validation.valid) {
        return res.status(503).json({
            success: false,
            error: 'OpenAI service unavailable',
            message: validation.error,
            details: {
                type: 'openai_error',
                retryable: true
            },
            timestamp: new Date().toISOString()
        });
    }
    
    next();
};
