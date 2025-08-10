/**
 * Enhanced Logging System
 * Works alongside existing console.log statements
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

// Convert URL to path for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create logs directory
const createLogsDir = async (dir) => {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (error) {
        console.warn(`Warning: Could not create logs directory: ${error.message}`);
    }
};

// Log levels with colors
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
};

// Color scheme for different log levels
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'grey'
};

// Add colors to winston
winston.addColors(colors);

// Custom format for log messages
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Custom format for console output
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(
        info => `${info.timestamp} [${info.level}]: ${info.message}${info.stack ? '\n' + info.stack : ''}`
    )
);

/**
 * Create logger instance with file rotation and console output
 */
class Logger {
    constructor(options = {}) {
        this.options = {
            logsDir: options.logsDir || 'logs',
            level: options.level || 'info',
            maxSize: options.maxSize || '20m',
            maxFiles: options.maxFiles || '14d',
            ...options
        };

        // Initialize the logging system
        this.initialize();
    }

    /**
     * Initialize the logging system by creating directories and setting up transports
     */
    async initialize() {
        // Create logs directory if it doesn't exist
        await createLogsDir(this.options.logsDir);

        // Create Winston logger instance
        this.logger = winston.createLogger({
            level: this.options.level,
            levels,
            format: logFormat,
            transports: [
                // Console transport with custom formatting
                new winston.transports.Console({
                    format: consoleFormat
                }),
                // File transport for all logs
                new DailyRotateFile({
                    filename: path.join(this.options.logsDir, 'stancestream-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: this.options.maxSize,
                    maxFiles: this.options.maxFiles,
                    format: logFormat
                }),
                // Separate file for errors
                new DailyRotateFile({
                    filename: path.join(this.options.logsDir, 'stancestream-error-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: this.options.maxSize,
                    maxFiles: this.options.maxFiles,
                    level: 'error',
                    format: logFormat
                })
            ]
        });

        // Expose log levels
        this.levels = levels;
    }

    /**
     * Log with context and optional metadata
     */
    log(level, message, context = {}, metadata = {}) {
        const logData = {
            message,
            context,
            ...metadata,
            timestamp: new Date().toISOString()
        };

        this.logger.log(level, logData);
    }

    /**
     * Log HTTP request (works with morgan)
     */
    httpLog(req, res, responseTime) {
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            responseTime: `${responseTime}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            timestamp: new Date().toISOString()
        };

        this.logger.http(logData);
    }

    /**
     * Log WebSocket events
     */
    wsLog(event, data = {}) {
        const logData = {
            event,
            ...data,
            timestamp: new Date().toISOString()
        };

        this.logger.verbose(logData);
    }

    /**
     * Log Redis operations
     */
    redisLog(operation, details = {}) {
        const logData = {
            operation,
            ...details,
            timestamp: new Date().toISOString()
        };

        this.logger.debug(logData);
    }

    /**
     * Log debate events
     */
    debateLog(debateId, event, data = {}) {
        const logData = {
            debateId,
            event,
            ...data,
            timestamp: new Date().toISOString()
        };

        this.logger.info(logData);
    }

    /**
     * Log performance metrics
     */
    metricsLog(metrics) {
        const logData = {
            type: 'metrics',
            ...metrics,
            timestamp: new Date().toISOString()
        };

        this.logger.verbose(logData);
    }

    /**
     * Log security events
     */
    securityLog(event, details = {}) {
        const logData = {
            event,
            ...details,
            timestamp: new Date().toISOString()
        };

        this.logger.warn(logData);
    }

    /**
     * Create Express middleware for request logging
     */
    requestLogger() {
        return (req, res, next) => {
            const start = Date.now();
            
            // Log when the request finishes
            res.on('finish', () => {
                const duration = Date.now() - start;
                this.httpLog(req, res, duration);
            });
            
            next();
        };
    }
}

// Create singleton instance
const logger = new Logger({
    logsDir: 'logs',
    level: process.env.LOG_LEVEL || 'info',
    maxSize: '20m',
    maxFiles: '14d'
});

// Usage examples
export const logDebate = (debateId, event, data) => {
    logger.debateLog(debateId, event, data);
};

export const logRedis = (operation, details) => {
    logger.redisLog(operation, details);
};

export const logWebSocket = (event, data) => {
    logger.wsLog(event, data);
};

export const logMetrics = (metrics) => {
    logger.metricsLog(metrics);
};

export const logSecurity = (event, details) => {
    logger.securityLog(event, details);
};

// Export the logger instance and middleware
export const requestLogger = logger.requestLogger.bind(logger);
export default logger;

// Example usage:
/*
import logger, { 
    logDebate, 
    logRedis, 
    logWebSocket,
    logMetrics,
    logSecurity,
    requestLogger 
} from './utils/logger.js';

// Use in Express app
app.use(requestLogger());

// Log debate events
logDebate('debate_123', 'started', { topic: 'climate change' });

// Log Redis operations
logRedis('HSET', { key: 'user:123', fields: ['name', 'email'] });

// Log WebSocket events
logWebSocket('connection', { clientId: 'ws_123' });

// Log metrics
logMetrics({
    cacheHitRate: 0.85,
    responseTime: 120,
    activeConnections: 5
});

// Log security events
logSecurity('rate_limit_exceeded', { ip: '1.2.3.4' });

// Direct logger usage
logger.log('info', 'Custom message', { custom: 'context' });
*/
