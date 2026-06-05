import type { LocationInput, WeatherDay, WeatherForecast } from "@/types/weather";

type OpenMeteoResponse = {
  daily?: {
    time: string[];
    temperature_2m_min: number[];
    temperature_2m_max: number[];
    sunrise: string[];
    sunset: string[];
    precipitation_probability_max?: number[];
    weather_code?: number[];
  };
  hourly?: {
    time: string[];
    temperature_2m?: number[];
    relative_humidity_2m?: number[];
    wind_speed_10m?: number[];
    precipitation_probability?: number[];
    cloud_cover?: number[];
    pressure_msl?: number[];
  };
};

export async function getOpenMeteoForecast(location: LocationInput): Promise<WeatherForecast> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("timezone", "Europe/Kyiv");
  url.searchParams.set("forecast_days", "3");
  url.searchParams.set("hourly", "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability,cloud_cover,pressure_msl");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max");

  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Open-Meteo HTTP ${response.status}`);
  const json = await response.json() as OpenMeteoResponse;
  const days = toWeatherDays(json);
  if (days.length === 0) throw new Error("Open-Meteo returned no daily forecast");

  return {
    source: "open-meteo",
    location,
    generatedAt: new Date().toISOString(),
    current: days[0],
    days,
  };
}

function toWeatherDays(data: OpenMeteoResponse): WeatherDay[] {
  const daily = data.daily;
  if (!daily?.time?.length) return [];
  return daily.time.slice(0, 3).map((date, index) => {
    const hourIndex = index * 24 + 12;
    const code = daily.weather_code?.[index] ?? 2;
    return {
      date,
      dayLabel: index === 0 ? "Сьогодні" : index === 1 ? "Завтра" : "Післязавтра",
      summary: weatherCodeSummary(code),
      icon: weatherCodeIcon(code),
      temperatureMin: Math.round(daily.temperature_2m_min[index] ?? 10),
      temperatureMax: Math.round(daily.temperature_2m_max[index] ?? 20),
      pressure: Math.round((data.hourly?.pressure_msl?.[hourIndex] ?? 1007) * 0.750062),
      humidity: Math.round(data.hourly?.relative_humidity_2m?.[hourIndex] ?? 65),
      windSpeed: Math.round(data.hourly?.wind_speed_10m?.[hourIndex] ?? 3),
      windDirection: "за GPS",
      rainProbability: Math.round(daily.precipitation_probability_max?.[index] ?? data.hourly?.precipitation_probability?.[hourIndex] ?? 0),
      cloudiness: Math.round(data.hourly?.cloud_cover?.[hourIndex] ?? 50),
      sunrise: shortTime(daily.sunrise[index]),
      sunset: shortTime(daily.sunset[index]),
    };
  });
}

function shortTime(value?: string): string {
  return value?.slice(11, 16) || "--:--";
}

function weatherCodeSummary(code: number): string {
  if ([0].includes(code)) return "Ясно";
  if ([1, 2, 3].includes(code)) return "Мінлива хмарність";
  if ([45, 48].includes(code)) return "Туман";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "Дощ";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Сніг";
  if ([95, 96, 99].includes(code)) return "Гроза";
  return "Хмарно з проясненнями";
}

function weatherCodeIcon(code: number): string {
  if ([0].includes(code)) return "☀️";
  if ([1, 2, 3].includes(code)) return "⛅";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "🌧";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "🌨";
  if ([95, 96, 99].includes(code)) return "⛈";
  return "☁️";
}
