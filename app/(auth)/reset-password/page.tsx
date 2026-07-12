"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Button, Notice } from "@/components/ui/primitives";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState(""); const [message, setMessage] = useState<string | null>(null); const [error, setError] = useState<string | null>(null); const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); setError(null); setMessage(null); const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/callback?next=/profile/edit` }); if (resetError) setError(resetError.message); else setMessage("If an account uses that email, a reset link is on its way."); setPending(false); }
  return <main className="flex min-h-screen items-center justify-center bg-[var(--canvas)] px-5 py-10"><section className="surface w-full max-w-md rounded-2xl p-6 sm:p-10"><Link className="font-display text-2xl font-bold tracking-[0.04em]" href="/">CALLED IT</Link><p className="mt-14 text-xs font-bold uppercase tracking-[0.2em] text-[var(--lime)]">Account access</p><h1 className="font-display mt-3 text-5xl font-bold leading-none">Reset your password.</h1><p className="mt-4 text-sm leading-7 text-[var(--text-muted)]">Enter the email you use for Called It and we’ll send a secure reset link.</p><form className="mt-8 space-y-5" onSubmit={submit}><label className="block text-sm font-bold">Email<input className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text)]" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>{error && <Notice tone="danger">{error}</Notice>}{message && <Notice tone="success">{message}</Notice>}<Button className="w-full" type="submit" disabled={pending}>{pending ? "Sending…" : "Send reset link"}</Button></form><Link className="mt-7 block text-center text-sm font-bold text-[var(--text-muted)] hover:text-[var(--lime)]" href="/login">Back to sign in</Link></section></main>;
}
