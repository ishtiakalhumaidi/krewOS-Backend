import dotenv from "dotenv";
import AppError from "../errorHelpers/AppError";
import status from "http-status";

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

  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;

  ACCESS_TOKEN_SECRET: string;
  REFRESH_TOKEN_SECRET: string;
  ACCESS_TOKEN_EXPIRES_IN: string;
  REFRESH_TOKEN_EXPIRES_IN: string;

  BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: string;
  BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: string;

  // Google OAuth
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  CRON_SECRET: string;
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

    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_SECRET_KEY",

    "ACCESS_TOKEN_SECRET",
    "REFRESH_TOKEN_SECRET",
    "ACCESS_TOKEN_EXPIRES_IN",
    "REFRESH_TOKEN_EXPIRES_IN",

    "BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN",
    "BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE",

    // Google OAuth
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_CALLBACK_URL",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "CRON_SECRET",
  ];

  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      throw new AppError(
        status.INTERNAL_SERVER_ERROR,
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

    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET as string,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,

    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
    ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN as string,
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN as string,

    BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: process.env
      .BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN as string,

    BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: process.env
      .BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE as string,

    // Google OAuth
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string,

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
    CRON_SECRET: process.env.CRON_SECRET as string,
  };
};

export const envVars = loadEnv();
