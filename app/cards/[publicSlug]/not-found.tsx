import Link from "next/link";

export default function PublicCardNotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6"><section className="max-w-lg rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center"><p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--muted)]">Card unavailable</p><h1 className="mt-3 text-3xl font-black tracking-[-0.05em]">This proof is no longer public.</h1><p className="mt-4 leading-7 text-[var(--muted)]">It may have been hidden by its owner or changed after an official result correction.</p><Link className="mt-7 inline-flex rounded-full bg-[var(--dark)] px-5 py-3 font-bold text-white" href="/">Visit Called It</Link></section></main>;
}
