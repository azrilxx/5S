import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("5000").transform(Number),
  HOST: z.string().default("0.0.0.0"),
  
  // Database
  DATABASE_URL: z.string().optional(),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRY: z.string().default("8h"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  
  // Security
  BCRYPT_ROUNDS: z.string().default("12").transform(Number),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default("900000").transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default("100").transform(Number),
  LOGIN_RATE_LIMIT_MAX: z.string().default("5").transform(Number),
  
  // File Upload
  UPLOAD_MAX_SIZE: z.string().default("5242880").transform(Number),
  UPLOAD_ALLOWED_TYPES: z.string().default("image/jpeg,image/png,image/gif,image/webp"),
  
  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  
  // Features
  HELMET_ENABLED: z.string().default("true").transform(val => val === "true"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
});

export type Environment = z.infer<typeof envSchema>;

export function validateEnvironment(): Environment {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map(err => `${err.path.join(".")}: ${err.message}`)
        .join("\n");
      
      throw new Error(
        `❌ Environment validation failed:\n${missingVars}\n\n` +
        `Please check your .env file or environment variables.`
      );
    }
    throw error;
  }
}

export const env = validateEnvironment();