/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer";
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
    console.log("🚀 Mail server is ready to take our messages");
  })
  .catch(console.error);

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"KrewOS" <noreply@krewos.com>`,
      to,
      subject,
      html,
    });
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error: any) {
    console.error("Error sending email:", error);

    throw new Error("Failed to send email", { cause: error });
  }
};
