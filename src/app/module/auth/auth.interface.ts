import type { UserRole } from "../../../generated/prisma/enums";

export interface IPublicRegister {
  companyName: string;
  name: string;
  email: string;
  password: string;
}

export interface IRegisterMember {
  token: string;
  name: string;
  password: string;
}

export interface IInviteWorker {
  email: string;
  role: UserRole;
  companyId: string;
}

export interface ILoginUser {
  email: string;
  password: string;
}
