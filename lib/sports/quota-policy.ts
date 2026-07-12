import type { ProviderStatus } from "@/lib/sports/contracts";

export type DueWorkItem = { externalId: string; status: "scheduled" | "live" | "finished" | "postponed" | "cancelled"; providerStatus: ProviderStatus | null; nextSyncAt: string | null; syncFailureCount?: number };
export type SyncQuotaPolicy = { maxFixturesPerRun: number; maxFixturesPerBatch: number; resultReserve: number };

export const defaultSyncQuotaPolicy: SyncQuotaPolicy = { maxFixturesPerRun: 20, maxFixturesPerBatch: 5, resultReserve: 2 };

export function prioritizeDueWork(items: DueWorkItem[], now = new Date(), policy = defaultSyncQuotaPolicy): DueWorkItem[] {
  const due = items.filter((item) => !item.nextSyncAt || new Date(item.nextSyncAt).getTime() <= now.getTime()).sort((left, right) => priority(right) - priority(left));
  const terminal = due.filter((item) => priority(item) === 3).slice(0, policy.resultReserve);
  return [...new Map([...terminal, ...due].map((item) => [item.externalId, item])).values()].slice(0, policy.maxFixturesPerRun);
}

export function retryAt(failureCount: number, now = new Date()): string {
  const delaySeconds = Math.min(3600, 60 * 2 ** Math.min(Math.max(failureCount, 0), 6));
  return new Date(now.getTime() + delaySeconds * 1000).toISOString();
}

export function nextSyncAtForStatus(status: "scheduled" | "live" | "finished" | "postponed" | "cancelled", now = new Date()): string | null {
  if (status === "cancelled") return null;
  const seconds = status === "finished" || status === "live" ? 60 : status === "scheduled" ? 900 : 3600;
  return new Date(now.getTime() + seconds * 1000).toISOString();
}

function priority(item: DueWorkItem): number { if (item.status === "finished" || item.providerStatus === "FINISHED") return 3; if (item.status === "live" || item.providerStatus === "IN_PLAY" || item.providerStatus === "PAUSED") return 2; return 1; }
