import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, query, param, validationResult } from 'express-validator';
import { createError } from './errorHandler.js';

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
 * Rate limiting configurations
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP',
    code: 'RATE_LIMIT_GENERAL',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

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
    .withMessage('Fact must be 10-1000 characters'),
  
  body('source')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .trim()
    .escape(),
  
  body('category')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .trim()
    .escape(),
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
