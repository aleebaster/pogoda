import "dotenv/config";
import { appConfig, defaultLocation } from "@/config/app";
import { buildBiteForecast } from "@/services/fishing/engine";
import { formatBite } from "@/services/telegram/formatters";
import { getWeatherForecast } from "@/services/weather/sinoptik";

async function main() {
  const weather = await getWeatherForecast(defaultLocation);
  const bite = buildBiteForecast(weather);
  const text = formatBite(weather, bite);

  if (!appConfig.telegramToken || !appConfig.chatId) {
    console.log(JSON.stringify({ sent: false, reason: "Telegram env missing", preview: text }, null, 2));
    return;
  }

  const response = await fetch(`https://api.telegram.org/bot${appConfig.telegramToken}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: appConfig.chatId, text: `✅ Runtime proof\n\n${text}`, parse_mode: "HTML" }),
  });

  const json = await response.json();
  console.log(JSON.stringify({ sent: response.ok, telegramResponse: json }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
