// OpenAI API validation middleware
import { Configuration, OpenAIApi } from 'openai';
import healthMonitor from '../services/healthMonitor.js';

class OpenAIValidator {
    constructor() {
        this.lastValidation = null;
        this.validationCache = new Map();
        this.validationTTL = 5 * 60 * 1000; // 5 minutes
    }

    async validateApiKey(apiKey) {
        if (!apiKey) {
            throw new Error('OpenAI API key not provided');
        }

        // Check cache first
        const cachedValidation = this.validationCache.get(apiKey);
        if (cachedValidation && Date.now() - cachedValidation.timestamp < this.validationTTL) {
            return cachedValidation.isValid;
        }

        try {
            const configuration = new Configuration({ apiKey });
            const openai = new OpenAIApi(configuration);
            
            // Try a minimal API call to verify key
            await openai.createEmbedding({
                model: "text-embedding-ada-002",
                input: "test"
            });

            // Cache successful validation
            this.validationCache.set(apiKey, {
                isValid: true,
                timestamp: Date.now()
            });

            healthMonitor.status.openai = 'connected';
            return true;
        } catch (error) {
            // Cache failed validation
            this.validationCache.set(apiKey, {
                isValid: false,
                timestamp: Date.now(),
                error: error.message
            });

            healthMonitor.status.openai = 'error';
            throw new Error(`OpenAI API key validation failed: ${error.message}`);
        }
    }

    clearValidationCache() {
        this.validationCache.clear();
    }

    middleware() {
        return async (req, res, next) => {
            try {
                const apiKey = process.env.OPENAI_API_KEY;
                await this.validateApiKey(apiKey);
                next();
            } catch (error) {
                res.status(503).json({
                    error: 'OpenAI API service unavailable',
                    details: error.message
                });
            }
        };
    }
}

export default new OpenAIValidator();
