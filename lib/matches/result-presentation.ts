export type ResultPresentationInput = {
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  resultProcessingStatus: "not_ready" | "candidate" | "processing" | "processed" | "manual_review" | "failed";
  resultVersion: number;
  scoredResultVersion: number | null;
  totalPoints: number;
  hasPrediction?: boolean;
};

export type ResultPresentationState = {
  key: "open" | "locked-soon" | "live-locked" | "full-time-unconfirmed" | "scoring" | "under-review" | "scoring-delayed" | "scored" | "recalculating" | "postponed" | "cancelled";
  label: string;
  pointsVisible: boolean;
  totalPoints: number | null;
};

export function getResultPresentationState(input: ResultPresentationInput): ResultPresentationState {
  if (input.status === "postponed") return { key: "postponed", label: "Postponed", pointsVisible: false, totalPoints: null };
  if (input.status === "cancelled") return { key: "cancelled", label: "Cancelled", pointsVisible: false, totalPoints: null };
  if (input.status === "live") return { key: "live-locked", label: "Live · predictions locked", pointsVisible: false, totalPoints: null };
  if (input.status === "scheduled") return { key: "open", label: "Open for predictions", pointsVisible: false, totalPoints: null };
  if (input.resultProcessingStatus === "processed" && input.hasPrediction === false) return { key: "scored", label: "Result confirmed", pointsVisible: false, totalPoints: null };
  if (input.resultProcessingStatus === "processed" && input.scoredResultVersion === input.resultVersion) return { key: "scored", label: `Scored · +${input.totalPoints} points`, pointsVisible: true, totalPoints: input.totalPoints };
  if (input.resultProcessingStatus === "processed") return { key: "recalculating", label: "Result corrected · recalculating your points", pointsVisible: false, totalPoints: null };
  if (input.resultProcessingStatus === "processing") return { key: "scoring", label: "Result confirmed · calculating points", pointsVisible: false, totalPoints: null };
  if (input.resultProcessingStatus === "manual_review") return { key: "under-review", label: "Official result under review", pointsVisible: false, totalPoints: null };
  if (input.resultProcessingStatus === "failed") return { key: "scoring-delayed", label: "Scoring delayed", pointsVisible: false, totalPoints: null };
  return { key: "full-time-unconfirmed", label: "Full time · awaiting confirmation", pointsVisible: false, totalPoints: null };
}
