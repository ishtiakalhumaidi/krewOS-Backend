import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AuthService } from "./auth.service";

const registerPublicOwner = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.registerPublicOwner(payload);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Company and Owner account created successfully",
    data: result,
  });
});

const sendInvite = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  // TODO: If you have a middleware setting req.user, you can inject companyId here:
  // payload.companyId = req.user.companyId;

  const result = await AuthService.sendInvite(payload);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Invitation link generated and sent successfully",
    data: result,
  });
});

const registerInvitedMember = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await AuthService.registerInvitedMember(payload);

    sendResponse(res, {
      statusCode: status.CREATED,
      success: true,
      message: "Member account created successfully",
      data: result,
    });
  },
);

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.loginUser(payload);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: `${result.user.role.toUpperCase()} logged in successfully`,
    data: result,
  });
});

export const AuthController = {
  registerPublicOwner,
  sendInvite,
  registerInvitedMember,
  loginUser,
};
