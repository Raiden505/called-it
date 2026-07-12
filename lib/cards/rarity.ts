export type CardRarity = {
  label: "Legendary" | "Elite" | "Rare" | "Verified";
  percentage: number;
};

export function getCardRarity(eligiblePredictions: number, scoredPredictions: number): CardRarity {
  if (eligiblePredictions <= 0 || scoredPredictions <= 0) {
    return { label: "Verified", percentage: 0 };
  }

  const percentage = Number(((eligiblePredictions / scoredPredictions) * 100).toFixed(1));

  if (percentage <= 1) {
    return { label: "Legendary", percentage };
  }

  if (percentage <= 5) {
    return { label: "Elite", percentage };
  }

  if (percentage <= 15) {
    return { label: "Rare", percentage };
  }

  return { label: "Verified", percentage };
}
