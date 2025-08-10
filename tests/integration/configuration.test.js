/**
 * Integration Tests - Configuration and Startup
 * Tests system startup, configuration validation, and error handling
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createClient } from 'redis';
import OpenAI from 'openai';
import { validateSystem } from '../../src/config/environment.js';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler.js';
import express from 'express';
import request from 'supertest';

describe('System Configuration Integration', () => {
    let app;
    let redisClient;
    let openai;
    let sandbox;
    let processEnvBackup;

    before(() => {
        // Backup current process.env
        processEnvBackup = { ...process.env };
        sandbox = sinon.createSandbox();
        
        // Create Express app for testing error handlers
        app = express();
        app.use(express.json());
    });

    afterEach(() => {
        // Restore process.env after each test
        process.env = { ...processEnvBackup };
        sandbox.restore();
    });

    describe('System Startup Validation', () => {
        beforeEach(() => {
            // Set required environment variables
            process.env.REDIS_URL = 'redis://localhost:6379';
            process.env.OPENAI_API_KEY = 'sk-test123';
            process.env.NODE_ENV = 'test';

            // Create mock clients
            redisClient = {
                ping: sandbox.stub().resolves('PONG'),
                info: sandbox.stub().resolves(
                    'module:name=JSON\nmodule:name=search\nmodule:name=timeseries'
                )
            };

            openai = {
                embeddings: {
                    create: sandbox.stub().resolves({
                        data: [{ embedding: new Array(1536).fill(0.1) }]
                    })
                }
            };
        });

        it('should validate complete system configuration', async () => {
            const result = await validateSystem({
                redisClient,
                openai
            });

            expect(result.environment.success).to.be.true;
            expect(result.redis.success).to.be.true;
            expect(result.openai.success).to.be.true;
            expect(result.config).to.have.property('REDIS_URL');
            expect(result.config).to.have.property('OPENAI_API_KEY');
        });

        it('should handle missing Redis modules', async () => {
            redisClient.info = sandbox.stub().resolves('module:name=JSON');

            try {
                await validateSystem({ redisClient, openai });
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error.message).to.include('Required Redis modules missing');
            }
        });

        it('should handle OpenAI API errors', async () => {
            openai.embeddings.create = sandbox.stub().rejects(
                new Error('Invalid API key')
            );

            try {
                await validateSystem({ redisClient, openai });
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error.message).to.include('OpenAI API validation failed');
            }
        });
    });

    describe('Error Handling Integration', () => {
        beforeEach(() => {
            // Set up error handlers
            app.use(errorHandler);
            app.use(notFoundHandler);
        });

        it('should handle Redis errors appropriately', async () => {
            app.get('/test-redis-error', (req, res, next) => {
                const error = new Error('Redis connection failed');
                error.type = 'redis';
                next(error);
            });

            const response = await request(app)
                .get('/test-redis-error')
                .expect(503);

            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('code', 'REDIS_ERROR');
        });

        it('should handle OpenAI errors appropriately', async () => {
            app.get('/test-openai-error', (req, res, next) => {
                const error = new Error('OpenAI API error');
                error.type = 'openai';
                next(error);
            });

            const response = await request(app)
                .get('/test-openai-error')
                .expect(503);

            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('code', 'OPENAI_ERROR');
        });

        it('should handle validation errors', async () => {
            app.get('/test-validation-error', (req, res, next) => {
                const error = new Error('Invalid input');
                error.type = 'validation';
                error.details = { field: 'topic', message: 'Required' };
                next(error);
            });

            const response = await request(app)
                .get('/test-validation-error')
                .expect(400);

            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('code', 'VALIDATION_ERROR');
            expect(response.body).to.have.property('details');
        });

        it('should handle rate limit errors', async () => {
            app.get('/test-rate-limit', (req, res, next) => {
                const error = new Error('Too many requests');
                error.type = 'rate_limit';
                error.retryAfter = 60;
                next(error);
            });

            const response = await request(app)
                .get('/test-rate-limit')
                .expect(429);

            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('code', 'RATE_LIMIT_EXCEEDED');
            expect(response.body).to.have.property('retryAfter', 60);
        });

        it('should handle 404 errors', async () => {
            const response = await request(app)
                .get('/non-existent-route')
                .expect(404);

            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('code', 'NOT_FOUND');
            expect(response.body).to.have.property('path');
        });

        it('should handle unexpected errors in development mode', async () => {
            process.env.NODE_ENV = 'development';

            app.get('/test-unexpected-error', (req, res, next) => {
                throw new Error('Unexpected error');
            });

            const response = await request(app)
                .get('/test-unexpected-error')
                .expect(500);

            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('code', 'INTERNAL_ERROR');
            expect(response.body).to.have.property('message');
            expect(response.body).to.have.property('stack');
        });

        it('should hide error details in production mode', async () => {
            process.env.NODE_ENV = 'production';

            app.get('/test-production-error', (req, res, next) => {
                throw new Error('Sensitive error details');
            });

            const response = await request(app)
                .get('/test-production-error')
                .expect(500);

            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('code', 'INTERNAL_ERROR');
            expect(response.body).to.not.have.property('stack');
            expect(response.body).to.not.have.property('message');
        });
    });
});
