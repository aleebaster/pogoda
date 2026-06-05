export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type LocationInput = Coordinates & {
  label: string;
  citySlug: string;
  region: string;
  district: string;
  source: "default" | "telegram-gps" | "manual" | "district" | "favorite";
};

export type WeatherDay = {
  date: string;
  dayLabel: string;
  summary: string;
  icon: string;
  temperatureMin: number;
  temperatureMax: number;
  pressure: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  rainProbability: number;
  cloudiness: number;
  sunrise: string;
  sunset: string;
};

export type WeatherForecast = {
  source: "sinoptik" | "open-meteo" | "fallback";
  location: LocationInput;
  generatedAt: string;
  current: WeatherDay;
  days: WeatherDay[];
};
