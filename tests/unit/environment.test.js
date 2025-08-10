import { expect } from 'chai';
import sinon from 'sinon';
import {
    validateEnvironment,
    validateSystem,
    requiredEnvVars,
    optionalEnvVars,
    redisConfig,
    openAIConfig
} from '../../src/config/environment.js';

describe('Environment Configuration', () => {
    let sandbox;
    let processEnvBackup;

    before(() => {
        // Backup current process.env
        processEnvBackup = { ...process.env };
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        // Restore process.env after each test
        process.env = { ...processEnvBackup };
        sandbox.restore();
    });

    describe('Required Environment Variables', () => {
        it('should validate required environment variables', () => {
            // Set up valid environment
            process.env.REDIS_URL = 'redis://localhost:6379';
            process.env.OPENAI_API_KEY = 'sk-test123';
            process.env.NODE_ENV = 'development';

            const config = validateEnvironment();
            expect(config).to.have.property('REDIS_URL');
            expect(config).to.have.property('OPENAI_API_KEY');
            expect(config).to.have.property('NODE_ENV');
        });

        it('should throw error for missing required variables', () => {
            // Clear required variables
            delete process.env.REDIS_URL;
            delete process.env.OPENAI_API_KEY;

            expect(() => validateEnvironment())
                .to.throw('Environment validation failed')
                .and.to.have.property('message')
                .that.includes('Missing required environment variable');
        });

        it('should validate REDIS_URL format', () => {
            process.env.REDIS_URL = 'invalid-url';
            process.env.OPENAI_API_KEY = 'sk-test123';
            process.env.NODE_ENV = 'development';

            expect(() => validateEnvironment())
                .to.throw()
                .and.to.have.property('message')
                .that.includes('REDIS_URL must start with redis://');
        });

        it('should validate OPENAI_API_KEY format', () => {
            process.env.REDIS_URL = 'redis://localhost:6379';
            process.env.OPENAI_API_KEY = 'invalid-key';
            process.env.NODE_ENV = 'development';

            expect(() => validateEnvironment())
                .to.throw()
                .and.to.have.property('message')
                .that.includes('OPENAI_API_KEY must be a valid OpenAI key');
        });
    });

    describe('Optional Environment Variables', () => {
        beforeEach(() => {
            // Set required variables
            process.env.REDIS_URL = 'redis://localhost:6379';
            process.env.OPENAI_API_KEY = 'sk-test123';
            process.env.NODE_ENV = 'development';
        });

        it('should use default values for missing optional variables', () => {
            delete process.env.PORT;
            delete process.env.LOG_LEVEL;

            const config = validateEnvironment();
            expect(config.PORT).to.equal(optionalEnvVars.PORT.default);
            expect(config.LOG_LEVEL).to.equal(optionalEnvVars.LOG_LEVEL.default);
        });

        it('should validate optional variable values when provided', () => {
            process.env.PORT = 'invalid';
            
            expect(() => validateEnvironment())
                .to.throw()
                .and.to.have.property('message')
                .that.includes('PORT must be a positive number');
        });

        it('should validate LOG_LEVEL values', () => {
            process.env.LOG_LEVEL = 'invalid';

            expect(() => validateEnvironment())
                .to.throw()
                .and.to.have.property('message')
                .that.includes('LOG_LEVEL must be error, warn, info, or debug');
        });
    });

    describe('Redis Configuration', () => {
        it('should validate Redis connection and modules', async () => {
            const mockClient = {
                ping: sinon.stub().resolves(),
                info: sinon.stub().resolves(
                    'module:name=JSON\nmodule:name=search\nmodule:name=timeseries'
                )
            };

            const result = await redisConfig.validateConnection(mockClient);
            expect(result.success).to.be.true;
        });

        it('should detect missing Redis modules', async () => {
            const mockClient = {
                ping: sinon.stub().resolves(),
                info: sinon.stub().resolves('module:name=JSON')
            };

            try {
                await redisConfig.validateConnection(mockClient);
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error.message).to.include('Required Redis modules missing');
            }
        });

        it('should handle Redis connection failures', async () => {
            const mockClient = {
                ping: sinon.stub().rejects(new Error('Connection failed')),
                info: sinon.stub().rejects(new Error('Connection failed'))
            };

            try {
                await redisConfig.validateConnection(mockClient);
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error.message).to.include('Redis connection validation failed');
            }
        });
    });

    describe('OpenAI Configuration', () => {
        it('should validate OpenAI API connection', async () => {
            const mockOpenAI = {
                embeddings: {
                    create: sinon.stub().resolves({ data: [{ embedding: [] }] })
                }
            };

            const result = await openAIConfig.validateConnection(mockOpenAI);
            expect(result.success).to.be.true;
        });

        it('should handle OpenAI API errors', async () => {
            const mockOpenAI = {
                embeddings: {
                    create: sinon.stub().rejects(new Error('Invalid API key'))
                }
            };

            try {
                await openAIConfig.validateConnection(mockOpenAI);
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error.message).to.include('OpenAI API validation failed');
            }
        });
    });

    describe('System Validation', () => {
        beforeEach(() => {
            // Set up valid environment
            process.env.REDIS_URL = 'redis://localhost:6379';
            process.env.OPENAI_API_KEY = 'sk-test123';
            process.env.NODE_ENV = 'development';
        });

        it('should validate entire system configuration', async () => {
            const mockServices = {
                redisClient: {
                    ping: sinon.stub().resolves(),
                    info: sinon.stub().resolves(
                        'module:name=JSON\nmodule:name=search\nmodule:name=timeseries'
                    )
                },
                openai: {
                    embeddings: {
                        create: sinon.stub().resolves({ data: [{ embedding: [] }] })
                    }
                }
            };

            const results = await validateSystem(mockServices);
            expect(results.environment.success).to.be.true;
            expect(results.redis.success).to.be.true;
            expect(results.openai.success).to.be.true;
        });

        it('should handle partial service validation', async () => {
            const mockServices = {
                redisClient: {
                    ping: sinon.stub().resolves(),
                    info: sinon.stub().resolves(
                        'module:name=JSON\nmodule:name=search\nmodule:name=timeseries'
                    )
                }
            };

            const results = await validateSystem(mockServices);
            expect(results.environment.success).to.be.true;
            expect(results.redis.success).to.be.true;
            expect(results.openai.success).to.be.false;
        });

        it('should fail validation on service errors', async () => {
            const mockServices = {
                redisClient: {
                    ping: sinon.stub().rejects(new Error('Connection failed')),
                    info: sinon.stub().rejects(new Error('Connection failed'))
                }
            };

            try {
                await validateSystem(mockServices);
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error.message).to.include('Redis connection validation failed');
            }
        });
    });
});
