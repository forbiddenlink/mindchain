// Enhanced AI Features for StanceStream - Contest Improvements

import 'dotenv/config';
import { createClient } from 'redis';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🔍 Check message similarity to prevent repetition
function checkMessageSimilarity(newMessage, recentMessages) {
    if (!newMessage || !recentMessages.length) return 0;
    
    const newWords = newMessage.toLowerCase().split(/\s+/);
    let maxSimilarity = 0;
    
    for (const oldMessage of recentMessages) {
        const oldWords = oldMessage.toLowerCase().split(/\s+/);
        
        // Simple word overlap similarity
        const commonWords = newWords.filter(word => 
            word.length > 3 && oldWords.includes(word)
        );
        
        const similarity = commonWords.length / Math.max(newWords.length, oldWords.length);
        maxSimilarity = Math.max(maxSimilarity, similarity);
    }
    
    return maxSimilarity;
}

// 📊 Calculate similarity between two messages
function calculateSimilarity(message1, message2) {
    if (!message1 || !message2) return 0;
    
    const words1 = message1.toLowerCase().split(/\s+/);
    const words2 = message2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => 
        word.length > 3 && words2.includes(word)
    );
    
    return commonWords.length / Math.max(words1.length, words2.length);
}

// 🔄 Convert debate topic to stance key for profile lookup

    // 📊 Enhanced AI generation with emotional state and coalition building
export async function generateEnhancedMessage(agentId, debateId, topic = 'general policy') {
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();

    try {
        const profile = await client.json.get(`agent:${agentId}:profile`);
        
        // Convert topic to stance key
        const stanceKey = topicToStanceKey(topic);
        
        // Get conversation context from multiple agents (not just own memory)
        const debateMessages = await client.xRevRange(`debate:${debateId}:messages`, '+', '-', { COUNT: 10 });
        const recentContext = debateMessages
            .reverse()
            .map(entry => `${entry.message.agent_id}: ${entry.message.message}`)
            .join('\n');

        // Check recent messages from this agent to avoid repetition
        const recentAgentMessages = debateMessages
            .filter(entry => entry.message.agent_id === agentId)
            .slice(-3) // Last 3 messages from this agent
            .map(entry => entry.message.message);

        // Check for potential allies based on stance similarity
        const allies = await findPotentialAllies(client, agentId, debateId, stanceKey);
        
        // Generate contextually aware response
        const emotionalState = determineEmotionalState(profile, recentContext);
        
        const enhancedPrompt = `
You are ${profile.name}, a ${profile.tone} ${profile.role}.
Current emotional state: ${emotionalState}
Topic: ${topic}

Recent debate context:
${recentContext}

${allies.length > 0 ? `Potential allies who share similar views: ${allies.join(', ')}` : ''}

Your recent statements (DO NOT repeat these):
${recentAgentMessages.map((msg, i) => `- "${msg}"`).join('\n')}

Instructions:
- Reference specific points made by other participants
- Show character development based on the conversation
- Consider building on allies' arguments or respectfully countering opponents
- Keep responses engaging and authentic to your character
- Maintain focus on ${topic}
- IMPORTANT: Do not repeat your previous statements - bring new perspectives or arguments
- Add variety to your responses even when making similar points
`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: enhancedPrompt },
                { role: 'user', content: `Continue the debate on "${topic}" considering the recent discussion.` }
            ],
            temperature: 0.9, // Increased for more variety
            max_tokens: 150
        });

        let message = response.choices[0].message.content.trim();

        // Check for similarity with recent messages and regenerate if too similar
        if (recentAgentMessages.length > 0) {
            const similarity = checkMessageSimilarity(message, recentAgentMessages);
            if (similarity > 0.7) {
                console.log(`⚠️ ${agentId} generated similar message, regenerating...`);
                
                // Regenerate with higher temperature and explicit instructions
                const retryResponse = await openai.chat.completions.create({
                    model: 'gpt-4',
                    messages: [
                        { role: 'system', content: enhancedPrompt },
                        { role: 'user', content: `Create a completely different response about "${topic}". Your previous response was too similar to earlier statements. Approach this from a new angle or focus on different aspects.` }
                    ],
                    temperature: 1.0, // Maximum creativity
                    max_tokens: 150
                });
                
                message = retryResponse.choices[0].message.content.trim();
            }
        }

        // NOTE: Server handles all storage centrally, so we don't store here
        // The server calls generateEnhancedMessageOnly instead
        /*
        await client.xAdd(`debate:${debateId}:messages`, '*', {
            agent_id: agentId,
            message,
            emotional_state: emotionalState,
            references_made: extractReferences(message, recentContext) || ''
        });

        await client.xAdd(`debate:${debateId}:agent:${agentId}:memory`, '*', {
            type: 'enhanced_statement',
            content: message,
            context_size: debateMessages.length.toString(),
            emotional_state: emotionalState
        });
        */

        await client.quit();
        return message;

    } catch (error) {
        await client.quit();
        throw error;
    }
}

