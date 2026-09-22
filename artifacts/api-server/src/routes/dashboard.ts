import { Router, type IRouter } from "express";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { listProjectRecords } from "./project-store";

const router: IRouter = Router();

router.get("/dashboard/summary", (_req, res) => {
  const projects = listProjectRecords();
  const data = GetDashboardSummaryResponse.parse({
    projectCount: projects.length,
    testRunCount: 0,
    passRate: null,
    violationCount: 0,
  });
  res.json(data);
});

export default router;