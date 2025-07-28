# MindChain Project Structure

## 📁 Root Directory
```
mindchain/
├── 📄 README.md                    # Main project documentation
├── ⚙️ package.json                 # Node.js dependencies & scripts
├── 🔒 .env                         # Environment variables (Redis, OpenAI)
├── 🔒 .env.example                 # Template for environment setup
└── 🚫 .gitignore                   # Git ignore rules
```

## 🔧 Core Backend Files
```
├── 🖥️  server.js                   # Main Express + WebSocket server
├── 🤖 generateMessage.js          # AI message generation with topic support
├── ✅ factChecker.js               # Vector-based fact verification
├── 🔍 vectorsearch.js             # Redis vector index setup
├── 👤 addReformer.js              # Agent profile initialization
└── 🏠 index.js                    # Basic Redis setup & testing
```

## 🧪 Testing & Enhanced Features
```
├── 🎭 simulateDebate.js           # Standalone debate simulation
├── 📊 addFactsEnhanced.js         # Advanced fact database management
└── 📝 summarizeDebateEnhanced.js  # AI-powered debate summaries
```

## 🎨 Frontend Application
```
mindchain-frontend/
├── 📄 package.json                # React + Vite dependencies
├── ⚙️ vite.config.js              # Vite build configuration
├── 🎨 tailwind.config.js          # Tailwind CSS setup
├── 📱 index.html                  # HTML entry point
└── src/
    ├── 🏠 App.jsx                 # Main React application
    ├── 🎯 main.jsx                # React entry point
    ├── components/
    │   ├── 🎛️  EnhancedControls.jsx   # Unified debate controls & topic selection
    │   ├── 🗣️  DebatePanel.jsx        # Live debate message display
    │   ├── 📊 EnhancedPerformanceDashboard.jsx # Advanced Redis metrics
    │   ├── 🎭 TrueMultiDebateViewer.jsx # Multi-debate concurrent display
    │   ├── ✅ FactChecker.jsx         # Fact verification display
    │   └── 🏠 Header.jsx              # Application header with status
    ├── hooks/
    │   └── 🔌 useWebSocket.js     # WebSocket connection management
    └── services/
        └── 🌐 api.js              # Backend API integration
```

## 📚 Documentation
```
docs/
├── 📋 ENHANCEMENT-SUMMARY.md      # Feature implementation log
├── ✅ SETUP-COMPLETE.md           # Installation & setup guide
└── 🔧 LATEST-FIXES.md            # Recent bug fixes & updates
```

## 🗄️ Archive (Legacy Files)
```
archive/
├── 📄 README-old.md               # Previous documentation versions
├── 📄 README-updated.md
├── 🔧 addFacts.js                 # Superseded by enhanced version
├── 📝 summarizeDebate.js         # Superseded by enhanced version
├── ⚙️  debateEngine.js            # Functionality moved to server.js
├── 💾 memoryStream.js            # Integrated into generateMessage.js
├── 🔍 searchFacts.js             # Functionality in factChecker.js
├── 👁️  viewProfile.js             # Standalone utility
├── 🧪 test-setup.js              # Old testing script
├── 🎭 DebatePanel-old.jsx        # Previous UI versions
└── 🎭 DebatePanel-fixed.jsx
```

## 🔐 Configuration Files
```
.github/
└── 📋 copilot-instructions.md     # AI assistant development guide
```

## 📦 Dependencies
- **Backend**: Express.js, Redis, OpenAI, WebSocket, CORS
- **Frontend**: React 19, Vite 7, Tailwind CSS
- **AI**: GPT-4 for responses, text-embedding-ada-002 for vectors
- **Database**: Redis with JSON, Streams, TimeSeries, Vector modules

## 🚀 Quick Commands
```bash
# Backend
npm run start          # Start main server
npm run setup          # Initialize Redis indices & agents

# Frontend  
npm run frontend       # Start development server
npm run build          # Build for production
```