// Enhanced message generation without storing to streams (for server-controlled storage)
export async function generateEnhancedMessageOnly(agentId, debateId, topic = 'general policy') {
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();

    try {
        // Get agent profile and debate context
        const profile = await client.json.get(`agent:${agentId}:profile`);
        if (!profile) {
            throw new Error(`No profile found for agent: ${agentId}`);
        }

        // Get recent debate messages for context
        const debateMessages = await client.xRevRange(`debate:${debateId}:messages`, '+', '-', { COUNT: 5 });
        const recentContext = debateMessages.reverse().map(entry => 
            `${entry.message.agent_id}: ${entry.message.message}`
        ).join('\n');

        // Determine emotional state based on recent context
        const emotionalState = determineEmotionalState(profile, recentContext);

        // Enhanced prompt with emotional context
        const enhancedPrompt = `
You are ${profile.name}, a ${profile.tone} ${profile.role} currently feeling ${emotionalState}.
You believe in ${profile.biases.join(', ')}.
Debate topic: ${topic}.

Recent debate context:
${recentContext || 'This is the start of the debate.'}

Current emotional state: ${emotionalState}
Respond thoughtfully about ${topic}, incorporating your emotional state. Keep under 200 words.`;

        // Generate response
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: enhancedPrompt }],
            max_tokens: 300,
            temperature: 0.7 + (emotionalState === 'passionate' ? 0.2 : 0),
        });

        let message = completion.choices[0].message.content.trim();

        // Check for similarity to recent messages and regenerate if too similar
        if (debateMessages.length > 0) {
            const lastMessage = debateMessages[debateMessages.length - 1]?.message?.message || '';
            const similarity = calculateSimilarity(message, lastMessage);
            
            if (similarity > 0.7) {
                console.log(`🔄 Message too similar (${similarity.toFixed(2)}), regenerating...`);
                
                const retryResponse = await openai.chat.completions.create({
                    model: 'gpt-4',
                    messages: [
                        { role: 'user', content: enhancedPrompt },
                        { role: 'assistant', content: message },
                        { role: 'user', content: 'That response is too similar to recent messages. Please provide a completely different perspective or approach to the topic.' }
                    ],
                    temperature: 1.0,
                    max_tokens: 150
                });
                
                message = retryResponse.choices[0].message.content.trim();
            }
        }

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

