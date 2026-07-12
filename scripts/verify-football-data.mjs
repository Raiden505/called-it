#!/usr/bin/env node

import process from "node:process";
import { existsSync, readFileSync } from "node:fs";

const args = parseArgs(process.argv.slice(2));
const localEnv = readDotEnv(".env.local");
const config = {
  apiToken: process.env.FOOTBALL_DATA_API_TOKEN ?? localEnv.FOOTBALL_DATA_API_TOKEN,
  baseUrl: process.env.FOOTBALL_DATA_BASE_URL ?? localEnv.FOOTBALL_DATA_BASE_URL ?? "https://api.football-data.org/v4",
  competition: args.competition ?? process.env.FOOTBALL_DATA_COMPETITION ?? localEnv.FOOTBALL_DATA_COMPETITION,
  season: args.season ?? process.env.FOOTBALL_DATA_SEASON ?? localEnv.FOOTBALL_DATA_SEASON,
  fixtureIds: args.fixtures?.split(",").map((id) => id.trim()).filter(Boolean) ?? [],
  dateFrom: args.from ?? process.env.FOOTBALL_DATA_DATE_FROM ?? localEnv.FOOTBALL_DATA_DATE_FROM ?? todayUtc(),
  dateTo: args.to ?? process.env.FOOTBALL_DATA_DATE_TO ?? localEnv.FOOTBALL_DATA_DATE_TO ?? addUtcDays(todayUtc(), 14),
};

const missing = [
  ["FOOTBALL_DATA_API_TOKEN", config.apiToken],
  ["FOOTBALL_DATA_COMPETITION or --competition", config.competition],
  ["FOOTBALL_DATA_SEASON or --season", config.season],
].filter(([, value]) => !value).map(([name]) => name);

if (missing.length) {
  console.error("Phase 0 football-data.org verification cannot run yet.");
  console.error(`Missing: ${missing.join(", ")}`);
  console.error("Set the values in .env.local or pass --competition=<code> --season=<yyyy>.");
  process.exit(1);
}

if (!/^\d{4}$/.test(String(config.season)) || !/^[A-Za-z0-9_-]+$/.test(String(config.competition))) {
  console.error("Invalid provider configuration: competition must be a code/ID and season must be a four-digit year.");
  process.exit(1);
}

const provider = createProviderClient(config);

