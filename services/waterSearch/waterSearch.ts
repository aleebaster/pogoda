import { fishingSpots } from "@/data/fishingSpots";
import { distanceKm } from "@/lib/math";
import type { BiteForecast, SpotRecommendation } from "@/types/fishing";
import type { Coordinates } from "@/types/weather";

export function recommendSpots(origin: Coordinates, forecast: BiteForecast): SpotRecommendation[] {
  return fishingSpots
    .map((spot) => {
      const distance = distanceKm(origin.latitude, origin.longitude, spot.latitude, spot.longitude);
      const speciesBoost = spot.species.some((fish) => forecast.fish.slice(0, 3).some((active) => active.fish === fish)) ? 8 : 0;
      const distancePenalty = Math.min(20, distance * 0.7);
      const todayScore = Math.max(0, Math.min(100, Math.round(forecast.score + speciesBoost - distancePenalty)));
      return {
        ...spot,
        distanceKm: distance,
        todayScore,
        reason: `${spot.species.slice(0, 3).join(", ")} зараз мають добру сумісність з погодою`,
      };
    })
    .sort((a, b) => b.todayScore - a.todayScore || a.distanceKm - b.distanceKm)
    .slice(0, 5);
}
