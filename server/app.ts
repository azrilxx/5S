import express, { type Express } from "express";
import cors from "cors";
import { env } from "./config/environment.js";
import { 
  apiRateLimit, 
  securityHeaders, 
  sanitizeInput,
  corsConfig 
} from "./middleware/security.js";
import { errorHandler, notFoundHandler } from "./utils/errors.js";
import { createServer, type Server } from "http";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import { registerLegacyRoutes } from "./routes.js"; // Legacy routes

export function createApp(): Express {
  const app = express();

  // Trust proxy for accurate IP addresses (important for rate limiting)
  app.set("trust proxy", 1);

  // Basic middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Security middleware (applied in order)
  if (env.HELMET_ENABLED) {
    app.use(securityHeaders);
  }
  app.use(cors(corsConfig));
  app.use(sanitizeInput);

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        
        // Log user info if available
        if ((req as any).user) {
          logLine += ` (user: ${(req as any).user.username})`;
        }

        if (capturedJsonResponse && env.LOG_LEVEL === "debug") {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 120) {
          logLine = logLine.slice(0, 119) + "…";
        }

        console.log(`[${new Date().toISOString()}] ${logLine}`);
      }
    });

    next();
  });

  // Health check endpoint (before rate limiting)
  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
    });
  });

  // Apply rate limiting to API routes
  app.use("/api", apiRateLimit);

  // Modern route handlers
  app.use("/api/auth", authRoutes);

  // Legacy routes (to be refactored)
  registerLegacyRoutes(app);

  return app;
}

export function addFinalMiddleware(app: Express) {
  // 404 handler for unmatched API routes only
  app.use("/api/*", notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

export async function startServer(app: Express, port?: number): Promise<{ server: Server; port: number }> {
  const server = createServer(app);
  const actualPort = port || env.PORT;

  return new Promise((resolve, reject) => {
    const onError = (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        reject(new Error(
          `❌ Port ${actualPort} is already in use. ` +
          `Please ensure no other process is using this port or choose a different one.`
        ));
      } else if (error.code === 'EACCES') {
        reject(new Error(
          `❌ Permission denied to bind to port ${actualPort}. ` +
          `Try using a port number above 1024 or run with elevated privileges.`
        ));
      } else {
        reject(error);
      }
    };

    const onListening = () => {
      const address = server.address();
      const actualPort = typeof address === 'string' ? parseInt(address) : address?.port || env.PORT;
      
      console.log(`🚀 Server running on http://${env.HOST}:${actualPort}`);
      console.log(`📝 Environment: ${env.NODE_ENV}`);
      console.log(`🔒 Security headers: ${env.HELMET_ENABLED ? "enabled" : "disabled"}`);
      console.log(`⚡ Process ID: ${process.pid}`);
      
      if (env.NODE_ENV === "development") {
        console.log(`🔄 Auto-restart enabled (watching for changes)`);
      }
      
      resolve({ server, port: actualPort });
    };

    server.on('error', onError);
    server.on('listening', onListening);

    server.listen({
      port: actualPort,
      host: env.HOST,
    });
  });
}