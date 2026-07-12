import type { FixtureLifecycleStatus, ProviderStatus } from "@/lib/sports/contracts";

export function mapProviderStatus(status: ProviderStatus): FixtureLifecycleStatus {
  if (["IN_PLAY", "PAUSED", "EXTRA_TIME", "PENALTY_SHOOTOUT", "SUSPENDED"].includes(status)) return "live";
  if (status === "FINISHED") return "finished_candidate";
  if (status === "POSTPONED") return "postponed";
  if (["CANCELLED", "AWARDED"].includes(status)) return "cancelled";
  return "scheduled";
}
