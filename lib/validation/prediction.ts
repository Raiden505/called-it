import { z } from "zod";
import { postgresUuidSchema } from "@/lib/validation/postgres";

export const predictionInputSchema = z.object({
  matchId: postgresUuidSchema,
  homeScore: z.number().int().nonnegative(),
  awayScore: z.number().int().nonnegative(),
  firstGoalscorerId: postgresUuidSchema.nullable(),
  noGoalscorer: z.boolean(),
  advancedTeamId: postgresUuidSchema.nullable(),
  confidenceMultiplier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
}).superRefine((input, context) => {
  if (input.noGoalscorer && input.firstGoalscorerId !== null) {
    context.addIssue({
      code: "custom",
      path: ["firstGoalscorerId"],
      message: "Choose a player or no goalscorer, not both",
    });
  }
});

export type PredictionInput = z.infer<typeof predictionInputSchema>;
