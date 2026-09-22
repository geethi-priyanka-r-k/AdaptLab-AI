import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import dashboardRouter from "./dashboard";
import contractsRouter from "./contracts";
import testsRouter from "./tests";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(dashboardRouter);
router.use(contractsRouter);
router.use(testsRouter);

export default router;
