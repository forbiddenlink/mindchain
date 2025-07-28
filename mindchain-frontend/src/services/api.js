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

    async getDebateMessages(debateId, limit = 10) {
        return this.get(`/debate/${debateId}/messages?limit=${limit}`);
    }

    // Health check
    async getHealth() {
        return this.get('/health');
    }
}

export default new MindChainAPI();
