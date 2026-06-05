import { resolveManualLocation } from "@/services/location/location";
import { getWeatherForecast } from "@/services/weather/sinoptik";

async function main() {
  const location = await resolveManualLocation("Березівка Калуський район");
  const weather = await getWeatherForecast({ ...location, citySlug: "sinoptik-missing-small-village-proof" });
  console.log(JSON.stringify({
    requested: "Березівка Калуський район",
    resolved: location,
    forcedMissingSinoptikSlug: true,
    weatherSource: weather.source,
    current: weather.current,
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
