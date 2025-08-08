import { Router } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { apiRateLimit, agentValidation, queryValidation, validateRequest } from '../middleware/security.js';
import redisService from '../services/redis.js';

const router = Router();

/**
 * Get agent profile
 * GET /api/agent/:id/profile
 */
router.get('/:id/profile', 
  agentValidation, 
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const profile = await redisService.jsonGet(`agent:${id}:profile`);

      if (!profile) {
        throw createError('Agent not found', 'validation', 404, { agentId: id });
      }

      res.json({
        success: true,
        agent: profile,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      if (error.type) throw error;
      throw createError('Failed to fetch agent profile', 'redis', 503, { agentId: id });
    }
  })
);

/**
 * Update agent profile
 * POST /api/agent/:id/update
 */
router.post('/:id/update', 
  apiRateLimit,
  agentValidation, 
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
      // Get current profile
      const currentProfile = await redisService.jsonGet(`agent:${id}:profile`);
      if (!currentProfile) {
        throw createError('Agent not found', 'validation', 404, { agentId: id });
      }

      // Validate stance values if provided
      if (updates.stance) {
        for (const [key, value] of Object.entries(updates.stance)) {
          if (typeof value !== 'number' || value < 0 || value > 1) {
            throw createError(
              `Invalid stance value for ${key}: must be between 0 and 1`,
              'validation',
              400
            );
          }
        }
      }

      // Merge updates
      const updatedProfile = { ...currentProfile, ...updates };
      await redisService.jsonSet(`agent:${id}:profile`, '$', updatedProfile);

      res.json({
        success: true,
        agent: updatedProfile,
        message: 'Agent profile updated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      if (error.type) throw error;
      throw createError('Failed to update agent profile', 'redis', 503, { agentId: id });
    }
  })
);

/**
 * Get agent memory for a specific debate
 * GET /api/agent/:id/memory/:debateId
 */
router.get('/:id/memory/:debateId', 
  queryValidation, 
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id, debateId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    try {
      const memories = await redisService.streamRead(
        `debate:${debateId}:agent:${id}:memory`, 
        '+', 
        '-', 
        { COUNT: limit }
      );

      const formattedMemories = memories.reverse().map(entry => ({
        id: entry.id,
        type: entry.message.type,
        content: entry.message.content,
        timestamp: new Date(parseInt(entry.id.split('-')[0])).toISOString()
      }));

      res.json({
        success: true,
        agentId: id,
        debateId,
        memories: formattedMemories,
        count: formattedMemories.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      if (error.type) throw error;
      throw createError('Failed to fetch agent memory', 'redis', 503, { agentId: id, debateId });
    }
  })
);

/**
 * Get stance evolution data for agent in debate
 * GET /api/agent/:id/stance/:debateId/:topic
 */
router.get('/:id/stance/:debateId/:topic', 
  asyncHandler(async (req, res) => {
    const { id, debateId, topic } = req.params;
    const stanceKey = `debate:${debateId}:agent:${id}:stance:${topic}`;

    try {
      const stanceData = await redisService.timeSeriesRange(stanceKey, '-', '+');

      const formattedData = stanceData.map(([timestamp, value]) => ({
        timestamp: new Date(timestamp).toISOString(),
        value: parseFloat(value)
      }));

      res.json({
        success: true,
        agentId: id,
        debateId,
        topic,
        stanceEvolution: formattedData,
        count: formattedData.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      if (error.type) throw error;
      throw createError('Failed to fetch stance data', 'redis', 503, { agentId: id, debateId, topic });
    }
  })
);

/**
 * Generate intelligent message for agent
 * POST /api/agent/:agentId/intelligent-message
 */
router.post('/:agentId/intelligent-message', 
  apiRateLimit,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { agentId } = req.params;
    const { debateId, topic, conversationHistory = [] } = req.body;

    if (!debateId || !topic) {
      throw createError('debateId and topic are required', 'validation', 400);
    }

    try {
      // This would call the intelligent agents service
      // For now, return a placeholder response
      const response = {
        message: `Intelligent response from ${agentId} about ${topic}`,
        metadata: {
          emotionalState: 'analytical',
          confidence: 0.85,
          generatedAt: new Date().toISOString()
        }
      };

      res.json({
        success: true,
        agentId,
        response: response.message,
        metadata: response.metadata,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      if (error.type) throw error;
      throw createError('Failed to generate intelligent message', 'openai', 503, { agentId });
    }
  })
);

export default router;
