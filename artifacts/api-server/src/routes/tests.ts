import { Router, type IRouter } from "express";
import {
  CreateTestRunBody,
  CreateTestRunParams,
  GetTestRunParams,
  ListTestRunsParams,
} from "@workspace/api-zod";
import { findProject } from "./project-store";
import { listTestProfileRecords } from "./contract-store";
import {
  createTestRunRecord,
  findTestRun,
  listTestRunRecords,
} from "./test-store";

const router: IRouter = Router();

router.get("/test-profiles", (_req, res) => {
  res.json(listTestProfileRecords());
});

router.get("/projects/:id/tests", (req, res) => {
  const params = ListTestRunsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }
  if (!findProject(params.data.id)) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(listTestRunRecords(params.data.id));
});

router.post("/projects/:id/tests", (req, res) => {
  const params = CreateTestRunParams.safeParse(req.params);
  const body = CreateTestRunBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid test configuration" });
    return;
  }
  if (!findProject(params.data.id)) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.status(201).json(createTestRunRecord(params.data.id, body.data));
});

router.get("/projects/:id/tests/:testId", (req, res) => {
  const params = GetTestRunParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid test run id" });
    return;
  }
  const testRun = findTestRun(params.data.id, params.data.testId);
  if (!testRun) {
    res.status(404).json({ error: "Test run not found" });
    return;
  }
  res.json(testRun);
});

export default router;