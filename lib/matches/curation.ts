export type RecentOutcomeCandidate = {
  id: string;
  status: "finished" | "scheduled" | "live" | "postponed" | "cancelled";
  kickoffAt: string;
  hasPrediction: boolean;
  lifecycle: "scored" | "corrected" | "under-review" | "recalculating" | "full-time-unconfirmed";
};

export type RecentOutcomes<T extends RecentOutcomeCandidate> = {
  items: T[];
  remainingCount: number;
};

export function selectRecentOutcomes<T extends RecentOutcomeCandidate>(matches: T[], now = new Date(), limit = 3): RecentOutcomes<T> {
  const eligible = matches.filter((match) => {
    if (match.status !== "finished") return false;
    const kickoff = Date.parse(match.kickoffAt);
    if (!Number.isFinite(kickoff)) return false;
    const ageMs = now.getTime() - kickoff;
    return match.hasPrediction ? ageMs >= 0 && ageMs <= 7 * 24 * 60 * 60 * 1000 : ageMs >= 0 && ageMs <= 48 * 60 * 60 * 1000;
  });

  const sorted = [...eligible].sort((a, b) => Date.parse(b.kickoffAt) - Date.parse(a.kickoffAt) || b.id.localeCompare(a.id));
  return { items: sorted.slice(0, Math.max(0, limit)), remainingCount: Math.max(0, sorted.length - Math.max(0, limit)) };
}
