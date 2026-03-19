/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";

import { envVars } from "../../config/env";
import {
  InviteStatus,
  SubscriptionPlan,
  UserRole,
} from "../../../generated/prisma/enums";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { inviteTemplate } from "../../shared/mailTemplates/inviteTemplate";
import { sendEmailVersion2 } from "../../shared/sendEmail";
import type {
  IChangePasswordPayload,
  IInviteWorker,
  ILoginUser,
  IPublicRegister,
  IRegisterMember,
} from "./auth.interface";
import AppError from "../../errorHelpers/AppError";
import { tokenUtils } from "../../utils/token";
import { jwtUtils } from "../../utils/jwt";
import type { JwtPayload } from "jsonwebtoken";
import { PLAN_LIMITS } from "../../config/subscriptionLimits";
import { date } from "zod";

const registerPublicOwner = async (payload: IPublicRegister) => {
  const { companyName, name, email, password } = payload;

  const slug =
    companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();

  const newCompany = await prisma.company.create({
    data: { name: companyName, slug },
  });

  try {
    const data = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        companyId: newCompany.id,
        role: UserRole.OWNER,
        isActive: true,
      },
    });

    if (!data.user) {
      throw new AppError(status.BAD_REQUEST, "Failed to register user");
    }

    const accessToken = tokenUtils.getAccessToken({
      userId: data.user.id,
      role: data.user.role,
      name: data.user.name,
      email: data.user.email,
      isDelete: data.user.isDeleted,
      emailVerified: data.user.emailVerified,
    });
    const refreshToken = tokenUtils.getRefreshToken({
      userId: data.user.id,
      role: data.user.role,
      name: data.user.name,
      email: data.user.email,
      isDelete: data.user.isDeleted,
      emailVerified: data.user.emailVerified,
    });

    return { ...data, accessToken, refreshToken };
  } catch (error) {
    await prisma.company.delete({ where: { id: newCompany.id } });
    throw error;
  }
};

const sendInvite = async (payload: IInviteWorker) => {
  const { email, role, companyId } = payload;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { subscription: true },
  });

  if (!company) {
    throw new AppError(status.NOT_FOUND, "Company not found");
  }

  // 🌟 1. SAAS QUOTA CHECK: Active users + Pending Invites
  const [activeUsers, pendingInvites] = await Promise.all([
    prisma.user.count({ where: { companyId, isDeleted: false } }),
    prisma.invite.count({ where: { companyId, status: InviteStatus.PENDING } }),
  ]);

  const totalSeatsUsed = activeUsers + pendingInvites;
  const currentPlan = company.subscription?.plan || SubscriptionPlan.FREE;
  const limit = PLAN_LIMITS[currentPlan].maxMembers;

  if (totalSeatsUsed >= limit) {
    throw new AppError(
      status.FORBIDDEN,
      `Seat Limit Reached: Your ${currentPlan} plan is limited to ${limit} members.`,
    );
  }

  // 🌟 2. Generate secure DB token (Expires in 2 days)
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 2);

  const invite = await prisma.invite.upsert({
    where: {
      email_companyId: { email, companyId },
    },
    update: {
      token,
      role,
      status: InviteStatus.PENDING,
      expiresAt,
    },
    create: {
      email,
      token,
      role,
      companyId,
      expiresAt,
    },
  });

  // 3. Send Email
  const inviteLink = `${envVars.FRONTEND_URL}/join?token=${invite.token}`;

  await sendEmailVersion2({
    to: email,
    subject: `You are invited to join ${company.name} on KrewOS`,
    templateName: "sendInvite",
    templateData: {
      inviteLink,
      expiresIn: "48 Hours",
      company: company.name,
      role,
    },
  });

  return { message: "Invite sent successfully", inviteLink };
};

const registerInvitedMember = async (payload: IRegisterMember) => {
  const { token, name, password } = payload;

  const invite = await prisma.invite.findUnique({
    where: { token },
  });

  if (!invite) {
    throw new AppError(status.NOT_FOUND, "Invalid invite link.");
  }

  if (invite.status !== InviteStatus.PENDING) {
    throw new AppError(
      status.BAD_REQUEST,
      "This invite link already used or canceled.",
    );
  }

  if (invite.expiresAt < new Date()) {
    throw new AppError(status.BAD_REQUEST, "Invite expired.");
  }

  // Prevent duplicate user creation
  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email },
  });

  if (existingUser) {
    throw new AppError(
      status.BAD_REQUEST,
      "User already exists with this email",
    );
  }

  let authUser;
  let sessionToken;

  try {
    const data = await auth.api.signUpEmail({
      body: {
        email: invite.email,
        name,
        password,
      },
    });

    if (!data?.user) {
      throw new Error("Auth user creation failed");
    }

    authUser = data.user;
    sessionToken = data.token;

    await prisma.user.update({
      where: { id: authUser.id },
      data: {
        emailVerified: true,
      },
    });
  } catch (err: any) {
    throw new AppError(
      status.BAD_REQUEST,
      `Failed to create account: ${err.message}`,
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: authUser.id },
        data: {
          companyId: invite.companyId,
          role: invite.role,
          isActive: true,
        },
      });

      await tx.invite.update({
        where: { id: invite.id },
        data: {
          status: InviteStatus.ACCEPTED,
        },
      });
    });
  } catch (err: any) {
    //rollback user if company assignment fails
    await prisma.user.delete({ where: { id: authUser.id } }).catch(() => {});

    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Database assignment failed",
    );
  }

  const tokenPayload = {
    userId: authUser.id,
    role: invite.role,
    name: authUser.name,
    email: authUser.email,
    companyId: invite.companyId,
    isDelete: false,
    emailVerified: true,
  };

  const accessToken = tokenUtils.getAccessToken(tokenPayload);

  const refreshToken = tokenUtils.getRefreshToken(tokenPayload);

  return {
    user: {
      ...authUser,
      role: invite.role,
      companyId: invite.companyId,
    },
    token: sessionToken,
    accessToken,
    refreshToken,
  };
};

