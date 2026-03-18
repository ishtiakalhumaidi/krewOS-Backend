/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";

import { envVars } from "../../../config/env";
import { UserRole } from "../../../generated/prisma/enums";
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
    select: { name: true },
  });

  if (!company) {
    throw new AppError(status.NOT_FOUND, "Company not found");
  }

  const token = tokenUtils.getAccessToken({ email, companyId, role });

  const inviteLink = `${envVars.FRONTEND_URL}/join?token=${token}`;

  const htmlContent = inviteTemplate(role, inviteLink, company.name);

  await sendEmail(email, "You are invited to join KrewOS", htmlContent);

  return {
    message: "Invite sent successfully",
    inviteLink,
  };
};

const registerInvitedMember = async (payload: IRegisterMember) => {
  const { token, name, password } = payload;

  // 1. Verify the Token (Don't just decode, verify the signature!)
  let decoded: any;
  try {
    decoded = jwtUtils.verifyToken(token, envVars.ACCESS_TOKEN_SECRET) as {
      success: boolean;
      data: {
        email: string;
        companyId: string;
        role: string;
      };
    };
  } catch (err) {
    throw new AppError(
      status.UNAUTHORIZED,
      "Invalid, expired, or tampered invite token",
    );
  }

  if (
    !decoded?.data?.email ||
    !decoded?.data?.companyId ||
    !decoded?.data?.role
  ) {
    throw new AppError(status.BAD_REQUEST, "Malformed invite token payload");
  }

  // 2. Create the Auth User (BetterAuth)
  let authUser;
  try {
    const data = await auth.api.signUpEmail({
      body: {
        email: decoded.data.email,
        name,
        password,
      },
    });

    if (!data?.user)
      throw new Error("Authentication provider did not return user data");
    authUser = data.user;
  } catch (err: any) {
    throw new AppError(
      status.BAD_REQUEST,
      `Failed to create account: ${err.message}`,
    );
  }
  try {
    const formattedRole = decoded.data.role.toUpperCase() as UserRole;

    await prisma.user.update({
      where: { id: authUser.id },
      data: {
        companyId: decoded.data.companyId,
        role: formattedRole,
        isActive: true,
        emailVerified: true,
      },
    });
  } catch (err: any) {
    console.error("🔥 PRISMA UPDATE FAILED:", err);

    try {
      await prisma.user.delete({ where: { id: authUser.id } });
    } catch (rollbackErr) {
      console.error(
        "🚨 CRITICAL: Failed to rollback orphaned user!",
        rollbackErr,
      );
    }

    if (err.code === "P2003") {
      throw new AppError(
        status.BAD_REQUEST,
        "The company associated with this invite no longer exists.",
      );
    }

    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      `Database assignment failed: ${err.message}`,
    );
  }

  const formattedRole = decoded.data.role.toUpperCase();

  const tokenPayload = {
    userId: authUser.id,
    role: formattedRole,
    name: authUser.name,
    email: authUser.email,
    isDelete: false,
    emailVerified: true,
  };

  const accessToken = tokenUtils.getAccessToken(tokenPayload);
  const refreshToken = tokenUtils.getRefreshToken(tokenPayload);

  return {
    user: {
      ...authUser,
      role: formattedRole,
      companyId: decoded.data.companyId,
    },
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
  const verifiedRefreshToken = jwtUtils.verifyToken(
    refreshToken,
    envVars.REFRESH_TOKEN_SECRET,
  );
  if (!verifiedRefreshToken.success && verifiedRefreshToken.error) {
    throw new AppError(status.UNAUTHORIZED, "Invalid refresh token");
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  const newAccessToken = tokenUtils.getAccessToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    isDelete: data.user.isDeleted,
    emailVerified: data.user.emailVerified,
  });
  const newRefreshToken = tokenUtils.getRefreshToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    isDelete: data.user.isDeleted,
    emailVerified: data.user.emailVerified,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const AuthService = {
  registerPublicOwner,
  registerInvitedMember,
  sendInvite,
  loginUser,
};
