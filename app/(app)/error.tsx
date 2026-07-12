"use client";

export default function AppError({ reset }: { reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6"><section className="max-w-lg rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center"><p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--muted)]">Match paused</p><h1 className="mt-3 text-3xl font-black tracking-[-0.05em]">This view could not load.</h1><p className="mt-4 leading-7 text-[var(--muted)]">Your saved predictions are safe. Try loading the latest data again.</p><button className="mt-7 rounded-full bg-[var(--dark)] px-5 py-3 font-bold text-white" onClick={reset} type="button">Try again</button></section></main>;
}
