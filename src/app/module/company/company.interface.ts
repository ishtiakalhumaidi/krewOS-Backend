import type { CompanyStatus } from "../../../generated/prisma/enums";

export interface IUpdateCompany {
  name?: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
}
export interface IChangeCompanyStatus {
  status: CompanyStatus;
}
