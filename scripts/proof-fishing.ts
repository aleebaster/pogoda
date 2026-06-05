import { defaultLocation } from "@/config/app";
import { buildBiteForecast } from "@/services/fishing/engine";
import { getWeatherForecast } from "@/services/weather/sinoptik";
import { recommendSpots } from "@/services/waterSearch/waterSearch";

const weather = await getWeatherForecast(defaultLocation);
const bite = buildBiteForecast(weather);
const spots = recommendSpots(defaultLocation, bite);
console.log(JSON.stringify({
  score: bite.score,
  shouldGo: bite.shouldGo,
  bestTime: bite.bestTime,
  fish: bite.fish.map((fish) => ({ fish: fish.fish, score: fish.score, bait: fish.bait })),
  spots: spots.map((spot) => ({ name: spot.name, distanceKm: spot.distanceKm, todayScore: spot.todayScore })),
}, null, 2));
