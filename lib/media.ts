const approvedHosts = new Set(["crests.football-data.org", "flagcdn.com"]);

export function normalizeCountryCode(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? "";
  return /^[a-z]{2}$/.test(normalized) ? normalized : null;
}

export function countryFlagUrl(value: string | null | undefined): string | null {
  const code = normalizeCountryCode(value);
  return code ? `https://flagcdn.com/24x18/${code}.png` : null;
}

export function initials(value: string | null | undefined, fallback = "?"): string {
  const words = value?.trim().split(/\s+/).filter(Boolean) ?? [];
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase() || fallback;
}

export function isAllowedImageUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
    return url.protocol === "https:" && (approvedHosts.has(url.hostname) || url.hostname === supabaseHost);
  } catch {
    return false;
  }
}
