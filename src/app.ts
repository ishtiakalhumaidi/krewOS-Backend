import express, { Application, Request, Response } from "express";
import { IndexRouter } from "./app/routes";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFoundHandler } from "./app/middleware/notFoundHandler";
import AppError from "./app/errorHelpers/AppError";
import status from "http-status";

const app: Application = express();

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());

// Register the IndexRouter for API routes
app.use("/api/v1", IndexRouter);

// Basic route
app.get("/", (req: Request, res: Response) => {
  throw new AppError(status.BAD_REQUEST, "testing global error handler");
  // res.send("Welcome to the KrewOS Backend!");
});

app.use(globalErrorHandler);
app.use(notFoundHandler);
export default app;
