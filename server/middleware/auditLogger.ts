import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.js";
import { env } from "../config/environment.js";

// Audit log entry interface
interface AuditLogEntry {
  timestamp: string;
  event: string;
  userId?: number;
  username?: string;
  ip: string;
  userAgent: string;
  success: boolean;
  details?: any;
}

// In-memory audit log storage (in production, this would go to a database or log service)
const auditLogs: AuditLogEntry[] = [];

/**
 * Log authentication events for security auditing
 */
export function logAuditEvent(
  event: string,
  req: Request,
  success: boolean,
  details?: any,
  userId?: number,
  username?: string
): void {
  const logEntry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    event,
    userId,
    username,
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    success,
    details: details ? JSON.stringify(details) : undefined,
  };

  auditLogs.push(logEntry);

  // Log to console in development, would use proper logging service in production
  if (env.NODE_ENV === "development" || env.LOG_LEVEL === "debug") {
    console.log(`[AUDIT] ${logEntry.timestamp} | ${event} | ${success ? 'SUCCESS' : 'FAILURE'} | User: ${username || 'anonymous'} | IP: ${logEntry.ip}`);
  }

  // Keep only last 1000 entries in memory (for demo purposes)
  if (auditLogs.length > 1000) {
    auditLogs.shift();
  }
}

/**
 * Middleware to log authentication attempts
 */
export const auditLoginAttempt = (req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json;
  
  res.json = function(body: any) {
    const success = res.statusCode >= 200 && res.statusCode < 300;
    const username = req.body?.username || 'unknown';
    
    if (req.path.includes('/login')) {
      logAuditEvent('LOGIN_ATTEMPT', req, success, {
        statusCode: res.statusCode,
        username: username
      }, undefined, username);
    } else if (req.path.includes('/logout')) {
      const user = (req as AuthenticatedRequest).user;
      logAuditEvent('LOGOUT', req, success, {
        statusCode: res.statusCode
      }, user?.id, user?.username);
    } else if (req.path.includes('/refresh')) {
      logAuditEvent('TOKEN_REFRESH', req, success, {
        statusCode: res.statusCode
      });
    }
    
    return originalJson.call(this, body);
  };
  
  next();
};

/**
 * Get audit logs (admin only endpoint)
 */
export function getAuditLogs(limit: number = 100): AuditLogEntry[] {
  return auditLogs.slice(-limit).reverse();
}

/**
 * Log user action events
 */
export const auditUserAction = (action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    
    const originalJson = res.json;
    res.json = function(body: any) {
      const success = res.statusCode >= 200 && res.statusCode < 300;
      
      logAuditEvent(action, req, success, {
        statusCode: res.statusCode,
        method: req.method,
        path: req.path
      }, user?.id, user?.username);
      
      return originalJson.call(this, body);
    };
    
    next();
  };
};