// Production Monitoring & Observability System for StanceStream
// Real-time error tracking, performance monitoring, health checks, and alerting

import 'dotenv/config';
import { createClient } from 'redis';
import fs from 'fs/promises';
import { EventEmitter } from 'events';

class ProductionMonitoringSystem extends EventEmitter {
    constructor() {
        super();
        this.metrics = {
            errors: [],
            performance: [],
            healthChecks: [],
            alerts: [],
            systemStats: {
                startTime: Date.now(),
                errorCount: 0,
                warningCount: 0,
                uptimePercentage: 100,
                averageResponseTime: 0,
                memoryUsage: {
                    current: 0,
                    peak: 0,
                    average: 0
                }
            }
        };
        
        this.thresholds = {
            maxResponseTime: 5000, // 5 seconds
            maxMemoryUsage: 500 * 1024 * 1024, // 500MB
            maxErrorRate: 0.05, // 5% error rate
            minCacheHitRate: 0.3, // 30% cache hit rate
            maxCPUUsage: 80 // 80% CPU usage
        };
        
        this.monitoringInterval = null;
        this.isMonitoring = false;
        this.redisClient = null;
    }

    async startMonitoring() {
        console.log('📊 Starting Production Monitoring System');
        console.log('=' .repeat(60));
        
        try {
            // Initialize Redis connection for monitoring
            this.redisClient = createClient({ url: process.env.REDIS_URL });
            await this.redisClient.connect();
            console.log('✅ Redis monitoring connection established');
            
            // Start periodic monitoring
            this.isMonitoring = true;
            this.monitoringInterval = setInterval(() => {
                this.collectMetrics();
            }, 30000); // Every 30 seconds
            
            // Initial health check
            await this.performHealthCheck();
            
            // Set up error handling monitoring
            this.setupErrorMonitoring();
            
            // Set up performance monitoring
            this.setupPerformanceMonitoring();
            
            // Start real-time dashboards
            this.startHealthDashboard();
            
            console.log('📈 Monitoring system active - collecting metrics every 30 seconds');
            
        } catch (error) {
            console.error('❌ Failed to start monitoring system:', error);
            throw error;
        }
    }

    async stopMonitoring() {
        console.log('⏹️ Stopping monitoring system...');
        
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        if (this.redisClient) {
            await this.redisClient.quit();
        }
        
        console.log('✅ Monitoring system stopped');
    }