// � Convert debate topic to stance key for profile lookup
function topicToStanceKey(topic) {
    const topicMappings = {
        // Frontend topic descriptions
        'environmental regulations and green energy': 'climate_policy',
        'climate policy': 'climate_policy',
        'climate change': 'climate_policy',
        
        'artificial intelligence governance and ethics': 'ai_policy',
        'ai regulation': 'ai_policy',
        
        'universal healthcare and medical access': 'healthcare_policy',
        'healthcare reform': 'healthcare_policy',
        'healthcare': 'healthcare_policy',
        
        'border security and refugee assistance': 'immigration_policy',
        'immigration policy': 'immigration_policy',
        'immigration': 'immigration_policy',
        
        'public education and student debt': 'education_policy',
        'education reform': 'education_policy',
        'education': 'education_policy',
        
        'progressive taxation and wealth redistribution': 'tax_policy',
        'tax policy': 'tax_policy',
        'taxation': 'tax_policy',
        
        'data protection and surveillance': 'privacy_policy',
        'digital privacy': 'privacy_policy',
        'privacy': 'privacy_policy',
        
        'space colonization and research funding': 'space_policy',
        'space exploration': 'space_policy',
        'space': 'space_policy',
        
        // Legacy mappings
        'foreign policy': 'foreign_policy',
        'defense': 'defense_policy'
    };
    
    // Convert to lowercase for matching
    const lowerTopic = topic.toLowerCase();
    
    // Direct match
    if (topicMappings[lowerTopic]) {
        return topicMappings[lowerTopic];
    }
    
    // Partial match for key words
    if (lowerTopic.includes('climate') || lowerTopic.includes('environment')) {
        return 'climate_policy';
    }
    if (lowerTopic.includes('healthcare') || lowerTopic.includes('medical')) {
        return 'healthcare_policy';
    }
    if (lowerTopic.includes('education') || lowerTopic.includes('school')) {
        return 'education_policy';
    }
    if (lowerTopic.includes('immigration') || lowerTopic.includes('border')) {
        return 'immigration_policy';
    }
    if (lowerTopic.includes('tax') || lowerTopic.includes('wealth')) {
        return 'tax_policy';
    }
    if (lowerTopic.includes('ai') || lowerTopic.includes('artificial')) {
        return 'ai_policy';
    }
    if (lowerTopic.includes('privacy') || lowerTopic.includes('data')) {
        return 'privacy_policy';
    }
    if (lowerTopic.includes('space')) {
        return 'space_policy';
    }
    
    // Default fallback to climate policy
    console.log(`⚠️ Unknown topic "${topic}", defaulting to climate_policy`);
    return 'climate_policy';
}

// �📊 Advanced stance evolution based on debate dynamics
export async function updateStanceBasedOnDebate(agentId, debateId, topic) {
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();
    
    try {
        const profile = await client.json.get(`agent:${agentId}:profile`);
        const stanceKey = topicToStanceKey(topic);
        const currentStance = profile.stance?.[stanceKey] || 0.5;
        
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
        
        // Calculate stance evolution with agent-specific behavior (increased for better visualization)
        let baseShift = 0;
        if (strongArgumentsFor > strongArgumentsAgainst) {
            baseShift = 0.15; // More noticeable movement toward positive
        } else if (strongArgumentsAgainst > strongArgumentsFor) {
            baseShift = -0.15; // More noticeable movement toward negative
        } else {
            // Even when no strong arguments, add some random variation for demo
            baseShift = (Math.random() - 0.5) * 0.1; // Random small change
        }
        
        // Add agent-specific personality modifiers for distinct patterns
        let agentModifier = 1.0;
        if (agentId === 'senatorbot') {
            // SenatorBot tends to be more conservative, changes less drastically
            agentModifier = 0.7 + (Math.sin(Date.now() / 10000) * 0.3); // Subtle wave pattern
        } else if (agentId === 'reformerbot') {
            // ReformerBot is more dynamic, changes more dramatically
            agentModifier = 1.3 + (Math.cos(Date.now() / 8000) * 0.4); // Different wave pattern
        }
        
        stanceShift = baseShift * agentModifier;
        
        // Apply personality resistance (some agents change less)
        const personalityFactor = profile.tone === 'stubborn' ? 0.5 : 1.0;
        stanceShift *= personalityFactor;
        
        const newStance = Math.max(0, Math.min(1, currentStance + stanceShift));
        
        // Update profile
        profile.stance[stanceKey] = newStance;
        await client.json.set(`agent:${agentId}:profile`, '$', profile);
        
        // Store in TimeSeries
        const tsKey = `debate:${debateId}:agent:${agentId}:stance:${stanceKey}`;
        try {
            await client.ts.add(tsKey, '*', parseFloat(newStance).toString());
        } catch (tsError) {
            console.log(`⚠️ TimeSeries add failed: ${tsError.message}`);
        }
        
        await client.quit();
        return { oldStance: currentStance, newStance, shift: stanceShift };
        
    } catch (error) {
        await client.quit();
        throw error;
    }
}
