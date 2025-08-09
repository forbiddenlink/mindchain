/**
 * Enhanced Error Handler Middleware
 * ADDITIVE: Enhances existing error handling without replacing it
 */

import { RedisError } from 'redis';
import { WebSocketError } from 'ws';

// Error types mapping for better error responses
const ERROR_TYPES = {
    ValidationError: 400,
    AuthenticationError: 401,
    AuthorizationError: 403,
    NotFoundError: 404,
    ConflictError: 409,
    RateLimitError: 429,
    RedisError: 503,
    WebSocketError: 503,
    ServerError: 500
};

// Custom error classes
export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class AuthorizationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthorizationError';
    }
}

export class RateLimitError extends Error {
    constructor(message) {
        super(message);
        this.name = 'RateLimitError';
    }
}

// Enhanced error handler - works alongside existing error handling
export const enhancedErrorHandler = (err, req, res, next) => {
    // Log error with request context
    console.error('🔴 Enhanced Error Handler:', {
        error: err.message,
        type: err.name,
        path: req.path,
        method: req.method,
        query: req.query,
        body: req.body,
        timestamp: new Date().toISOString()
    });

    // Determine status code based on error type
    const statusCode = ERROR_TYPES[err.name] || 500;

    // Structured error response
    const errorResponse = {
        success: false,
        error: {
            message: err.message,
            type: err.name,
            code: statusCode,
            request_id: req.id, // Requires request ID middleware
            timestamp: new Date().toISOString()
        }
    };

    // Add debugging info in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.error.stack = err.stack;
        errorResponse.error.context = {
            path: req.path,
            method: req.method,
            query: req.query,
            body: req.body
        };
    }

    // Special handling for Redis errors
    if (err instanceof RedisError) {
        errorResponse.error.service = 'redis';
        // Don't expose internal Redis errors to client
        errorResponse.error.message = 'Database service temporarily unavailable';
    }

    // Special handling for WebSocket errors
    if (err instanceof WebSocketError) {
        errorResponse.error.service = 'websocket';
        errorResponse.error.message = 'Real-time service temporarily unavailable';
    }

    // Send response
    res.status(statusCode).json(errorResponse);

    // Continue to next error handler if exists
    next(err);
};

// Validation middleware helper
export const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            const { error } = schema.validate(req.body);
            if (error) {
                throw new ValidationError(error.details[0].message);
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};

// Request validation schemas (example)
export const requestSchemas = {
    startDebate: {
        validate: (data) => {
            const errors = [];
            if (!data.topic) errors.push('Topic is required');
            if (!data.agents || !Array.isArray(data.agents)) {
                errors.push('Agents must be an array');
            }
            return {
                error: errors.length ? { details: [{ message: errors.join(', ') }] } : null
            };
        }
    },
    // Add more schemas as needed
};

// Export helper functions
export const errorHelpers = {
    /**
     * Safely execute async operations with error handling
     */
    async safeExecute(operation, errorMessage = 'Operation failed') {
        try {
            const result = await operation();
            return { success: true, data: result };
        } catch (error) {
            console.error(`❌ ${errorMessage}:`, error);
            return { 
                success: false, 
                error: {
                    message: errorMessage,
                    details: error.message,
                    timestamp: new Date().toISOString()
                }
            };
        }
    },

    /**
     * Wrap route handler with error boundary
     */
    withErrorBoundary(handler) {
        return async (req, res, next) => {
            try {
                await handler(req, res, next);
            } catch (error) {
                next(error);
            }
        };
    }
};

// Usage example:
/*
import { enhancedErrorHandler, validateRequest, requestSchemas } from './middleware/enhancedErrorHandler.js';

// Add to your Express app AFTER existing error handlers
app.use(enhancedErrorHandler);

// Use validation middleware
app.post('/api/debate/start', 
    validateRequest(requestSchemas.startDebate),
    async (req, res) => {
        // Your route handler
    }
);

// Use safe execution
const { safeExecute } = errorHelpers;
const result = await safeExecute(
    () => someAsyncOperation(),
    'Failed to perform operation'
);
*/
