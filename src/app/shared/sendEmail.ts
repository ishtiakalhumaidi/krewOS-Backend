/* eslint-disable @typescript-eslint/no-explicit-any */

import nodemailer from "nodemailer";
import status from "http-status";
import AppError from "../errorHelpers/AppError";
import { envVars } from "../config/env";
import path from "path";
import ejs from "ejs";

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

// export const sendEmail = async (to: string, subject: string, html: string) => {
//   try {
//     const info = await transporter.sendMail({
//       from: `"KrewOS" <noreply@krewos.com>`,
//       to,
//       subject,
//       html,
//     });

//     console.log("Message sent:", info.messageId);

//     return info;
//   } catch (error: any) {
//     console.error("Email sending failed:", error);

//     throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to send email");
//   }
// };

interface SendEmailOptions {
  to: string;
  subject: string;
  templateName: string;
  templateData: Record<string, any>;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[];
}
export const sendEmailVersion2 = async ({
  to,
  subject,
  templateName,
  templateData,
  attachments,
}: SendEmailOptions) => {
  try {
    const templatePath = path.resolve(
      process.cwd(),
      `src/app/templates/${templateName}.ejs`,
    );
    const html = await ejs.renderFile(templatePath, templateData);
    const info = await transporter.sendMail({
      from: envVars.SMTP_USER,
      to: to,
      subject: subject,
      html: html,
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });
    console.log(`Email sent to ${to} : ${info.messageId}`);
  } catch (error: any) {
    console.error("Email sending failed:", error);

    throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to send email");
  }
};