try {
  const competitionPayload = await provider.get(`competitions/${encodeURIComponent(config.competition)}`);
  const competition = competitionPayload;
  const matchesPayload = await provider.get(`competitions/${encodeURIComponent(config.competition)}/matches`, {
    season: config.season,
    dateFrom: config.dateFrom,
    dateTo: config.dateTo,
    limit: "20",
  }, matchHeaders());
  const teamsPayload = await provider.get(`competitions/${encodeURIComponent(config.competition)}/teams`, {
    season: config.season,
  });
  const matches = Array.isArray(matchesPayload.matches) ? matchesPayload.matches : [];
  const teams = Array.isArray(teamsPayload.teams) ? teamsPayload.teams : [];

  console.log(JSON.stringify({
    provider: "football-data.org",
    apiVersion: "v4",
    competition: summarizeCompetition(competition),
    season: config.season,
    dateWindow: { from: config.dateFrom, to: config.dateTo },
    capabilitiesObserved: {
      matchGoals: matches.some((match) => Array.isArray(match.goals)),
      matchLineups: matches.some((match) => Array.isArray(match.homeTeam?.lineup) || Array.isArray(match.awayTeam?.lineup)),
      teamSquads: teams.some((team) => Array.isArray(team.squad) && team.squad.length > 0),
      statuses: [...new Set(matches.map((match) => match.status).filter(Boolean))].sort(),
    },
    requestBudget: summarizeHeaders(matchesPayload.headers),
  }, null, 2));

  const statusCounts = Object.groupBy(matches, (match) => match.status ?? "UNKNOWN");
  console.log(JSON.stringify({
    fixtureSummary: {
      results: matches.length,
      statusCounts: Object.fromEntries(Object.entries(statusCounts).map(([status, values]) => [status, values.length])),
      fixtures: matches.map(summarizeFixture),
    },
    teamSummary: {
      results: teams.length,
      teamsWithSquads: teams.filter((team) => Array.isArray(team.squad) && team.squad.length > 0).length,
    },
  }, null, 2));

  for (const fixtureId of config.fixtureIds) {
    const fixture = await provider.get(`matches/${encodeURIComponent(fixtureId)}`, {}, matchHeaders());
    console.log(JSON.stringify({ contractFixture: summarizeFixtureContract(fixture) }, null, 2));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Provider verification failed.");
  process.exitCode = 1;
}

function createProviderClient({ apiToken, baseUrl }) {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  return {
    async get(path, params = {}, headers = {}) {
      const url = new URL(`${normalizedBaseUrl}/${path}`);
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      let response;
      try {
        response = await fetch(url, {
          headers: { "X-Auth-Token": apiToken, ...headers },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const providerError = payload?.error ? ` ${payload.error}` : "";
        throw new Error(`football-data.org ${path} failed with HTTP ${response.status}.${providerError}`);
      }
      if (!payload || typeof payload !== "object") {
        throw new Error(`football-data.org ${path} returned an invalid JSON response.`);
      }
      return { ...payload, headers: summarizeHeaders(response.headers) };
    },
  };
}

function matchHeaders() {
  return {
    "X-Unfold-Lineups": "true",
    "X-Unfold-Bookings": "true",
    "X-Unfold-Subs": "true",
    "X-Unfold-Goals": "true",
  };
}

function summarizeCompetition(competition) {
  return {
    id: competition.id,
    code: competition.code,
    name: competition.name,
    type: competition.type,
    area: competition.area ? { id: competition.area.id, name: competition.area.name, code: competition.area.code } : null,
    currentSeason: competition.currentSeason ? {
      id: competition.currentSeason.id,
      startDate: competition.currentSeason.startDate,
      endDate: competition.currentSeason.endDate,
      currentMatchday: competition.currentSeason.currentMatchday,
    } : null,
  };
}

function summarizeFixture(match) {
  return {
    id: match.id,
    utcDate: match.utcDate,
    status: match.status,
    minute: match.minute ?? null,
    injuryTime: match.injuryTime ?? null,
    stage: match.stage,
    matchday: match.matchday ?? null,
    homeTeam: match.homeTeam ? { id: match.homeTeam.id, name: match.homeTeam.name, tla: match.homeTeam.tla } : null,
    awayTeam: match.awayTeam ? { id: match.awayTeam.id, name: match.awayTeam.name, tla: match.awayTeam.tla } : null,
    score: match.score ?? null,
  };
}

function summarizeFixtureContract(match) {
  const goals = Array.isArray(match.goals) ? match.goals : [];
  return {
    ...summarizeFixture(match),
    lastUpdated: match.lastUpdated ?? null,
    score: match.score ?? null,
    goalEvents: goals.map((goal) => ({
      minute: goal.minute ?? null,
      injuryTime: goal.injuryTime ?? null,
      type: goal.type ?? null,
      teamId: goal.team?.id ?? null,
      scorerId: goal.scorer?.id ?? null,
      score: goal.score ?? null,
    })),
    lineupCounts: {
      home: Array.isArray(match.homeTeam?.lineup) ? match.homeTeam.lineup.length : null,
      away: Array.isArray(match.awayTeam?.lineup) ? match.awayTeam.lineup.length : null,
      homeBench: Array.isArray(match.homeTeam?.bench) ? match.homeTeam.bench.length : null,
      awayBench: Array.isArray(match.awayTeam?.bench) ? match.awayTeam.bench.length : null,
    },
  };
}

function summarizeHeaders(headers) {
  if (!headers) return null;
  const get = (name) => typeof headers.get === "function" ? headers.get(name) : headers[name] ?? null;
  return {
    apiVersion: get("x-api-version"),
    requestsAvailable: get("x-requestsavailable"),
    requestCounterResetSeconds: get("x-requestcounter-reset"),
  };
}

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function addUtcDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const result = {};
  for (const value of argv) {
    const match = value.match(/^--([^=]+)=(.*)$/);
    if (match) result[match[1]] = match[2];
  }
  return result;
}

function readDotEnv(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/))
      .filter(Boolean)
      .map(([, key, rawValue]) => [key, rawValue.replace(/^['"]|['"]$/g, "")]),
  );
}
