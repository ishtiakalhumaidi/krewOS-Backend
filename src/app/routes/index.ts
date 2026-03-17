import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.router";

const router = Router();

router.use("/auth", AuthRoutes);
export const IndexRouter = router;
