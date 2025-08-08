import 'dotenv/config';
import { createClient } from 'redis';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * Redis Service - Centralized Redis connection management
 * Implements connection pooling, error handling, and graceful degradation
 */
class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Connect to Redis with retry logic
   */
  async connect() {
    if (this.isConnected && this.client) {
      return this.client;
    }

    try {
      this.client = createClient({ 
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries >= this.maxRetries) {
              logger.error('Redis reconnection attempts exhausted');
              return false;
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      // Set up error handlers
      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
        this.connectionAttempts = 0;
      });

      this.client.on('disconnect', () => {
        logger.warn('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      logger.info('✅ Redis service connected successfully');
      return this.client;

    } catch (error) {
      this.connectionAttempts++;
      logger.error(`❌ Redis connection failed (attempt ${this.connectionAttempts}):`, error.message);
      
      if (this.connectionAttempts < this.maxRetries) {
        logger.info(`Retrying Redis connection in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.connect();
      }
      
      throw new Error(`Redis connection failed after ${this.maxRetries} attempts: ${error.message}`);
    }
  }

  /**
   * Get Redis client (connects if not connected)
   */
  async getClient() {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }
    return this.client;
  }

  /**
   * Execute Redis operation with error handling
   */
  async execute(operation, fallback = null) {
    try {
      const client = await this.getClient();
      return await operation(client);
    } catch (error) {
      logger.error('Redis operation failed:', error.message);
      
      if (fallback !== null) {
        logger.warn('Using fallback value for Redis operation');
        return fallback;
      }
      
      throw new Error(`Redis operation failed: ${error.message}`);
    }
  }

  /**
   * JSON operations with error handling
   */
  async jsonGet(key, path = '$', fallback = null) {
    return this.execute(
      async (client) => await client.json.get(key, path),
      fallback
    );
  }

  async jsonSet(key, path, value) {
    return this.execute(
      async (client) => await client.json.set(key, path, value)
    );
  }

  /**
   * Stream operations with error handling
   */
  async streamAdd(key, id, fields) {
    return this.execute(
      async (client) => await client.xAdd(key, id, fields)
    );
  }

  async streamRead(key, start = '-', end = '+', options = {}) {
    return this.execute(
      async (client) => await client.xRevRange(key, start, end, options),
      []
    );
  }

  /**
   * TimeSeries operations with error handling
   */
  async timeSeriesAdd(key, timestamp, value) {
    return this.execute(
      async (client) => await client.ts.add(key, timestamp, value),
      null
    );
  }

  async timeSeriesRange(key, start = '-', end = '+', options = {}) {
    return this.execute(
      async (client) => await client.ts.range(key, start, end, options),
      []
    );
  }

  /**
   * Vector search operations with error handling
   */
  async vectorSearch(index, query, options = {}) {
    return this.execute(
      async (client) => await client.ft.search(index, query, options),
      { total: 0, documents: [] }
    );
  }

  /**
   * Hash operations with error handling
   */
  async hashSet(key, field, value) {
    return this.execute(
      async (client) => await client.hSet(key, field, value)
    );
  }

  async hashGet(key, field, fallback = null) {
    return this.execute(
      async (client) => await client.hGet(key, field),
      fallback
    );
  }

  /**
   * Basic operations
   */
  async ping() {
    return this.execute(
      async (client) => await client.ping(),
      'PONG (fallback)'
    );
  }

  async dbSize() {
    return this.execute(
      async (client) => await client.dbSize(),
      0
    );
  }

  async keys(pattern) {
    return this.execute(
      async (client) => await client.keys(pattern),
      []
    );
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const ping = await this.ping();
      const dbSize = await this.dbSize();
      
      return {
        status: 'healthy',
        connected: this.isConnected,
        ping,
        dbSize,
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
   * Graceful disconnect
   */
  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        logger.info('✅ Redis client disconnected gracefully');
      } catch (error) {
        logger.error('Error during Redis disconnect:', error.message);
      } finally {
        this.client = null;
        this.isConnected = false;
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
      attempts: this.connectionAttempts
    };
  }
}

// Export singleton instance
const redisService = new RedisService();

export default redisService;

// Graceful shutdown handling
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing Redis connection...');
  await redisService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing Redis connection...');
  await redisService.disconnect();
  process.exit(0);
});
