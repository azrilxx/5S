# 🔧 Development Guide: Enhanced Server Management

## 🚀 Quick Start

```bash
# Start development server (with auto-restart)
npm run dev

# Alternative development modes
npm run dev:nodemon    # Using nodemon
npm run dev:ts-node    # Using ts-node-dev (if ESM issues resolved)

# Port management utilities
npm run kill-port-5000  # Kill process on port 5000
npm run restart         # Kill port 5000 and restart server
```

## 🔌 Port Management Features

### **Automatic Port Conflict Resolution**
```typescript
// The server now intelligently handles port conflicts:

1. ✅ Production: Fails fast if configured port is busy
2. ✅ Development: Automatically finds next available port (5000 → 5001 → 5002...)
3. ✅ Port killing: Can automatically free up ports in development
4. ✅ Helpful error messages with troubleshooting tips
```

### **Development Scripts**
```bash
# Basic development
npm run dev              # tsx watch with hot reload
npm run dev:nodemon      # nodemon with tsx execution
npm run dev:ts-node      # ts-node-dev (if ESM compatible)

# Port management
npm run kill-port        # Kill any port (specify with argument)
npm run kill-port-5000   # Kill process on port 5000
npm run restart          # Full restart (kill + start)

# Testing & validation
npm run test:watch       # Tests in watch mode
npm run check:watch      # TypeScript checking in watch mode

# Utilities
npm run clean            # Clean build artifacts
npm run reset            # Clean + reinstall dependencies
```

## 🛡️ Enhanced Startup Process

### **Development Mode Features**
- **Port Auto-Discovery**: Finds available ports starting from 5000
- **Process Conflict Resolution**: Automatically handles EADDRINUSE errors
- **Enhanced Logging**: Shows all accessible URLs and helpful tips
- **Hot Reload**: File watching with tsx/nodemon
- **Error Recovery**: Graceful error handling with recovery suggestions

### **Startup Sequence**
```
🚀 Starting development server...
🔍 Checking port 5000...
⚠️  Port 5000 is busy, using port 5001 instead
🚀 Server running on http://0.0.0.0:5001
📝 Environment: development
🔒 Security headers: disabled
⚡ Process ID: 1234
🔄 Auto-restart enabled (watching for changes)
✅ Server started successfully

📍 Development URLs:
   Local:    http://localhost:5001
   Network:  http://0.0.0.0:5001
   Health:   http://localhost:5001/health

💡 Press Ctrl+C to stop the server
```

## 🔄 Graceful Shutdown Features

### **Enhanced Shutdown Handling**
```typescript
// Handles multiple shutdown scenarios:
- SIGTERM (production deployments)
- SIGINT (Ctrl+C in development)
- SIGBREAK (Windows)
- Unhandled rejections/exceptions
- Connection draining
- Timeout protection (10s dev, 30s prod)
```

### **Shutdown Sequence**
```
⚠️  Received SIGINT. Starting graceful shutdown...
🔄 Development mode: forcing connection close
✅ Server closed successfully (uptime: 245s)
```

## 🔧 Development Utilities

### **Port Management Script**
```bash
# Check if port is available
node scripts/dev-utils.js check-port 5000

# Kill process on port
node scripts/dev-utils.js kill-port 5000

# Scan for available ports
node scripts/dev-utils.js scan-ports 5000 10

# Health check server
node scripts/dev-utils.js health-check 5000
```

### **Environment Configuration**
```bash
# .env file is automatically loaded
# Override specific variables:
PORT=3000 npm run dev
NODE_ENV=production npm run dev
LOG_LEVEL=debug npm run dev
```

## 🚨 Error Handling & Troubleshooting

### **Common Issues & Solutions**

#### **Port Already in Use**
```bash
❌ Port 5000 is already in use.

🔧 Troubleshooting tips:
   • Check if another process is using port 5000
   • Try: npm run kill-port 5000
   • Or change the PORT in your .env file

# Automatic solutions:
npm run restart          # Kill and restart
PORT=5001 npm run dev   # Use different port
```

#### **Environment Variable Issues**
```bash
❌ Environment validation failed:
JWT_SECRET: Required
JWT_REFRESH_SECRET: Required

Please check your .env file or environment variables.

# Solution: Copy from template
cp .env.example .env
# Then edit .env with proper values
```

#### **TypeScript Errors**
```bash
# Check types without running
npm run check

# Watch for type errors
npm run check:watch

# Fix auto-fixable issues
npm run lint:fix    # (when ESLint is added)
```

## ⚡ Performance & Monitoring

### **Development Monitoring**
```bash
# Built-in request logging shows:
[2025-07-15T01:01:10.264Z] POST /api/auth/login 200 in 42ms (user: admin)

# Health check provides:
{
  "status": "healthy",
  "timestamp": "2025-07-15T01:01:32.113Z",
  "uptime": 31.036146524,
  "environment": "development"
}

# Process information:
⚡ Process ID: 1234
🔄 Auto-restart enabled (watching for changes)
```

### **File Watching**
```typescript
// Watches these file types:
- server/**/*.ts     // Server code
- shared/**/*.ts     // Shared schemas
- .env              // Environment changes

// Ignores:
- node_modules/     // Dependencies
- **/*.test.ts      // Test files
- dist/             // Build output
- coverage/         // Test coverage
```

## 🎯 Best Practices

### **Development Workflow**
```bash
# 1. Start development
npm run dev

# 2. Run tests in parallel
npm run test:watch

# 3. Check types continuously
npm run check:watch

# 4. Before committing
npm run precommit
```

### **Production Testing**
```bash
# Build and test production bundle
npm run build
npm run start

# Check production health
node scripts/dev-utils.js health-check 5000

# Load testing
npm run test:load    # (to be implemented)
```

### **Debugging**
```bash
# Debug mode with inspector
npm run dev:debug

# Trace warnings and issues
npm run dev:trace

# Memory usage monitoring
npm run dev:memory   # (to be implemented)
```

---

## 📊 Current Status

### **✅ Implemented Features**
- Automatic port conflict resolution
- Enhanced graceful shutdown
- Development hot reload
- Environment validation
- Comprehensive error handling
- Request/response logging
- Health monitoring
- Process management
- Port management utilities

### **🔄 Next Steps**
- Add ESLint + Prettier configuration
- Implement database connection pooling
- Add distributed tracing
- Create Docker development setup
- Enhance monitoring dashboard

---

**The development experience is now production-grade with intelligent port management, comprehensive error handling, and excellent developer ergonomics!**