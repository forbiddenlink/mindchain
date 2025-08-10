import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export const chai = require('chai');
export const expect = chai.expect;
export const sinon = require('sinon');
export const redis = require('redis');

// Test environment configuration
export const TEST_CONFIG = {
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    CACHE_INDEX: 'test-cache-index',
    FACTS_INDEX: 'test-facts-index',
    CACHE_PREFIX: 'test:cache:prompt:',
    TEST_TIMEOUT: 10000
};
