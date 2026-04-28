import express, { Application, Request, Response } from "express";
import { IndexRouter } from "./app/routes";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFoundHandler } from "./app/middleware/notFoundHandler";

import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/lib/auth";
import path from "path";
import cors from "cors";
// import { envVars } from "./app/config/env";
import { BillingController } from "./app/module/billing/billing.controller";
import { envVars } from "./app/config/env";

const app: Application = express();

app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), `src/app/templates/`));

app.post(
  "/api/v1/billing/webhook",
  express.raw({ type: "application/json" }),
  BillingController.handleStripeWebhook,
);

app.use(
  cors({
    origin: [
      envVars.FRONTEND_URL,
      envVars.BETTER_AUTH_URL,
      "https://krew-os.vercel.app",
      "http://localhost:5000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/api/auth", toNodeHandler(auth));

// Middleware to parse JSON bodies
app.use(express.json({ limit: "50mb" }));
// Enable URL-encoded form data parsing
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Register the IndexRouter for API routes
app.use("/api/v1", IndexRouter);

// Basic route
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the KrewOS Backend!");
});

app.use(globalErrorHandler);
app.use(notFoundHandler);
export default app;
