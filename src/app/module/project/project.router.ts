import { Router } from "express";
import { ProjectController } from "./project.controller";

const router = Router();


router.post("/", ProjectController.createProject);

router.get("/company/:companyId", ProjectController.getCompanyProjects);

export const ProjectRoutes = router;