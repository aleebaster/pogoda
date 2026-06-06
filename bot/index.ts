import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import { appConfig, defaultLocation } from "@/config/app";
import { getAiAdvice } from "@/services/ai/assistant";
import { buildBiteForecast } from "@/services/fishing/engine";
import { resolveDistrictLocation, resolveLocation, resolveManualLocation } from "@/services/location/location";
import { startNotifications } from "@/services/notifications/scheduler";
import { getMenuAction, mainMenu, mainMenuText, type MenuAction } from "@/services/telegram/menu";
import { formatBite, formatFishActivity, formatLocationOverview, formatMorningForecast, formatNightFishing, formatSpots, formatWeather } from "@/services/telegram/formatters";
import { getWeatherForecast } from "@/services/weather/sinoptik";
import { recommendSpots } from "@/services/waterSearch/waterSearch";
import { spotsRouteKeyboard } from "@/services/waterSearch/routes";

if (!appConfig.telegramToken) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

const bot = new TelegramBot(appConfig.telegramToken, { polling: true });
const userLocations = new Map<number, ReturnType<typeof resolveLocation>>();
const favoriteLocations = new Map<number, ReturnType<typeof resolveLocation>[]>();

bot.on("polling_error", (error) => {
  console.error("[telegram:polling_error]", error.message);
});

bot.on("webhook_error", (error) => {
  console.error("[telegram:webhook_error]", error.message);
});

bot.onText(/\/start|\/menu/, async (message) => {
  logIncoming(message, "command");
  await bot.sendMessage(message.chat.id, mainMenuText(), { parse_mode: "HTML", reply_markup: mainMenu });
});

bot.on("location", async (message) => {
  logIncoming(message, "location");
  if (!message.location) return;
  const location = resolveLocation({ latitude: message.location.latitude, longitude: message.location.longitude, label: "Моя геолокація" });
  userLocations.set(message.chat.id, location);
  saveFavorite(message.chat.id, location);
  await bot.sendMessage(message.chat.id, `📍 Геолокацію збережено: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`, { reply_markup: mainMenu });
});

bot.on("message", async (message) => {
  logIncoming(message, "message");
  try {
    if (!message.text || message.text.startsWith("/") || message.location) return;
    const chatId = message.chat.id;
    const menuAction = getMenuAction(message.text);
    console.log("[telegram:route]", JSON.stringify({ text: message.text, action: menuAction ?? "manual-location" }));
    if (menuAction) {
      await handleMenuAction(chatId, menuAction);
      return;
    }

    const location = await resolveManualLocation(message.text);
    userLocations.set(chatId, location);
    saveFavorite(chatId, location);
    const weather = await getWeatherForecast(location);
    const forecast = buildBiteForecast(weather);
    const spots = recommendSpots(location, forecast);
    await bot.sendMessage(chatId, formatLocationOverview(weather, forecast, spots), { parse_mode: "HTML", reply_markup: spotsRouteKeyboard(spots, location) });
  } catch (error) {
    console.error("[telegram:message_error]", error);
    await bot.sendMessage(message.chat.id, "⚠️ Виникла помилка обробки. Меню активне, спробуй ще раз або натисни /menu.", { reply_markup: mainMenu });
  }
});

bot.on("callback_query", async (query) => {
  const chatId = query.message?.chat.id;
  if (!chatId) return;
  await bot.answerCallbackQuery(query.id).catch(() => undefined);
  const data = query.data ?? "home";

  if (data === "home") {
    await bot.sendMessage(chatId, mainMenuText(), { parse_mode: "HTML", reply_markup: mainMenu });
    return;
  }

  const legacyAction = legacyCallbackToAction(data);
  if (legacyAction) await handleMenuAction(chatId, legacyAction);
});

