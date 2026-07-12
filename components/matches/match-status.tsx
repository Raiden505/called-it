import { getFreshnessLabel, getMatchFreshness, getMatchLifecycleState } from "@/lib/matches/freshness";
import type { MatchDetailViewModel, MatchSummaryViewModel } from "@/lib/matches/queries";
import { LocalTime } from "@/components/ui/local-time";

const toneClasses = { neutral: "border-[var(--line)] bg-[var(--surface-2)] text-[var(--text-muted)]", live: "border-[var(--live)]/40 bg-[var(--live)]/10 text-[var(--live)]", pending: "border-[var(--warning)]/40 bg-[var(--warning)]/10 text-[var(--warning)]", confirmed: "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]", warning: "border-[var(--warning)]/40 bg-[var(--warning)]/10 text-[var(--warning)]" } as const;

export function MatchStatus({ match }: { match: MatchSummaryViewModel | MatchDetailViewModel }) {
  const lifecycle = getMatchLifecycleState(match.status, match.resultProcessingStatus); const freshness = getMatchFreshness(match.lastSyncedAt); const resultLabel = match.status === "finished" ? match.resultPresentation.label : lifecycle.label; const resultDescription = match.status === "finished" ? match.resultPresentation.label : lifecycle.description;
  return <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4 text-xs font-bold"><span aria-label={resultDescription} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${toneClasses[lifecycle.tone]}`}><span aria-hidden="true" className={`status-dot ${lifecycle.tone === "live" ? "status-dot-live" : lifecycle.tone === "confirmed" ? "status-dot-good" : lifecycle.tone === "pending" || lifecycle.tone === "warning" ? "status-dot-warn" : "bg-[var(--text-faint)]"}`} />{resultLabel}</span><span className={freshness === "stale" ? "text-[var(--warning)]" : "text-[var(--text-muted)]"}>{freshness === "fresh" ? "Updated" : getFreshnessLabel(freshness)}{match.lastSyncedAt ? <> · <LocalTime date={match.lastSyncedAt} /></> : null}</span></div>;
}
