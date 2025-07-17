import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/environment.js";
import { storage } from "../storage.js";
import { ApiError } from "../utils/errors.js";

export interface JWTPayload {
  id: number;
  username: string;
  role: string;
  tokenType: "access" | "refresh";
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    username: string;
    role: string;
  };
}

export class TokenService {
  static generateAccessToken(payload: Omit<JWTPayload, "tokenType" | "iat" | "exp">): string {
    const options: any = { expiresIn: env.JWT_ACCESS_EXPIRY };
    return jwt.sign(
      { ...payload, tokenType: "access" as const },
      env.JWT_SECRET,
      options
    ) as string;
  }

  static generateRefreshToken(payload: Omit<JWTPayload, "tokenType" | "iat" | "exp">): string {
    const options: any = { expiresIn: env.JWT_REFRESH_EXPIRY };
    return jwt.sign(
      { ...payload, tokenType: "refresh" as const },
      env.JWT_REFRESH_SECRET,
      options
    ) as string;
  }

  static generateTokenPair(payload: Omit<JWTPayload, "tokenType" | "iat" | "exp">) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
      if (decoded.tokenType !== "access") {
        throw new ApiError(401, "Invalid token type");
      }
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(401, "Access token expired");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(401, "Invalid access token");
      }
      throw error;
    }
  }

  static verifyRefreshToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;
      if (decoded.tokenType !== "refresh") {
        throw new ApiError(401, "Invalid token type");
      }
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(401, "Refresh token expired");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(401, "Invalid refresh token");
      }
      throw error;
    }
  }
}

// Extract token from Authorization header
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

// Main authentication middleware
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      throw new ApiError(401, "Access token required");
    }

    const decoded = TokenService.verifyAccessToken(token);
    
    // Verify user still exists and is active
    const user = await storage.getUser(decoded.id);
    if (!user || !user.isActive) {
      throw new ApiError(401, "User not found or inactive");
    }

    // Attach user info to request
    (req as AuthenticatedRequest).user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      throw new ApiError(401, "Authentication required");
    }

    if (!allowedRoles.includes(user.role)) {
      throw new ApiError(403, "Insufficient permissions");
    }

    next();
  };
};

// Admin only middleware (includes superadmin)
export const requireAdmin = requireRole(["admin", "superadmin"]);

// Supervisor or Admin middleware (includes superadmin)
export const requireSupervisor = requireRole(["admin", "superadmin", "supervisor"]);

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = TokenService.verifyAccessToken(token);
      const user = await storage.getUser(decoded.id);
      
      if (user && user.isActive) {
        (req as AuthenticatedRequest).user = {
          id: user.id,
          username: user.username,
          role: user.role,
        };
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't fail on token errors
    next();
  }
};