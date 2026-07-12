import { z } from "zod";

export const summaryTypeSchema = z.enum(["personal_performance", "friends_recap"]);
export type SummaryType = z.infer<typeof summaryTypeSchema>;

export const performanceSummarySchema = z.object({
  headline: z.string().trim().min(1).max(80),
  summary: z.string().trim().min(1).max(400),
  strengths: z.array(z.string().trim().min(1).max(100)).max(3),
  improvementAreas: z.array(z.string().trim().min(1).max(100)).max(3),
  factualHighlights: z.array(z.string().trim().min(1).max(120)).max(4),
}).strict();

export type PerformanceSummary = z.infer<typeof performanceSummarySchema>;
