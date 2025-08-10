import { createClient } from 'redis';
import { promises as fs } from 'fs';
import path from 'path';

// Configuration
const REQUIRED_DOCS = [
    'TECHNICAL-DOCS.md',
    'BUSINESS-VALUE.md',
    'API-DOCUMENTATION.md',
    'FEATURE-OVERVIEW.md'
];

const REDIS_MODULE_KEYS = {
    json: 'agent:senatorbot:profile', // Test JSON key
    streams: 'debate:*:messages',      // Test Streams pattern
    timeseries: 'debate:*:agent:*:stance:*', // Test TimeSeries pattern
    vector: 'cache:prompt:*'           // Test Vector key
};

const PERFORMANCE_THRESHOLDS = {
    apiResponseTime: 100,  // ms
    wsLatency: 50,        // ms
    cacheHitRate: 70,     // percent
    maxMemoryUsage: 80    // percent
};

async function validateContestChecklist() {
    console.log('Starting StanceStream Contest Validation...\n');
    const results = {
        documentation: {},
        technical: {},
        performance: {},
        innovation: {}
    };

    try {
        // Connect to Redis
        const client = createClient({ url: process.env.REDIS_URL });
        await client.connect();
        console.log('✓ Redis connection established');

        // 1. Documentation Validation
        console.log('\nValidating Documentation...');
        for (const doc of REQUIRED_DOCS) {
            try {
                await fs.access(doc);
                const stats = await fs.stat(doc);
                results.documentation[doc] = {
                    exists: true,
                    size: stats.size,
                    lastModified: stats.mtime
                };
                console.log(`✓ ${doc} validated`);
            } catch (err) {
                results.documentation[doc] = { exists: false, error: err.message };
                console.log(`✗ ${doc} not found`);
            }
        }

        // 2. Redis Module Validation
        console.log('\nValidating Redis Modules...');
        for (const [module, testKey] of Object.entries(REDIS_MODULE_KEYS)) {
            try {
                switch (module) {
                    case 'json':
                        const jsonResult = await client.json.get(testKey);
                        results.technical[module] = { active: !!jsonResult };
                        break;
                    case 'streams':
                        const streamResult = await client.xLen(testKey.replace('*', 'test'));
                        results.technical[module] = { active: true };
                        break;
                    case 'timeseries':
                        const tsResult = await client.ts.range(testKey.replace(/\*/g, 'test'), 0, '+');
                        results.technical[module] = { active: true };
                        break;
                    case 'vector':
                        const vectorResult = await client.ft.search('cache-index', '*');
                        results.technical[module] = { active: vectorResult.total > 0 };
                        break;
                }
                console.log(`✓ ${module} module validated`);
            } catch (err) {
                results.technical[module] = { active: false, error: err.message };
                console.log(`✗ ${module} module validation failed`);
            }
        }

        // 3. Performance Validation
        console.log('\nValidating Performance Metrics...');
        try {
            // Cache hit rate validation
            const cacheMetrics = await client.json.get('cache:metrics');
            results.performance.cacheHitRate = {
                value: cacheMetrics?.hitRate || 0,
                passes: (cacheMetrics?.hitRate || 0) >= PERFORMANCE_THRESHOLDS.cacheHitRate
            };
            console.log(`✓ Cache hit rate: ${cacheMetrics?.hitRate || 0}%`);

            // API response time validation
            const apiMetrics = await client.json.get('system:metrics:api');
            results.performance.apiResponseTime = {
                value: apiMetrics?.avgResponseTime || 0,
                passes: (apiMetrics?.avgResponseTime || 0) <= PERFORMANCE_THRESHOLDS.apiResponseTime
            };
            console.log(`✓ API response time: ${apiMetrics?.avgResponseTime || 0}ms`);

            // WebSocket latency validation
            const wsMetrics = await client.json.get('system:metrics:websocket');
            results.performance.wsLatency = {
                value: wsMetrics?.avgLatency || 0,
                passes: (wsMetrics?.avgLatency || 0) <= PERFORMANCE_THRESHOLDS.wsLatency
            };
            console.log(`✓ WebSocket latency: ${wsMetrics?.avgLatency || 0}ms`);
        } catch (err) {
            console.log(`✗ Performance metrics validation failed:`, err.message);
        }

        // 4. Innovation Validation
        console.log('\nValidating Innovation Features...');
        try {
            // Semantic cache validation
            const cacheKeys = await client.keys('cache:prompt:*');
            results.innovation.semanticCache = {
                active: cacheKeys.length > 0,
                keyCount: cacheKeys.length
            };
            console.log(`✓ Semantic cache active with ${cacheKeys.length} entries`);

            // Multi-agent system validation
            const agentProfiles = await client.keys('agent:*:profile');
            results.innovation.multiAgent = {
                active: agentProfiles.length >= 2,
                agentCount: agentProfiles.length
            };
            console.log(`✓ Multi-agent system active with ${agentProfiles.length} agents`);

            // Business metrics validation
            const businessMetrics = await client.json.get('system:metrics:business');
            results.innovation.businessMetrics = {
                active: !!businessMetrics,
                metrics: businessMetrics
            };
            console.log(`✓ Business metrics system validated`);
        } catch (err) {
            console.log(`✗ Innovation features validation failed:`, err.message);
        }

        // Calculate final scores
        const scores = calculateContestScores(results);
        
        // Save validation results
        await fs.writeFile(
            'contest-validation-results.json',
            JSON.stringify({ results, scores }, null, 2)
        );

        console.log('\nValidation Summary:');
        console.log('-------------------');
        console.log(`Documentation Score: ${scores.documentation}/10`);
        console.log(`Technical Score: ${scores.technical}/40`);
        console.log(`Performance Score: ${scores.performance}/20`);
        console.log(`Innovation Score: ${scores.innovation}/30`);
        console.log(`Total Score: ${scores.total}/100`);

        await client.quit();
        return { results, scores };

    } catch (err) {
        console.error('Validation failed:', err);
        throw err;
    }
}

function calculateContestScores(results) {
    // Initialize score components
    let scores = {
        documentation: 0,
        technical: 0,
        performance: 0,
        innovation: 0,
        total: 0
    };

    // Documentation scoring (10 points)
    const docCount = Object.values(results.documentation)
        .filter(doc => doc.exists).length;
    scores.documentation = Math.round((docCount / REQUIRED_DOCS.length) * 10);

    // Technical scoring (40 points)
    const activeModules = Object.values(results.technical)
        .filter(module => module.active).length;
    scores.technical = Math.round((activeModules / Object.keys(REDIS_MODULE_KEYS).length) * 40);

    // Performance scoring (20 points)
    let perfScore = 0;
    if (results.performance.cacheHitRate?.passes) perfScore += 7;
    if (results.performance.apiResponseTime?.passes) perfScore += 7;
    if (results.performance.wsLatency?.passes) perfScore += 6;
    scores.performance = perfScore;

    // Innovation scoring (30 points)
    let innovScore = 0;
    if (results.innovation.semanticCache?.active) innovScore += 10;
    if (results.innovation.multiAgent?.active) innovScore += 10;
    if (results.innovation.businessMetrics?.active) innovScore += 10;
    scores.innovation = innovScore;

    // Calculate total score
    scores.total = scores.documentation + scores.technical + 
                  scores.performance + scores.innovation;

    return scores;
}

// Run validation
validateContestChecklist()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Validation failed:', err);
        process.exit(1);
    });

export { validateContestChecklist };
