"use client";

import { useState, useTransition } from "react";
import { submitPrediction, type PredictionActionResult } from "@/app/(app)/matches/actions";
import type { MatchDetailViewModel, MatchSummaryViewModel } from "@/lib/matches/queries";
import { Button, Notice } from "@/components/ui/primitives";
import { CountryFlag, PlayerAvatar, TeamCrest } from "@/components/media/media";
import { LocalTime } from "@/components/ui/local-time";
import { outcomeForScores, scoresForOutcome, type PredictionOutcome } from "@/lib/matches/prediction-outcome";

export function PredictionForm({ match }: { match: MatchSummaryViewModel | MatchDetailViewModel }) {
  const existing = match.prediction;
  const [homeScore, setHomeScore] = useState(existing?.predicted_home_score ?? 0);
  const [awayScore, setAwayScore] = useState(existing?.predicted_away_score ?? 0);
  const [outcome, setOutcome] = useState<PredictionOutcome>(outcomeForScores(homeScore, awayScore));
  const [firstGoalscorerId, setFirstGoalscorerId] = useState(existing?.predicted_first_goalscorer_id ?? "");
  const [noGoalscorer, setNoGoalscorer] = useState(existing?.predicted_no_goalscorer ?? false);
  const [confidenceMultiplier, setConfidenceMultiplier] = useState<1 | 2 | 3>(existing?.confidence_multiplier ?? 1);
  const [result, setResult] = useState<PredictionActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const isLocked = new Date() >= new Date(match.kickoffAt) || match.status !== "scheduled";
  const homePlayers = match.players.filter((player) => player.team_id === match.homeTeam.id);
  const awayPlayers = match.players.filter((player) => player.team_id === match.awayTeam.id);
  const selectedPlayer = [...homePlayers, ...awayPlayers].find((player) => player.id === firstGoalscorerId);

  function updateScores(nextHome: number, nextAway: number) {
    setHomeScore(nextHome);
    setAwayScore(nextAway);
    setOutcome(outcomeForScores(nextHome, nextAway));
  }

  function chooseOutcome(nextOutcome: PredictionOutcome) {
    const [nextHome, nextAway] = scoresForOutcome(nextOutcome, homeScore, awayScore);
    updateScores(nextHome, nextAway);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    startTransition(async () => {
      const actionResult = await submitPrediction({ matchId: match.id, homeScore, awayScore, firstGoalscorerId: noGoalscorer || !firstGoalscorerId ? null : firstGoalscorerId, noGoalscorer, advancedTeamId: null, confidenceMultiplier });
      setResult(actionResult);
    });
  }

  return <form className="mt-7 border-t border-[var(--line)] pt-6" onSubmit={handleSubmit}>
    <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--text-faint)]">Your call</p><p className="text-xs font-bold text-[var(--warning)]">Locks <LocalTime date={match.kickoffAt} /></p></div>
    <fieldset className="mt-5"><legend className="text-sm font-bold">Score and result</legend><p className="mt-1 text-xs text-[var(--text-muted)]">Tap a flag to pick the winner. Choose Draw for a level score, including penalty-decided matches.</p><div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-end gap-3"><ScoreControl team={match.homeTeam} score={homeScore} selected={outcome === "home"} onSelect={() => chooseOutcome("home")} onChange={(score) => updateScores(score, awayScore)} /><div className="flex flex-col items-center gap-3 pb-3"><span className="font-display text-xl font-bold text-[var(--text-faint)]">–</span><button aria-pressed={outcome === "draw"} className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition ${outcome === "draw" ? "border-[var(--lime)] bg-[var(--lime)] text-[var(--canvas)]" : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-[var(--lime)]"}`} onClick={() => chooseOutcome("draw")} type="button">Draw</button></div><ScoreControl team={match.awayTeam} score={awayScore} selected={outcome === "away"} onSelect={() => chooseOutcome("away")} onChange={(score) => updateScores(homeScore, score)} /></div></fieldset>
    <label className="mt-6 block text-sm font-bold">First goalscorer<select className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--text)]" value={noGoalscorer ? "" : firstGoalscorerId} onChange={(event) => setFirstGoalscorerId(event.target.value)} disabled={noGoalscorer || isLocked}><option value="">Skip for now</option><optgroup label={match.homeTeam.short_name}>{homePlayers.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</optgroup><optgroup label={match.awayTeam.short_name}>{awayPlayers.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</optgroup></select></label>
    {selectedPlayer && !noGoalscorer && <div className="mt-3 flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2"><PlayerAvatar name={selectedPlayer.name} photoUrl={selectedPlayer.photo_url} size={28} /><span className="text-xs font-bold">{selectedPlayer.name}<span className="ml-2 font-normal text-[var(--text-faint)]">Selected scorer</span></span></div>}
    <label className="mt-4 flex min-h-11 items-center gap-3 text-sm font-bold text-[var(--text-muted)]"><input className="h-5 w-5 accent-[var(--lime)]" type="checkbox" checked={noGoalscorer} onChange={(event) => setNoGoalscorer(event.target.checked)} disabled={isLocked} />No goalscorer</label>
    <fieldset className="mt-5"><legend className="text-sm font-bold">Confidence <span className="ml-2 text-xs font-normal text-[var(--text-faint)]">Choose your risk</span></legend><div className="mt-3 grid grid-cols-3 gap-2">{[1, 2, 3].map((multiplier) => { const value = multiplier as 1 | 2 | 3; const remaining = value === 1 ? null : match.multiplierRemaining[value]; const unavailable = !isLocked && value !== 1 && remaining === 0 && confidenceMultiplier !== value; return <button className={`min-h-12 rounded-xl border text-sm font-bold transition ${confidenceMultiplier === value ? "border-[var(--lime)] bg-[var(--lime)] text-[var(--canvas)]" : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-[var(--lime)]"}`} key={multiplier} type="button" onClick={() => setConfidenceMultiplier(value)} disabled={isLocked || unavailable}>{multiplier}×{remaining !== null && <span className="ml-1 text-xs opacity-70">({remaining})</span>}</button>; })}</div></fieldset>
    {result && (result.ok ? <div className="mt-4"><Notice tone="success" role="status">Prediction saved. Your call is on the desk.</Notice></div> : <div className="mt-4"><Notice tone="danger">{result.error}</Notice></div>)}
    <Button className="mt-5 w-full" type="submit" disabled={isLocked || isPending}>{isLocked ? "Locked at kickoff" : isPending ? "Saving your call…" : existing ? "Update prediction" : "Save prediction"}</Button>
  </form>;
}

