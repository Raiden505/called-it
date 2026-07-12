import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getTeamById } from "@/lib/leaderboards/queries";
import { ProfileAvatar, TeamCrest } from "@/components/media/media";
import { logOut } from "@/app/(app)/logout-action";
import { ActiveNavLink } from "@/components/ui/active-nav-link";

const items = [
  { href: "/dashboard", label: "Home", icon: "⌂" },
  { href: "/matches", label: "Matches", icon: "◎" },
  { href: "/leaderboard", label: "Rankings", icon: "↗" },
  { href: "/friends", label: "Friends", icon: "＋" },
  { href: "/profile", label: "Profile", icon: "◉" },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getCurrentProfile(supabase, user.id) : null;
  const favoriteTeam = await getTeamById(supabase, profile?.favorite_team_id ?? null);
  const displayName = profile?.display_name ?? "Your account";

  return <div className="app-canvas"><aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-[var(--line)] bg-[var(--surface-1)] px-6 py-7 lg:flex"><ShellBrand /><div className="mt-12"><p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-faint)]">Matchday desk</p><nav aria-label="Primary navigation" className="space-y-1">{items.map((item) => <ActiveNavLink key={item.href} {...item} variant="rail" />)}</nav></div><AccountPanel displayName={displayName} username={profile?.username} avatarUrl={profile?.avatar_url} favoriteTeam={favoriteTeam} /></aside><div className="lg:hidden"><div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface-1)] px-4 py-4"><ShellBrand /><ProfileAvatar name={displayName} avatarUrl={profile?.avatar_url} size={36} /></div></div><main className="app-content">{children}</main><nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[var(--line)] bg-[var(--surface-1)]/95 px-1 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">{items.map((item) => <ActiveNavLink key={item.href} {...item} variant="bottom" />)}</nav></div>;
}

function AccountPanel({ displayName, username, avatarUrl, favoriteTeam }: { displayName: string; username: string | null | undefined; avatarUrl: string | null | undefined; favoriteTeam: { name: string; code: string | null; badge_url: string | null } | null }) { return <div className="mt-auto border-t border-[var(--line)] pt-5"><div className="flex items-center gap-3 rounded-xl px-3 py-2"><ProfileAvatar name={displayName} avatarUrl={avatarUrl} size={40} /><div className="min-w-0"><p className="truncate text-sm font-bold text-[var(--text)]">{displayName}</p><p className="truncate text-xs text-[var(--text-faint)]">{username ? `@${username}` : "Your matchday identity"}</p></div></div><div className="mt-2 grid gap-1"><Link className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]" href="/profile"><span aria-hidden="true" className="w-5 text-center text-[var(--text-faint)]">◉</span>View profile</Link><Link className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]" href="/profile/edit"><span aria-hidden="true" className="w-5 text-center text-[var(--text-faint)]">⚙</span>Profile settings</Link>{favoriteTeam && <div className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-faint)]"><TeamCrest name={favoriteTeam.name} code={favoriteTeam.code} badgeUrl={favoriteTeam.badge_url} size={20} /><span className="truncate">{favoriteTeam.name}</span></div>}<form action={logOut}><button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[var(--text-muted)] transition hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]" type="submit"><span aria-hidden="true" className="w-5 text-center">↪</span>Log out</button></form></div></div>; }

function ShellBrand() { return <Link className="inline-flex items-center gap-3" href="/"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--lime)] font-display text-xl font-bold text-[var(--canvas)]">C</span><span className="font-display text-2xl font-bold tracking-[0.04em] text-[var(--text)]">CALLED IT</span></Link>; }
