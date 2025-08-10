import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, query, param, validationResult } from 'express-validator';
import { createError } from './errorHandler.js';
import { promiseTimeout } from '../utils/helpers.js';

// WebSocket connection tracking
const wsConnections = new Map();

/**
 * WebSocket rate limiting and security
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} req - HTTP request object
 */
export const wsSecurityMiddleware = (ws, req) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  // Initialize or get connection tracking
  if (!wsConnections.has(ip)) {
    wsConnections.set(ip, {
      connections: 0,
      messageCount: 0,
      lastReset: Date.now()
    });
  }
  
  const stats = wsConnections.get(ip);
  stats.connections++;
  
  // Limit concurrent connections (max 3 per IP)
  if (stats.connections > 3) {
    ws.close(1008, 'Too many concurrent connections');
    return false;
  }
  
  // Message rate limiting
  const messageLimit = async () => {
    const now = Date.now();
    if (now - stats.lastReset > 60000) { // Reset counter every minute
      stats.messageCount = 0;
      stats.lastReset = now;
    }
    
    if (stats.messageCount > 50) { // 50 messages per minute
      ws.close(1008, 'Message rate limit exceeded');
      return false;
    }
    stats.messageCount++;
    return true;
  };
  
  // Attach rate limiter to WebSocket
  ws.checkMessageLimit = messageLimit;
  
  // Cleanup on close
  ws.on('close', () => {
    const stats = wsConnections.get(ip);
    if (stats) {
      stats.connections--;
      if (stats.connections <= 0) {
        wsConnections.delete(ip);
      }
    }
  });
  
  return true;
};

/**
 * Redis operation security wrapper
 * @param {Function} operation - Redis operation to execute
 * @param {number} timeout - Timeout in milliseconds
 */
export const secureRedisOperation = async (operation, timeout = 5000) => {
  try {
    return await promiseTimeout(operation(), timeout);
  } catch (error) {
    if (error.name === 'TimeoutError') {
      throw createError('Redis operation timeout', 'redis', 408);
    }
    throw error;
  }
};

/**
 * Security headers middleware using Helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false // Allow WebSocket connections
});

/**
 * Rate limiting configurations with Redis store
 */
export const createRateLimiter = (redisClient) => {
  const RedisStore = require('rate-limit-redis');
  
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    store: new RedisStore({
      // Use existing Redis connection
      client: redisClient,
      prefix: 'rl:general:',
      // Automatically handle Redis disconnections
      sendCommand: (...args) => {
        return secureRedisOperation(() => redisClient.sendCommand(args));
      }
    }),
    message: {
      success: false,
      error: 'Too many requests from this IP',
      code: 'RATE_LIMIT_GENERAL',
      retryAfter: 900 // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

export const apiRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Limit each IP to 50 API requests per 5 minutes
  message: {
    success: false,
    error: 'Too many API requests',
    code: 'RATE_LIMIT_API',
    retryAfter: 300
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Limit AI generation requests to prevent OpenAI quota abuse
  message: {
    success: false,
    error: 'Too many AI requests',
    code: 'RATE_LIMIT_AI',
    retryAfter: 600
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Input validation middleware
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = createError(
      'Invalid request data',
      'validation',
      400,
      errors.array()
    );
    return next(error);
  }
  next();
};

/**
 * Common validation rules
 */
export const debateValidation = [
  body('debateId')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Debate ID must be alphanumeric with underscores/hyphens'),
  
  body('topic')
    .optional()
    .isString()
    .isLength({ min: 3, max: 200 })
    .trim()
    .escape()
    .withMessage('Topic must be 3-200 characters'),
  
  body('agents')
    .optional()
    .isArray({ min: 1, max: 10 })
    .withMessage('Agents must be an array of 1-10 items'),
  
  body('agents.*')
    .isString()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Agent IDs must be alphanumeric'),
];

export const agentValidation = [
  param('id')
    .isString()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Agent ID must be alphanumeric'),
  
  body('name')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .trim()
    .escape(),
  
  body('role')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .trim()
    .escape(),
  
  body('tone')
    .optional()
    .isString()
    .isIn(['measured', 'passionate', 'analytical', 'aggressive', 'diplomatic'])
    .withMessage('Invalid tone value'),
];

export const factValidation = [
  body('fact')
    .isString()
    .isLength({ min: 10, max: 1000 })
    .trim()
    .customSanitizer(value => {
      // Remove potentially harmful markdown/HTML while preserving readability
      return value
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/\[.*?\]/g, '') // Remove markdown links
        .replace(/`.*?`/g, '') // Remove code blocks
        .trim();
    })
    .withMessage('Fact must be 10-1000 characters'),
  
  body('source')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .trim()
    .matches(/^[a-zA-Z0-9\s\-.,:']+$/)
    .withMessage('Source contains invalid characters')
    .escape(),
  
  body('category')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .trim()
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage('Category must be alphanumeric with hyphens/underscores')
    .escape(),
  
  body('embedding')
    .optional()
    .custom((value, { req }) => {
      if (!Array.isArray(value) || value.length !== 1536) { // OpenAI embedding dimension
        throw new Error('Invalid embedding format');
      }
      if (!value.every(n => typeof n === 'number' && !isNaN(n))) {
        throw new Error('Embedding must contain only numbers');
      }
      return true;
    })
];

export const queryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be 1-100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative'),
  
  query('points')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Points must be 1-50'),
];

/**
 * CORS configuration
 */
/**
 * WebSocket message validation
 */
export const validateWsMessage = (message) => {
  try {
    const data = JSON.parse(message);
    
    // Required fields
    if (!data.type || typeof data.type !== 'string') {
      return { valid: false, error: 'Invalid message type' };
    }
    
    // Message type-specific validation
    switch (data.type) {
      case 'new_message':
        if (!data.debateId || !data.message || !data.agentId) {
          return { valid: false, error: 'Missing required message fields' };
        }
        if (data.message.length > 2000) {
          return { valid: false, error: 'Message too long' };
        }
        break;
        
      case 'join_debate':
        if (!data.debateId) {
          return { valid: false, error: 'Missing debate ID' };
        }
        break;
        
      case 'cache_operation':
        if (!data.operation || !data.key) {
          return { valid: false, error: 'Invalid cache operation' };
        }
        break;
        
      default:
        return { valid: false, error: 'Unknown message type' };
    }
    
    return { valid: true, data };
  } catch (error) {
    return { valid: false, error: 'Invalid JSON' };
  }
};

export const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200 // Support legacy browsers
};

/**
 * Request logging middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};
