import Link from "next/link";

export function AppNav() {
  return <nav className="mt-6 flex flex-wrap gap-3 text-sm font-bold"><Link className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2" href="/matches">Matches</Link><a className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2" href="/leaderboard">Leaderboard</a><a className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2" href="/friends">Friends</a><a className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2" href="/profile">Profile</a></nav>;
}
