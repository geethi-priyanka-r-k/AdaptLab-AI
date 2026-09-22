import { Router, type IRouter } from "express";
import {
  CreateProjectBody,
  GetProjectParams,
  UpdateProjectBody,
  UpdateProjectParams,
} from "@workspace/api-zod";
import {
  createProjectRecord,
  deleteProjectRecord,
  findProject,
  listProjectRecords,
  updateProjectRecord,
} from "./project-store";

const router: IRouter = Router();

router.get("/projects", (_req, res) => {
  res.json(listProjectRecords());
});

router.post("/projects", (req, res) => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid project details" });
    return;
  }

  res.status(201).json(createProjectRecord(parsed.data));
});

router.get("/projects/:id", (req, res) => {
  const parsed = GetProjectParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  const project = findProject(parsed.data.id);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json(project);
});

router.patch("/projects/:id", (req, res) => {
  const params = UpdateProjectParams.safeParse(req.params);
  const body = UpdateProjectBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid project details" });
    return;
  }

  const project = updateProjectRecord(params.data.id, body.data);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json(project);
});

router.delete("/projects/:id", (req, res) => {
  const parsed = GetProjectParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  if (!deleteProjectRecord(parsed.data.id)) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.status(204).send();
});

export default router;