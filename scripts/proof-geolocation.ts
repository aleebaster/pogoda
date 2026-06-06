import { buildBiteForecast } from "@/services/fishing/engine";
import { resolveLocation } from "@/services/location/location";
import { getWeatherForecast } from "@/services/weather/sinoptik";
import { recommendSpots } from "@/services/waterSearch/waterSearch";
import { googleMapsRouteUrl } from "@/services/waterSearch/routes";

async function main() {
  const location = resolveLocation({ latitude: 49.0119, longitude: 24.3731, label: "Telegram location proof" });
  const weather = await getWeatherForecast(location);
  const bite = buildBiteForecast(weather);
  const places = recommendSpots(location, bite).sort((a, b) => a.distanceKm - b.distanceKm);
  console.log(JSON.stringify({
    input: { latitude: 49.0119, longitude: 24.3731 },
    resolved: location,
    weatherSource: weather.source,
    biteScore: bite.score,
    nearestPlaces: places.slice(0, 3).map((place) => ({ name: place.name, distanceKm: place.distanceKm, score: place.todayScore, route: googleMapsRouteUrl(place, location) })),
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
