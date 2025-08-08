// Performance Profiling and Optimization Suite for StanceStream
// Deep dive analysis of bundle size, memory usage, CPU profiling, and optimization opportunities

import 'dotenv/config';
import axios from 'axios';
import WebSocket from 'ws';
import { createClient } from 'redis';
import fs from 'fs/promises';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const API_BASE = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

class PerformanceProfiler {
    constructor() {
        this.metrics = {
            bundleAnalysis: {},
            memoryProfile: {},
            performanceMetrics: {},
            networkProfile: {},
            cacheEfficiency: {},
            recommendations: []
        };
        this.startTime = Date.now();
        this.memorySnapshots = [];
        this.performanceSamples = [];
    }

    async runCompleteProfiler() {
        console.log('⚡ Starting Performance Deep Dive Analysis');
        console.log('=' .repeat(60));

        await this.analyzeBundleSize();
        await this.profileMemoryUsage();
        await this.measureResponseTimes();
        await this.analyzeCacheEfficiency();
        await this.profileNetworkOptimization();
        await this.detectMemoryLeaks();
        await this.measureCPUUsage();
        await this.analyzeAssetOptimization();
        
        this.generateOptimizationReport();
    }

    // ===== BUNDLE SIZE ANALYSIS =====
    async analyzeBundleSize() {
        console.log('\n📦 Analyzing Bundle Size and Dependencies');
        console.log('-'.repeat(50));

        try {
            // Analyze backend dependencies
            await this.analyzeBackendBundle();
            
            // Analyze frontend bundle
            await this.analyzeFrontendBundle();
            
            console.log('✅ Bundle analysis completed');
        } catch (error) {
            console.log(`❌ Bundle analysis failed: ${error.message}`);
        }
    }

    async analyzeBackendBundle() {
        console.log('Analyzing backend dependencies...');
        
        try {
            const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
            const dependencies = packageJson.dependencies;
            
            // Estimate dependency sizes (simplified analysis)
            const heavyDependencies = [];
            const estimatedSizes = {
                'redis': '2.5MB',
                'openai': '1.8MB', 
                'express': '0.5MB',
                '@langchain/openai': '3.2MB',
                'ws': '0.3MB'
            };
            
            Object.keys(dependencies).forEach(dep => {
                if (estimatedSizes[dep]) {
                    heavyDependencies.push({ name: dep, size: estimatedSizes[dep] });
                }
            });
            
            this.metrics.bundleAnalysis.backend = {
                totalDependencies: Object.keys(dependencies).length,
                heavyDependencies,
                estimatedTotalSize: '8.3MB'
            };
            
            console.log(`Backend: ${Object.keys(dependencies).length} dependencies`);
            console.log('Heaviest dependencies:', heavyDependencies.map(d => `${d.name} (${d.size})`).join(', '));
            
        } catch (error) {
            console.log(`Backend bundle analysis error: ${error.message}`);
        }
    }

    async analyzeFrontendBundle() {
        console.log('Analyzing frontend bundle...');
        
        try {
            // Try to read frontend package.json
            const frontendPackageJson = JSON.parse(
                await fs.readFile('stancestream-frontend/package.json', 'utf8')
            );
            
            const dependencies = frontendPackageJson.dependencies;
            const devDependencies = frontendPackageJson.devDependencies;
            
            // Estimate frontend bundle sizes
            const estimatedSizes = {
                'react': '42KB (gzipped)',
                'react-dom': '130KB (gzipped)',
                'recharts': '400KB (gzipped)',
                'lucide-react': '300KB (gzipped)',
                'date-fns': '69KB (gzipped)'
            };
            
            const bundleEstimate = Object.keys(dependencies).reduce((total, dep) => {
                if (dep === 'react' || dep === 'react-dom') return total + 172;
                if (dep === 'recharts') return total + 400;
                if (dep === 'lucide-react') return total + 300;
                if (dep === 'date-fns') return total + 69;
                return total + 50; // Average estimate for other deps
            }, 0);
            
            this.metrics.bundleAnalysis.frontend = {
                dependencies: Object.keys(dependencies).length,
                devDependencies: Object.keys(devDependencies).length,
                estimatedBundleSize: `${bundleEstimate}KB (gzipped)`,
                recommendations: []
            };
            
            // Generate recommendations
            if (bundleEstimate > 1000) {
                this.metrics.bundleAnalysis.frontend.recommendations.push(
                    'Consider code splitting for large components'
                );
            }
            
            if (dependencies['lucide-react']) {
                this.metrics.bundleAnalysis.frontend.recommendations.push(
                    'Use tree-shaking to import only needed Lucide icons'
                );
            }
            
            console.log(`Frontend: ${bundleEstimate}KB estimated bundle size (gzipped)`);
            
        } catch (error) {
            console.log(`Frontend bundle analysis error: ${error.message}`);
        }
    }

