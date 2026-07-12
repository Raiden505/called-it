"use client";

import { useMemo, useState } from "react";
import { countryOptions, getCountryOption } from "@/lib/countries";
import { CountryFlag } from "@/components/media/media";

export function CountryPicker({ defaultValue }: { defaultValue: string | null }) {
  const initial = getCountryOption(defaultValue);
  const [query, setQuery] = useState(initial?.name ?? defaultValue?.toUpperCase() ?? "");
  const [selectedCode, setSelectedCode] = useState(initial?.code ?? "");
  const listId = useMemo(() => "country-options", []);

  function handleChange(value: string) {
    const trimmed = value.trim();
    const match = countryOptions.find((country) => country.name.toLowerCase() === trimmed.toLowerCase() || country.code.toLowerCase() === trimmed.toLowerCase());
    if (match) {
      setQuery(match.name);
      setSelectedCode(match.code);
      return;
    }
    setQuery(value);
    setSelectedCode(/^[a-z]{2}$/i.test(trimmed) ? trimmed.toUpperCase() : "");
  }

  function clear() {
    setQuery("");
    setSelectedCode("");
  }

  return <div>
    <div className="relative">
      <input aria-describedby="country-hint" aria-label="Country" autoComplete="country-name" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 pr-24 text-[var(--text)] placeholder:text-[var(--text-faint)]" list={listId} onChange={(event) => handleChange(event.target.value)} placeholder="Search by country or code" value={query} />
      {selectedCode ? <span className="pointer-events-none absolute inset-y-0 right-10 flex items-center"><CountryFlag countryCode={selectedCode} label={query || "Selected country"} /></span> : null}
      {query ? <button aria-label="Clear country" className="absolute inset-y-0 right-2 px-3 text-lg text-[var(--text-faint)] hover:text-[var(--text)]" onClick={clear} type="button">×</button> : null}
    </div>
    <datalist id={listId}>{countryOptions.map((country) => <option key={country.code} value={country.name}>{country.code}</option>)}</datalist>
    <input name="countryCode" type="hidden" value={selectedCode} />
    <p className="mt-2 text-xs text-[var(--text-muted)]" id="country-hint">Type to search; your flag appears beside your matchday identity.</p>
  </div>;
}
