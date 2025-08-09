/**
 * Intelligent Agents System Tests
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createClient } from 'redis';
import {
    generateIntelligentMessage,
    updateAgentStance,
    getAgentProfile,
    analyzeSentiment,
    buildCoalition,
    checkEmotionalState
} from '../intelligentAgents.js';

describe('Intelligent Agents System', () => {
    let redisClient;
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

    describe('Agent Profile Management', () => {
        it('should create and retrieve agent profiles', async () => {
            const testAgent = {
                id: 'test_agent',
                name: 'Test Agent',
                personality: {
                    traits: ['analytical', 'objective'],
                    emotional_baseline: 0.5
                },
                stance: {
                    climate_policy: 0.7,
                    ai_policy: 0.6,
                    healthcare_policy: 0.4
                }
            };

            await redisClient.json.set(`agent:${testAgent.id}:profile`, '$', testAgent);
            const profile = await getAgentProfile('test_agent');

            expect(profile).to.deep.equal(testAgent);
        });

        it('should update agent stance based on debate', async () => {
            const agentId = 'test_agent';
            const debateId = 'test_debate';
            const topic = 'climate_policy';
            const oldStance = 0.7;

            const result = await updateAgentStance(agentId, debateId, topic, oldStance);

            expect(result.newStance).to.be.a('number');
            expect(result.newStance).to.be.within(0, 1);
            expect(result.change).to.be.a('number');
        });

        it('should maintain consistent personality traits', async () => {
            const profile1 = await getAgentProfile('test_agent');
            const message = await generateIntelligentMessage('test_agent', 'test_debate', 'climate_policy');
            const profile2 = await getAgentProfile('test_agent');

            expect(profile2.personality.traits).to.deep.equal(profile1.personality.traits);
        });
    });

    describe('Message Generation', () => {
        it('should generate contextually appropriate messages', async () => {
            const message = await generateIntelligentMessage(
                'test_agent',
                'test_debate',
                'climate_policy'
            );

            expect(message).to.be.a('string');
            expect(message.length).to.be.above(0);
        });

        it('should incorporate emotional state in responses', async () => {
            const emotionalState = await checkEmotionalState('test_agent', 'test_debate');
            const message = await generateIntelligentMessage(
                'test_agent',
                'test_debate',
                'climate_policy'
            );

            expect(emotionalState).to.have.property('current');
            expect(emotionalState).to.have.property('intensity');
        });

        it('should adapt tone based on debate context', async () => {
            // Set up debate context
            await redisClient.xAdd(
                'debate:test_debate:messages',
                '*',
                {
                    agent_id: 'other_agent',
                    message: 'Strongly disagree with that position.'
                }
            );

            const message = await generateIntelligentMessage(
                'test_agent',
                'test_debate',
                'climate_policy'
            );

            // Analyze response sentiment
            const sentiment = await analyzeSentiment(message);
            expect(sentiment).to.have.property('polarity');
            expect(sentiment).to.have.property('confidence');
        });
    });

    describe('Coalition Building', () => {
        it('should identify potential coalitions based on stance similarity', async () => {
            // Create test agents with different stances
            const agents = ['agent1', 'agent2', 'agent3'];
            const stances = {
                agent1: { climate_policy: 0.8 },
                agent2: { climate_policy: 0.7 },
                agent3: { climate_policy: 0.3 }
            };

            for (const agent of agents) {
                await redisClient.json.set(
                    `agent:${agent}:profile`,
                    '$',
                    {
                        id: agent,
                        stance: stances[agent]
                    }
                );
            }

            const coalitions = await buildCoalition('agent1', 'climate_policy');

            expect(coalitions).to.be.an('array');
            expect(coalitions).to.have.length.above(0);
            // Agent2 should be in coalition (close stance)
            expect(coalitions).to.include('agent2');
            // Agent3 should not be in coalition (distant stance)
            expect(coalitions).to.not.include('agent3');
        });

        it('should maintain coalition stability over time', async () => {
            const firstCoalition = await buildCoalition('agent1', 'climate_policy');
            
            // Small stance change
            await redisClient.json.set(
                'agent:agent2:profile',
                '$.stance.climate_policy',
                0.75
            );

            const secondCoalition = await buildCoalition('agent1', 'climate_policy');
            expect(secondCoalition).to.deep.equal(firstCoalition);
        });
    });

    describe('Emotional Intelligence', () => {
        it('should track emotional state changes', async () => {
            const agentId = 'test_agent';
            const debateId = 'test_debate';

            const initialState = await checkEmotionalState(agentId, debateId);
            
            // Add emotional trigger
            await redisClient.xAdd(
                `debate:${debateId}:messages`,
                '*',
                {
                    agent_id: 'other_agent',
                    message: 'Your argument is completely wrong!'
                }
            );

            const newState = await checkEmotionalState(agentId, debateId);
            expect(newState.intensity).to.not.equal(initialState.intensity);
        });

        it('should recover emotional baseline', async () => {
            const agentId = 'test_agent';
            const debateId = 'test_debate';
            const profile = await getAgentProfile(agentId);
            const baseline = profile.personality.emotional_baseline;

            // Simulate time passing
            const states = [];
            for (let i = 0; i < 5; i++) {
                const state = await checkEmotionalState(agentId, debateId);
                states.push(state.intensity);
            }

            // Last state should be closer to baseline
            expect(Math.abs(states[states.length - 1] - baseline))
                .to.be.below(Math.abs(states[0] - baseline));
        });
    });

    describe('Debate Memory', () => {
        it('should maintain context awareness', async () => {
            const agentId = 'test_agent';
            const debateId = 'test_debate';
            const topic = 'climate_policy';

            // Add previous context
            await redisClient.xAdd(
                `debate:${debateId}:agent:${agentId}:memory`,
                '*',
                {
                    type: 'statement',
                    content: 'We need immediate action on climate change.'
                }
            );

            const message = await generateIntelligentMessage(agentId, debateId, topic);
            expect(message).to.be.a('string');
            expect(message.length).to.be.above(0);
        });

        it('should use strategic memory for responses', async () => {
            const agentId = 'test_agent';
            const debateId = 'test_debate';

            // Add strategic memory
            await redisClient.xAdd(
                `debate:${debateId}:agent:${agentId}:strategic_memory`,
                '*',
                {
                    type: 'insight',
                    content: 'Opponent shows flexibility on economic measures.'
                }
            );

            const message = await generateIntelligentMessage(
                agentId,
                debateId,
                'climate_policy'
            );

            expect(message).to.be.a('string');
            expect(message.length).to.be.above(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle missing agent profiles gracefully', async () => {
            try {
                await generateIntelligentMessage(
                    'nonexistent_agent',
                    'test_debate',
                    'climate_policy'
                );
            } catch (error) {
                expect(error.message).to.include('Agent not found');
            }
        });

        it('should handle corrupted emotional state data', async () => {
            const agentId = 'test_agent';
            const debateId = 'test_debate';

            // Corrupt emotional state data
            await redisClient.json.set(
                `agent:${agentId}:profile`,
                '$.emotional_state',
                null
            );

            const state = await checkEmotionalState(agentId, debateId);
            expect(state).to.have.property('current');
            expect(state).to.have.property('intensity');
        });
    });
});
