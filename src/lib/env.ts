/**
 * Environment variable validation and type-safe access
 * 
 * This ensures all required environment variables are present at build/runtime
 * and provides type-safe access throughout the application.
 */

const requiredEnvVars = [] as const;

const optionalEnvVars = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Dieter HQ',
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

// Validate required environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const env = {
  ...optionalEnvVars,
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
} as const;

export type Env = typeof env;
