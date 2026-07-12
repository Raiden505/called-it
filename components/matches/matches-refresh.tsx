"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function MatchesRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);

  function refresh() {
    startTransition(() => {
      router.refresh();
      setLastCheckedAt(new Date().toISOString());
    });
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      startTransition(() => {
        router.refresh();
        setLastCheckedAt(new Date().toISOString());
      });
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [router, startTransition]);

  return <div className="flex flex-col items-start gap-2 sm:items-end"><button aria-label="Refresh match data now" className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dark)] disabled:opacity-50" disabled={isPending} onClick={refresh} type="button">{isPending ? "Refreshing" : "Refresh data"}</button><p aria-live="polite" className="text-right text-xs text-[var(--muted)]">{lastCheckedAt ? `Checked ${new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(lastCheckedAt))}` : "Auto-checks every minute"}</p></div>;
}
