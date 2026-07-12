"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ActiveNavLinkProps = { href: string; label: string; icon: string; variant: "rail" | "bottom" };

function isCurrent(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

export function ActiveNavLink({ href, label, icon, variant }: ActiveNavLinkProps) {
  const pathname = usePathname();
  const active = isCurrent(pathname, href);
  if (variant === "bottom") return <Link aria-current={active ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg ${active ? "bg-[var(--lime)]/10 text-[var(--lime)]" : "text-[var(--text-faint)]"}`} href={href as never}><span aria-hidden="true" className="font-display text-lg leading-none">{icon}</span><span className="text-[10px] font-bold uppercase tracking-[0.08em]">{label}</span></Link>;
  return <Link aria-current={active ? "page" : undefined} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-[var(--lime)]/10 text-[var(--lime)]" : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"}`} href={href as never}><span aria-hidden="true" className={`flex h-7 w-7 items-center justify-center rounded-md border border-transparent font-display text-lg ${active ? "text-[var(--lime)]" : "text-[var(--text-faint)] group-hover:text-[var(--lime)]"}`}>{icon}</span><span>{label}</span></Link>;
}
