import { createServer } from "net";
import { env } from "../config/environment.js";

/**
 * Check if a port is available
 */
export function checkPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.listen(port, (err?: Error) => {
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
 * Find an available port starting from the preferred port
 */
export async function findAvailablePort(
  preferredPort: number, 
  maxAttempts: number = 10
): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const testPort = preferredPort + i;
    const isAvailable = await checkPortAvailable(testPort);
    
    if (isAvailable) {
      return testPort;
    }
  }
  
  throw new Error(
    `No available port found after ${maxAttempts} attempts starting from ${preferredPort}`
  );
}

/**
 * Get the next available port with smart fallback
 */
export async function getAvailablePort(): Promise<number> {
  const preferredPort = env.PORT;
  
  // In production, always use the configured port (fail fast if not available)
  if (env.NODE_ENV === "production") {
    const isAvailable = await checkPortAvailable(preferredPort);
    if (!isAvailable) {
      throw new Error(
        `❌ Production port ${preferredPort} is not available. ` +
        `Please ensure the port is free or configure a different PORT environment variable.`
      );
    }
    return preferredPort;
  }
  
  // In development, find an available port with fallback
  try {
    const availablePort = await findAvailablePort(preferredPort);
    
    if (availablePort !== preferredPort) {
      console.warn(
        `⚠️  Port ${preferredPort} is busy, using port ${availablePort} instead`
      );
    }
    
    return availablePort;
  } catch (error) {
    throw new Error(
      `❌ Could not find an available port starting from ${preferredPort}. ` +
      `Please check if other services are using nearby ports.`
    );
  }
}

/**
 * Kill process using a specific port (development only)
 */
export async function killPortProcess(port: number): Promise<boolean> {
  if (env.NODE_ENV === "production") {
    console.warn("⚠️  Port killing is disabled in production mode");
    return false;
  }
  
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    
    // Try to find and kill the process using the port
    const commands = [
      `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`,
      `fuser -k ${port}/tcp 2>/dev/null || true`,
      `netstat -ano | grep :${port} | awk '{print $5}' | xargs taskkill /PID /F 2>/dev/null || true`
    ];
    
    for (const command of commands) {
      try {
        await execAsync(command);
      } catch (error) {
        // Ignore errors, try next command
      }
    }
    
    // Wait a bit and check if port is now available
    await new Promise(resolve => setTimeout(resolve, 1000));
    const isNowAvailable = await checkPortAvailable(port);
    
    if (isNowAvailable) {
      console.log(`✅ Successfully freed port ${port}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn(`⚠️  Could not kill process on port ${port}:`, error);
    return false;
  }
}