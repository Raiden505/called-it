"use client";

import { useActionState } from "react";
import { updateCardVisibility, type CardVisibilityState } from "@/app/(app)/profile/actions";

const initialState: CardVisibilityState = { ok: true, message: "" };

export function CardVisibilityForm({ cardId, isPublic }: { cardId: string; isPublic: boolean }) {
  const [state, formAction, isPending] = useActionState(updateCardVisibility, initialState);

  return <form action={formAction} className="flex flex-wrap items-center gap-3"><input name="cardId" type="hidden" value={cardId} /><input name="isPublic" type="hidden" value={String(!isPublic)} /><button className="min-h-10 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-sm font-bold text-[var(--text)] disabled:opacity-50" disabled={isPending} type="submit">{isPending ? "Saving..." : isPublic ? "Disable public link" : "Make public"}</button>{state.message && <p className={state.ok ? "text-sm font-bold text-[var(--text-muted)]" : "text-sm font-bold text-[var(--danger)]"} role="status">{state.message}</p>}</form>;
}
