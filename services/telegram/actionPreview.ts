import { defaultLocation } from "@/config/app";
import { getAiAdvice } from "@/services/ai/assistant";
import { buildBiteForecast } from "@/services/fishing/engine";
import { formatBite, formatFishActivity, formatMorningForecast, formatNightFishing, formatSpots, formatWeather } from "@/services/telegram/formatters";
import type { MenuAction } from "@/services/telegram/menu";
import { mainMenu } from "@/services/telegram/menu";
import { getWeatherForecast } from "@/services/weather/sinoptik";
import { recommendSpots } from "@/services/waterSearch/waterSearch";
import type TelegramBot from "node-telegram-bot-api";

export type ActionPreview = {
  text: string;
  replyMarkup: TelegramBot.SendMessageOptions["reply_markup"];
  parseMode?: TelegramBot.SendMessageOptions["parse_mode"];
};

export async function buildActionPreview(action: MenuAction): Promise<ActionPreview> {
  if (action === "location") return html("📍 Надішли GPS pin через Telegram або просто напиши місто/село текстом. Погода працює через Sinoptik, а якщо населений пункт не знайдено - через Open-Meteo GPS.");
  if (action === "kalushDistrict") return html("🏞 <b>Калуський район</b>\n\nОбрано базовий регіон: Калуш, Лімниця, Добрівляни, Войнилів, Долина та найближчі водойми.");
  if (action === "favorites") return html("⭐ <b>Обрані місця</b>\n\nПоки список порожній. Надішли геолокацію або напиши місто/село, і я додам його в обрані у runtime.");

  const weather = await getWeatherForecast(defaultLocation);
  const forecast = buildBiteForecast(weather);
  const spots = recommendSpots(defaultLocation, forecast);

  if (action === "bite") return html(formatBite(weather, forecast));
  if (action === "weather") return html(formatWeather(weather));
  if (action === "spots" || action === "topSpots" || action === "hot") return html(formatSpots(spots));
  if (action === "routes") return html("🗺 <b>Маршрути до рибних місць</b>\n\nКнопки маршрутів відкривають Google Maps у повідомленні з водоймами. Нижнє меню залишається закріпленим.");
  if (action === "fish") return html(formatFishActivity(forecast));
  if (action === "biteIndex") return html(`📊 <b>Індекс кльову</b>\n━━━━━━━━━━━━━━\n${forecast.emoji} ${forecast.score}% - ${forecast.label}\n${forecast.shouldGo ? "✅ Варто їхати" : "🔴 Краще зачекати"}\n\nТоп риба: ${forecast.fish.slice(0, 4).map((fish) => `${fish.fish} ${fish.score}%`).join(" • ")}`);
  if (action === "morning") return html(formatMorningForecast(forecast));
  if (action === "night") return html(formatNightFishing(forecast));
  if (action === "bait") return html(`🪱 <b>Рекомендована наживка</b>\n\n${forecast.bait.join(" / ")}`);
  if (action === "ai") return html(`🧠 <b>AI порада</b>\n\n${await getAiAdvice(weather, forecast)}`);
  if (action === "notifications") return html("🔔 Сповіщення готові: ранковий прогноз 06:00, вечірній 18:00. Для постійного режиму запусти bot runtime.");
  return html("⚙️ За замовчуванням: Україна, Івано-Франківська область, Калуський район. Можна надіслати геолокацію або написати місто/село.");
}

function html(text: string): ActionPreview {
  return { text, parseMode: "HTML", replyMarkup: mainMenu };
}
