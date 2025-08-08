# 🚀 Immediate Action Plan - StanceStream Refactoring

## STEP 1: Install Critical Dependencies

```bash
# Security & Validation
pnpm add helmet express-rate-limit joi express-validator

# Development Tools  
pnpm add -D eslint prettier nodemon jest supertest

# Performance & Monitoring
pnpm add winston morgan compression redis-pool

# Type Safety (Optional but Recommended)
pnpm add -D typescript @types/node @types/express
```

## STEP 2: Critical Files to Refactor (In Order)

### 1. `server.js` - PRIORITY 1
- **Issue**: 2,487 lines - unmaintainable monolith
- **Action**: Split into focused modules
- **Target**: Break into 8-10 smaller files

### 2. `generateMessage.js` - PRIORITY 2  
- **Issue**: Redis connection per call, no error handling
- **Action**: Implement connection pooling, error recovery

### 3. `semanticCache.js` - PRIORITY 3
- **Issue**: Connection management, error handling gaps
- **Action**: Improve robustness and fallbacks

## STEP 3: Immediate Security Fixes

```javascript
// Add to server.js imports
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

// Add middleware BEFORE routes
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

## STEP 4: Redis Connection Pooling

```javascript
// Create src/services/redis.js
import { createClient } from 'redis';

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (!this.client) {
      this.client = createClient({ url: process.env.REDIS_URL });
      await this.client.connect();
      this.isConnected = true;
    }
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }
}

export default new RedisService();
```

## STEP 5: Error Handling Middleware

```javascript
// Create src/middleware/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.type === 'redis') {
    return res.status(503).json({ 
      error: 'Database temporarily unavailable' 
    });
  }
  
  if (err.type === 'openai') {
    return res.status(503).json({ 
      error: 'AI service temporarily unavailable' 
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error' 
  });
};
```

## TODAY'S GOALS

1. ✅ **Document refactoring plan** (DONE)
2. 🔄 **Install security dependencies**
3. 🔄 **Create basic folder structure** 
4. 🔄 **Extract first route handler from server.js**
5. 🔄 **Add basic error handling middleware**

## TOMORROW'S GOALS  

1. 🔄 **Complete server.js breakdown**
2. 🔄 **Implement Redis service layer**
3. 🔄 **Add comprehensive input validation**
4. 🔄 **Fix OpenAI error handling**

---

**Ready to start?** Let's begin with Step 1 - adding the critical dependencies!
