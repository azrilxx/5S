#!/usr/bin/env node

/**
 * Development utilities for port management and server operations
 */

import { execSync } from 'child_process';
import { createServer } from 'net';

const DEFAULT_PORT = 5000;

/**
 * Check if a port is available
 */
function checkPort(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(port, (err) => {
      if (err) {
        resolve(false);
      } else {
        server.close(() => resolve(true));
      }
    });
    server.on('error', () => resolve(false));
  });
}

/**
 * Kill process using a port
 */
function killPort(port) {
  console.log(`🔍 Checking port ${port}...`);
  
  try {
    // Try different commands for different systems
    const commands = [
      `lsof -ti:${port} | xargs kill -9`,
      `fuser -k ${port}/tcp`,
      `netstat -ano | findstr :${port} | for /f "tokens=5" %a in ('more') do taskkill /PID %a /F`
    ];

    for (const cmd of commands) {
      try {
        execSync(cmd, { stdio: 'ignore' });
        console.log(`✅ Port ${port} freed`);
        return true;
      } catch (error) {
        // Continue to next command
      }
    }
    
    console.log(`⚠️  Could not kill process on port ${port}`);
    return false;
  } catch (error) {
    console.error(`❌ Error killing port ${port}:`, error.message);
    return false;
  }
}

/**
 * Find available ports
 */
async function findAvailablePorts(startPort = DEFAULT_PORT, count = 5) {
  console.log(`🔍 Scanning for available ports starting from ${startPort}...`);
  
  const available = [];
  const busy = [];
  
  for (let i = 0; i < count; i++) {
    const port = startPort + i;
    const isAvailable = await checkPort(port);
    
    if (isAvailable) {
      available.push(port);
    } else {
      busy.push(port);
    }
  }
  
  console.log(`✅ Available ports: ${available.join(', ')}`);
  if (busy.length > 0) {
    console.log(`⚠️  Busy ports: ${busy.join(', ')}`);
  }
  
  return { available, busy };
}

/**
 * Main CLI handler
 */
async function main() {
  const [,, command, ...args] = process.argv;
  
  switch (command) {
    case 'check-port':
      const port = parseInt(args[0]) || DEFAULT_PORT;
      const isAvailable = await checkPort(port);
      console.log(`Port ${port} is ${isAvailable ? 'available' : 'busy'}`);
      process.exit(isAvailable ? 0 : 1);
      
    case 'kill-port':
      const targetPort = parseInt(args[0]) || DEFAULT_PORT;
      const killed = killPort(targetPort);
      process.exit(killed ? 0 : 1);
      
    case 'scan-ports':
      const startPort = parseInt(args[0]) || DEFAULT_PORT;
      const count = parseInt(args[1]) || 5;
      await findAvailablePorts(startPort, count);
      break;
      
    case 'health-check':
      const healthPort = parseInt(args[0]) || DEFAULT_PORT;
      try {
        const response = await fetch(`http://localhost:${healthPort}/health`);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Server healthy on port ${healthPort}`);
          console.log(`   Uptime: ${Math.round(data.uptime)}s`);
          console.log(`   Environment: ${data.environment}`);
        } else {
          console.log(`⚠️  Server responding but not healthy (status: ${response.status})`);
        }
      } catch (error) {
        console.log(`❌ Server not responding on port ${healthPort}`);
        process.exit(1);
      }
      break;
      
    default:
      console.log(`
🔧 Development Utilities

Usage:
  node scripts/dev-utils.js <command> [args]

Commands:
  check-port [port]     Check if a port is available (default: 5000)
  kill-port [port]      Kill process using a port (default: 5000)
  scan-ports [start] [count]  Scan for available ports (default: 5000, 5)
  health-check [port]   Check server health (default: 5000)

Examples:
  node scripts/dev-utils.js check-port 3000
  node scripts/dev-utils.js kill-port 5000
  node scripts/dev-utils.js scan-ports 5000 10
  node scripts/dev-utils.js health-check
      `);
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}