import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { env } from "../config/environment.js";

export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;
  public details?: any;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: any,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }

    this.name = this.constructor.name;
  }
}

// Predefined error types
export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, message, "VALIDATION_ERROR", details);
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = "Authentication failed") {
    super(401, message, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = "Insufficient permissions") {
    super(403, message, "AUTHORIZATION_ERROR");
  }
}

export class NotFoundError extends ApiError {
  constructor(resource = "Resource") {
    super(404, `${resource} not found`, "NOT_FOUND");
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message, "CONFLICT_ERROR");
  }
}

export class RateLimitError extends ApiError {
  constructor(message = "Rate limit exceeded") {
    super(429, message, "RATE_LIMIT_ERROR");
  }
}

export class InternalServerError extends ApiError {
  constructor(message = "Internal server error") {
    super(500, message, "INTERNAL_SERVER_ERROR", undefined, false);
  }
}

// Error response interface
interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: any;
    timestamp: string;
    path: string;
    method: string;
    requestId?: string;
  };
}

// Convert various error types to ApiError
function normalizeError(error: any): ApiError {
  // Already an ApiError
  if (error instanceof ApiError) {
    return error;
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    const details = error.errors.map(err => ({
      field: err.path.join("."),
      message: err.message,
      code: err.code,
    }));
    
    return new ValidationError("Validation failed", details);
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    return new AuthenticationError("Invalid token");
  }
  if (error.name === "TokenExpiredError") {
    return new AuthenticationError("Token expired");
  }

  // Multer errors (file upload)
  if (error.code === "LIMIT_FILE_SIZE") {
    return new ValidationError("File too large");
  }
  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return new ValidationError("Unexpected file field");
  }

  // Database errors (if using postgres)
  if (error.code === "23505") { // Unique constraint violation
    return new ConflictError("Resource already exists");
  }
  if (error.code === "23503") { // Foreign key constraint violation
    return new ValidationError("Referenced resource does not exist");
  }

  // Default to internal server error
  console.error("Unhandled error:", error);
  return new InternalServerError(
    env.NODE_ENV === "production" 
      ? "Something went wrong" 
      : error.message || "Internal server error"
  );
}

// Main error handling middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiError = normalizeError(error);
  
  // Log error details for debugging
  if (!apiError.isOperational || apiError.statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}:`, {
      error: apiError.message,
      stack: apiError.stack,
      user: (req as any).user?.id,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    error: {
      message: apiError.message,
      code: apiError.code,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      requestId: req.headers["x-request-id"] as string,
    },
  };

  // Include details in development or for validation errors
  if (env.NODE_ENV === "development" || apiError instanceof ValidationError) {
    errorResponse.error.details = apiError.details;
  }

  // Include stack trace in development for server errors
  if (env.NODE_ENV === "development" && apiError.statusCode >= 500) {
    (errorResponse.error as any).stack = apiError.stack;
  }

  res.status(apiError.statusCode).json(errorResponse);
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response): void => {
  const error = new NotFoundError("Endpoint");
  const errorResponse: ErrorResponse = {
    error: {
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    },
  };

  res.status(404).json(errorResponse);
};

// Async error wrapper to catch promise rejections
export const asyncHandler = <T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) => {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};