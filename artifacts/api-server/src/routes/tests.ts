import { Router, type IRouter } from "express";
import {
  CreateTestRunBody,
  CreateTestRunParams,
  GetTestRunParams,
  ListTestRunsParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { sendRouteError } from "./route-errors";
import { getWorkspaceStore } from "../services/workspace-store";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/test-profiles", async (req, res) => {
  try {
    res.json(await getWorkspaceStore(req.user!).listTestProfiles());
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.get("/projects/:id/tests", async (req, res) => {
  const params = ListTestRunsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }
  try {
    const store = getWorkspaceStore(req.user!);
    if (!(await store.findProject(params.data.id))) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json(await store.listTestRuns(params.data.id));
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.post("/projects/:id/tests", async (req, res) => {
  const params = CreateTestRunParams.safeParse(req.params);
  const body = CreateTestRunBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid test configuration" });
    return;
  }
  try {
    const store = getWorkspaceStore(req.user!);
    if (!(await store.findProject(params.data.id))) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.status(201).json(await store.createTestRun(params.data.id, body.data));
  } catch (error) {
    sendRouteError(res, error);
  }
});

router.get("/projects/:id/tests/:testId", async (req, res) => {
  const params = GetTestRunParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid test run id" });
    return;
  }
  try {
    const testRun = await getWorkspaceStore(req.user!).findTestRun(
      params.data.id,
      params.data.testId,
    );
    if (!testRun) {
      res.status(404).json({ error: "Test run not found" });
      return;
    }
    res.json(testRun);
  } catch (error) {
    sendRouteError(res, error);
  }
});

export default router;