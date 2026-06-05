import type { BiteForecast, SpotRecommendation } from "@/types/fishing";
import type { WeatherForecast } from "@/types/weather";

export function formatBite(weather: WeatherForecast, forecast: BiteForecast): string {
  return [
    "🎣 <b>Прогноз кльову</b>",
    `📍 ${weather.location.label}`,
    "",
    `${forecast.emoji} <b>Кльов: ${forecast.score}%</b> - ${forecast.label}`,
    forecast.shouldGo ? "✅ <b>Варто їхати</b>" : "🔴 <b>Сьогодні краще не їхати</b>",
    "",
    "🐟 <b>Активність риби</b>",
    ...forecast.fish.map((fish) => `${fish.score >= 60 ? "🟢" : fish.score >= 35 ? "🟡" : "🔴"} ${fish.fish}: ${fish.score}% (${fish.confidence}% довіра)`),
    "",
    "🕒 <b>Найкращий час</b>",
    forecast.bestTime,
    "",
    "🪱 <b>Наживка</b>",
    forecast.bait.join(" / "),
    "",
    "Причина:",
    ...forecast.reasons.map((reason) => `• ${reason}`),
    ...forecast.warnings.map((warning) => `• ⚠️ ${warning}`),
  ].join("\n");
}

export function formatWeather(weather: WeatherForecast): string {
  return [
    "🌦 <b>Погода для риболовлі</b>",
    `📍 ${weather.location.label}`,
    `Джерело: ${weather.source === "sinoptik" ? "Sinoptik" : "fallback cache"}`,
    "",
    ...weather.days.map((day) => [
      `${day.icon} <b>${day.dayLabel}</b> <i>${day.date}</i>`,
      `${day.summary}`,
      `🌡 ${day.temperatureMin}..${day.temperatureMax}°C | 💨 ${day.windSpeed} м/с ${day.windDirection}`,
      `🌡 Тиск: ${day.pressure} мм | 💧 Вологість: ${day.humidity}%`,
      `🌧 Дощ: ${day.rainProbability}% | ☁️ Хмарність: ${day.cloudiness}%`,
      `🌅 ${day.sunrise} | 🌇 ${day.sunset}`,
    ].join("\n")),
  ].join("\n\n");
}

export function formatSpots(spots: SpotRecommendation[]): string {
  return [
    "📍 <b>Куди поїхати на рибалку сьогодні?</b>",
    "",
    ...spots.map((spot, index) => [
      `<b>${index + 1}. ${spot.name}</b>`,
      `${spot.type} | ${spot.distanceKm} км | кльов ${spot.todayScore}%`,
      `🐟 ${spot.species.join(", ")}`,
      `🚗 ${spot.accessibility}`,
      `• ${spot.reason}`,
    ].join("\n")),
  ].join("\n\n");
}

export function formatFishActivity(forecast: BiteForecast): string {
  return [
    "🐟 <b>Яка риба активна</b>",
    "",
    ...forecast.fish.map((fish) => [
      `<b>${fish.fish}: ${fish.score}%</b>`,
      `🕒 ${fish.bestTime}`,
      `🪱 ${fish.bait.join(" / ")}`,
      `📌 ${fish.locationHint}`,
    ].join("\n")),
  ].join("\n\n");
}
