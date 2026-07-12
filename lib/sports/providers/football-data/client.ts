import { footballDataMatchSchema, footballDataMatchesResponseSchema, footballDataTeamResponseSchema } from "@/lib/sports/providers/football-data/schemas";
import type { FootballDataMatch, FootballDataTeamResponse } from "@/lib/sports/providers/football-data/schemas";
export type FootballDataClientOptions = { token: string; baseUrl?: string; fetchImpl?: typeof fetch; timeoutMs?: number; sleep?: (ms: number) => Promise<void> };

export class FootballDataClient {
  private readonly baseUrl: string; private readonly fetchImpl: typeof fetch; private readonly timeoutMs: number; private readonly sleep: (ms: number) => Promise<void>; private readonly token: string;
  constructor(options: FootballDataClientOptions) { this.token = options.token; this.baseUrl = (options.baseUrl ?? "https://api.football-data.org/v4").replace(/\/$/, ""); this.fetchImpl = options.fetchImpl ?? fetch; this.timeoutMs = options.timeoutMs ?? 10000; this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms))); }
  async getMatches(path: string): Promise<FootballDataMatch[]> { return (await this.request(path, (value) => footballDataMatchesResponseSchema.parse(value))).matches; }
  async getMatch(id: string): Promise<FootballDataMatch> { return this.request(`/matches/${encodeURIComponent(id)}`, (value) => footballDataMatchSchema.parse(value)); }
  async getTeam(id: string): Promise<FootballDataTeamResponse> { return this.request(`/teams/${encodeURIComponent(id)}`, (value) => footballDataTeamResponseSchema.parse(value)); }
  private async request<T>(path: string, parse: (value: unknown) => T, attempt = 0): Promise<T> {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try { const response = await this.fetchImpl(`${this.baseUrl}${path}`, { headers: { "X-Auth-Token": this.token, "X-Unfold-Goals": "true", "X-Unfold-Lineups": "true", "X-Unfold-Subs": "true" }, signal: controller.signal });
      if (!response.ok) { if ((response.status === 429 || response.status >= 500) && attempt < 2) { await this.sleep(250 * (attempt + 1)); return this.request(path, parse, attempt + 1); } throw new Error(`football-data request failed (${response.status})`); }
      return parse(await response.json());
    } catch (error) { if (error instanceof Error && error.name === "AbortError" && attempt < 2) { await this.sleep(250 * (attempt + 1)); return this.request(path, parse, attempt + 1); } throw error; } finally { clearTimeout(timeout); }
  }
}
