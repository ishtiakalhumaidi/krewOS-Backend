/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";

import { envVars } from "../../../config/env";
import {
  InviteStatus,
  SubscriptionPlan,
  UserRole,
} from "../../../generated/prisma/enums";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { inviteTemplate } from "../../shared/mailTemplates/inviteTemplate";
import { sendEmail } from "../../shared/sendEmail";
import type {
  IInviteWorker,
  ILoginUser,
  IPublicRegister,
  IRegisterMember,
} from "./auth.interface";
import AppError from "../../errorHelpers/AppError";
import { tokenUtils } from "../../utils/token";
import { jwtUtils } from "../../utils/jwt";
import type { JwtPayload } from "jsonwebtoken";
import { PLAN_LIMITS } from "../../../config/subscriptionLimits";

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

  // 🌟 2. Generate secure DB token (Expires in 7 days)
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

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
  const htmlContent = inviteTemplate(role, inviteLink, company.name);

  await sendEmail(
    email,
    `You are invited to join ${company.name} on KrewOS`,
    htmlContent,
  );

  return { message: "Invite sent successfully", inviteLink };
};

const registerInvitedMember = async (payload: IRegisterMember) => {
  const { token, name, password } = payload;

  // 🌟 1. Check the database for the token, not a JWT!
  const invite = await prisma.invite.findUnique({
    where: { token },
  });

  if (!invite) {
    throw new AppError(status.NOT_FOUND, "Invalid invite link.");
  }
  if (invite.status !== InviteStatus.PENDING) {
    throw new AppError(
      status.BAD_REQUEST,
      "This invite link has already been used or canceled.",
    );
  }
  if (invite.expiresAt < new Date()) {
    throw new AppError(status.BAD_REQUEST, "This invite link has expired.");
  }

  // 2. Create Auth User using the email securely stored in the database
  let authUser;
  try {
    const data = await auth.api.signUpEmail({
      body: {
        email: invite.email, // Force them to use the email they were invited with!
        name,
        password,
      },
    });

    if (!data?.user) throw new Error();
    authUser = data.user;
  } catch (err: any) {
    throw new AppError(
      status.BAD_REQUEST,
      `Failed to create account: ${err.message}`,
    );
  }

  // 3. Transaction: Update user and mark invite as USED
  try {
    await prisma.$transaction(async (tx) => {
      // Assign the user to the company
      await tx.user.update({
        where: { id: authUser.id },
        data: {
          companyId: invite.companyId,
          role: invite.role,
          isActive: true,
          emailVerified: true,
        },
      });

      // Mark the invite so it can't be used twice!
      await tx.invite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.ACCEPTED },
      });
    });
  } catch (err: any) {
    // Rollback user if it fails
    await prisma.user.delete({ where: { id: authUser.id } }).catch(() => {});
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Database assignment failed",
    );
  }

  // 4. Generate Session Tokens
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
    user: { ...authUser, role: invite.role, companyId: invite.companyId },
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

export const AuthService = {
  registerPublicOwner,
  registerInvitedMember,
  sendInvite,
  loginUser,
  getNewToken,
};
