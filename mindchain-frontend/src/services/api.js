const API_BASE_URL = window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:3001/api'
    : 'http://localhost:3001/api';

class MindChainAPI {
    async get(endpoint) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    }

    async post(endpoint, data) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    }

    // Agent methods
    async getAgentProfile(agentId) {
        return this.get(`/agent/${agentId}/profile`);
    }

    async updateAgentProfile(agentId, updates) {
        return this.post(`/agent/${agentId}/update`, updates);
    }

    async getAgentMemory(agentId, debateId, limit = 5) {
        return this.get(`/agent/${agentId}/memory/${debateId}?limit=${limit}`);
    }

    async getAgentStance(agentId, debateId, topic) {
        return this.get(`/agent/${agentId}/stance/${debateId}/${topic}`);
    }

    // Debate methods
    async startDebate(config = {}) {
        return this.post('/debate/start', config);
    }

    async stopDebate(debateId) {
        return this.post(`/debate/${debateId}/stop`, {});
    }

    async getDebateMessages(debateId, limit = 10) {
        return this.get(`/debate/${debateId}/messages?limit=${limit}`);
    }

    // Health check
    async getHealth() {
        return this.get('/health');
    }

    // Redis performance stats
    async getRedisStats() {
        return this.get('/stats/redis');
    }

    // 🏆 Contest Analytics
    async getContestAnalytics() {
        return this.get('/contest/analytics');
    }

    // Add fact to knowledge base
    async addFact(fact, source = 'user', category = 'general') {
        return this.post('/facts/add', { fact, source, category });
    }

    // Generate debate summary
    async generateSummary(debateId, maxMessages = 20) {
        return this.post(`/debate/${debateId}/summarize`, { maxMessages });
    }

    // 🆕 MULTI-DEBATE API METHODS

    // Get all active debates
    async getActiveDebates() {
        return this.get('/debates/active');
    }

    // Start multiple debates simultaneously
    async startMultipleDebates(topics, agents = ['senatorbot', 'reformerbot']) {
        return this.post('/debates/start-multiple', { topics, agents });
    }

    // Get enhanced metrics for performance dashboard
    async getEnhancedMetrics() {
        return this.get('/metrics/enhanced');
    }

    // Get semantic cache metrics with business value analysis
    async getCacheMetrics() {
        return this.get('/cache/metrics');
    }

    // Get business intelligence summary and ROI analysis
    async getBusinessSummary() {
        return this.get('/business/summary');
    }

    // 🔍 KEY MOMENTS API METHODS

    // Get key moments for a specific debate
    async getKeyMoments(debateId, limit = 10) {
        return this.get(`/debate/${debateId}/key-moments?limit=${limit}`);
    }

    // Get all key moments across debates
    async getAllKeyMoments(limit = 20) {
        return this.get(`/key-moments/all?limit=${limit}`);
    }

    // Manually trigger key moment detection (for testing)
    async triggerKeyMoment(data) {
        return this.post('/debug/key-moment', data);
    }
}

export default new MindChainAPI();
