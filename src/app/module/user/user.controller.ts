/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { UserService } from "./user.service";

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  // Grab the userId from the JWT token
  const userId = (req as any).user.userId;
  const result = await UserService.getMyProfile(userId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: result,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const result = await UserService.updateProfile(userId, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const updateAvatar = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  
  // Grab the Cloudinary URL from Multer
  if (!req.file) {
    return sendResponse(res, {
      statusCode: status.BAD_REQUEST,
      success: false,
      message: "No image file provided",
      data: null,
    });
  }

  // Update just the image field
  const result = await UserService.updateProfile(userId, { image: req.file.path });

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Profile picture updated successfully",
    data: result,
  });
});

export const UserController = {
  getMyProfile,
  updateProfile,
  updateAvatar,
};