function ScoreControl({ team, score, selected, onSelect, onChange }: { team: MatchSummaryViewModel["homeTeam"]; score: number; selected: boolean; onSelect: () => void; onChange: (score: number) => void }) {
  return <div><button aria-label={`Predict ${team.name} to win`} aria-pressed={selected} className={`mx-auto flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-xl border px-3 py-2 transition ${selected ? "border-[var(--lime)] bg-[var(--lime)]/10 text-[var(--lime)]" : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-[var(--lime)]"}`} onClick={onSelect} type="button"><CountryFlag countryCode={team.country_code} label={`${team.name} selectable flag`} /><span className="text-[10px] font-black uppercase tracking-[0.1em]">{selected ? "Winner" : "Pick winner"}</span></button><TeamCrest name={team.name} code={team.code} badgeUrl={team.badge_url} size={36} className="mx-auto mt-3" /><p className="mt-2 truncate text-center text-sm font-bold">{team.short_name}</p><div className="mt-2 flex items-center justify-center gap-2"><button aria-label={`Decrease ${team.short_name} score`} className="font-display h-10 w-10 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-2xl font-bold leading-none text-[var(--text-muted)] transition hover:border-[var(--lime)] hover:text-[var(--lime)] disabled:cursor-not-allowed disabled:opacity-45" type="button" onClick={() => onChange(Math.max(0, score - 1))} disabled={score === 0}>−</button><input aria-label={`${team.short_name} score`} className="score-input font-display block w-20 bg-transparent text-center text-6xl font-bold leading-none text-[var(--text)]" inputMode="numeric" min="0" type="number" value={score} onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))} /><button aria-label={`Increase ${team.short_name} score`} className="font-display h-10 w-10 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-2xl font-bold leading-none text-[var(--text-muted)] transition hover:border-[var(--lime)] hover:text-[var(--lime)]" type="button" onClick={() => onChange(score + 1)}>+</button></div></div>;
}
