// Enhanced AI Features for MindChain - Contest Improvements

import 'dotenv/config';
import { createClient } from 'redis';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🧠 Enhanced AI generation with emotional state and coalition building
export async function generateEnhancedMessage(agentId, debateId, topic = 'general policy') {
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();

    try {
        const profile = await client.json.get(`agent:${agentId}:profile`);
        
        // Get conversation context from multiple agents (not just own memory)
        const debateMessages = await client.xRevRange(`debate:${debateId}:messages`, '+', '-', { COUNT: 5 });
        const recentContext = debateMessages
            .reverse()
            .map(entry => `${entry.message.agent_id}: ${entry.message.message}`)
            .join('\n');

        // Check for potential allies based on stance similarity
        const allies = await findPotentialAllies(client, agentId, debateId, topic);
        
        // Generate contextually aware response
        const emotionalState = determineEmotionalState(profile, recentContext);
        
        const enhancedPrompt = `
You are ${profile.name}, a ${profile.tone} ${profile.role}.
Current emotional state: ${emotionalState}
Topic: ${topic}

Recent debate context:
${recentContext}

${allies.length > 0 ? `Potential allies who share similar views: ${allies.join(', ')}` : ''}

Instructions:
- Reference specific points made by other participants
- Show character development based on the conversation
- Consider building on allies' arguments or respectfully countering opponents
- Keep responses engaging and authentic to your character
- Maintain focus on ${topic}
`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: enhancedPrompt },
                { role: 'user', content: `Continue the debate on "${topic}" considering the recent discussion.` }
            ],
            temperature: 0.8, // Add more personality variation
            max_tokens: 150
        });

        const message = response.choices[0].message.content.trim();

        // Store enhanced metadata
        await client.xAdd(`debate:${debateId}:messages`, '*', {
            agent_id: agentId,
            message,
            emotional_state: emotionalState,
            references_made: extractReferences(message, recentContext)
        });

        await client.xAdd(`debate:${debateId}:agent:${agentId}:memory`, '*', {
            type: 'enhanced_statement',
            content: message,
            context_size: debateMessages.length,
            emotional_state: emotionalState
        });

        await client.quit();
        return message;

    } catch (error) {
        await client.quit();
        throw error;
    }
}

// 🤝 Find agents with similar stances for coalition building
async function findPotentialAllies(client, agentId, debateId, topic) {
    try {
        const currentProfile = await client.json.get(`agent:${agentId}:profile`);
        const currentStance = currentProfile.stance?.[topic] || 0.5;
        
        // Check other agents' stances
        const allAgents = ['senatorbot', 'reformerbot']; // Could be dynamic
        const allies = [];
        
        for (const otherId of allAgents) {
            if (otherId !== agentId) {
                const otherProfile = await client.json.get(`agent:${otherId}:profile`);
                const otherStance = otherProfile?.stance?.[topic] || 0.5;
                
                // Consider allies if stances are within 0.3 range
                if (Math.abs(currentStance - otherStance) < 0.3) {
                    allies.push(otherProfile.name);
                }
            }
        }
        
        return allies;
    } catch (error) {
        return [];
    }
}

// 😊 Determine emotional state based on profile and context
function determineEmotionalState(profile, recentContext) {
    const contextLower = recentContext.toLowerCase();
    
    // Analyze context for emotional triggers
    const frustrationWords = ['wrong', 'ridiculous', 'impossible', 'failed'];
    const agreementWords = ['excellent', 'agree', 'correct', 'right'];
    const challengingWords = ['however', 'but', 'disagree', 'unfortunately'];
    
    let state = 'neutral';
    
    if (frustrationWords.some(word => contextLower.includes(word))) {
        state = profile.tone === 'aggressive' ? 'frustrated' : 'concerned';
    } else if (agreementWords.some(word => contextLower.includes(word))) {
        state = 'encouraged';
    } else if (challengingWords.some(word => contextLower.includes(word))) {
        state = 'analytical';
    }
    
    return state;
}

// 🔗 Extract what the agent is referencing from previous messages
function extractReferences(message, recentContext) {
    const references = [];
    const contextLines = recentContext.split('\n');
    
    // Simple reference detection (could be enhanced with NLP)
    for (const line of contextLines) {
        if (line.includes('senatorbot:') || line.includes('reformerbot:')) {
            const agentName = line.split(':')[0];
            if (message.toLowerCase().includes(agentName.toLowerCase())) {
                references.push(agentName);
            }
        }
    }
    
    return references.join(', ');
}

// 📊 Advanced stance evolution based on debate dynamics
export async function updateStanceBasedOnDebate(agentId, debateId, topic) {
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();
    
    try {
        const profile = await client.json.get(`agent:${agentId}:profile`);
        const currentStance = profile.stance?.[topic] || 0.5;
        
        // Analyze recent debate messages for influence
        const recentMessages = await client.xRevRange(`debate:${debateId}:messages`, '+', '-', { COUNT: 10 });
        
        let stanceShift = 0;
        let strongArgumentsAgainst = 0;
        let strongArgumentsFor = 0;
        
        for (const entry of recentMessages) {
            if (entry.message.agent_id !== agentId) {
                // Analyze other agents' arguments
                const message = entry.message.message.toLowerCase();
                
                // Simple sentiment analysis for argument strength
                const strongIndicators = ['evidence', 'data', 'research', 'study', 'proven'];
                const isStrong = strongIndicators.some(word => message.includes(word));
                
                if (isStrong) {
                    // Determine if argument supports or opposes current stance
                    if (message.includes('benefit') || message.includes('improve')) {
                        strongArgumentsFor++;
                    } else if (message.includes('harmful') || message.includes('dangerous')) {
                        strongArgumentsAgainst++;
                    }
                }
            }
        }
        
        // Calculate stance evolution
        if (strongArgumentsFor > strongArgumentsAgainst) {
            stanceShift = 0.05; // Slight movement toward more positive
        } else if (strongArgumentsAgainst > strongArgumentsFor) {
            stanceShift = -0.05; // Slight movement toward more negative
        }
        
        // Apply personality resistance (some agents change less)
        const personalityFactor = profile.tone === 'stubborn' ? 0.5 : 1.0;
        stanceShift *= personalityFactor;
        
        const newStance = Math.max(0, Math.min(1, currentStance + stanceShift));
        
        // Update profile
        profile.stance[topic] = newStance;
        await client.json.set(`agent:${agentId}:profile`, '$', profile);
        
        // Store in TimeSeries
        const stanceKey = `debate:${debateId}:agent:${agentId}:stance:${topic}`;
        await client.ts.add(stanceKey, '*', newStance);
        
        await client.quit();
        return { oldStance: currentStance, newStance, shift: stanceShift };
        
    } catch (error) {
        await client.quit();
        throw error;
    }
}