    // ===== MEMORY PROFILING =====
    async profileMemoryUsage() {
        console.log('\n🧠 Memory Usage Profiling');
        console.log('-'.repeat(50));

        await this.measureBaselineMemory();
        await this.measureMemoryUnderLoad();
        await this.analyzeDodgerMemoryPatterns();
    }

    async measureBaselineMemory() {
        console.log('Measuring baseline memory usage...');
        
        try {
            const baseline = process.memoryUsage();
            this.memorySnapshots.push({
                timestamp: Date.now(),
                type: 'baseline',
                memory: baseline
            });
            
            console.log(`Baseline memory: ${(baseline.heapUsed / 1024 / 1024).toFixed(2)}MB heap`);
            
        } catch (error) {
            console.log(`Memory baseline error: ${error.message}`);
        }
    }

    async measureMemoryUnderLoad() {
        console.log('Measuring memory usage under load...');
        
        try {
            // Start memory monitoring
            const memoryInterval = setInterval(() => {
                const memory = process.memoryUsage();
                this.memorySnapshots.push({
                    timestamp: Date.now(),
                    type: 'under_load',
                    memory
                });
            }, 1000);
            
            // Generate load
            const requests = [];
            for (let i = 0; i < 20; i++) {
                requests.push(
                    axios.post(`${API_BASE}/api/debate/start`, {
                        topic: `memory test ${i}`,
                        agents: ['senatorbot', 'reformerbot']
                    }).catch(err => ({ error: err.message }))
                );
            }
            
            await Promise.all(requests);
            
            // Wait a bit longer to see memory patterns
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            clearInterval(memoryInterval);
            
            // Analyze memory growth
            const loadSnapshots = this.memorySnapshots.filter(s => s.type === 'under_load');
            if (loadSnapshots.length > 0) {
                const maxMemory = Math.max(...loadSnapshots.map(s => s.memory.heapUsed));
                const minMemory = Math.min(...loadSnapshots.map(s => s.memory.heapUsed));
                const memoryGrowth = ((maxMemory - minMemory) / 1024 / 1024).toFixed(2);
                
                console.log(`Memory growth under load: ${memoryGrowth}MB`);
                
                this.metrics.memoryProfile.underLoad = {
                    maxMemory: `${(maxMemory / 1024 / 1024).toFixed(2)}MB`,
                    minMemory: `${(minMemory / 1024 / 1024).toFixed(2)}MB`,
                    growth: `${memoryGrowth}MB`
                };
                
                if (parseFloat(memoryGrowth) > 100) {
                    this.metrics.recommendations.push(
                        'Memory growth under load is high - investigate potential memory leaks'
                    );
                }
            }
            
        } catch (error) {
            console.log(`Memory under load error: ${error.message}`);
        }
    }

    // ===== RESPONSE TIME ANALYSIS =====
    async measureResponseTimes() {
        console.log('\n⏱️ Response Time Analysis');
        console.log('-'.repeat(50));

        await this.measureAPIResponseTimes();
        await this.measureWebSocketLatency();
        await this.measureCacheResponseTimes();
    }

