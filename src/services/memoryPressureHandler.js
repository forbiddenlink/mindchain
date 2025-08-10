// Memory pressure handler
import healthMonitor from '../services/healthMonitor.js';

class MemoryPressureHandler {
    constructor() {
        this.warningThreshold = 0.85; // 85% heap usage
        this.criticalThreshold = 0.95; // 95% heap usage
        this.gcInterval = null;
        this.setupMonitoring();
    }

    setupMonitoring() {
        // Monitor memory usage every 30 seconds
        this.gcInterval = setInterval(() => {
            this.checkMemoryUsage();
        }, 30000);

        // Listen for health monitor memory warnings
        healthMonitor.addListener((status) => {
            if (status.type === 'memory' && status.status === 'warning') {
                this.handleMemoryPressure();
            }
        });
    }

    checkMemoryUsage() {
        const memUsage = process.memoryUsage();
        const heapUsedRatio = memUsage.heapUsed / memUsage.heapTotal;

        if (heapUsedRatio > this.criticalThreshold) {
            this.handleCriticalMemoryPressure();
        } else if (heapUsedRatio > this.warningThreshold) {
            this.handleMemoryPressure();
        }
    }

    handleMemoryPressure() {
        // Suggest garbage collection
        if (global.gc) {
            global.gc();
        }

        // Clear any in-memory caches
        this.clearCaches();
    }

    handleCriticalMemoryPressure() {
        // Force garbage collection
        if (global.gc) {
            global.gc();
        }

        // Clear all caches
        this.clearCaches();

        // Notify health monitor of critical situation
        healthMonitor.notifyListeners({
            type: 'memory',
            status: 'critical',
            details: 'Critical memory pressure detected'
        });
    }

    clearCaches() {
        // Clear module-specific caches
        // This should be implemented based on your application's needs
    }

    stop() {
        if (this.gcInterval) {
            clearInterval(this.gcInterval);
            this.gcInterval = null;
        }
    }
}

export default new MemoryPressureHandler();
