import { z } from "zod";
import { postgresUuidSchema } from "@/lib/validation/postgres";

export const resultProcessingInputSchema = z.object({
  matchId: postgresUuidSchema,
  homeScore90: z.number().int().nonnegative(),
  awayScore90: z.number().int().nonnegative(),
  homeScoreFinal: z.number().int().nonnegative().nullable(),
  awayScoreFinal: z.number().int().nonnegative().nullable(),
  firstGoalscorerId: postgresUuidSchema.nullable(),
  firstGoalWasOwnGoal: z.boolean(),
  advancedTeamId: postgresUuidSchema.nullable(),
});

export type ResultProcessingInput = z.infer<typeof resultProcessingInputSchema>;