async function handleMenuAction(chatId: number, action: MenuAction): Promise<void> {
  console.log("[telegram:handle_action]", JSON.stringify({ chatId, action }));
  const location = userLocations.get(chatId) ?? defaultLocation;

  if (action === "location") {
    await bot.sendMessage(chatId, "📍 Надішли GPS pin через Telegram або просто напиши місто/село текстом. Якщо Sinoptik не знайде населений пункт, я автоматично використаю Open-Meteo по координатах.", { reply_markup: mainMenu });
    return;
  }

  if (action === "kalushDistrict") {
    const district = resolveDistrictLocation("Калуський район");
    userLocations.set(chatId, district);
    saveFavorite(chatId, district);
    await bot.sendMessage(chatId, "🏞 Обрано Калуський район за замовчуванням.", { reply_markup: mainMenu });
    return;
  }

  if (action === "favorites") {
    const favorites = favoriteLocations.get(chatId) ?? [];
    await bot.sendMessage(chatId, favorites.length ? `⭐ <b>Обрані місця</b>\n\n${favorites.map((item, index) => `${index + 1}. ${item.label} (${item.region})`).join("\n")}` : "⭐ Обраних місць ще немає. Надішли геолокацію або напиши місто/село.", { parse_mode: "HTML", reply_markup: mainMenu });
    return;
  }

  const weather = await getWeatherForecast(location);
  const forecast = buildBiteForecast(weather);
  const spots = recommendSpots(location, forecast);

  if (action === "bite") await bot.sendMessage(chatId, formatBite(weather, forecast), { parse_mode: "HTML", reply_markup: mainMenu });
  if (action === "weather") await bot.sendMessage(chatId, formatWeather(weather), { parse_mode: "HTML", reply_markup: mainMenu });
  if (action === "spots" || action === "topSpots" || action === "hot") await bot.sendMessage(chatId, formatSpots(spots), { parse_mode: "HTML", reply_markup: spotsRouteKeyboard(spots, location) });
  if (action === "routes") await bot.sendMessage(chatId, "🗺 <b>Маршрути до рибних місць</b>\n\nОбери водойму нижче, відкриється Google Maps маршрут. Нижнє меню залишається закріпленим.", { parse_mode: "HTML", reply_markup: spotsRouteKeyboard(spots, location) });
  if (action === "fish") await bot.sendMessage(chatId, formatFishActivity(forecast), { parse_mode: "HTML", reply_markup: mainMenu });
  if (action === "biteIndex") await bot.sendMessage(chatId, `📊 <b>Індекс кльову</b>\n━━━━━━━━━━━━━━\n${forecast.emoji} ${forecast.score}% - ${forecast.label}\n${forecast.shouldGo ? "✅ Варто їхати" : "🔴 Краще зачекати"}\n\nТоп риба: ${forecast.fish.slice(0, 4).map((fish) => `${fish.fish} ${fish.score}%`).join(" • ")}`, { parse_mode: "HTML", reply_markup: mainMenu });
  if (action === "morning") await bot.sendMessage(chatId, formatMorningForecast(forecast), { parse_mode: "HTML", reply_markup: mainMenu });
  if (action === "night") await bot.sendMessage(chatId, formatNightFishing(forecast), { parse_mode: "HTML", reply_markup: mainMenu });
  if (action === "bait") await bot.sendMessage(chatId, `🪱 <b>Рекомендована наживка</b>\n\n${forecast.bait.join(" / ")}`, { parse_mode: "HTML", reply_markup: mainMenu });
  if (action === "ai") await bot.sendMessage(chatId, `🧠 <b>AI порада</b>\n\n${await getAiAdvice(weather, forecast)}`, { parse_mode: "HTML", reply_markup: mainMenu });
  if (action === "notifications") await bot.sendMessage(chatId, "🔔 Сповіщення готові: ранковий прогноз 06:00, вечірній 18:00. Для постійного режиму запусти bot runtime.", { reply_markup: mainMenu });
  if (action === "settings") await bot.sendMessage(chatId, "⚙️ За замовчуванням: Україна, Івано-Франківська область, Калуський район. Можна надіслати геолокацію або написати місто/село.", { reply_markup: mainMenu });
}

startNotifications(bot);
console.log("Pogoda Telegram bot is running");

function logIncoming(message: TelegramBot.Message, event: string): void {
  console.log("[telegram:incoming]", JSON.stringify({
    event,
    chatId: message.chat.id,
    messageId: message.message_id,
    text: message.text ?? null,
    location: message.location ? { latitude: message.location.latitude, longitude: message.location.longitude } : null,
  }));
}

function saveFavorite(chatId: number, location: ReturnType<typeof resolveLocation>): void {
  const existing = favoriteLocations.get(chatId) ?? [];
  const next = [location, ...existing.filter((item) => item.label !== location.label)].slice(0, 5);
  favoriteLocations.set(chatId, next);
}

function legacyCallbackToAction(data: string): MenuAction | null {
  const map: Record<string, MenuAction> = {
    bite: "bite",
    weather: "weather",
    spots: "spots",
    fish: "fish",
    routes: "routes",
    top_spots: "topSpots",
    hot: "hot",
    bite_index: "biteIndex",
    morning: "morning",
    night: "night",
    bait: "bait",
    ai: "ai",
    notifications: "notifications",
    settings: "settings",
    location_help: "location",
    district_kalush: "kalushDistrict",
    favorites: "favorites",
  };
  return map[data] ?? null;
}