    async measureAPIResponseTimes() {
        console.log('Measuring API response times...');
        
        const endpoints = [
            { path: '/api/health', method: 'GET' },
            { path: '/api/cache/metrics', method: 'GET' },
            { path: '/api/stats/redis', method: 'GET' },
            { path: '/api/debate/start', method: 'POST', data: { topic: 'test', agents: ['senatorbot'] } }
        ];
        
        for (const endpoint of endpoints) {
            try {
                const samples = [];
                
                // Take 10 samples for each endpoint
                for (let i = 0; i < 10; i++) {
                    const startTime = Date.now();
                    
                    if (endpoint.method === 'GET') {
                        await axios.get(`${API_BASE}${endpoint.path}`);
                    } else {
                        await axios.post(`${API_BASE}${endpoint.path}`, endpoint.data || {});
                    }
                    
                    const responseTime = Date.now() - startTime;
                    samples.push(responseTime);
                    
                    // Small delay between requests
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                const avgResponseTime = samples.reduce((a, b) => a + b, 0) / samples.length;
                const maxResponseTime = Math.max(...samples);
                const minResponseTime = Math.min(...samples);
                
                console.log(`${endpoint.path}: avg ${avgResponseTime.toFixed(2)}ms, max ${maxResponseTime}ms`);
                
                this.metrics.performanceMetrics[endpoint.path] = {
                    average: avgResponseTime,
                    max: maxResponseTime,
                    min: minResponseTime,
                    samples: samples.length
                };
                
                if (avgResponseTime > 2000) {
                    this.metrics.recommendations.push(
                        `${endpoint.path} has slow response time (${avgResponseTime.toFixed(2)}ms) - needs optimization`
                    );
                }
                
            } catch (error) {
                console.log(`${endpoint.path} measurement failed: ${error.message}`);
            }
        }
    }

    async measureWebSocketLatency() {
        console.log('Measuring WebSocket latency...');
        
        try {
            const ws = new WebSocket(WS_URL, { origin: 'http://localhost:5173' });
            const latencies = [];
            
            await new Promise((resolve, reject) => {
                ws.on('open', () => {
                    console.log('WebSocket connected for latency testing');
                    
                    let pingsent = 0;
                    const pingInterval = setInterval(() => {
                        if (pingsent >= 10) {
                            clearInterval(pingInterval);
                            ws.close();
                            resolve();
                            return;
                        }
                        
                        const pingStart = Date.now();
                        ws.ping();
                        
                        ws.on('pong', () => {
                            const latency = Date.now() - pingStart;
                            latencies.push(latency);
                            pingsent++;
                        });
                    }, 1000);
                });
                
                ws.on('error', reject);
                setTimeout(() => reject(new Error('WebSocket latency test timeout')), 15000);
            });
            
            if (latencies.length > 0) {
                const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
                console.log(`WebSocket average latency: ${avgLatency.toFixed(2)}ms`);
                
                this.metrics.networkProfile.websocketLatency = {
                    average: avgLatency,
                    samples: latencies
                };
            }
            
        } catch (error) {
            console.log(`WebSocket latency measurement failed: ${error.message}`);
        }
    }

    // ===== CACHE EFFICIENCY ANALYSIS =====
    async analyzeCacheEfficiency() {
        console.log('\n🚀 Cache Efficiency Analysis');
        console.log('-'.repeat(50));

        try {
            // Get initial cache metrics
            const initialMetrics = await axios.get(`${API_BASE}/api/cache/metrics`);
            const initialData = initialMetrics.data;
            
            console.log('Initial cache state:', {
                hits: initialData.cache_hits || 0,
                total: initialData.total_requests || 0,
                ratio: ((initialData.hit_ratio || 0) * 100).toFixed(1) + '%'
            });
            
            // Generate some cache-able requests
            const testRequests = [
                'What is climate change?',
                'Benefits of renewable energy',
                'Economic impact of green policies',
                'What is climate change?', // Duplicate for cache hit
                'Benefits of renewable energy' // Another duplicate
            ];
            
            for (const prompt of testRequests) {
                try {
                    await axios.post(`${API_BASE}/api/debate/start`, {
                        topic: prompt,
                        agents: ['senatorbot', 'reformerbot']
                    });
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for processing
                } catch (error) {
                    // Continue even if some requests fail
                }
            }
            
            // Get final cache metrics
            const finalMetrics = await axios.get(`${API_BASE}/api/cache/metrics`);
            const finalData = finalMetrics.data;
            
            const newHits = (finalData.cache_hits || 0) - (initialData.cache_hits || 0);
            const newRequests = (finalData.total_requests || 0) - (initialData.total_requests || 0);
            
            console.log('Cache performance during test:', {
                newRequests,
                newHits,
                testHitRatio: newRequests > 0 ? ((newHits / newRequests) * 100).toFixed(1) + '%' : '0%'
            });
            
            this.metrics.cacheEfficiency = {
                initialHits: initialData.cache_hits || 0,
                finalHits: finalData.cache_hits || 0,
                newHits,
                newRequests,
                overallRatio: ((finalData.hit_ratio || 0) * 100).toFixed(1) + '%'
            };
            
            const expectedHits = 2; // We sent 2 duplicate requests
            if (newHits < expectedHits) {
                this.metrics.recommendations.push(
                    'Semantic cache may not be working optimally - investigate similarity threshold'
                );
            }
            
        } catch (error) {
            console.log(`Cache efficiency analysis failed: ${error.message}`);
        }
    }

    // ===== MEMORY LEAK DETECTION =====
    async detectMemoryLeaks() {
        console.log('\n🔍 Memory Leak Detection');
        console.log('-'.repeat(50));

        try {
            console.log('Running extended memory leak detection...');
            
            const initialMemory = process.memoryUsage();
            console.log(`Initial memory: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
            
            // Simulate extended usage
            for (let cycle = 0; cycle < 5; cycle++) {
                console.log(`Running cycle ${cycle + 1}/5...`);
                
                // Create and destroy multiple connections
                const connections = [];
                for (let i = 0; i < 10; i++) {
                    try {
                        const ws = new WebSocket(WS_URL, { origin: 'http://localhost:5173' });
                        connections.push(ws);
                        
                        // Send some data
                        ws.on('open', () => {
                            ws.send(JSON.stringify({ type: 'memory_test', data: 'X'.repeat(1000) }));
                        });
                    } catch (error) {
                        // Continue even if connections fail
                    }
                }
                
                // Wait and then close connections
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                connections.forEach(ws => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.close();
                    }
                });
                
                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                }
                
                const currentMemory = process.memoryUsage();
                console.log(`Cycle ${cycle + 1} memory: ${(currentMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
                
                this.memorySnapshots.push({
                    timestamp: Date.now(),
                    type: 'leak_detection',
                    cycle: cycle + 1,
                    memory: currentMemory
                });
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Analyze memory trend
            const leakSnapshots = this.memorySnapshots.filter(s => s.type === 'leak_detection');
            if (leakSnapshots.length >= 2) {
                const memoryGrowth = leakSnapshots[leakSnapshots.length - 1].memory.heapUsed - 
                                   leakSnapshots[0].memory.heapUsed;
                const growthMB = memoryGrowth / 1024 / 1024;
                
                console.log(`Memory growth over test: ${growthMB.toFixed(2)}MB`);
                
                if (growthMB > 50) {
                    this.metrics.recommendations.push(
                        `Potential memory leak detected - ${growthMB.toFixed(2)}MB growth during extended testing`
                    );
                }
                
                this.metrics.memoryProfile.leakDetection = {
                    totalGrowth: `${growthMB.toFixed(2)}MB`,
                    cycles: leakSnapshots.length,
                    avgGrowthPerCycle: `${(growthMB / leakSnapshots.length).toFixed(2)}MB`
                };
            }
            
        } catch (error) {
            console.log(`Memory leak detection failed: ${error.message}`);
        }
    }

    // ===== ASSET OPTIMIZATION ANALYSIS =====
    async analyzeAssetOptimization() {
        console.log('\n🖼️ Asset Optimization Analysis');
        console.log('-'.repeat(50));

        try {
            // Check if frontend build exists
            try {
                await fs.access('stancestream-frontend/dist');
                console.log('✅ Frontend build directory exists');
                
                // Analyze build output if available
                const buildFiles = await fs.readdir('stancestream-frontend/dist', { recursive: true });
                const jsFiles = buildFiles.filter(f => f.endsWith('.js'));
                const cssFiles = buildFiles.filter(f => f.endsWith('.css'));
                
                console.log(`Build contains: ${jsFiles.length} JS files, ${cssFiles.length} CSS files`);
                
                this.metrics.bundleAnalysis.buildOutput = {
                    jsFiles: jsFiles.length,
                    cssFiles: cssFiles.length,
                    totalFiles: buildFiles.length
                };
                
            } catch (error) {
                console.log('⚠️ Frontend not built - run: cd stancestream-frontend && pnpm build');
                this.metrics.recommendations.push('Build frontend to analyze bundle optimization');
            }
            
            // Check for optimization opportunities
            const optimizationChecks = [
                {
                    name: 'Compression middleware',
                    check: () => fs.readFile('server.js', 'utf8').then(content => content.includes('compression')),
                    recommendation: 'Enable gzip compression middleware'
                },
                {
                    name: 'Static file caching',
                    check: () => fs.readFile('server.js', 'utf8').then(content => content.includes('Cache-Control')),
                    recommendation: 'Add Cache-Control headers for static assets'
                },
                {
                    name: 'Bundle splitting',
                    check: () => fs.readFile('stancestream-frontend/vite.config.js', 'utf8')
                        .then(content => content.includes('splitVendorChunk'))
                        .catch(() => false),
                    recommendation: 'Configure vendor chunk splitting in Vite'
                }
            ];
            
            for (const optimization of optimizationChecks) {
                try {
                    const hasOptimization = await optimization.check();
                    if (hasOptimization) {
                        console.log(`✅ ${optimization.name} is configured`);
                    } else {
                        console.log(`⚠️ ${optimization.name} not found`);
                        this.metrics.recommendations.push(optimization.recommendation);
                    }
                } catch (error) {
                    console.log(`❓ ${optimization.name} check failed: ${error.message}`);
                }
            }
            
        } catch (error) {
            console.log(`Asset optimization analysis failed: ${error.message}`);
        }
    }

    // ===== REPORT GENERATION =====
    generateOptimizationReport() {
        const duration = (Date.now() - this.startTime) / 1000;
        
        console.log('\n' + '='.repeat(80));
        console.log('⚡ PERFORMANCE OPTIMIZATION REPORT');
        console.log('='.repeat(80));
        
        console.log(`\nProfile Duration: ${duration.toFixed(2)} seconds`);
        
        // Bundle Analysis Results
        if (this.metrics.bundleAnalysis.backend) {
            console.log('\n📦 BUNDLE ANALYSIS:');
            console.log(`Backend Dependencies: ${this.metrics.bundleAnalysis.backend.totalDependencies}`);
            console.log(`Estimated Backend Size: ${this.metrics.bundleAnalysis.backend.estimatedTotalSize}`);
            
            if (this.metrics.bundleAnalysis.frontend) {
                console.log(`Frontend Bundle Size: ${this.metrics.bundleAnalysis.frontend.estimatedBundleSize}`);
            }
        }
        
        // Memory Profile Results
        if (this.metrics.memoryProfile.underLoad) {
            console.log('\n🧠 MEMORY PROFILE:');
            console.log(`Memory Growth Under Load: ${this.metrics.memoryProfile.underLoad.growth}`);
            console.log(`Peak Memory Usage: ${this.metrics.memoryProfile.underLoad.maxMemory}`);
            
            if (this.metrics.memoryProfile.leakDetection) {
                console.log(`Memory Leak Test Growth: ${this.metrics.memoryProfile.leakDetection.totalGrowth}`);
            }
        }
        
        // Performance Metrics
        if (Object.keys(this.metrics.performanceMetrics).length > 0) {
            console.log('\n⏱️ RESPONSE TIME ANALYSIS:');
            Object.entries(this.metrics.performanceMetrics).forEach(([endpoint, metrics]) => {
                console.log(`${endpoint}: ${metrics.average.toFixed(2)}ms avg (${metrics.min}-${metrics.max}ms range)`);
            });
        }
        
        // Cache Efficiency
        if (this.metrics.cacheEfficiency.overallRatio) {
            console.log('\n🚀 CACHE EFFICIENCY:');
            console.log(`Overall Hit Ratio: ${this.metrics.cacheEfficiency.overallRatio}`);
            console.log(`New Hits During Test: ${this.metrics.cacheEfficiency.newHits}/${this.metrics.cacheEfficiency.newRequests}`);
        }
        
        // Recommendations
        if (this.metrics.recommendations.length > 0) {
            console.log('\n🎯 OPTIMIZATION RECOMMENDATIONS:');
            this.metrics.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec}`);
            });
        } else {
            console.log('\n✅ No major performance issues detected!');
        }
        
        // Performance Score
        const performanceScore = this.calculatePerformanceScore();
        console.log('\n📊 PERFORMANCE SCORE:');
        console.log(`Overall Score: ${performanceScore.overall}/100`);
        console.log(`Response Time: ${performanceScore.responseTime}/25`);
        console.log(`Memory Usage: ${performanceScore.memory}/25`);
        console.log(`Cache Efficiency: ${performanceScore.cache}/25`);
        console.log(`Bundle Size: ${performanceScore.bundle}/25`);
        
        if (performanceScore.overall >= 85) {
            console.log('\n🏆 EXCELLENT PERFORMANCE - Production ready!');
        } else if (performanceScore.overall >= 70) {
            console.log('\n✅ GOOD PERFORMANCE - Minor optimizations recommended');
        } else if (performanceScore.overall >= 55) {
            console.log('\n⚠️ ACCEPTABLE PERFORMANCE - Several optimizations needed');
        } else {
            console.log('\n❌ POOR PERFORMANCE - Major optimizations required');
        }
        
        return this.metrics;
    }

    calculatePerformanceScore() {
        let responseTimeScore = 25;
        let memoryScore = 25;
        let cacheScore = 25;
        let bundleScore = 25;
        
        // Response time scoring (slower = lower score)
        const avgResponseTimes = Object.values(this.metrics.performanceMetrics)
            .map(m => m.average);
        if (avgResponseTimes.length > 0) {
            const maxAvgResponse = Math.max(...avgResponseTimes);
            if (maxAvgResponse > 3000) responseTimeScore = 10;
            else if (maxAvgResponse > 2000) responseTimeScore = 15;
            else if (maxAvgResponse > 1000) responseTimeScore = 20;
        }
        
        // Memory scoring (higher growth = lower score)  
        if (this.metrics.memoryProfile.underLoad) {
            const growth = parseFloat(this.metrics.memoryProfile.underLoad.growth);
            if (growth > 100) memoryScore = 10;
            else if (growth > 50) memoryScore = 15;
            else if (growth > 25) memoryScore = 20;
        }
        
        // Cache scoring (lower hit ratio = lower score)
        if (this.metrics.cacheEfficiency.overallRatio) {
            const hitRatio = parseFloat(this.metrics.cacheEfficiency.overallRatio);
            if (hitRatio < 30) cacheScore = 10;
            else if (hitRatio < 50) cacheScore = 15;
            else if (hitRatio < 70) cacheScore = 20;
        }
        
        // Bundle scoring (recommendations = lower score)
        const bundleRecommendations = this.metrics.recommendations.filter(r => 
            r.includes('bundle') || r.includes('splitting') || r.includes('size')
        );
        if (bundleRecommendations.length > 2) bundleScore = 15;
        else if (bundleRecommendations.length > 0) bundleScore = 20;
        
        return {
            overall: responseTimeScore + memoryScore + cacheScore + bundleScore,
            responseTime: responseTimeScore,
            memory: memoryScore,
            cache: cacheScore,
            bundle: bundleScore
        };
    }
}

// Export for use in other files
export default PerformanceProfiler;

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const profiler = new PerformanceProfiler();
    
    console.log('⚡ StanceStream Performance Profiler');
    console.log('Ensure server is running on localhost:3001');
    console.log('This will analyze performance, memory usage, and optimization opportunities\n');
    
    try {
        await profiler.runCompleteProfiler();
    } catch (error) {
        console.error('❌ Performance profiling failed:', error);
        process.exit(1);
    }
}
