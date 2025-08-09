/**
 * Server Integration Tests
 */

import { expect } from 'chai';
import { createClient } from 'redis';
import WebSocket from 'ws';
import axios from 'axios';
import sinon from 'sinon';

const API_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

describe('StanceStream Server Integration', () => {
    let redisClient;
    let ws;
    let sandbox;

    before(async () => {
        redisClient = createClient({ url: process.env.REDIS_URL });
        await redisClient.connect();
        sandbox = sinon.createSandbox();
    });

    after(async () => {
        await redisClient.quit();
        sandbox.restore();
    });

    describe('API Endpoints', () => {
        describe('Debate Management', () => {
            it('should start a new debate', async () => {
                const response = await axios.post(`${API_URL}/api/debate/start`, {
                    topic: 'climate_policy',
                    agents: ['senatorbot', 'reformerbot']
                });

                expect(response.status).to.equal(200);
                expect(response.data).to.have.property('debateId');
                expect(response.data).to.have.property('success', true);
            });

            it('should prevent duplicate debate starts', async () => {
                const debateId = 'test_debate';
                
                // Start first debate
                await axios.post(`${API_URL}/api/debate/start`, {
                    debateId,
                    topic: 'climate_policy'
                });

                try {
                    // Try to start duplicate
                    await axios.post(`${API_URL}/api/debate/start`, {
                        debateId,
                        topic: 'climate_policy'
                    });
                    throw new Error('Should not allow duplicate debate');
                } catch (error) {
                    expect(error.response.status).to.equal(409);
                }
            });

            it('should stop a running debate', async () => {
                const response = await axios.post(`${API_URL}/api/debate/test_debate/stop`);
                expect(response.status).to.equal(200);
                expect(response.data.success).to.be.true;
            });
        });

        describe('Agent Profiles', () => {
            it('should retrieve agent profiles', async () => {
                const response = await axios.get(`${API_URL}/api/agent/senatorbot/profile`);
                expect(response.status).to.equal(200);
                expect(response.data).to.have.property('id', 'senatorbot');
            });

            it('should update agent profiles', async () => {
                const updates = {
                    stance: {
                        climate_policy: 0.8
                    }
                };

                const response = await axios.post(
                    `${API_URL}/api/agent/senatorbot/update`,
                    updates
                );

                expect(response.status).to.equal(200);
                expect(response.data.stance.climate_policy).to.equal(0.8);
            });
        });

        describe('Cache Management', () => {
            it('should return cache metrics', async () => {
                const response = await axios.get(`${API_URL}/api/cache/metrics`);
                expect(response.status).to.equal(200);
                expect(response.data).to.have.property('metrics');
                expect(response.data.metrics).to.have.property('hit_ratio');
            });
        });

        describe('Security', () => {
            it('should enforce rate limits', async () => {
                const promises = Array(300).fill(0).map(() => 
                    axios.get(`${API_URL}/api/health`)
                );

                try {
                    await Promise.all(promises);
                    throw new Error('Should have hit rate limit');
                } catch (error) {
                    expect(error.response.status).to.equal(429);
                }
            });

            it('should validate input', async () => {
                try {
                    await axios.post(`${API_URL}/api/debate/start`, {
                        topic: '<script>alert("xss")</script>'
                    });
                    throw new Error('Should reject invalid input');
                } catch (error) {
                    expect(error.response.status).to.equal(400);
                }
            });
        });
    });

    describe('WebSocket Integration', () => {
        beforeEach((done) => {
            ws = new WebSocket(WS_URL);
            ws.on('open', done);
        });

        afterEach(() => {
            ws.close();
        });

        it('should receive debate messages', (done) => {
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                if (message.type === 'new_message') {
                    expect(message).to.have.property('agentId');
                    expect(message).to.have.property('message');
                    done();
                }
            });

            // Start a debate to trigger messages
            axios.post(`${API_URL}/api/debate/start`, {
                topic: 'climate_policy',
                agents: ['senatorbot', 'reformerbot']
            });
        });

        it('should receive stance updates', (done) => {
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                if (message.type === 'debate:stance_update') {
                    expect(message).to.have.property('senatorbot');
                    expect(message).to.have.property('reformerbot');
                    done();
                }
            });
        });

        it('should handle multiple concurrent debates', async () => {
            const messages = [];

            ws.on('message', (data) => {
                const message = JSON.parse(data);
                if (message.type === 'new_message') {
                    messages.push(message);
                }
            });

            // Start multiple debates
            await axios.post(`${API_URL}/api/debates/start-multiple`, {
                topics: ['climate_policy', 'ai_policy']
            });

            // Wait for messages
            await new Promise(resolve => setTimeout(resolve, 2000));

            const debateIds = new Set(messages.map(m => m.debateId));
            expect(debateIds.size).to.be.above(1);
        });
    });

    describe('Redis Integration', () => {
        it('should store debate messages in streams', async () => {
            const debateId = 'test_stream';
            
            await axios.post(`${API_URL}/api/debate/start`, {
                debateId,
                topic: 'climate_policy'
            });

            // Wait for messages
            await new Promise(resolve => setTimeout(resolve, 1000));

            const messages = await redisClient.xRange(
                `debate:${debateId}:messages`,
                '-',
                '+'
            );

            expect(messages.length).to.be.above(0);
        });

        it('should track agent memory', async () => {
            const agentId = 'senatorbot';
            const debateId = 'test_memory';

            // Wait for agent interaction
            await new Promise(resolve => setTimeout(resolve, 1000));

            const memory = await redisClient.xRange(
                `debate:${debateId}:agent:${agentId}:memory`,
                '-',
                '+'
            );

            expect(memory.length).to.be.above(0);
        });

        it('should update stance timeseries', async () => {
            const agentId = 'senatorbot';
            const debateId = 'test_stance';
            const topic = 'climate_policy';

            // Wait for stance updates
            await new Promise(resolve => setTimeout(resolve, 1000));

            const stanceData = await redisClient.ts.range(
                `debate:${debateId}:agent:${agentId}:stance:${topic}`,
                '-',
                '+'
            );

            expect(stanceData.length).to.be.above(0);
        });
    });

    describe('Error Recovery', () => {
        it('should handle Redis disconnections', async () => {
            // Simulate Redis disconnect
            await redisClient.quit();

            try {
                await axios.get(`${API_URL}/api/health`);
            } catch (error) {
                expect(error.response.status).to.equal(503);
            }

            // Reconnect Redis
            await redisClient.connect();
            
            // Service should recover
            const response = await axios.get(`${API_URL}/api/health`);
            expect(response.status).to.equal(200);
        });

        it('should handle WebSocket disconnections', (done) => {
            ws.close();

            // Try to reconnect
            const newWs = new WebSocket(WS_URL);
            newWs.on('open', () => {
                expect(newWs.readyState).to.equal(WebSocket.OPEN);
                newWs.close();
                done();
            });
        });
    });

    describe('Performance', () => {
        it('should handle concurrent requests', async () => {
            const requests = Array(10).fill(0).map(() =>
                axios.get(`${API_URL}/api/health`)
            );

            const responses = await Promise.all(requests);
            responses.forEach(response => {
                expect(response.status).to.equal(200);
            });
        });

        it('should maintain WebSocket message order', async () => {
            const messages = [];
            
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                if (message.type === 'new_message') {
                    messages.push(message);
                }
            });

            // Start a debate
            await axios.post(`${API_URL}/api/debate/start`, {
                topic: 'climate_policy'
            });

            // Wait for messages
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Check message order
            messages.forEach((message, index) => {
                if (index > 0) {
                    const prevTimestamp = new Date(messages[index - 1].timestamp).getTime();
                    const currTimestamp = new Date(message.timestamp).getTime();
                    expect(currTimestamp).to.be.at.least(prevTimestamp);
                }
            });
        });
    });
});
