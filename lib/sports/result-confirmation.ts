import type { ResultCandidate } from "@/lib/sports/contracts";

export type CandidateObservation = { status: "not_ready" | "manual_review" | "candidate" | "confirmed"; hash: string | null; seenAt: string | null; observations: number };

export function observeResultCandidate(previous: { hash: string | null; seenAt: string | null; observations: number; status: string } | null, candidate: ResultCandidate, now = new Date(), minimumIntervalMs = 90_000): CandidateObservation {
  if (candidate.status !== "ready") return { status: candidate.status, hash: candidate.hash, seenAt: now.toISOString(), observations: 0 };
  if (!previous || previous.hash !== candidate.hash || previous.status === "manual_review" || previous.status === "not_ready") return { status: "candidate", hash: candidate.hash, seenAt: now.toISOString(), observations: 1 };
  const observations = previous.observations + 1;
  const stableLongEnough = previous.seenAt !== null && now.getTime() - new Date(previous.seenAt).getTime() >= minimumIntervalMs;
  return { status: observations >= 2 && stableLongEnough ? "confirmed" : "candidate", hash: candidate.hash, seenAt: previous.seenAt, observations };
}
