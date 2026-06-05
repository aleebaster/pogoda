import cron from "node-cron";
import type TelegramBot from "node-telegram-bot-api";
import { appConfig, defaultLocation } from "@/config/app";
import { buildBiteForecast } from "@/services/fishing/engine";
import { formatBite } from "@/services/telegram/formatters";
import { getWeatherForecast } from "@/services/weather/sinoptik";

export function startNotifications(bot: TelegramBot): void {
  if (!appConfig.chatId) return;
  cron.schedule("0 6 * * *", () => sendReport(bot, "🎣 Ранковий прогноз"), { timezone: appConfig.timezone });
  cron.schedule("0 18 * * *", () => sendReport(bot, "🌇 Вечірній прогноз"), { timezone: appConfig.timezone });
}

async function sendReport(bot: TelegramBot, title: string): Promise<void> {
  const weather = await getWeatherForecast(defaultLocation);
  const forecast = buildBiteForecast(weather);
  await bot.sendMessage(appConfig.chatId, `${title}\n\n${formatBite(weather, forecast)}`, { parse_mode: "HTML" });
}
