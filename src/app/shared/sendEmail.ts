/* eslint-disable @typescript-eslint/no-explicit-any */

import nodemailer from "nodemailer";
import status from "http-status";
import AppError from "../errorHelpers/AppError";
import { envVars } from "../../config/env";

export const transporter = nodemailer.createTransport({
  host: envVars.SMTP_HOST,
  port: Number(envVars.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: envVars.SMTP_USER,
    pass: envVars.SMTP_PASS,
  },
});

transporter
  .verify()
  .then(() => {
    console.log("🚀 Mail server is ready");
  })
  .catch((error) => {
    console.error("Mail server error:", error);
  });

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"KrewOS" <noreply@krewos.com>`,
      to,
      subject,
      html,
    });

    console.log("Message sent:", info.messageId);

    return info;
  } catch (error: any) {
    console.error("Email sending failed:", error);

    throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to send email");
  }
};
