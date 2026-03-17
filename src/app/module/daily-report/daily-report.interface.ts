import { WeatherCondition } from "../../../generated/prisma/enums";

export interface ICreateDailyReport {
  projectId: string;
  submittedBy: string;
  reportDate: string | Date;
  summary: string;
  weatherCondition: WeatherCondition;
  photoUrls?: string[];
  workersPresent: number;
  pdfUrl?: string;
}

export interface IUpdateDailyReport {
  summary?: string;
  workersPresent?: number;
  weatherCondition?: WeatherCondition;
  photoUrls?: string[];
  pdfUrl?: string;
}
