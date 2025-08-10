// Core Message Generation Logic for StanceStream
import 'dotenv/config';
import OpenAI from 'openai';
import redisManager from './redisManager.js';
import { getCachedResponse, cacheNewResponse } from './semanticCache.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Common utility to check message similarity
export function calculateSimilarity(message1, message2) {
    if (!message1 || !message2) return 0;
    
    const words1 = message1.toLowerCase().split(/\s+/);
    const words2 = message2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => 
        word.length > 3 && words2.includes(word)
    );
    
    return commonWords.length / Math.max(words1.length, words2.length);
}

// Enhanced prompt generation with randomization and context
export function generateEnhancedPrompt(profile, memoryContext, topic, turnNumber, additionalContext = {}) {
    const conversationalCues = [
        "Let me address this directly:",
        "I want to emphasize:",
        "My position is clear:",
        "Here's what I believe:",
        "From my perspective:",
        "Building on the discussion",
        "Taking a different perspective", 
        "Considering the broader implications",
        "From my experience",
        "Looking at this pragmatically",
    ];
    
    const randomSeed = Math.floor(Math.random() * 1000);
    const randomCue = conversationalCues[randomSeed % conversationalCues.length];
    const emotionalState = additionalContext.emotionalState || 'neutral';
    
    return `
You are ${profile.name}, a ${profile.tone} ${profile.role} currently feeling ${emotionalState}.
You believe in ${profile.biases.join(', ')}.
Debate topic: ${topic}
Turn: ${turnNumber}
Conversational style: ${randomCue}

${memoryContext ? `Previous context:\n${memoryContext}\n\n` : ''}

Instructions:
- Keep responses concise (1-2 sentences)
- Stay focused on ${topic}
- Maintain your character's unique perspective
- Add variety to your responses
- Consider your emotional state: ${emotionalState}
${additionalContext.allies?.length > 0 ? `- Consider building on arguments from potential allies: ${additionalContext.allies.join(', ')}` : ''}

Seed: ${randomSeed}
`;
}

// Core message generation with caching
export async function generateMessageCore({
    agentId,
    debateId,
    topic,
    profile,
    memoryContext,
    turnNumber,
    additionalContext = {},
    temperature = 0.8,
    maxTokens = 150
}) {
    try {
        const prompt = generateEnhancedPrompt(profile, memoryContext, topic, turnNumber, additionalContext);
        const agentSpecificTopic = `${agentId}:${topic}:${profile.name}`;
        
        // Check semantic cache
        const cachedResult = await getCachedResponse(prompt, agentSpecificTopic);
        
        if (cachedResult && cachedResult.similarity > 0.85) { // High similarity threshold
            console.log(`🎯 Using cached response (${(cachedResult.similarity * 100).toFixed(1)}% similarity)`);
            return {
                message: cachedResult.response,
                cacheHit: true,
                similarity: cachedResult.similarity,
                costSaved: 0.002 // Estimated cost per API call
            };
        }
        
        // Generate new response
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: `Continue the debate on "${topic}" considering the recent discussion.` }
            ],
            temperature,
            max_tokens: maxTokens
        });
        
        const message = completion.choices[0].message.content.trim();
        
        // Cache new response
        await cacheNewResponse(prompt, message, {
            agentId,
            debateId,
            topic: agentSpecificTopic,
            timestamp: new Date().toISOString()
        });
        
        return {
            message,
            cacheHit: false,
            similarity: 0,
            costSaved: 0
        };
        
    } catch (error) {
        console.error('❌ Error in generateMessageCore:', error);
        return {
            message: `I apologize, but I'm having trouble formulating a response right now. Let me gather my thoughts on ${topic}.`,
            cacheHit: false,
            similarity: 0,
            costSaved: 0
        };
    }
}

// Convert debate topic to stance key for profile lookup
export function topicToStanceKey(topic) {
    const topicMappings = {
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
        'space': 'space_policy'
    };
    
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
    
    // Default fallback
    console.log(`⚠️ Unknown topic "${topic}", defaulting to general_policy`);
    return 'general_policy';
}

// Determine emotional state from context
export function determineEmotionalState(profile, recentContext) {
    const contextLower = recentContext.toLowerCase();
    
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

// Find potential allies for coalition building
export async function findPotentialAllies(agentId, debateId, topic) {
    const client = await redisManager.getClient();
    
    try {
        const currentProfile = await client.json.get(`agent:${agentId}:profile`);
        const stanceKey = topicToStanceKey(topic);
        const currentStance = currentProfile.stance?.[stanceKey] || 0.5;
        
        const allAgents = ['senatorbot', 'reformerbot']; // Could be dynamic
        const allies = [];
        
        for (const otherId of allAgents) {
            if (otherId !== agentId) {
                const otherProfile = await client.json.get(`agent:${otherId}:profile`);
                const otherStance = otherProfile?.stance?.[stanceKey] || 0.5;
                
                if (Math.abs(currentStance - otherStance) < 0.3) {
                    allies.push(otherProfile.name);
                }
            }
        }
        
        return allies;
    } catch (error) {
        console.error('Error finding allies:', error);
        return [];
    }
}
