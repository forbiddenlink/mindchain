// Health Monitor Service
import redisManager from '../../redisManager.js';

class HealthMonitor {
    constructor() {
        this.lastPingTime = Date.now();
        this.healthyThreshold = 30000; // 30 seconds
        this.monitorInterval = null;
        this.listeners = new Set();
        this.status = {
            redis: 'unknown',
            openai: 'unknown',
            websocket: 'unknown',
            memory: {
                heapUsed: 0,
                heapTotal: 0,
                rss: 0,
                memoryWarning: false
            }
        };
    }

    start() {
        if (this.monitorInterval) {
            return;
        }

        this.monitorInterval = setInterval(async () => {
            await this.checkHealth();
        }, 5000); // Check every 5 seconds
    }

    stop() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
    }

    async checkHealth() {
        try {
            // Check Redis health
            const redisStatus = await redisManager.healthCheck();
            if (redisStatus.status === 'healthy' && redisStatus.ping === 'PONG') {
                this.lastPingTime = Date.now();
                this.status.redis = 'connected';
                this.notifyListeners({ type: 'redis', status: 'connected' });
            } else {
                const timeSinceLastPing = Date.now() - this.lastPingTime;
                if (timeSinceLastPing > this.healthyThreshold) {
                    this.status.redis = 'disconnected';
                    this.notifyListeners({ 
                        type: 'redis', 
                        status: 'disconnected',
                        details: redisStatus.error || 'Redis health check failed'
                    });
                }
            }

            // Check memory usage
            const memUsage = process.memoryUsage();
            this.status.memory = {
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                rss: memUsage.rss,
                memoryWarning: (memUsage.heapUsed / memUsage.heapTotal) > 0.85
            };

            if (this.status.memory.memoryWarning) {
                this.notifyListeners({
                    type: 'memory',
                    status: 'warning',
                    details: `High memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
                });
            }

            const healthStatus = {
                status: this.determineOverallStatus(),
                components: {
                    redis: this.status.redis,
                    openai: this.status.openai,
                    websocket: this.status.websocket
                },
                memory: this.status.memory,
                timestamp: new Date().toISOString()
            };

            return healthStatus;

        } catch (error) {
            this.notifyListeners({ 
                type: 'system', 
                status: 'error',
                error: error.message 
            });
            return {
                status: 'unhealthy',
                connected: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    determineOverallStatus() {
        if (this.status.redis === 'disconnected') {
            return 'degraded';
        }
        if (this.status.memory.memoryWarning) {
            return 'warning';
        }
        return 'healthy';
    }

    addListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners(status) {
        for (const listener of this.listeners) {
            try {
                listener(status);
            } catch (error) {
                console.error('Health listener error:', error);
            }
        }
    }
}

const healthMonitor = new HealthMonitor();
export default healthMonitor;
