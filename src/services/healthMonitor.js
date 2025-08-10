// Health Monitor Service
import redisManager from '../../redisManager.js';

class HealthMonitor {
    constructor() {
        this.lastPingTime = Date.now();
        this.healthyThreshold = 30000; // 30 seconds
        this.monitorInterval = null;
        this.listeners = new Set();
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
            const status = await redisManager.healthCheck();
            
            // Update last successful ping time if Redis is healthy
            if (status.status === 'healthy' && status.ping === 'PONG') {
                this.lastPingTime = Date.now();
                this.notifyListeners({ type: 'redis', status: 'connected' });
            } else {
                const timeSinceLastPing = Date.now() - this.lastPingTime;
                if (timeSinceLastPing > this.healthyThreshold) {
                    this.notifyListeners({ 
                        type: 'redis', 
                        status: 'disconnected',
                        details: status.error || 'Redis health check failed'
                    });
                }
            }

            return status;
        } catch (error) {
            this.notifyListeners({ 
                type: 'redis', 
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
