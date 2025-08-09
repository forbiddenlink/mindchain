/**
 * Enhanced Security Middleware
 * ADDITIVE: Adds security features without breaking existing functionality
 */

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import crypto from 'crypto';
import { WebSocketServer } from 'ws';

/**
 * Enhanced Rate Limiter
 * More sophisticated than basic rate limiting
 */
export const createEnhancedRateLimiter = (options = {}) => {
    const config = {
        windowMs: options.windowMs || 1 * 60 * 1000, // 1 minute default
        max: options.max || 100, // 100 requests per window default
        message: {
            error: 'Too many requests, please try again later',
            retryAfter: 'windowMs',
            ...options.message
        },
        standardHeaders: true,
        legacyHeaders: false,
        // Custom handler for rate limit exceeded
        handler: (req, res) => {
            const retryAfter = Math.ceil(options.windowMs / 1000);
            res.status(429).json({
                error: 'Rate limit exceeded',
                retryAfter,
                message: `Please wait ${retryAfter} seconds before trying again`,
                timestamp: new Date().toISOString()
            });
        },
        // Skip rate limiting for whitelisted IPs
        skip: (req) => {
            const whitelistedIPs = options.whitelist || ['127.0.0.1', '::1'];
            return whitelistedIPs.includes(req.ip);
        },
        // Store additional metadata about rate limits
        ...options
    };

    return rateLimit(config);
};

/**
 * Enhanced Helmet Configuration
 * Strengthens security headers without breaking functionality
 */
export const enhancedHelmetConfig = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'", "ws:", "wss:"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    expectCt: {
        maxAge: 30,
        enforce: true
    },
    frameguard: {
        action: "deny"
    },
    hidePoweredBy: true,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
};

/**
 * Enhanced CORS Configuration
 * More detailed CORS settings that maintain compatibility
 */
export const enhancedCorsConfig = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5174'
        ];
        
        // Allow requests with no origin (mobile apps, curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS not allowed'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 200
};

/**
 * Enhanced WebSocket Security
 * Adds security features to WebSocket server
 */
export const enhanceWebSocketSecurity = (wss) => {
    // Connection validation
    wss.on('connection', (ws, req) => {
        const ip = req.socket.remoteAddress;
        console.log(`🔒 WebSocket connection from ${ip}`);

        // Add heartbeat mechanism
        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        // Add authentication timeout
        const authTimeout = setTimeout(() => {
            if (!ws.authenticated) {
                console.log(`🚫 Client ${ip} failed to authenticate in time`);
                ws.terminate();
            }
        }, 5000);

        // Handle authentication (example)
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                if (message.type === 'auth') {
                    // Implement your auth logic here
                    ws.authenticated = true;
                    clearTimeout(authTimeout);
                }
            } catch (e) {
                console.error('Invalid WebSocket message format');
            }
        });

        // Clean up on close
        ws.on('close', () => {
            clearTimeout(authTimeout);
        });
    });

    // Implement heartbeat interval
    const heartbeat = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (!ws.isAlive) {
                console.log('🔌 Terminating inactive WebSocket connection');
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on('close', () => {
        clearInterval(heartbeat);
    });

    return wss;
};

/**
 * Request Sanitizer Middleware
 * Enhanced input validation and sanitization
 */
export const requestSanitizer = (req, res, next) => {
    const sanitizeValue = (value) => {
        if (typeof value !== 'string') return value;
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .replace(/`/g, '&#x60;')
            .replace(/\\/g, '&#x5c;');
    };

    // Sanitize query parameters
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            req.query[key] = sanitizeValue(req.query[key]);
        });
    }

    // Sanitize body
    if (req.body && typeof req.body === 'object') {
        Object.keys(req.body).forEach(key => {
            req.body[key] = sanitizeValue(req.body[key]);
        });
    }

    // Sanitize params
    if (req.params) {
        Object.keys(req.params).forEach(key => {
            req.params[key] = sanitizeValue(req.params[key]);
        });
    }

    next();
};

/**
 * Request ID Middleware
 * Adds unique identifier to each request
 */
export const requestId = (req, res, next) => {
    req.id = crypto.randomBytes(16).toString('hex');
    res.setHeader('X-Request-ID', req.id);
    next();
};

/**
 * Security Headers Middleware
 * Additional security headers beyond Helmet
 */
export const additionalSecurityHeaders = (req, res, next) => {
    // Permissions Policy (formerly Feature-Policy)
    res.setHeader('Permissions-Policy', 
        "geolocation=(), microphone=(), camera=(), payment=(), usb=(), vr=()"
    );
    
    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    next();
};

// Usage example:
/*
import { 
    createEnhancedRateLimiter,
    enhancedHelmetConfig,
    enhancedCorsConfig,
    enhanceWebSocketSecurity,
    requestSanitizer,
    requestId,
    additionalSecurityHeaders
} from './middleware/enhancedSecurity.js';

// Apply enhanced security (after existing security middleware)
app.use(helmet(enhancedHelmetConfig));
app.use(cors(enhancedCorsConfig));
app.use(requestId);
app.use(requestSanitizer);
app.use(additionalSecurityHeaders);

// Apply rate limiters
const apiLimiter = createEnhancedRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', apiLimiter);

// Enhance WebSocket security
const wss = new WebSocketServer({ server });
enhanceWebSocketSecurity(wss);
*/
