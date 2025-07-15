import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "../config/environment.js";

// General API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // 15 minutes default
  max: env.RATE_LIMIT_MAX_REQUESTS, // 100 requests per window
  message: {
    error: "Too many requests",
    message: "Rate limit exceeded. Please try again later.",
    retryAfter: env.RATE_LIMIT_WINDOW_MS / 1000,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain IPs (e.g., health checks)
  skip: (req) => {
    const allowedIPs = ["127.0.0.1", "::1"];
    return allowedIPs.includes(req.ip || "");
  },
});

// Strict rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.LOGIN_RATE_LIMIT_MAX, // 5 attempts per window
  message: {
    error: "Too many login attempts",
    message: "Account temporarily locked. Please try again later.",
    retryAfter: env.RATE_LIMIT_WINDOW_MS / 1000,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use IP + user agent for more specific rate limiting
  keyGenerator: (req) => {
    return `${req.ip}-${req.get("User-Agent") || "unknown"}`;
  },
});

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for better compatibility
});

// Request sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Basic XSS protection - strip HTML tags from string inputs
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === "string") {
      return obj.replace(/<script[^>]*>.*?<\/script>/gi, "")
                .replace(/<[\/\!]*?[^<>]*?>/gi, "")
                .trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// CORS configuration
export const corsConfig = {
  origin: env.NODE_ENV === "production" 
    ? env.CORS_ORIGIN.split(",")
    : true, // Allow all origins in development
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With", 
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
  ],
  exposedHeaders: ["X-Total-Count"],
  maxAge: 86400, // 24 hours
};