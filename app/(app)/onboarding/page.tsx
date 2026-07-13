import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { getSelectableTeams } from "@/lib/profiles/queries";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("username,display_name,favorite_team_id,country_code,bio,is_searchable,profile_visibility,onboarding_completed_at").eq("id", user.id).maybeSingle();
  if (profile?.onboarding_completed_at) redirect("/profile/edit" as never);
  const teams = await getSelectableTeams(supabase);
  const params = await searchParams;
  return <main className="min-h-screen overflow-hidden bg-[var(--canvas)] px-5 py-8 sm:px-8"><div className="mx-auto grid max-w-[1180px] gap-4 sm:gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:py-10"><section className="ticket-surface ticket-rail relative rounded-2xl p-5 pt-8 sm:p-10 sm:pt-12"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--lime)]">Before kickoff</p><h1 className="font-display mt-5 max-w-md text-4xl font-bold leading-[0.85] sm:text-6xl lg:text-7xl">Make the call yours.</h1><p className="mt-6 max-w-sm text-sm leading-7 text-[var(--text-muted)]">Set your matchday identity once. Then get straight to the fixtures, friends, and receipts.</p><div className="mt-8 border-t border-[var(--line)] pt-5 sm:mt-14 text-xs font-bold uppercase tracking-[0.15em] text-[var(--text-faint)]"><span className="text-[var(--lime)]">01</span> Your profile card</div></section><section className="surface rounded-2xl p-5 pt-8 sm:p-10 sm:pt-12"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--lime)]">Your matchday card</p><h2 className="font-display mt-3 text-2xl font-bold sm:text-4xl lg:text-5xl">Tell us who to put on the ticket.</h2><p className="mt-3 max-w-xl text-sm leading-7 text-[var(--text-muted)]">Username, display name, and favourite team are required. You can tune the rest later.</p><ProfileForm mode="onboarding" next={params.next} profile={{ username: profile?.username ?? null, display_name: profile?.display_name ?? "New predictor", favorite_team_id: profile?.favorite_team_id ?? null, country_code: profile?.country_code ?? null, bio: profile?.bio ?? null, is_searchable: profile?.is_searchable ?? true, profile_visibility: profile?.profile_visibility ?? "public" }} teams={teams} /></section></div></main>;
}
