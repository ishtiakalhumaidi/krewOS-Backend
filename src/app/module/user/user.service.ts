/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      image: true,
      companyId: true,
      isActive: true,
      createdAt: true,
    }
  });

  if (!user) throw new AppError(status.NOT_FOUND, "User not found");
  return user;
};

const updateProfile = async (userId: string, payload: any) => {
  return await prisma.user.update({
    where: { id: userId },
    data: payload,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      image: true,
    }
  });
};

export const UserService = {
  getMyProfile,
  updateProfile,
};