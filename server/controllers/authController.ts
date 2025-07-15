import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import argon2 from "argon2";
import { storage } from "../storage.js";
import { TokenService, AuthenticatedRequest } from "../middleware/auth.js";
import { 
  ApiError, 
  AuthenticationError, 
  ConflictError, 
  ValidationError,
  asyncHandler 
} from "../utils/errors.js";
import { env } from "../config/environment.js";

// Validation schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required").max(50),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address").max(255),
  role: z.enum(["admin", "auditor", "supervisor", "viewer"]).default("auditor"),
  team: z.string().max(50).optional(),
  zones: z.array(z.string()).default([]),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "New password must be at least 8 characters")
    .max(128, "New password must be less than 128 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "New password must contain at least one lowercase letter, one uppercase letter, and one number"),
});

// Password hashing utilities
class PasswordService {
  static async hash(password: string): Promise<string> {
    try {
      return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 19456, // 19 MB
        timeCost: 2,
        parallelism: 1,
      });
    } catch (error) {
      throw new ApiError(500, "Password hashing failed");
    }
  }

  static async verify(hashedPassword: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, password);
    } catch (error) {
      throw new ApiError(500, "Password verification failed");
    }
  }
}

// Auth Controller Class
export class AuthController {
  // POST /api/auth/login
  static login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { username, password } = loginSchema.parse(req.body);

    // Find user by username
    const user = await storage.getUserByUsername(username);
    if (!user) {
      throw new AuthenticationError("Invalid credentials");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError("Account is deactivated");
    }

    // Verify password
    const isValidPassword = await PasswordService.verify(user.password, password);
    if (!isValidPassword) {
      throw new AuthenticationError("Invalid credentials");
    }

    // Generate token pair
    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const { accessToken, refreshToken } = TokenService.generateTokenPair(tokenPayload);

    // Return success response
    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          team: user.team,
          zones: user.zones,
        },
      },
    });
  });

  // POST /api/auth/register
  static register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userData = registerSchema.parse(req.body);

    // Check if username already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      throw new ConflictError("Username already exists");
    }

    // Hash password
    const hashedPassword = await PasswordService.hash(userData.password);

    // Create user
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });

    // Return success response (no tokens for registration)
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          team: user.team,
          zones: user.zones,
        },
      },
    });
  });

  // POST /api/auth/refresh
  static refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = refreshTokenSchema.parse(req.body);

    // Verify refresh token
    const decoded = TokenService.verifyRefreshToken(refreshToken);

    // Verify user still exists and is active
    const user = await storage.getUser(decoded.id);
    if (!user || !user.isActive) {
      throw new AuthenticationError("User not found or inactive");
    }

    // Generate new token pair
    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const tokens = TokenService.generateTokenPair(tokenPayload);

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  });

  // GET /api/auth/me
  static getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user: authUser } = req as AuthenticatedRequest;

    // Get fresh user data
    const user = await storage.getUser(authUser.id);
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          team: user.team,
          zones: user.zones,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      },
    });
  });

  // PUT /api/auth/change-password
  static changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user: authUser } = req as AuthenticatedRequest;
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    // Get user data
    const user = await storage.getUser(authUser.id);
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Verify current password
    const isValidPassword = await PasswordService.verify(user.password, currentPassword);
    if (!isValidPassword) {
      throw new AuthenticationError("Current password is incorrect");
    }

    // Hash new password
    const hashedPassword = await PasswordService.hash(newPassword);

    // Update password
    await storage.updateUser(user.id, { password: hashedPassword });

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  });

  // POST /api/auth/logout (optional - for token blacklisting in production)
  static logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // In a production app, you would blacklist the token here
    // For now, we'll just return a success response
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  });
}