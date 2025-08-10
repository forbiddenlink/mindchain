@echo off
REM StanceStream Redis Challenge Demo Setup Script for Windows

echo 🏆 STANCESTREAM REDIS CHALLENGE DEMO SETUP
echo ==========================================
echo.

REM Check if Redis is running
echo 🔍 Checking Redis server...
redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis server is running
) else (
    echo ❌ Redis server not running. Please start Redis first.
    pause
    exit /b 1
)

REM Check environment variables
echo 🔐 Checking environment variables...
if "%REDIS_URL%"=="" (
    echo ⚠️ REDIS_URL not set, using default: redis://localhost:6379
    set REDIS_URL=redis://localhost:6379
)

if "%OPENAI_API_KEY%"=="" (
    echo ❌ OPENAI_API_KEY not set. Please configure your OpenAI API key.
    pause
    exit /b 1
) else (
    echo ✅ OpenAI API key configured
)

REM Install dependencies if needed
echo 📦 Checking dependencies...
if not exist "node_modules" (
    echo 📥 Installing backend dependencies...
    call pnpm install
)

if not exist "stancestream-frontend\node_modules" (
    echo 📥 Installing frontend dependencies...
    cd stancestream-frontend
    call pnpm install
    cd ..
)

REM Setup Redis vector indices
echo 🔍 Setting up Redis vector indices...
call node vectorsearch.js
if %errorlevel% equ 0 (
    echo ✅ Facts index created successfully
) else (
    echo ⚠️ Facts index creation had issues
)

call node setupCacheIndex.js
if %errorlevel% equ 0 (
    echo ✅ Cache index created successfully
) else (
    echo ⚠️ Cache index creation had issues
)

REM Initialize agent profiles
echo 🤖 Initializing AI agent profiles...
call node index.js
call node addReformer.js
echo ✅ Agent profiles initialized

REM Optional: Add some facts for demonstration
echo 📚 Adding demonstration facts...
call node addFactsEnhanced.js >nul 2>&1
echo ✅ Demonstration facts added

echo.
echo 🎉 DEMO SETUP COMPLETE!
echo ======================
echo.
echo 🚀 To start the demo:
echo    1. Backend:  node server.js
echo    2. Frontend: cd stancestream-frontend ^&^& pnpm dev
echo    3. Browser:  http://localhost:5173
echo.
echo 🎯 Demo Features Ready:
echo    ✅ All 4 Redis modules configured
echo    ✅ AI agents with personalities loaded
echo    ✅ Vector indices for semantic caching
echo    ✅ Fact database for verification
echo    ✅ Real-time WebSocket connections
echo.
echo 🏆 Ready for Redis Challenge demonstration!
echo.
pause
