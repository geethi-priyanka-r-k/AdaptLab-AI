import { randomUUID } from "node:crypto";
import {
  CreateProjectBody,
  UpdateProjectBody,
} from "@workspace/api-zod";
import type { ProjectInput, ProjectUpdate } from "@workspace/api-zod";

export type Project = {
  id: string;
  name: string;
  description: string;
  applicationType: "ecommerce" | "news";
  applicationUrl: string;
  status: "active" | "paused";
  createdAt: Date;
  updatedAt: Date;
};

type CreateProjectInput = ProjectInput;
type UpdateProjectInput = ProjectUpdate;

const projects: Project[] = [];

export function listProjectRecords() {
  return projects;
}

export function findProject(id: string) {
  return projects.find((project) => project.id === id);
}

export function createProjectRecord(input: CreateProjectInput) {
  const now = new Date();
  const project: Project = {
    id: randomUUID(),
    ...input,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  projects.unshift(project);
  return project;
}

export function updateProjectRecord(
  id: string,
  input: UpdateProjectInput,
) {
  const project = findProject(id);
  if (!project) return undefined;

  Object.assign(project, input, { updatedAt: new Date() });
  return project;
}

export function deleteProjectRecord(id: string) {
  const index = projects.findIndex((project) => project.id === id);
  if (index === -1) return false;

  projects.splice(index, 1);
  return true;
}