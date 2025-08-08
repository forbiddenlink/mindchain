// Centralized Redis Connection Manager - Production Ready
import 'dotenv/config';
import { createClient } from 'redis';

/**
 * Singleton Redis Connection Manager
 * Centralized, robust connection handling for the entire application
 */
class RedisConnectionManager {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.connectionPromise = null;
        this.connectionAttempts = 0;
        this.maxRetries = 5;
        this.retryDelay = 1000;
        this.reconnectStrategy = this.exponentialBackoff.bind(this);
    }

    /**
     * Get Redis client with automatic connection management
     */
    async getClient() {
        if (this.client && this.client.isReady) {
            return this.client;
        }

        // Avoid multiple concurrent connection attempts
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = this.connect();
        return this.connectionPromise;
    }

    /**
     * Connect to Redis with comprehensive error handling
     */
    async connect() {
        try {
            // Clean up any existing client
            if (this.client) {
                try {
                    await this.client.quit();
                } catch (error) {
                    // Ignore cleanup errors
                }
                this.client = null;
            }

            this.client = createClient({
                url: process.env.REDIS_URL,
                socket: {
                    reconnectStrategy: this.reconnectStrategy,
                    connectTimeout: 10000,
                    commandTimeout: 5000,
                    keepAlive: true,
                    lazyConnect: false
                },
                // Enable command retries
                commandsQueueMaxLength: 100,
                // Memory optimization
                legacyMode: false
            });

            // Set up comprehensive event handlers
            this.setupEventHandlers();

            await this.client.connect();
            
            this.isConnected = true;
            this.connectionAttempts = 0;
            this.connectionPromise = null;

            console.log('✅ Redis connection established successfully');
            return this.client;

        } catch (error) {
            this.connectionAttempts++;
            this.connectionPromise = null;
            
            console.error(`❌ Redis connection failed (attempt ${this.connectionAttempts}):`, error.message);
            
            if (this.connectionAttempts >= this.maxRetries) {
                throw new Error(`Redis connection failed after ${this.maxRetries} attempts: ${error.message}`);
            }

            // Exponential backoff retry
            const delay = this.retryDelay * Math.pow(2, this.connectionAttempts - 1);
            console.log(`🔄 Retrying Redis connection in ${delay}ms...`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.connect();
        }
    }

    /**
     * Set up Redis client event handlers
     */
    setupEventHandlers() {
        this.client.on('error', (error) => {
            console.error('🔴 Redis client error:', error.message);
            this.isConnected = false;
            
            // Attempt automatic recovery for connection errors
            if (error.code === 'CONNECTION_BROKEN' || error.code === 'ECONNRESET') {
                setTimeout(() => {
                    this.getClient().catch(err => {
                        console.error('❌ Redis auto-recovery failed:', err.message);
                    });
                }, 5000);
            }
        });

        this.client.on('connect', () => {
            console.log('🔗 Redis client connected');
            this.isConnected = true;
            this.connectionAttempts = 0;
        });

        this.client.on('ready', () => {
            console.log('✅ Redis client ready for operations');
            this.isConnected = true;
        });

        this.client.on('reconnecting', () => {
            console.log('🔄 Redis client reconnecting...');
        });

        this.client.on('disconnect', () => {
            console.log('🔌 Redis client disconnected');
            this.isConnected = false;
        });

        this.client.on('end', () => {
            console.log('📤 Redis connection ended');
            this.isConnected = false;
            this.client = null;
        });
    }

    /**
     * Exponential backoff strategy for reconnection
     */
    exponentialBackoff(retries) {
        if (retries >= this.maxRetries) {
            console.error('❌ Redis reconnection attempts exhausted');
            return false;
        }
        
        const delay = Math.min(this.retryDelay * Math.pow(2, retries), 30000); // Max 30 seconds
        console.log(`⏳ Redis reconnection attempt ${retries + 1} in ${delay}ms`);
        return delay;
    }

    /**
     * Execute Redis operation with error handling and retries
     */
    async execute(operation, fallback = null) {
        try {
            const client = await this.getClient();
            return await operation(client);
        } catch (error) {
            console.error('❌ Redis operation failed:', error.message);
            
            if (fallback !== null) {
                console.warn('⚠️ Using fallback value for Redis operation');
                return fallback;
            }
            
            throw new Error(`Redis operation failed: ${error.message}`);
        }
    }

    /**
     * Health check for monitoring
     */
    async healthCheck() {
        try {
            const client = await this.getClient();
            const ping = await client.ping();
            const info = await client.info('server');
            
            return {
                status: 'healthy',
                connected: this.isConnected,
                ping,
                uptime: this.parseInfoValue(info, 'uptime_in_seconds'),
                version: this.parseInfoValue(info, 'redis_version'),
                memory: this.parseInfoValue(info, 'used_memory_human'),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                connected: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Graceful shutdown
     */
    async disconnect() {
        if (this.client) {
            try {
                console.log('🔌 Closing Redis connection...');
                await this.client.quit();
                console.log('✅ Redis connection closed gracefully');
            } catch (error) {
                console.error('❌ Error during Redis disconnect:', error.message);
                // Force close if graceful quit fails
                if (this.client.disconnect) {
                    this.client.disconnect();
                }
            } finally {
                this.client = null;
                this.isConnected = false;
                this.connectionPromise = null;
            }
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            client: !!this.client,
            ready: this.client?.isReady || false,
            attempts: this.connectionAttempts
        };
    }

    /**
     * Parse Redis INFO command values
     */
    parseInfoValue(info, key) {
        const regex = new RegExp(`${key}:(.+)`);
        const match = info.match(regex);
        return match ? match[1].trim() : null;
    }
}

// Export singleton instance
const redisManager = new RedisConnectionManager();

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
    console.log(`📤 Received ${signal}, closing Redis connection...`);
    await redisManager.disconnect();
    process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGQUIT', gracefulShutdown);

// Unhandled rejection handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Redis promise rejection:', reason);
});

export default redisManager;
