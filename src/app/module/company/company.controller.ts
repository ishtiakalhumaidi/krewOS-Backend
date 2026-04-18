/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { CompanyService } from "./company.service";

const getAllCompanies = catchAsync(async (req: Request, res: Response) => {
  const result = await CompanyService.getAllCompanies();
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "All companies retrieved",
    data: result,
  });
});

const getCompanyById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CompanyService.getCompanyById(id as string);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Company details retrieved",
    data: result,
  });
});

const getCompanyRoster = catchAsync(async (req: Request, res: Response) => {
  const companyId = (req as any).user.companyId;
  const result = await CompanyService.getCompanyRoster(companyId as string);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Company roster retrieved",
    data: result,
  });
});


const updateCompany = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  req.body.logoUrl = req.file?.path;

  const result = await CompanyService.updateCompany(id as string, req.body);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Company updated",
    data: result,
  });
});

const changeStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CompanyService.changeCompanyStatus(
    id as string,
    req.body,
  );

  const statusMsg = result.isActive ? "reactivated" : "blocked/blacklisted";
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: `Company successfully ${statusMsg}`,
    data: result,
  });
});

export const CompanyController = {
  getAllCompanies,
  getCompanyById,
  updateCompany,
  changeStatus,
  getCompanyRoster,
};
