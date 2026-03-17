/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ICreateSafetyChecklist {
  projectId: string;
  submittedBy: string;
  checkDate: string | Date;
  checklistData: Record<string, any>;
  allClear?: boolean;
  notes?: string;
}
