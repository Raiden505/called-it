import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { getSelectableTeams } from "@/lib/profiles/queries";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: profile }, teams] = await Promise.all([supabase.from("profiles").select("username,display_name,favorite_team_id,country_code,bio,is_searchable,profile_visibility").eq("id", user.id).single(), getSelectableTeams(supabase)]);
  if (!profile) redirect("/onboarding" as never);
  return <main className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-10"><div className="mx-auto max-w-4xl"><Link className="text-sm font-bold text-[var(--muted)]" href="/profile">← Profile</Link><div className="mt-8 rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-10"><p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--muted)]">Profile settings</p><h1 className="mt-3 text-2xl font-black tracking-[-0.06em] sm:text-4xl">Keep your card current.</h1><p className="mt-3 max-w-xl leading-7 text-[var(--muted)]">Your name, crest, and visibility are always yours to change.</p><ProfileForm mode="edit" profile={profile} teams={teams} /></div></div></main>;
}
