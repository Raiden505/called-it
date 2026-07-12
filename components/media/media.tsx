"use client";

import Image from "next/image";
import { useState } from "react";
import { countryFlagUrl, initials, isAllowedImageUrl } from "@/lib/media";

type MediaFallbackProps = { label: string; className?: string; tone?: "team" | "person" | "neutral"; size?: number };

export function MediaFallback({ label, className = "", tone = "neutral", size }: MediaFallbackProps) {
  return <span aria-hidden="true" className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-display font-bold ${tone === "team" ? "bg-[var(--surface-3)] text-[var(--lime)]" : tone === "person" ? "bg-[var(--surface-2)] text-[var(--text-muted)]" : "bg-[var(--surface-3)] text-[var(--text-faint)]"} ${className}`} style={size ? { width: size, height: size } : undefined}>{initials(label)}</span>;
}

export function TeamCrest({ name, code, badgeUrl, size = 44, className = "" }: { name: string; code?: string | null; badgeUrl?: string | null; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const label = `${name} crest`;
  if (!badgeUrl || !isAllowedImageUrl(badgeUrl) || failed) return <MediaFallback label={code ?? name} className={className} tone="team" size={size} />;
  return <span className={`relative block shrink-0 ${className}`} style={{ width: size, height: size }}><Image alt={label} className="object-contain" fill sizes={`${size}px`} src={badgeUrl} onError={() => setFailed(true)} /></span>;
}

export function PlayerAvatar({ name, photoUrl, size = 32, className = "" }: { name: string; photoUrl?: string | null; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!photoUrl || !isAllowedImageUrl(photoUrl) || failed) return <MediaFallback label={name} className={className} tone="person" size={size} />;
  return <span className={`relative block shrink-0 overflow-hidden rounded-full ${className}`} style={{ width: size, height: size }}><Image alt={`${name} portrait`} className="object-cover" fill sizes={`${size}px`} src={photoUrl} onError={() => setFailed(true)} /></span>;
}

export function ProfileAvatar({ name, avatarUrl, size = 36, className = "" }: { name: string; avatarUrl?: string | null; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!avatarUrl || !isAllowedImageUrl(avatarUrl) || failed) return <MediaFallback label={name} className={className} tone="person" size={size} />;
  return <span className={`relative block shrink-0 overflow-hidden rounded-full ${className}`} style={{ width: size, height: size }}><Image alt={`${name} avatar`} className="object-cover" fill sizes={`${size}px`} src={avatarUrl} onError={() => setFailed(true)} /></span>;
}

export function CountryFlag({ countryCode, label = "Country" }: { countryCode?: string | null; label?: string }) {
  const [failed, setFailed] = useState(false);
  const src = countryFlagUrl(countryCode);
  if (!src || failed) return countryCode ? <span aria-label={`${label}: ${countryCode.toUpperCase()}`} className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-faint)]">{countryCode.toUpperCase()}</span> : null;
  return <Image alt={`${label} flag`} className="inline-block rounded-[2px] object-cover" height={18} width={24} src={src} onError={() => setFailed(true)} />;
}
