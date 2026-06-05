import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import { appConfig, defaultLocation } from "@/config/app";
import { getAiAdvice } from "@/services/ai/assistant";
import { buildBiteForecast } from "@/services/fishing/engine";
import { resolveLocation } from "@/services/location/location";
import { startNotifications } from "@/services/notifications/scheduler";
import { backMenu, mainMenu, mainMenuText } from "@/services/telegram/menu";
import { formatBite, formatFishActivity, formatSpots, formatWeather } from "@/services/telegram/formatters";
import { getWeatherForecast } from "@/services/weather/sinoptik";
import { recommendSpots } from "@/services/waterSearch/waterSearch";

if (!appConfig.telegramToken) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

const bot = new TelegramBot(appConfig.telegramToken, { polling: true });
const userLocations = new Map<number, ReturnType<typeof resolveLocation>>();

bot.onText(/\/start|\/menu/, async (message) => {
  await bot.sendMessage(message.chat.id, mainMenuText(), { parse_mode: "HTML", reply_markup: mainMenu });
});

bot.on("location", async (message) => {
  if (!message.location) return;
  const location = resolveLocation({ latitude: message.location.latitude, longitude: message.location.longitude, label: "Моя геолокація" });
  userLocations.set(message.chat.id, location);
  await bot.sendMessage(message.chat.id, `📍 Геолокацію збережено: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`, { reply_markup: mainMenu });
});

bot.on("callback_query", async (query) => {
  const chatId = query.message?.chat.id;
  if (!chatId) return;
  await bot.answerCallbackQuery(query.id).catch(() => undefined);
  const location = userLocations.get(chatId) ?? defaultLocation;
  const data = query.data ?? "home";

  if (data === "home") {
    await bot.sendMessage(chatId, mainMenuText(), { parse_mode: "HTML", reply_markup: mainMenu });
    return;
  }

  if (data === "location_help") {
    await bot.sendMessage(chatId, "📍 Натисни скріпку в Telegram і надішли свою геолокацію. Після цього я покажу найближчі водойми та прогноз саме для тебе.", { reply_markup: backMenu });
    return;
  }

  const weather = await getWeatherForecast(location);
  const forecast = buildBiteForecast(weather);

  if (data === "bite") await bot.sendMessage(chatId, formatBite(weather, forecast), { parse_mode: "HTML", reply_markup: backMenu });
  if (data === "weather") await bot.sendMessage(chatId, formatWeather(weather), { parse_mode: "HTML", reply_markup: backMenu });
  if (data === "spots") await bot.sendMessage(chatId, formatSpots(recommendSpots(location, forecast)), { parse_mode: "HTML", reply_markup: backMenu });
  if (data === "fish") await bot.sendMessage(chatId, formatFishActivity(forecast), { parse_mode: "HTML", reply_markup: backMenu });
  if (data === "bait") await bot.sendMessage(chatId, `🪱 <b>Рекомендована наживка</b>\n\n${forecast.bait.join(" / ")}`, { parse_mode: "HTML", reply_markup: backMenu });
  if (data === "ai") await bot.sendMessage(chatId, `🧠 <b>AI порада</b>\n\n${await getAiAdvice(weather, forecast)}`, { parse_mode: "HTML", reply_markup: backMenu });
  if (data === "notifications") await bot.sendMessage(chatId, "🔔 Сповіщення готові: ранковий прогноз 06:00, вечірній 18:00. Для постійного режиму запусти bot runtime.", { reply_markup: backMenu });
  if (data === "settings") await bot.sendMessage(chatId, "⚙️ За замовчуванням: Україна, Івано-Франківська область, Калуський район. Можна надіслати геолокацію для точнішого пошуку.", { reply_markup: backMenu });
});

startNotifications(bot);
console.log("Pogoda Telegram bot is running");
