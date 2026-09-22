import { randomUUID } from "node:crypto";
import type { TestRun, TestRunInput } from "@workspace/api-zod";

const runs = new Map<string, TestRun[]>();

export function listTestRunRecords(projectId: string) {
  return runs.get(projectId) ?? [];
}

export function findTestRun(projectId: string, testId: string) {
  return listTestRunRecords(projectId).find((run) => run.id === testId);
}

export function createTestRunRecord(projectId: string, input: TestRunInput) {
  const now = new Date();
  const testRun: TestRun = {
    id: randomUUID(),
    projectId,
    profile: input.profile,
    method: input.method,
    configuration: input.configuration ?? {},
    status: "queued",
    createdAt: now,
    updatedAt: now,
  };
  runs.set(projectId, [testRun, ...listTestRunRecords(projectId)]);
  return testRun;
}