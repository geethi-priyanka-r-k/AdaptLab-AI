import { randomUUID } from "node:crypto";
import type {
  AdaptiveContract,
  AdaptiveContractInput,
  TestProfile,
} from "@workspace/api-zod";

const contracts = new Map<string, AdaptiveContract>();

const profiles: TestProfile[] = [
  {
    key: "low",
    name: "Low",
    description:
      "A constrained environment for checking graceful degradation under reduced bandwidth and limited resources.",
    networkProfile: "Slow 3G",
    imagePolicy: "low",
    javascriptPolicy: "minimal",
    featurePolicy: "reduced",
    maxResourceSizeKb: 800,
    maxLcpMs: 4000,
  },
  {
    key: "medium",
    name: "Medium",
    description:
      "A balanced baseline for release checks across typical network and device conditions.",
    networkProfile: "Fast 3G",
    imagePolicy: "medium",
    javascriptPolicy: "deferred",
    featurePolicy: "normal",
    maxResourceSizeKb: 1400,
    maxLcpMs: 3000,
  },
  {
    key: "high",
    name: "High",
    description:
      "A full-fidelity profile for validating the complete application experience and performance budget.",
    networkProfile: "4G",
    imagePolicy: "high",
    javascriptPolicy: "full",
    featurePolicy: "full",
    maxResourceSizeKb: 2400,
    maxLcpMs: 2000,
  },
];

export function listTestProfileRecords() {
  return profiles;
}

export function getContractRecord(projectId: string) {
  return contracts.get(projectId);
}

export function saveContractRecord(
  projectId: string,
  input: AdaptiveContractInput,
) {
  const existing = contracts.get(projectId);
  const now = new Date();
  const contract: AdaptiveContract = {
    id: existing?.id ?? randomUUID(),
    projectId,
    ...input,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  contracts.set(projectId, contract);
  return contract;
}