import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button, SectionLabel } from "@/components/ui/primitives";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { count } = await supabase.from("predictions").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  const isFirstCall = !count;

  return <div className="app-content-inner space-y-6 sm:space-y-8">
    <header className="flex flex-col justify-between gap-3 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-end sm:gap-5 sm:pb-7">
      <div><SectionLabel>Matchday home</SectionLabel><h1 className="font-display mt-2 text-4xl font-bold leading-[0.88] tracking-[-0.02em] sm:text-6xl lg:text-7xl">{isFirstCall ? <>Your first call<br /><span className="text-[var(--lime)]">starts here.</span></> : <>Keep your call<br /><span className="text-[var(--lime)]">moving.</span></>}</h1><p className="mt-5 max-w-xl text-sm leading-7 text-[var(--text-muted)]">{isFirstCall ? "Pick a fixture, make a prediction, and start building your matchday record." : "Your desk for every score, streak, and receipt. See what is next and keep your record growing."}</p></div>
      <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-1)] px-4 py-3 text-sm"><span className="status-dot status-dot-good" /><span><span className="block font-bold text-[var(--text)]">Signed in</span><span className="block max-w-[190px] truncate text-xs text-[var(--text-faint)]">{user.email}</span></span></div>
    </header>

    <section aria-labelledby="next-call-title" className="ticket-surface ticket-rail interactive-lift overflow-hidden rounded-2xl p-4 pt-6 sm:p-7 sm:pt-9">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><SectionLabel>{isFirstCall ? "Your starting line" : "Next on the desk"}</SectionLabel><p className="mt-2 text-sm font-bold text-[var(--text-muted)]">{isFirstCall ? "One prediction is all it takes" : "Your fixtures are waiting"}</p></div><span className="rounded-full border border-[var(--warning)]/40 bg-[var(--warning)]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--warning)]">Before kickoff</span></div>
      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_auto] md:items-end"><div><h2 id="next-call-title" className="font-display text-3xl font-bold leading-none text-[var(--text)] sm:text-5xl lg:text-6xl">{isFirstCall ? "Make the first call." : "What will you call next?"}</h2><p className="mt-4 max-w-xl text-sm leading-6 text-[var(--text-muted)]">Open the match desk to see upcoming fixtures, confidence allocations, and your saved predictions.</p></div><Button variant="primary" className="w-full sm:w-auto"><Link href="/matches">{isFirstCall ? "Make your first call" : "Open match desk"} <span aria-hidden="true">↗</span></Link></Button></div>
      <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3"><Metric label="Open fixture list" value="→" detail="Upcoming calls" /><Metric label="Prediction lock" value="UTC" detail="Server time" /><Metric label="Your data" value="Safe" detail="Private until kickoff" /></div>
    </section>

    <section className="grid gap-4 sm:gap-5 md:grid-cols-3"><StatCard label="Current points" value="—" detail="Scored results appear here" /><StatCard label="Global rank" value="—" detail={isFirstCall ? "Make your first call" : "Keep climbing"} /><StatCard label="Called It" value="—" detail="Exact proof is earned" /></section>

    <section className="grid gap-4 sm:gap-5 lg:grid-cols-[1.2fr_0.8fr]"><div className="surface rounded-2xl p-4 sm:p-6"><SectionLabel>How the desk works</SectionLabel><div className="mt-6 grid gap-5 sm:grid-cols-3"><Step number="01" title="Call it" copy="Pick a score, scorer, and confidence before kickoff." /><Step number="02" title="Lock it" copy="Your prediction becomes private and final at kickoff." /><Step number="03" title="Prove it" copy="Results score automatically. Exact calls earn a card." /></div></div><div className="surface-raised rounded-2xl p-4 sm:p-6"><SectionLabel>Social edge</SectionLabel><h2 className="font-display mt-3 text-2xl font-bold sm:text-3xl">Bring your rivals in.</h2><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">Find friends, accept requests, and see how your calls stack up once the match begins.</p><Link className="mt-6 inline-flex text-sm font-bold text-[var(--lime)]" href="/friends">Find friends <span aria-hidden="true" className="ml-2">↗</span></Link></div></section>
  </div>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="bg-[var(--surface-1)] p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-faint)]">{label}</p><p className="font-display mt-2 text-2xl font-bold text-[var(--lime)]">{value}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{detail}</p></div>; }
function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="surface rounded-2xl p-4 sm:p-5"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--text-faint)]">{label}</p><p className="font-display mt-3 text-3xl font-bold text-[var(--text)] sm:text-5xl">{value}</p><p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{detail}</p></div>; }
function Step({ number, title, copy }: { number: string; title: string; copy: string }) { return <div className="border-t border-[var(--line)] pt-3"><p className="font-display text-2xl font-bold text-[var(--lime)]">{number}</p><h3 className="mt-3 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{copy}</p></div>; }
