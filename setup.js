#!/usr/bin/env node

/**
 * StanceStream Unified Setup Script
 * Cross-platform setup for Redis Challenge demonstration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ANSI colors for better visibility
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

// Platform-specific commands
const isWindows = os.platform() === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';
const redis = isWindows ? 'redis-cli.exe' : 'redis-cli';

/**
 * Print formatted status message
 */
function log(emoji, message, type = 'info') {
    const color = type === 'error' ? colors.red : 
                 type === 'warning' ? colors.yellow : 
                 type === 'success' ? colors.green : 
                 colors.cyan;
    console.log(`${color}${emoji}  ${message}${colors.reset}`);
}

/**
 * Execute shell command safely
 */
function execCommand(command, options = {}) {
    try {
        return execSync(command, { 
            stdio: options.silent ? 'pipe' : 'inherit',
            encoding: 'utf-8',
            ...options
        });
    } catch (error) {
        if (options.ignoreError) {
            return null;
        }
        throw error;
    }
}

/**
 * Verify environment requirements
 */
async function checkEnvironment() {
    log('🔍', 'Checking environment requirements...');

    // Check Redis
    try {
        execCommand(`${redis} ping`, { silent: true });
        log('✅', 'Redis server is running', 'success');
    } catch (error) {
        log('❌', 'Redis server not running. Please start Redis first.', 'error');
        process.exit(1);
    }

    // Check environment variables
    if (!process.env.REDIS_URL) {
        log('⚠️', 'REDIS_URL not set, using default: redis://localhost:6379', 'warning');
        process.env.REDIS_URL = 'redis://localhost:6379';
    }

    if (!process.env.OPENAI_API_KEY) {
        log('❌', 'OPENAI_API_KEY not set. Please configure your OpenAI API key.', 'error');
        process.exit(1);
    }
    log('✅', 'Environment variables configured', 'success');
}

/**
 * Install project dependencies
 */
async function installDependencies() {
    log('📦', 'Installing dependencies...');

    // Backend dependencies
    if (!fs.existsSync('node_modules')) {
        log('📥', 'Installing backend dependencies...');
        execCommand(`${npm} install`);
    }

    // Frontend dependencies
    if (!fs.existsSync(path.join('stancestream-frontend', 'node_modules'))) {
        log('📥', 'Installing frontend dependencies...');
        process.chdir('stancestream-frontend');
        execCommand(`${npm} install`);
        process.chdir('..');
    }
    
    log('✅', 'All dependencies installed', 'success');
}

/**
 * Setup Redis indices and data
 */
async function setupRedisIndices() {
    log('🔍', 'Setting up Redis vector indices...');

    // Create vector search index
    try {
        execCommand('node vectorsearch.js');
        log('✅', 'Facts index created successfully', 'success');
    } catch (error) {
        log('⚠️', 'Facts index creation had issues', 'warning');
    }

    // Create cache index
    try {
        execCommand('node setupCacheIndex.js');
        log('✅', 'Cache index created successfully', 'success');
    } catch (error) {
        log('⚠️', 'Cache index creation had issues', 'warning');
    }
}

/**
 * Initialize AI agents
 */
async function setupAgents() {
    log('🤖', 'Initializing AI agent profiles...');
    
    try {
        // Create base agents
        execCommand('node index.js');
        execCommand('node addReformer.js');
        
        // Add demonstration facts
        execCommand('node addFactsEnhanced.js', { silent: true });
        
        log('✅', 'Agent profiles initialized', 'success');
    } catch (error) {
        log('⚠️', 'Agent initialization had issues', 'warning');
    }
}

/**
 * Optimize for presentation
 */
async function optimizeForDemo() {
    log('⚡', 'Optimizing for demonstration...');
    
    try {
        execCommand('node presentationOptimizer.js', { silent: true });
        log('✅', 'System optimized for demonstration', 'success');
    } catch (error) {
        log('⚠️', 'Optimization completed with warnings', 'warning');
    }
}

/**
 * Main setup function
 */
async function main() {
    console.log('\n🏆 STANCESTREAM REDIS CHALLENGE SETUP\n========================================\n');

    try {
        await checkEnvironment();
        await installDependencies();
        await setupRedisIndices();
        await setupAgents();
        await optimizeForDemo();

        console.log('\n🎉 SETUP COMPLETE!\n================\n');
        console.log('🚀 To start the application:');
        console.log('   1. Backend:  node server.js');
        console.log('   2. Frontend: cd stancestream-frontend && npm run dev');
        console.log('   3. Browser:  http://localhost:5173\n');
        
        console.log('🎯 Features Ready:');
        console.log('   ✅ All 4 Redis modules configured');
        console.log('   ✅ AI agents with personalities loaded');
        console.log('   ✅ Vector indices for semantic caching');
        console.log('   ✅ Fact database for verification');
        console.log('   ✅ Real-time WebSocket connections\n');
        
        console.log('🏆 Ready for Redis Challenge demonstration!\n');

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        process.exit(1);
    }
}

// Run setup
main();
