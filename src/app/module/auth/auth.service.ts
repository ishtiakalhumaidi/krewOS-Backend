import { envVars } from "../../../config/env";
import { CompanyRole } from "../../../generated/prisma/enums";
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
import jwt from "jsonwebtoken";

const registerPublicOwner = async (payload: IPublicRegister) => {
  const { companyName, name, email, password } = payload;
  const slug =
    companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
  const newCompany = await prisma.company.create({
    data: { name: companyName, slug: slug },
  });

  try {
    const data = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        companyId: newCompany.id,
        role: CompanyRole.OWNER,
        isActive: true,
      },
    });

    if (!data.user) throw new Error("Failed to Register User");
    return data;
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
    throw new Error("Company not found");
  }

  const token = jwt.sign({ email, companyId, role }, envVars.JWT_SECRET, {
    expiresIn: "48h",
  });

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

  const decoded = jwt.verify(token, envVars.JWT_SECRET) as {
    email: string;
    companyId: string;
    role: string;
  };

  const data = await auth.api.signUpEmail({
    body: {
      email: decoded.email,
      name,
      password,
      companyId: decoded.companyId,
      role: decoded.role,
      isActive: true,
    },
  });

  if (!data.user) {
    throw new Error("Failed to Register User");
  }

  return data;
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
    throw new Error("Invalid email or password");
  }

  if (data.user.isDeleted) {
    throw new Error("User account has been deleted. Please contact support.");
  }

  if (!data.user.isActive) {
    throw new Error(
      "User account is suspended. Please contact your Company Admin.",
    );
  }

  return data;
};
export const AuthService = {
  registerPublicOwner,
  registerInvitedMember,
  sendInvite,
  loginUser,
};
