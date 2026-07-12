"use client";

import { useMemo, useState } from "react";
import type { SelectableTeam } from "@/lib/profiles/queries";
import { CountryFlag, TeamCrest } from "@/components/media/media";

export function TeamPicker({ teams, defaultTeamId }: { teams: SelectableTeam[]; defaultTeamId: string | null }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(defaultTeamId ?? "");
  const selectedTeam = teams.find((team) => team.id === selectedId) ?? null;
  const matches = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return [];
    return teams.filter((team) => `${team.name} ${team.short_name} ${team.code ?? ""}`.toLowerCase().includes(search)).slice(0, 8);
  }, [query, teams]);

  function selectTeam(team: SelectableTeam) {
    setSelectedId(team.id);
    setQuery("");
  }

  return <div>
    <input name="favoriteTeamId" type="hidden" value={selectedId} />
    <label className="sr-only" htmlFor="favourite-team-search">Search for your favourite team</label>
    <div className="relative"><input autoComplete="off" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-faint)]" id="favourite-team-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search by team or country" value={query} />{query ? <button aria-label="Clear team search" className="absolute inset-y-0 right-2 px-3 text-lg text-[var(--text-faint)] hover:text-[var(--text)]" onClick={() => setQuery("")} type="button">×</button> : null}</div>
    {selectedTeam ? <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[var(--lime)]/50 bg-[var(--lime)]/10 p-3"><div className="flex min-w-0 items-center gap-3"><TeamCrest name={selectedTeam.name} code={selectedTeam.code} badgeUrl={selectedTeam.badge_url} size={38} /><div className="min-w-0"><p className="truncate text-sm font-bold text-[var(--text)]">{selectedTeam.name}</p><p className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]"><CountryFlag countryCode={selectedTeam.country_code} label={selectedTeam.name} />{selectedTeam.code ?? "Selected team"}</p></div></div><button className="shrink-0 text-xs font-bold text-[var(--lime)] hover:text-[var(--text)]" onClick={() => setSelectedId("")} type="button">Change</button></div> : <p className="mt-3 text-xs text-[var(--text-muted)]">Start typing to find your crest. Choose one result to make it your favourite.</p>}
    {query ? <div aria-live="polite" className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--surface-1)] p-1">{matches.length ? matches.map((team) => <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-[var(--surface-2)] focus-visible:bg-[var(--surface-2)]" key={team.id} onClick={() => selectTeam(team)} type="button"><TeamCrest name={team.name} code={team.code} badgeUrl={team.badge_url} size={32} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{team.name}</span><span className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]"><CountryFlag countryCode={team.country_code} label={team.name} />{team.code ?? team.short_name}</span></span></button>) : <p className="px-3 py-4 text-sm text-[var(--text-muted)]">No team matched “{query}”. Try a country or team name.</p>}</div> : null}
  </div>;
}