    // ===== HEALTH MONITORING =====
    async performHealthCheck() {
        const healthCheck = {
            timestamp: Date.now(),
            status: 'healthy',
            checks: {}
        };

        try {
            // Redis health check
            const redisStart = Date.now();
            await this.redisClient.ping();
            const redisLatency = Date.now() - redisStart;
            
            healthCheck.checks.redis = {
                status: redisLatency < 100 ? 'healthy' : 'degraded',
                latency: redisLatency,
                message: redisLatency < 100 ? 'Redis responding normally' : 'Redis responding slowly'
            };

            // Memory health check
            const memoryUsage = process.memoryUsage();
            const memoryHealthy = memoryUsage.heapUsed < this.thresholds.maxMemoryUsage;
            
            healthCheck.checks.memory = {
                status: memoryHealthy ? 'healthy' : 'critical',
                usage: memoryUsage.heapUsed,
                usageMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
                message: memoryHealthy ? 'Memory usage normal' : 'High memory usage detected'
            };

            // Cache health check
            try {
                const cacheMetrics = await this.redisClient.json.get('cache:metrics');
                const hitRate = cacheMetrics ? cacheMetrics.hit_ratio : 0;
                const cacheHealthy = hitRate >= this.thresholds.minCacheHitRate;
                
                healthCheck.checks.cache = {
                    status: cacheHealthy ? 'healthy' : 'warning',
                    hitRate: hitRate,
                    hitRatePercentage: (hitRate * 100).toFixed(1) + '%',
                    message: cacheHealthy ? 'Cache performing well' : 'Low cache hit rate'
                };
            } catch (error) {
                healthCheck.checks.cache = {
                    status: 'warning',
                    message: 'Cache metrics unavailable'
                };
            }

            // Overall health assessment
            const criticalIssues = Object.values(healthCheck.checks).filter(check => check.status === 'critical');
            const warnings = Object.values(healthCheck.checks).filter(check => check.status === 'warning' || check.status === 'degraded');
            
            if (criticalIssues.length > 0) {
                healthCheck.status = 'critical';
                this.triggerAlert('critical', `${criticalIssues.length} critical health issues detected`);
            } else if (warnings.length > 0) {
                healthCheck.status = 'warning';
                this.triggerAlert('warning', `${warnings.length} health warnings detected`);
            }

            this.metrics.healthChecks.push(healthCheck);
            
            // Keep only last 100 health checks
            if (this.metrics.healthChecks.length > 100) {
                this.metrics.healthChecks = this.metrics.healthChecks.slice(-100);
            }

            console.log(`🏥 Health Check: ${healthCheck.status.toUpperCase()} - Redis: ${redisLatency}ms, Memory: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
            
            return healthCheck;

        } catch (error) {
            healthCheck.status = 'critical';
            healthCheck.checks.system = {
                status: 'critical',
                message: `Health check failed: ${error.message}`
            };
            
            this.triggerAlert('critical', `Health check system failure: ${error.message}`);
            
            this.metrics.healthChecks.push(healthCheck);
            return healthCheck;
        }
    }

    // ===== ERROR MONITORING =====
    setupErrorMonitoring() {
        // Capture uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.logError('uncaught_exception', error, { critical: true });
        });

        // Capture unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.logError('unhandled_rejection', reason, { 
                critical: true,
                context: { promise: promise.toString() }
            });
        });

        // Monitor Redis errors
        if (this.redisClient) {
            this.redisClient.on('error', (error) => {
                this.logError('redis_error', error, { 
                    critical: true,
                    service: 'redis'
                });
            });
        }

        console.log('🚨 Error monitoring system active');
    }

    logError(type, error, metadata = {}) {
        const errorEntry = {
            timestamp: Date.now(),
            type,
            message: error.message || error.toString(),
            stack: error.stack || null,
            metadata,
            severity: metadata.critical ? 'critical' : 'error'
        };

        this.metrics.errors.push(errorEntry);
        this.metrics.systemStats.errorCount++;

        // Keep only last 500 errors
        if (this.metrics.errors.length > 500) {
            this.metrics.errors = this.metrics.errors.slice(-500);
        }

        // Log to console with severity
        const severityIcon = metadata.critical ? '🔥' : '❌';
        console.log(`${severityIcon} ERROR [${type}]: ${errorEntry.message}`);

        // Trigger alerts for critical errors
        if (metadata.critical) {
            this.triggerAlert('critical', `Critical error: ${errorEntry.message}`);
        }

        // Emit error event for external handlers
        this.emit('error', errorEntry);

        return errorEntry;
    }

    // ===== PERFORMANCE MONITORING =====
    setupPerformanceMonitoring() {
        console.log('⚡ Performance monitoring system active');
        
        // Monitor event loop lag
        this.monitorEventLoop();
        
        // Monitor garbage collection
        this.monitorGarbageCollection();
    }

    monitorEventLoop() {
        setInterval(() => {
            const start = process.hrtime.bigint();
            setImmediate(() => {
                const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
                
                this.recordPerformanceMetric('event_loop_lag', lag, 'ms');
                
                if (lag > 100) { // > 100ms lag
                    this.triggerAlert('warning', `High event loop lag: ${lag.toFixed(2)}ms`);
                }
            });
        }, 5000); // Check every 5 seconds
    }

    monitorGarbageCollection() {
        if (global.gc) {
            const originalGC = global.gc;
            global.gc = () => {
                const start = Date.now();
                originalGC();
                const duration = Date.now() - start;
                
                this.recordPerformanceMetric('gc_duration', duration, 'ms');
                
                if (duration > 100) {
                    this.triggerAlert('warning', `Long GC pause: ${duration}ms`);
                }
            };
        }
    }

    recordPerformanceMetric(name, value, unit = '') {
        const metric = {
            timestamp: Date.now(),
            name,
            value,
            unit
        };

        this.metrics.performance.push(metric);

        // Keep only last 1000 performance metrics
        if (this.metrics.performance.length > 1000) {
            this.metrics.performance = this.metrics.performance.slice(-1000);
        }

        // Update system stats
        if (name === 'response_time') {
            const responseTimes = this.metrics.performance
                .filter(m => m.name === 'response_time')
                .map(m => m.value);
            
            if (responseTimes.length > 0) {
                this.metrics.systemStats.averageResponseTime = 
                    responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
            }
        }

        return metric;
    }

    // ===== ALERTING SYSTEM =====
    triggerAlert(severity, message, metadata = {}) {
        const alert = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            severity, // 'info', 'warning', 'critical'
            message,
            metadata,
            acknowledged: false
        };

        this.metrics.alerts.push(alert);

        // Keep only last 100 alerts
        if (this.metrics.alerts.length > 100) {
            this.metrics.alerts = this.metrics.alerts.slice(-100);
        }

        // Console output with appropriate styling
        const severityIcons = {
            info: 'ℹ️',
            warning: '⚠️',
            critical: '🚨'
        };

        console.log(`${severityIcons[severity]} ALERT [${severity.toUpperCase()}]: ${message}`);

        // Update stats
        if (severity === 'warning') {
            this.metrics.systemStats.warningCount++;
        } else if (severity === 'critical') {
            this.metrics.systemStats.errorCount++;
        }

        // Emit alert event for external handlers
        this.emit('alert', alert);

        return alert;
    }

    acknowledgeAlert(alertId) {
        const alert = this.metrics.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedAt = Date.now();
            console.log(`✅ Alert acknowledged: ${alert.message}`);
        }
        return alert;
    }

    // ===== METRICS COLLECTION =====
    async collectMetrics() {
        if (!this.isMonitoring) return;

        try {
            // Collect memory metrics
            const memoryUsage = process.memoryUsage();
            this.recordPerformanceMetric('memory_heap_used', memoryUsage.heapUsed, 'bytes');
            this.recordPerformanceMetric('memory_heap_total', memoryUsage.heapTotal, 'bytes');
            
            // Update memory stats
            this.metrics.systemStats.memoryUsage.current = memoryUsage.heapUsed;
            if (memoryUsage.heapUsed > this.metrics.systemStats.memoryUsage.peak) {
                this.metrics.systemStats.memoryUsage.peak = memoryUsage.heapUsed;
            }

            // Collect Redis metrics if available
            try {
                const redisInfo = await this.redisClient.info('memory');
                const usedMemoryMatch = redisInfo.match(/used_memory:(\d+)/);
                if (usedMemoryMatch) {
                    const redisMemory = parseInt(usedMemoryMatch[1]);
                    this.recordPerformanceMetric('redis_memory_used', redisMemory, 'bytes');
                }
            } catch (error) {
                // Redis metrics not available, continue
            }

            // Calculate uptime percentage
            const uptime = Date.now() - this.metrics.systemStats.startTime;
            const errorWindow = 1000 * 60 * 60; // 1 hour window
            const recentErrors = this.metrics.errors.filter(
                error => Date.now() - error.timestamp < errorWindow
            );
            
            // Simplified uptime calculation
            this.metrics.systemStats.uptimePercentage = Math.max(0, 
                100 - (recentErrors.length * 2) // Each error reduces uptime by 2%
            );

            // Perform periodic health check
            await this.performHealthCheck();

        } catch (error) {
            this.logError('metrics_collection', error, { service: 'monitoring' });
        }
    }

    // ===== DASHBOARD & REPORTING =====
    startHealthDashboard() {
        console.log('\n📊 Real-Time Health Dashboard');
        console.log('-'.repeat(60));
        
        setInterval(() => {
            if (!this.isMonitoring) return;
            
            this.displayDashboard();
        }, 60000); // Update every minute
    }

    displayDashboard() {
        const uptime = Date.now() - this.metrics.systemStats.startTime;
        const uptimeHours = (uptime / (1000 * 60 * 60)).toFixed(1);
        
        console.clear();
        console.log('📊 StanceStream Production Health Dashboard');
        console.log('=' .repeat(60));
        console.log(`Uptime: ${uptimeHours}h | Uptime %: ${this.metrics.systemStats.uptimePercentage.toFixed(1)}%`);
        console.log(`Errors: ${this.metrics.systemStats.errorCount} | Warnings: ${this.metrics.systemStats.warningCount}`);
        console.log(`Memory: ${(this.metrics.systemStats.memoryUsage.current / 1024 / 1024).toFixed(2)}MB`);
        console.log(`Avg Response: ${this.metrics.systemStats.averageResponseTime.toFixed(2)}ms`);
        
        // Recent health status
        if (this.metrics.healthChecks.length > 0) {
            const lastHealth = this.metrics.healthChecks[this.metrics.healthChecks.length - 1];
            const healthIcon = {
                healthy: '✅',
                warning: '⚠️',
                critical: '🚨'
            }[lastHealth.status] || '❓';
            
            console.log(`Health Status: ${healthIcon} ${lastHealth.status.toUpperCase()}`);
        }
        
        // Recent alerts
        const recentAlerts = this.metrics.alerts.slice(-3);
        if (recentAlerts.length > 0) {
            console.log('\nRecent Alerts:');
            recentAlerts.forEach(alert => {
                const timeAgo = Math.floor((Date.now() - alert.timestamp) / 1000 / 60);
                console.log(`  ${alert.severity.toUpperCase()}: ${alert.message} (${timeAgo}m ago)`);
            });
        }
        
        console.log('-'.repeat(60));
        console.log(`Last updated: ${new Date().toLocaleTimeString()}`);
    }

    // ===== REPORTING =====
    generateHealthReport() {
        const uptime = Date.now() - this.metrics.systemStats.startTime;
        
        const report = {
            generatedAt: Date.now(),
            systemStats: {
                ...this.metrics.systemStats,
                uptimeHours: (uptime / (1000 * 60 * 60)).toFixed(1)
            },
            healthSummary: {
                totalHealthChecks: this.metrics.healthChecks.length,
                healthyChecks: this.metrics.healthChecks.filter(h => h.status === 'healthy').length,
                warningChecks: this.metrics.healthChecks.filter(h => h.status === 'warning').length,
                criticalChecks: this.metrics.healthChecks.filter(h => h.status === 'critical').length
            },
            errorSummary: {
                totalErrors: this.metrics.errors.length,
                criticalErrors: this.metrics.errors.filter(e => e.severity === 'critical').length,
                recentErrors: this.metrics.errors.filter(
                    e => Date.now() - e.timestamp < 1000 * 60 * 60 // Last hour
                ).length
            },
            alertSummary: {
                totalAlerts: this.metrics.alerts.length,
                unacknowledgedAlerts: this.metrics.alerts.filter(a => !a.acknowledged).length,
                criticalAlerts: this.metrics.alerts.filter(a => a.severity === 'critical').length
            },
            performanceSummary: {
                totalMetrics: this.metrics.performance.length,
                averageResponseTime: this.metrics.systemStats.averageResponseTime,
                peakMemoryUsage: this.metrics.systemStats.memoryUsage.peak,
                currentMemoryUsage: this.metrics.systemStats.memoryUsage.current
            },
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Memory recommendations
        const currentMemoryMB = this.metrics.systemStats.memoryUsage.current / 1024 / 1024;
        if (currentMemoryMB > 300) {
            recommendations.push('High memory usage detected - consider memory optimization');
        }
        
        // Error rate recommendations
        const errorRate = this.metrics.systemStats.errorCount / Math.max(1, this.metrics.healthChecks.length);
        if (errorRate > 0.1) {
            recommendations.push('High error rate - investigate recent errors and implement fixes');
        }
        
        // Response time recommendations
        if (this.metrics.systemStats.averageResponseTime > 2000) {
            recommendations.push('Slow response times - optimize database queries and caching');
        }
        
        // Uptime recommendations
        if (this.metrics.systemStats.uptimePercentage < 95) {
            recommendations.push('Low uptime percentage - improve error handling and system stability');
        }
        
        return recommendations;
    }

    async saveReportToFile() {
        const report = this.generateHealthReport();
        const filename = `health-report-${new Date().toISOString().split('T')[0]}.json`;
        
        try {
            await fs.writeFile(filename, JSON.stringify(report, null, 2));
            console.log(`📄 Health report saved to ${filename}`);
            return filename;
        } catch (error) {
            console.error(`❌ Failed to save health report: ${error.message}`);
            throw error;
        }
    }
}

// Export for use in other files
export default ProductionMonitoringSystem;

// CLI interface for monitoring
if (import.meta.url === `file://${process.argv[1]}`) {
    const monitor = new ProductionMonitoringSystem();
    
    console.log('📊 StanceStream Production Monitoring System');
    console.log('Starting comprehensive health monitoring...\n');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n⏹️ Shutting down monitoring system...');
        await monitor.stopMonitoring();
        
        // Generate final report
        try {
            const reportFile = await monitor.saveReportToFile();
            console.log(`📄 Final health report saved: ${reportFile}`);
        } catch (error) {
            console.error('Failed to save final report:', error.message);
        }
        
        process.exit(0);
    });
    
    // Start monitoring
    try {
        await monitor.startMonitoring();
        
        // Keep the process running
        setInterval(() => {
            // Monitor is running, keep alive
        }, 1000);
        
    } catch (error) {
        console.error('❌ Failed to start monitoring:', error);
        process.exit(1);
    }
}
