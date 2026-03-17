import { Severity } from "../../../generated/prisma/enums";

export interface ICreateIncident {
  projectId: string;
  reportedBy: string;
  title: string;
  description: string;
  severity: Severity;
  dateOccurred: string | Date;
  photoUrls?: string[];
}

export interface IUpdateIncidentStatus {
  isResolved: boolean;
  resolutionNotes?: string;
}