const loginUser = async (payload: ILoginUser) => {
  const { email, password } = payload;

  const data = await auth.api.signInEmail({
    body: {
      email,
      password,
    },
  });

  if (!data.user) {
    throw new AppError(status.UNAUTHORIZED, "Invalid email or password");
  }

  if (data.user.isDeleted) {
    throw new AppError(
      status.FORBIDDEN,
      "User account has been deleted. Please contact support.",
    );
  }

  if (!data.user.isActive) {
    throw new AppError(
      status.FORBIDDEN,
      "User account is suspended. Please contact your Company Admin.",
    );
  }

  const accessToken = tokenUtils.getAccessToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    isDelete: data.user.isDeleted,
    emailVerified: data.user.emailVerified,
  });
  const refreshToken = tokenUtils.getRefreshToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    isDelete: data.user.isDeleted,
    emailVerified: data.user.emailVerified,
  });

  return { ...data, accessToken, refreshToken };
};

const getNewToken = async (refreshToken: string, sessionToken: string) => {
  const isSessionExists = await prisma.session.findUnique({
    where: {
      token: sessionToken,
    },
    include: {
      user: true,
    },
  });
  if (!isSessionExists) {
    throw new AppError(status.UNAUTHORIZED, "Invalid session token");
  }

  const verifiedRefreshToken = jwtUtils.verifyToken(
    refreshToken,
    envVars.REFRESH_TOKEN_SECRET,
  );
  if (!verifiedRefreshToken.success && verifiedRefreshToken.error) {
    throw new AppError(status.UNAUTHORIZED, "Invalid refresh token");
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  const newAccessToken = tokenUtils.getAccessToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    isDelete: data.isDeleted,
    emailVerified: data.emailVerified,
  });
  const newRefreshToken = tokenUtils.getRefreshToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    isDelete: data.isDeleted,
    emailVerified: data.emailVerified,
  });

  const { token } = await prisma.session.update({
    where: {
      token: sessionToken,
    },
    data: {
      token: sessionToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 60 * 24 * 1000),
      updatedAt: new Date(),
    },
  });
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    sessionToken: token,
  };
};

const changePassword = async (
  payload: IChangePasswordPayload,
  sessionToken: string,
) => {
  const session = await auth.api.getSession({
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`,
    }),
  });
  if (!session) {
    throw new AppError(status.UNAUTHORIZED, "Invalid session token");
  }
  const { currentPassword, newPassword } = payload;

  const result = await auth.api.changePassword({
    body: {
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    },
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`,
    }),
  });

  const accessToken = tokenUtils.getAccessToken({
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name,
    email: session.user.email,
    isDelete: session.user.isDeleted,
    emailVerified: session.user.emailVerified,
  });
  const refreshToken = tokenUtils.getRefreshToken({
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name,
    email: session.user.email,
    isDelete: session.user.isDeleted,
    emailVerified: session.user.emailVerified,
  });

  return { ...result, accessToken, refreshToken };
};

const logoutUser = async (sessionToken: string) => {
  const result = await auth.api.signOut({
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });
  return result;
};

const verifyEmail = async (email: string, otp: string) => {
  const result = await auth.api.verifyEmailOTP({
    body: {
      email,
      otp,
    },
  });
  if (result.status && !result.user.emailVerified) {
    await prisma.user.update({
      where: {
        email,
      },
      data: {
        emailVerified: true,
      },
    });
  }
  return result;
};

const forgetPassword = async (email: string) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!isUserExists) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }
  if (!isUserExists.emailVerified) {
    throw new AppError(status.BAD_REQUEST, "Email not verified");
  }
  if (!isUserExists.isActive || isUserExists.isDeleted) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  await auth.api.requestPasswordResetEmailOTP({
    body: {
      email,
    },
  });
};

const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string,
) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!isUserExists) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }
  if (!isUserExists.emailVerified) {
    throw new AppError(status.BAD_REQUEST, "Email not verified");
  }
  if (!isUserExists.isActive || isUserExists.isDeleted) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }
  await auth.api.resetPasswordEmailOTP({
    body: {
      email,
      otp,
      password: newPassword,
    },
  });
  await prisma.session.deleteMany({
    where: {
      userId: isUserExists.id,
    },
  });
};

//! this is for letter use and learn purpose for any other app use.... we will not allow social login for this platform for security purpose...

const googleLoginSuccess = async (session: Record<string, any>) => {
  const isOwnerExists = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });
  if (isOwnerExists?.companyId === null) {
    const companyName = `${isOwnerExists.name} Workplace`;
    const slug =
      companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
    const newCompany = await prisma.company.create({
      data: { name: companyName, slug },
    });

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        companyId: newCompany.id,
      },
    });
  }
  const accessToken = tokenUtils.getAccessToken({
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name,
  });
  const refreshToken = tokenUtils.getRefreshToken({
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name,
  });

  return { accessToken, refreshToken };
};

export const AuthService = {
  registerPublicOwner,
  registerInvitedMember,
  sendInvite,
  loginUser,
  getNewToken,
  changePassword,
  logoutUser,
  verifyEmail,
  forgetPassword,
  resetPassword,
  googleLoginSuccess,
};
