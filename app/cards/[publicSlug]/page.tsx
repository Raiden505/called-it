import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalledItCard } from "@/components/cards/called-it-card";
import { ShareCardActions } from "@/components/cards/share-card-actions";
import { getPublicCalledItCard } from "@/lib/cards/queries";
import { createAdminClient } from "@/lib/supabase/admin";

type PublicCardPageProps = { params: Promise<{ publicSlug: string }> };

export async function generateMetadata({ params }: PublicCardPageProps): Promise<Metadata> {
  const { publicSlug } = await params;
  const card = await getPublicCalledItCard(createAdminClient(), publicSlug);

  if (!card) return { title: "Called It card" };

  return {
    title: `${card.predictor.displayName} called it | Called It`,
    description: `${card.predictor.displayName} correctly called ${card.homeTeam.name} ${card.actualHomeScore}–${card.actualAwayScore} ${card.awayTeam.name}.`,
  };
}

export default async function PublicCardPage({ params }: PublicCardPageProps) {
  const { publicSlug } = await params;
  const card = await getPublicCalledItCard(createAdminClient(), publicSlug);

  if (!card) notFound();

  return <main className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-10"><div className="mx-auto max-w-3xl"><Link className="text-sm font-black tracking-tight" href="/">CALLED IT</Link><div className="mt-12 text-center"><p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Verified prediction</p><h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">{card.predictor.displayName} called it.</h1><p className="mx-auto mt-4 max-w-xl leading-7 text-[var(--muted)]">The exact score and first scorer, confirmed after the official result.</p></div><div className="mx-auto mt-10 max-w-xl"><CalledItCard card={card} /></div><div className="mx-auto mt-7 max-w-xl"><ShareCardActions card={card} /></div><p className="mt-12 text-center text-sm text-[var(--muted)]">Make your call before kickoff at <Link className="font-bold underline" href="/">Called It</Link>.</p></div></main>;
}
