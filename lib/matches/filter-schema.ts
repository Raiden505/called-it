import { z } from "zod";

const matchDeskViewSchema = z.enum(["to-predict", "my-calls", "live", "recent", "all"]);

export type MatchDeskFilters = { view: z.infer<typeof matchDeskViewSchema>; teamId: string | null };

const archiveScopeSchema = z.enum(["mine", "all"]);
const archiveProcessingSchema = z.enum(["all", "pending", "processed", "manual_review", "failed"]);

export type ResultsArchiveFilters = {
  scope: z.infer<typeof archiveScopeSchema>;
  teamId: string | null;
  stage: string | null;
  from: string | null;
  to: string | null;
  processing: z.infer<typeof archiveProcessingSchema>;
};

export function parseMatchDeskFilters(params: URLSearchParams): MatchDeskFilters {
  const view = matchDeskViewSchema.safeParse(params.get("view")).success ? params.get("view") as MatchDeskFilters["view"] : "to-predict";
  const team = params.get("team")?.trim() ?? "";
  return { view, teamId: team || null };
}

export function parseResultsArchiveFilters(params: URLSearchParams): ResultsArchiveFilters {
  const scope = archiveScopeSchema.safeParse(params.get("scope")).success ? params.get("scope") as ResultsArchiveFilters["scope"] : "mine";
  const processing = archiveProcessingSchema.safeParse(params.get("processing")).success ? params.get("processing") as ResultsArchiveFilters["processing"] : "all";
  const team = params.get("team")?.trim() ?? "";
  const stage = params.get("stage")?.trim() ?? "";
  const from = params.get("from")?.trim() ?? "";
  const to = params.get("to")?.trim() ?? "";
  return { scope, teamId: team || null, stage: stage || null, from: from || null, to: to || null, processing };
}
