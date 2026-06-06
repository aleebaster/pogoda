import "dotenv/config";
import { appConfig } from "@/config/app";
import { buildActionPreview } from "@/services/telegram/actionPreview";
import { menuActions, type MenuAction } from "@/services/telegram/menu";

const actions = Object.keys(menuActions) as MenuAction[];

async function main() {
  const results = [];
  for (const action of actions) {
    const preview = await buildActionPreview(action);
    const response = await fetch(`https://api.telegram.org/bot${appConfig.telegramToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: appConfig.chatId,
        text: `✅ Button proof: ${menuActions[action]}\n\n${preview.text}`,
        parse_mode: preview.parseMode,
        reply_markup: preview.replyMarkup,
      }),
    });
    const json = await response.json() as { ok: boolean; result?: { message_id?: number }; description?: string };
    results.push({ button: menuActions[action], ok: response.ok && json.ok, messageId: json.result?.message_id, error: json.description });
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
