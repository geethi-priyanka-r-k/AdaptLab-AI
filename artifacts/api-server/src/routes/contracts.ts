import { Router, type IRouter } from "express";
import {
  GetAdaptiveContractParams,
  UpsertAdaptiveContractBody,
  UpsertAdaptiveContractParams,
} from "@workspace/api-zod";
import { findProject } from "./project-store";
import {
  getContractRecord,
  saveContractRecord,
} from "./contract-store";

const router: IRouter = Router();

router.get("/projects/:id/contract", (req, res) => {
  const params = GetAdaptiveContractParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  if (!findProject(params.data.id)) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const contract = getContractRecord(params.data.id);
  if (!contract) {
    res.status(404).json({ error: "Adaptive contract not configured" });
    return;
  }

  res.json(contract);
});

router.put("/projects/:id/contract", (req, res) => {
  const params = UpsertAdaptiveContractParams.safeParse(req.params);
  const body = UpsertAdaptiveContractBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid adaptive contract" });
    return;
  }

  if (!findProject(params.data.id)) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json(saveContractRecord(params.data.id, body.data));
});

export default router;