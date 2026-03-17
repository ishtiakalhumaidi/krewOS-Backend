import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  JWT_SECRET: string;
  FRONTEND_URL: string;

  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
}

const loadEnv = (): EnvConfig => {
  const requiredVars = [
    "NODE_ENV",
    "PORT",
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "JWT_SECRET",
    "FRONTEND_URL",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
  ];

  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      throw new Error(
        `Environment variable ${varName} is required but not set in .env. Please add it to the .env file.`,
      );
    }
  });

  return {
    NODE_ENV: process.env.NODE_ENV as string,
    PORT: Number(process.env.PORT),
    DATABASE_URL: process.env.DATABASE_URL as string,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL as string,
    JWT_SECRET: process.env.JWT_SECRET as string,
    FRONTEND_URL: process.env.FRONTEND_URL as string,
    SMTP_HOST: process.env.SMTP_HOST as string,
    SMTP_PORT: Number(process.env.SMTP_PORT),
    SMTP_USER: process.env.SMTP_USER as string,
    SMTP_PASS: process.env.SMTP_PASS as string,
  };
};

export const envVars = loadEnv();
