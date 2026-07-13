import Link from "next/link";
import { redirect } from "next/navigation";
import { generatePersonalInsight } from "@/app/(app)/insights/actions";
import { CalledItCard } from "@/components/cards/called-it-card";
import { CardVisibilityForm } from "@/components/cards/card-visibility-form";
import { InsightPanel } from "@/components/ai/insight-panel";
import { CountryFlag, TeamCrest } from "@/components/media/media";
import { getOwnCalledItCards } from "@/lib/cards/queries";
import { getCurrentProfile, getProfileStats, getTeamById } from "@/lib/leaderboards/queries";
import { getLatestSummary } from "@/lib/ai/summary-service";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, SectionLabel, EmptyState } from "@/components/ui/primitives";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [profile, stats, cards, insight] = await Promise.all([
    getCurrentProfile(supabase, user.id),
    getProfileStats(supabase, user.id),
    getOwnCalledItCards(supabase, user.id),
    getLatestSummary(supabase, user.id, "personal_performance"),
  ]);
  const favoriteTeam = await getTeamById(supabase, profile?.favorite_team_id ?? null);
  const statItems = [["Points", stats?.total_points ?? 0], ["Global rank", stats?.global_rank ? `#${stats.global_rank}` : "—"], ["Friends rank", stats?.friends_rank ? `#${stats.friends_rank}` : "—"], ["Accuracy", `${Math.round((stats?.accuracy ?? 0) * 100)}%`], ["Streak", stats?.current_streak ?? 0], ["Exact scores", stats?.exact_scores ?? 0], ["First scorers", stats?.correct_first_goalscorers ?? 0], ["Called It", stats?.called_it_cards ?? 0]];

  return <div className="app-content-inner"><PageHeader eyebrow="Your record" title={profile?.display_name ?? "Your profile"} description={profile?.bio ?? (profile?.username ? `@${profile.username}` : user.email ?? "Your matchday identity")} action={<Link className="rounded-xl border border-[var(--line)] bg-[var(--surface-1)] px-4 py-2.5 text-sm font-bold hover:border-[var(--lime)]" href="/profile/edit">Edit profile</Link>} /><div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)]"><span className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5">{profile?.username ? `@${profile.username}` : "New predictor"}</span>{profile?.country_code && <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5"><CountryFlag countryCode={profile.country_code} label="Your country" />{profile.country_code}</span>}{favoriteTeam && <span className="inline-flex items-center gap-2 rounded-full border border-[var(--lime)]/40 bg-[var(--lime)]/10 px-3 py-1.5 text-[var(--lime)]"><TeamCrest name={favoriteTeam.name} code={favoriteTeam.code} badgeUrl={favoriteTeam.badge_url} size={20} /><CountryFlag countryCode={favoriteTeam.country_code} label={favoriteTeam.name} />{favoriteTeam.short_name}</span>}</div><section className="mt-8"><div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-4">{statItems.map(([label, value]) => <div className="bg-[var(--surface-1)] p-4 sm:p-5" key={String(label)}><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-faint)]">{label}</p><p className="font-display mt-2 text-2xl font-bold text-[var(--text)] sm:text-4xl">{value}</p></div>)}</div></section><div className="mt-10"><InsightPanel action={generatePersonalInsight} canGenerate={Boolean(process.env.GEMINI_API_KEY)} description="A concise read of your scored calls, generated only from verified numbers on this profile." initialSummary={insight?.content ?? null} title="Your prediction briefing" /></div><section className="mt-14"><div className="flex items-end justify-between gap-4"><div><SectionLabel>Verified proof</SectionLabel><h2 className="font-display mt-2 text-4xl font-bold">Called It cards</h2></div><p className="hidden max-w-xs text-right text-xs leading-5 text-[var(--text-muted)] sm:block">Fully verified predictions, issued after the official result.</p></div>{cards.length ? <div className="mt-6 grid gap-6 lg:grid-cols-2">{cards.map((card) => <div key={card.id}><CalledItCard card={card} /><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><CardVisibilityForm cardId={card.id} isPublic={card.isPublic} />{card.isPublic ? <a className="text-sm font-bold text-[var(--lime)]" href={`/cards/${card.publicSlug}`}>Open public card ↗</a> : <span className="text-xs font-bold text-[var(--text-faint)]">Public link disabled</span>}</div></div>)}</div> : <div className="mt-6"><EmptyState eyebrow="Collection empty" title="Your first receipt is waiting" description="Call the exact score and first scorer after the result is confirmed to earn a Called It card." action={<Link className="text-sm font-bold text-[var(--lime)]" href="/matches">Open match desk ↗</Link>} /></div>}</section></div>;
}
