import { z } from "zod";

const nullableNumber = z.number().int().nonnegative().nullable().optional();
export const footballDataTeamSchema = z.object({
  id: z.number().int().positive(), name: z.string().min(1), shortName: z.string().min(1).optional().default(""),
  tla: z.string().nullable().optional(), crest: z.string().url().nullable().optional(),
  area: z.object({ code: z.string().nullable().optional() }).optional(),
});
const scoreSchema = z.object({ duration: z.string().nullable().optional(), winner: z.string().nullable().optional(),
  fullTime: z.object({ home: nullableNumber, away: nullableNumber }).optional(), halfTime: z.object({ home: nullableNumber, away: nullableNumber }).optional(),
  extraTime: z.object({ home: nullableNumber, away: nullableNumber }).optional(), penalties: z.object({ home: nullableNumber, away: nullableNumber }).optional() });
const goalSchema = z.object({ minute: z.number().int().nonnegative().nullable().optional(), injuryTime: z.number().int().nonnegative().nullable().optional(), type: z.enum(["REGULAR", "OWN", "PENALTY"]), team: footballDataTeamSchema, scorer: z.object({ id: z.number().int().positive(), name: z.string().min(1) }).nullable().optional() });
const playerSchema = z.object({ id: z.number().int().positive(), name: z.string().min(1), position: z.string().nullable().optional(), shirtNumber: z.number().int().positive().nullable().optional() });
const footballDataMatchTeamSchema = footballDataTeamSchema.extend({ id: z.number().int().positive().nullable(), name: z.string().min(1).nullable(), shortName: z.string().min(1).nullable(), lineup: z.array(playerSchema).optional(), bench: z.array(playerSchema).optional() });
export const footballDataMatchSchema = z.object({
  id: z.number().int().positive(), utcDate: z.string().datetime({ offset: true }).nullable().optional(),
  status: z.enum(["SCHEDULED", "TIMED", "IN_PLAY", "PAUSED", "EXTRA_TIME", "PENALTY_SHOOTOUT", "FINISHED", "SUSPENDED", "POSTPONED", "CANCELLED", "AWARDED"]),
  stage: z.string().nullable().optional(), lastUpdated: z.string().datetime({ offset: true }).nullable().optional(), competition: z.object({ id: z.number().int().positive() }),
  season: z.object({ startDate: z.string(), endDate: z.string(), currentMatchday: z.number().int().nullable().optional() }).optional(), homeTeam: footballDataMatchTeamSchema, awayTeam: footballDataMatchTeamSchema, score: scoreSchema,
  goals: z.array(goalSchema).optional(),
});
export const footballDataMatchesResponseSchema = z.object({ matches: z.array(footballDataMatchSchema) });
export const footballDataTeamResponseSchema = footballDataTeamSchema.extend({ squad: z.array(playerSchema).optional() });
export type FootballDataMatch = z.infer<typeof footballDataMatchSchema>;
export type FootballDataTeamResponse = z.infer<typeof footballDataTeamResponseSchema>;
