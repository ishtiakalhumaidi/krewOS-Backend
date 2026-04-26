import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { UserRole } from "../../generated/prisma/enums";
import { bearer, emailOTP } from "better-auth/plugins";
import { sendEmailVersion2 } from "../shared/sendEmail";
import { envVars } from "../config/env";

export const auth = betterAuth({
  baseURL: envVars.BETTER_AUTH_URL,
  secret: envVars.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "sqlite", ...etc
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  //! this is for letter use and learn purpose for any other app use.... we will not allow social login for this platform for security purpose...
  socialProviders: {
    google: {
      clientId: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,

      mapProfileToUser: () => {
        return {
          role: UserRole.OWNER,
          emailVerified: true,
          isDeleted: false,
          deletedAt: null,
        };
      },
    },
  },
  emailVerification: {
    sendOnSignIn: true,
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  user: {
    additionalFields: {
      companyId: {
        type: "string",
        required: false,
        defaultValue: null,
      },
      role: {
        type: "string",
        required: true,
        defaultValue: UserRole.MEMBER,
      },
      phone: {
        type: "string",
        required: false,
        defaultValue: null,
      },
      isActive: {
        type: "boolean",
        required: true,
        defaultValue: true,
      },
      isDeleted: {
        type: "boolean",
        required: true,
        defaultValue: false,
      },
      deletedAt: {
        type: "date",
        required: false,
        defaultValue: null,
      },
    },
  },
  plugins: [
    bearer(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      sendVerificationOnSignUp: true,
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "email-verification") {
          const user = await prisma.user.findUnique({
            where: {
              email,
            },
          });
          if (user && !user.emailVerified) {
            await sendEmailVersion2({
              to: email,
              subject: "Verify Your Email",
              templateName: "otp",
              templateData: {
                name: user.name,
                otp,
              },
            });
          }
        } else if (type === "forget-password") {
          const user = await prisma.user.findUnique({
            where: {
              email,
            },
          });
          if (user) {
            await  sendEmailVersion2({
              to: email,
              subject: "Password Reset OTP",
              templateName: "passwordReset",
              templateData: {
                name: user.name,
                otp,
              },
            });
          }
        }
      },
      expiresIn: 2 * 60,
      otpLength: 6,
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 60 * 24,
    updateAge: 60 * 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 60 * 24,
    },
  },
  redirectURLs: {
    signIn: `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success`,
  },
  trustedOrigins: [
    // process.env.BETTER_AUTH_URL || "http://localhost:5000",
    // envVars.FRONTEND_URL,
    "https://krew-os.vercel.app",
  ],

  // advanced: {
  //   useSecureCookies: false,
  //   cookies: {
  //     state: {
  //       attributes: {
  //         sameSite: "None",
  //         secure: true,
  //         httpOnly: true,
  //         path: "/",
  //       },
  //     },
  //     sessionToken: {
  //       attributes: {
  //         sameSite: "None",
  //         secure: true,
  //         httpOnly: true,
  //         path: "/",
  //       },
  //     },
  //   },
  // },
  advanced: {
    useSecureCookies: true,
    defaultCookieAttributes: {
      sameSite: "None",
      secure: true,
      httpOnly: true,
      partitioned: true,
    },
  },
});
