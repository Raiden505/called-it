import type { LeaderboardRow } from "@/lib/leaderboards/queries";
import { CountryFlag, ProfileAvatar, TeamCrest } from "@/components/media/media";
import { EmptyState } from "@/components/ui/primitives";

export function LeaderboardTable({ rows, currentUserId }: { rows: LeaderboardRow[]; currentUserId: string }) {
  if (!rows.length) return <EmptyState title="The table is waiting" description="Make the first call and this is where your points, rank, and Called It record will appear." />;
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-1)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--surface-2)]">
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)] sm:px-6">Rank</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)] sm:px-6">Predictor</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)] sm:px-6">Points</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)] sm:px-6">Exact</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)] sm:px-6">Called It</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)] sm:px-6">Streak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {rows.map((row) => (
              <tr
                className={`${row.user_id === currentUserId ? "border-l-2 border-[var(--lime)] bg-[var(--lime)]/10" : ""}`}
                key={row.user_id}
              >
                <td className="px-4 py-3 align-middle sm:px-6">
                  <span className="font-display text-2xl font-bold text-[var(--lime)]">#{row.rank}</span>
                </td>
                <td className="min-w-0 px-4 py-3 align-middle sm:px-6">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar name={row.display_name} avatarUrl={row.avatar_url} size={38} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {row.display_name}
                        {row.user_id === currentUserId ? <span className="ml-2 text-xs font-bold text-[var(--lime)]">You</span> : null}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                        {row.username ? `@${row.username}` : "New predictor"}
                        {row.favorite_team_name ? (
                          <>
                            <span aria-hidden="true">·</span>
                            {row.favorite_team_badge_url ? <TeamCrest name={row.favorite_team_name} badgeUrl={row.favorite_team_badge_url} size={18} /> : null}
                            {row.favorite_team_name}
                          </>
                        ) : null}
                        {row.country_code ? <CountryFlag countryCode={row.country_code} label={`${row.display_name}'s country`} /> : null}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right align-middle sm:px-6">
                  <strong className="font-display text-2xl font-bold">{row.total_points}</strong>
                </td>
                <td className="px-4 py-3 text-right align-middle sm:px-6">
                  <strong className="font-display text-2xl font-bold">{row.exact_scores}</strong>
                </td>
                <td className="px-4 py-3 text-right align-middle sm:px-6">
                  <strong className="font-display text-2xl font-bold">{row.called_it_cards}</strong>
                </td>
                <td className="px-4 py-3 text-right align-middle sm:px-6">
                  <strong className="font-display text-2xl font-bold">{row.current_streak}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
