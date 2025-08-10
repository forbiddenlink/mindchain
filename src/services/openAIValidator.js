// OpenAI API Key Validator
export class OpenAIValidator {
    constructor() {
        this.validationCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Validate OpenAI API key
     * @returns {Promise<{valid: boolean, error?: string}>}
     */
    async validateApiKey() {
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            return { 
                valid: false, 
                error: 'OpenAI API key not found in environment variables' 
            };
        }

        // Check cache first
        const cachedResult = this.validationCache.get(apiKey);
        if (cachedResult && Date.now() - cachedResult.timestamp < this.cacheExpiry) {
            return cachedResult.result;
        }

        try {
            const result = await this.testApiKey(apiKey);
            
            // Cache the result
            this.validationCache.set(apiKey, {
                timestamp: Date.now(),
                result
            });

            return result;
        } catch (error) {
            const result = { 
                valid: false, 
                error: `API key validation failed: ${error.message}` 
            };
            
            // Cache the error result too
            this.validationCache.set(apiKey, {
                timestamp: Date.now(),
                result
            });

            return result;
        }
    }

    /**
     * Test API key by making a minimal API call
     * @returns {Promise<{valid: boolean, error?: string}>}
     */
    async testApiKey(apiKey) {
        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401 || response.status === 403) {
                return { 
                    valid: false, 
                    error: 'Invalid API key' 
                };
            }

            if (!response.ok) {
                return { 
                    valid: false, 
                    error: `API request failed: ${response.statusText}` 
                };
            }

            const data = await response.json();
            if (!data.data || !Array.isArray(data.data)) {
                return { 
                    valid: false, 
                    error: 'Unexpected API response format' 
                };
            }

            return { valid: true };
            
        } catch (error) {
            return { 
                valid: false, 
                error: `API request failed: ${error.message}` 
            };
        }
    }

    /**
     * Clear validation cache
     */
    clearCache() {
        this.validationCache.clear();
    }
}

// Export singleton instance
const openAIValidator = new OpenAIValidator();
export default openAIValidator;
