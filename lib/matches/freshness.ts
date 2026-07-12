export type MatchFreshness = "fresh" | "stale" | "unknown";
export type MatchResultProcessingStatus = "not_ready" | "candidate" | "processing" | "processed" | "manual_review" | "failed";
export type MatchLifecycleTone = "neutral" | "live" | "pending" | "confirmed" | "warning";

export type MatchLifecycleState = {
  label: string;
  description: string;
  tone: MatchLifecycleTone;
};

export function getMatchFreshness(
  lastSyncedAt: string | null,
  now = new Date(),
  staleAfterMs = 10 * 60 * 1000,
): MatchFreshness {
  if (!lastSyncedAt) return "unknown";

  const syncedAt = Date.parse(lastSyncedAt);
  if (!Number.isFinite(syncedAt)) return "unknown";

  return now.getTime() - syncedAt <= staleAfterMs ? "fresh" : "stale";
}

export function getMatchLifecycleState(
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled",
  resultProcessingStatus: MatchResultProcessingStatus,
): MatchLifecycleState {
  if (status === "live") {
    return { label: "Live", description: "The match is in progress. Predictions are locked.", tone: "live" };
  }

  if (status === "finished" && resultProcessingStatus === "processed") {
    return { label: "Confirmed", description: "The official result has been confirmed.", tone: "confirmed" };
  }

  if (status === "finished") {
    return { label: "Result pending", description: "The result is waiting for a second confirmation before scoring.", tone: "pending" };
  }

  if (status === "postponed") {
    return { label: "Postponed", description: "The provider moved this fixture. Check back for the new kickoff.", tone: "warning" };
  }

  if (status === "cancelled") {
    return { label: "Cancelled", description: "This fixture will not be played.", tone: "warning" };
  }

  return { label: "Scheduled", description: "Predictions stay open until kickoff.", tone: "neutral" };
}

export function getFreshnessLabel(freshness: MatchFreshness): string {
  if (freshness === "fresh") return "Data fresh";
  if (freshness === "stale") return "Data may be out of date";
  return "Awaiting first sync";
}
