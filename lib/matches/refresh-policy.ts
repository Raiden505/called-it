export type RefreshContext = { hasLiveMatch: boolean; hasPendingResult: boolean; nextKickoffMs: number | null };

export function getRefreshIntervalMs(context: RefreshContext): number | null {
  if (context.hasLiveMatch || context.hasPendingResult) return 60_000;
  if (context.nextKickoffMs !== null && context.nextKickoffMs >= 0 && context.nextKickoffMs <= 30 * 60_000) return 120_000;
  if (context.nextKickoffMs !== null && context.nextKickoffMs > 30 * 60_000) return 300_000;
  return null;
}
