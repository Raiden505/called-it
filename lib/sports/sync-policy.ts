import type { FixtureLifecycleStatus, NormalizedFixture, ProviderStatus } from "@/lib/sports/contracts";

export type ExistingMatchLifecycle = { kickoffAt: string; kickoffConfirmed: boolean; status: "scheduled" | "live" | "finished" | "postponed" | "cancelled"; providerStatus: ProviderStatus | null; actualStartedAt: string | null; predictionsClosedAt: string | null };
export type MatchLifecycleUpdate = ExistingMatchLifecycle & { providerStatus: ProviderStatus; kickoffChanged: boolean };
const startedProviderStatuses: ProviderStatus[] = ["IN_PLAY", "PAUSED", "EXTRA_TIME", "PENALTY_SHOOTOUT", "FINISHED", "SUSPENDED"];

export function planMatchLifecycle(existing: ExistingMatchLifecycle | null, fixture: Pick<NormalizedFixture, "kickoffAt" | "kickoffConfirmed" | "providerStatus" | "lifecycleStatus">, now = new Date()): MatchLifecycleUpdate {
  const incomingKickoff = fixture.kickoffAt ?? existing?.kickoffAt ?? new Date(0).toISOString();
  const kickoffChanged = Boolean(existing && fixture.kickoffAt && existing.kickoffAt !== fixture.kickoffAt);
  const providerStarted = startedProviderStatuses.includes(fixture.providerStatus);
  const alreadyStarted = Boolean(existing?.actualStartedAt) || existing?.status === "live" || existing?.status === "finished" || providerStarted;
  const startedAt = existing?.actualStartedAt ?? (providerStarted ? now.toISOString() : null);
  const closedAt = existing?.predictionsClosedAt ?? (providerStarted ? now.toISOString() : null);
  if (!existing) return { kickoffAt: incomingKickoff, kickoffConfirmed: fixture.kickoffConfirmed, status: lifecycleToDatabaseStatus(fixture.lifecycleStatus), providerStatus: fixture.providerStatus, actualStartedAt: startedAt, predictionsClosedAt: closedAt, kickoffChanged: false };
  const safeKickoff = alreadyStarted ? existing.kickoffAt : incomingKickoff;
  let status = lifecycleToDatabaseStatus(fixture.lifecycleStatus);
  if (alreadyStarted && status === "scheduled") status = existing.status === "cancelled" ? "cancelled" : "live";
  if (fixture.lifecycleStatus === "postponed" && !alreadyStarted && fixture.kickoffAt && new Date(fixture.kickoffAt).getTime() > now.getTime()) status = "scheduled";
  return { kickoffAt: safeKickoff, kickoffConfirmed: alreadyStarted ? existing.kickoffConfirmed : fixture.kickoffConfirmed, status, providerStatus: fixture.providerStatus, actualStartedAt: startedAt, predictionsClosedAt: closedAt, kickoffChanged: kickoffChanged && !alreadyStarted };
}

function lifecycleToDatabaseStatus(status: FixtureLifecycleStatus): ExistingMatchLifecycle["status"] { return status === "finished_candidate" ? "finished" : status; }
