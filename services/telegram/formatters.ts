import type { BiteForecast, SpotRecommendation } from "@/types/fishing";
import type { WeatherForecast } from "@/types/weather";

export function formatBite(weather: WeatherForecast, forecast: BiteForecast): string {
  const active = forecast.fish.slice(0, 4).map((fish) => `${fish.fish} ${fish.score}%`).join(" • ");
  return [
    "🎣 <b>Прогноз кльову</b>",
    `📍 ${weather.location.label}`,
    "━━━━━━━━━━━━━━",
    "Коротко: оцінюю тиск, вітер, дощ, хмарність, температуру і активність риби.",
    "",
    `${forecast.emoji} <b>Кльов: ${forecast.score}%</b> - ${forecast.label}`,
    forecast.shouldGo ? "✅ <b>Варто їхати</b>" : "🔴 <b>Сьогодні краще не їхати</b>",
    `🐟 Активна риба: ${active}`,
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
  const today = weather.current;
  return [
    "🌦 <b>Погода для риболовлі</b>",
    `📍 ${weather.location.label}`,
    `Джерело: ${weather.source === "sinoptik" ? "Sinoptik" : weather.source === "open-meteo" ? "Open-Meteo GPS fallback" : "аварійний fallback"}`,
    "━━━━━━━━━━━━━━",
    `<b>Зараз для риби:</b> ${today.temperatureMin}..${today.temperatureMax}°C, вітер ${today.windSpeed} м/с, тиск ${today.pressure} мм`,
    pressureHint(today.pressure),
    windHint(today.windSpeed),
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
    "━━━━━━━━━━━━━━",
    "Показую найближчі водойми з урахуванням погоди, активної риби, відстані і доступності.",
    "",
    ...spots.map((spot, index) => [
      `<b>${index + 1}. ${spot.name}</b>`,
      `${spot.type} | ${spot.distanceKm} км | ⭐ кльов ${spot.todayScore}% | рейтинг ${spot.rating}/5`,
      `🐟 ${spot.species.join(", ")}`,
      `💳 ${spot.paid ? "платна водойма" : "безкоштовна/дика водойма"}`,
      `🚗 ${spot.accessibility}`,
      `🕒 ${spot.bestTime}`,
      `🌿 ${spot.seasonality}`,
      `• ${spot.reason}`,
    ].join("\n")),
  ].join("\n\n");
}

export function formatFishActivity(forecast: BiteForecast): string {
  return [
    "🐟 <b>Яка риба активна</b>",
    "━━━━━━━━━━━━━━",
    "Оцінка по погоді, сезону, часу доби і видових вподобаннях.",
    "",
    ...forecast.fish.map((fish) => [
      `<b>${fish.fish}: ${fish.score}%</b>`,
      `🕒 ${fish.bestTime}`,
      `🪱 ${fish.bait.join(" / ")}`,
      `📌 ${fish.locationHint}`,
    ].join("\n")),
  ].join("\n\n");
}

export function formatLocationOverview(weather: WeatherForecast, forecast: BiteForecast, spots: SpotRecommendation[]): string {
  return [
    `📍 <b>${weather.location.label}</b>`,
    "━━━━━━━━━━━━━━",
    "🌦 <b>Погода</b>",
    `${weather.current.temperatureMin}..${weather.current.temperatureMax}°C | тиск ${weather.current.pressure} мм | вітер ${weather.current.windSpeed} м/с`,
    `🌧 дощ ${weather.current.rainProbability}% | ☁️ хмарність ${weather.current.cloudiness}%`,
    "",
    "🎣 <b>Кльов</b>",
    `${forecast.emoji} ${forecast.score}% - ${forecast.label}`,
    forecast.shouldGo ? "✅ Варто їхати" : "🔴 Краще зачекати",
    "",
    "🐟 <b>Активна риба</b>",
    forecast.fish.slice(0, 5).map((fish) => `${fish.fish} ${fish.score}%`).join(" • "),
    "",
    "📍 <b>Рибні місця поруч</b>",
    ...spots.slice(0, 5).map((spot, index) => `${index + 1}. ${spot.name}\n⭐ ${spot.todayScore}% кльов | 📏 ${spot.distanceKm} км\n🐟 ${spot.species.slice(0, 4).join(", ")}\n🚗 ${spot.accessibility}`),
  ].join("\n");
}

export function formatMorningForecast(forecast: BiteForecast): string {
  return [`🌅 <b>Ранковий прогноз</b>`, "━━━━━━━━━━━━━━", `${forecast.emoji} Кльов ${forecast.score}%`, `🕒 ${forecast.bestTime}`, `🐟 ${forecast.fish.slice(0, 3).map((fish) => fish.fish).join(", ")}`, `🪱 ${forecast.bait.join(" / ")}`].join("\n");
}

export function formatNightFishing(forecast: BiteForecast): string {
  const catfish = forecast.fish.find((fish) => fish.fish === "Сом");
  return [`🌙 <b>Нічна рибалка</b>`, "━━━━━━━━━━━━━━", `Сом: ${catfish?.score ?? 0}%`, "Найкраще: теплі тихі вечори, ями, повільна течія.", "Наживка: пучок черв'яків / жаба / печінка", forecast.score >= 60 ? "✅ Можна планувати вечірній виїзд" : "🟡 Краще коротка розвідка без дальньої поїздки"].join("\n");
}

function pressureHint(pressure: number): string {
  if (pressure >= 750 && pressure <= 762) return "✅ Тиск комфортний: риба зазвичай стабільніша.";
  return "⚠️ Тиск неідеальний: кльов може бути хвилями.";
}

function windHint(windSpeed: number): string {
  if (windSpeed <= 4) return "✅ Вітер слабкий: добре для поплавка і фідера.";
  if (windSpeed >= 8) return "⚠️ Сильний вітер: шукай закритий берег.";
  return "🟡 Вітер помірний: обирай берег за напрямком хвилі.";
}
