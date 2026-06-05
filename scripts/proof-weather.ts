import { defaultLocation } from "@/config/app";
import { resolveManualLocation } from "@/services/location/location";
import { getWeatherForecast } from "@/services/weather/sinoptik";

async function main() {
  const locationName = process.argv.slice(2).join(" ");
  const location = locationName ? await resolveManualLocation(locationName) : defaultLocation;
  const forecast = await getWeatherForecast(location);
  console.log(JSON.stringify({
    source: forecast.source,
    location: forecast.location.label,
    citySlug: forecast.location.citySlug,
    coordinates: { latitude: forecast.location.latitude, longitude: forecast.location.longitude },
    days: forecast.days.length,
    current: forecast.current,
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
