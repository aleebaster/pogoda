import { buildBiteForecast } from "@/services/fishing/engine";
import { resolveManualLocation } from "@/services/location/location";
import { formatLocationOverview } from "@/services/telegram/formatters";
import { getWeatherForecast } from "@/services/weather/sinoptik";
import { recommendSpots } from "@/services/waterSearch/waterSearch";
import { googleMapsRouteUrl } from "@/services/waterSearch/routes";

async function main() {
  const location = await resolveManualLocation("Добрівляни");
  const weather = await getWeatherForecast(location);
  const bite = buildBiteForecast(weather);
  const spots = recommendSpots(location, bite);
  console.log(formatLocationOverview(weather, bite, spots));
  console.log("\nROUTES");
  for (const spot of spots.slice(0, 3)) console.log(`${spot.name}: ${googleMapsRouteUrl(spot, location)}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
