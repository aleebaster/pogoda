import { describe, expect, it } from "vitest";
import { defaultLocation } from "@/config/app";
import { buildBiteForecast } from "@/services/fishing/engine";
import type { WeatherForecast } from "@/types/weather";

describe("fishing engine", () => {
  it("builds a bounded bite forecast for all supported fish", () => {
    const forecast = buildBiteForecast(sampleWeather());
    expect(forecast.score).toBeGreaterThanOrEqual(0);
    expect(forecast.score).toBeLessThanOrEqual(100);
    expect(forecast.fish).toHaveLength(7);
    expect(forecast.fish.every((fish) => fish.score >= 0 && fish.score <= 100)).toBe(true);
    expect(forecast.bestTime.length).toBeGreaterThan(0);
  });
});

function sampleWeather(): WeatherForecast {
  return {
    source: "sinoptik",
    location: defaultLocation,
    generatedAt: new Date().toISOString(),
    current: {
      date: "today",
      dayLabel: "Сьогодні",
      summary: "Мінлива хмарність",
      icon: "⛅",
      temperatureMin: 14,
      temperatureMax: 23,
      pressure: 758,
      humidity: 72,
      windSpeed: 3,
      windDirection: "Зх",
      rainProbability: 25,
      cloudiness: 65,
      sunrise: "05:10",
      sunset: "21:20",
    },
    days: [],
  };
}
