"use client";

import { useState } from "react";
import type { CalledItCardView } from "@/lib/cards/queries";

export function ShareCardActions({ card }: { card: CalledItCardView }) {
  const [message, setMessage] = useState("");

  const getUrl = () => window.location.href;
  const getSvg = () => {
    const text = [
      "CALLED IT",
      `${card.homeTeam.short_name} ${card.actualHomeScore} — ${card.actualAwayScore} ${card.awayTeam.short_name}`,
      `${card.firstGoalscorerName} · ${card.rarity}`,
      `${card.predictor.displayName} · ${card.tournamentName}`,
    ].map(escapeXml);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#172116"/><rect width="1200" height="88" fill="#d8f458"/><text x="64" y="58" fill="#172116" font-family="Arial, sans-serif" font-size="34" font-weight="800" letter-spacing="8">${text[0]}</text><text x="64" y="250" fill="#ffffff" font-family="Arial, sans-serif" font-size="76" font-weight="800">${text[1]}</text><line x1="64" x2="1136" y1="322" y2="322" stroke="#ffffff" stroke-opacity=".24"/><text x="64" y="390" fill="#d8f458" font-family="Arial, sans-serif" font-size="34" font-weight="700">${text[2]}</text><text x="64" y="510" fill="#ffffff" fill-opacity=".7" font-family="Arial, sans-serif" font-size="28">${text[3]}</text><text x="64" y="570" fill="#ffffff" fill-opacity=".45" font-family="Arial, sans-serif" font-size="22">called-it.app</text></svg>`;
  };
  const getFile = () => new File([getSvg()], `called-it-${card.publicSlug}.svg`, { type: "image/svg+xml" });

  async function share() {
    const file = getFile();
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Called It", text: "I called it.", url: getUrl() });
        setMessage("Shared.");
      } else if (navigator.share) {
        await navigator.share({ title: "Called It", text: "I called it.", url: getUrl() });
        setMessage("Shared.");
      } else {
        await navigator.clipboard.writeText(getUrl());
        setMessage("Link copied.");
      }
    } catch {
      setMessage("Share cancelled.");
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(getUrl());
    setMessage("Link copied.");
  }

  function download() {
    const url = URL.createObjectURL(new Blob([getSvg()], { type: "image/svg+xml" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `called-it-${card.publicSlug}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Image downloaded.");
  }

  return <div className="flex flex-wrap items-center gap-3"><button className="min-h-11 rounded-xl bg-[var(--lime)] px-5 py-3 text-sm font-bold text-[var(--canvas)]" onClick={share} type="button">Share card</button><button className="min-h-11 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-5 py-3 text-sm font-bold text-[var(--text)]" onClick={copyLink} type="button">Copy link</button><button className="min-h-11 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-5 py-3 text-sm font-bold text-[var(--text)]" onClick={download} type="button">Download image</button>{message && <p className="text-sm font-bold text-[var(--text-muted)]" role="status">{message}</p>}</div>;
}

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}
