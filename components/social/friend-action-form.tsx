"use client";

import { useActionState } from "react";
import { sendFriendRequest, resolveFriendRequest, type FriendshipActionState } from "@/app/(app)/friends/actions";

const initialState: FriendshipActionState = { ok: true, message: "" };

export function SendFriendButton({ profileId }: { profileId: string }) {
  const [state, formAction, isPending] = useActionState(sendFriendRequest, initialState);
  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="addresseeId" value={profileId} />
      <button className="min-h-10 rounded-xl bg-[var(--lime)] px-4 py-2 text-sm font-bold text-[var(--canvas)] disabled:opacity-50">
        {isPending ? "Sending..." : "Add friend"}
      </button>
      {state.message && <span className={state.ok ? "text-sm text-[var(--muted)]" : "text-sm text-red-700"}>{state.message}</span>}
    </form>
  );
}

export function ResolveFriendButton({ friendshipId, action, label }: { friendshipId: string; action: "accept" | "reject" | "cancel" | "remove" | "block"; label: string }) {
  const [state, formAction, isPending] = useActionState(resolveFriendRequest, initialState);
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="friendshipId" value={friendshipId} />
      <input type="hidden" name="action" value={action} />
      <button className={`min-h-10 rounded-xl border px-3 py-2 text-xs font-bold disabled:opacity-50 ${action === "block" || action === "remove" ? "border-[var(--danger)]/40 text-[var(--danger)]" : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--text)]"}`} disabled={isPending}>{isPending ? "..." : label}</button>
      {state.message && !state.ok && <span className="text-xs text-red-700">{state.message}</span>}
    </form>
  );
}
