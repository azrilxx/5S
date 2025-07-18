import { type Server } from "http";
import { createApp, startServer } from "./app.js";
import { setupVite, serveStatic } from "./vite.js";
import { env } from "./config/environment.js";
import { getAvailablePort, killPortProcess } from "./utils/port.js";

interface AppState {
  server?: Server;
  port?: number;
  isShuttingDown: boolean;
  startTime: Date;
}

const appState: AppState = {
  isShuttingDown: false,
  startTime: new Date(),
};

/**
 * Enhanced graceful shutdown with connection draining
 */
async function gracefulShutdown(signal: string): Promise<void> {
  if (appState.isShuttingDown) {
    console.log("⚠️  Shutdown already in progress, forcing exit...");
    process.exit(1);
  }

  appState.isShuttingDown = true;
  console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`);
  
  const shutdownTimeout = setTimeout(() => {
    console.error("❌ Forced shutdown due to timeout");
    process.exit(1);
  }, env.NODE_ENV === "production" ? 30000 : 10000); // 30s prod, 10s dev

  try {
    if (appState.server) {
      // Stop accepting new connections
      appState.server.close((err) => {
        clearTimeout(shutdownTimeout);
        
        if (err) {
          console.error("❌ Error during server shutdown:", err);
          process.exit(1);
        }
        
        const uptime = Date.now() - appState.startTime.getTime();
        console.log(`✅ Server closed successfully (uptime: ${Math.round(uptime / 1000)}s)`);
        process.exit(0);
      });

      // In development, give existing connections time to finish
      if (env.NODE_ENV === "development") {
        setTimeout(() => {
          console.log("🔄 Development mode: forcing connection close");
          process.exit(0);
        }, 2000);
      }
    } else {
      clearTimeout(shutdownTimeout);
      process.exit(0);
    }
  } catch (error) {
    clearTimeout(shutdownTimeout);
    console.error("❌ Error during graceful shutdown:", error);
    process.exit(1);
  }
}

/**
 * Handle unhandled rejections and exceptions
 */
function setupErrorHandlers(): void {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    if (env.NODE_ENV === "production") {
      gracefulShutdown('UNHANDLED_REJECTION');
    }
  });

  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    if (env.NODE_ENV === "production") {
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    }
  });
}

/**
 * Main application startup
 */
async function main(): Promise<void> {
  try {
    // Setup error handlers early
    setupErrorHandlers();

    console.log(`🚀 Starting ${env.NODE_ENV} server...`);
    
    // Create Express app with all middleware configured
    const app = createApp();

    // Get an available port (with fallback in development)
    let port: number;
    try {
      port = await getAvailablePort();
    } catch (portError) {
      if (env.NODE_ENV === "development") {
        console.log("🔧 Attempting to free up the port...");
        const freed = await killPortProcess(env.PORT);
        if (freed) {
          port = env.PORT;
        } else {
          throw portError;
        }
      } else {
        throw portError;
      }
    }

    // Start the HTTP server
    const { server, port: actualPort } = await startServer(app, port);
    appState.server = server;
    appState.port = actualPort;

    // Setup Vite in development or serve static files in production
    // This must be done after starting the server for HMR
    if (env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Initialize WebSocket server
    const { initializeWebSocket } = await import("./websocket.js");
    initializeWebSocket(server);

    // Add final middleware after Vite setup
    const { addFinalMiddleware } = await import("./app.js");
    addFinalMiddleware(app);

    // Setup graceful shutdown handlers
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    
    // Additional Windows-specific signals
    if (process.platform === "win32") {
      process.on("SIGBREAK", () => gracefulShutdown("SIGBREAK"));
    }

    // Log successful startup
    console.log("✅ Server started successfully");
    
    if (env.NODE_ENV === "development") {
      console.log(`\n📍 Development URLs:`);
      console.log(`   Local:    http://localhost:${actualPort}`);
      console.log(`   Network:  http://${env.HOST}:${actualPort}`);
      console.log(`   Health:   http://localhost:${actualPort}/health`);
      console.log(`\n💡 Press Ctrl+C to stop the server\n`);
    }

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    
    // In development, provide helpful error messages
    if (env.NODE_ENV === "development") {
      if (error instanceof Error && error.message.includes("EADDRINUSE")) {
        console.log("\n🔧 Troubleshooting tips:");
        console.log(`   • Check if another process is using port ${env.PORT}`);
        console.log(`   • Try: npm run kill-port ${env.PORT}`);
        console.log(`   • Or change the PORT in your .env file`);
      }
    }
    
    process.exit(1);
  }
}

// Prevent multiple starts
if (process.env.NODE_ENV !== "test") {
  main();
}
