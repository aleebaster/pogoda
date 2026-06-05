import "dotenv/config";
import { appConfig } from "@/config/app";
import { mainMenu, mainMenuText } from "@/services/telegram/menu";

async function main() {
  const response = await fetch(`https://api.telegram.org/bot${appConfig.telegramToken}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: appConfig.chatId,
      text: mainMenuText(),
      parse_mode: "HTML",
      reply_markup: mainMenu,
    }),
  });
  const json = await response.json();
  console.log(JSON.stringify({ sent: response.ok, replyMarkupSent: mainMenu, telegramResponse: json }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
