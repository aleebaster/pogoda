import { defaultLocation } from "@/config/app";
import { getWeatherForecast } from "@/services/weather/sinoptik";

const forecast = await getWeatherForecast(defaultLocation);
console.log(JSON.stringify({
  source: forecast.source,
  location: forecast.location.label,
  days: forecast.days.length,
  current: forecast.current,
}, null, 2));
