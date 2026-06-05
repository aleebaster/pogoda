import type TelegramBot from "node-telegram-bot-api";

export const mainMenu: TelegramBot.InlineKeyboardMarkup = {
  inline_keyboard: [
    [{ text: "🎣 Кльов", callback_data: "bite" }, { text: "🌦 Погода", callback_data: "weather" }],
    [{ text: "📍 Де ловити", callback_data: "spots" }, { text: "🐟 Яка риба активна", callback_data: "fish" }],
    [{ text: "🪱 Наживка", callback_data: "bait" }, { text: "🗺 Локації", callback_data: "spots" }],
    [{ text: "🧠 AI Помічник", callback_data: "ai" }, { text: "🔔 Сповіщення", callback_data: "notifications" }],
    [{ text: "⚙️ Налаштування", callback_data: "settings" }, { text: "📍 Моя геолокація", callback_data: "location_help" }],
  ],
};

export const backMenu: TelegramBot.InlineKeyboardMarkup = {
  inline_keyboard: [[{ text: "🏠 Головне меню", callback_data: "home" }]],
};

export function mainMenuText(): string {
  return [
    "🎣 <b>Pogoda Fishing Assistant</b>",
    "",
    "Розумний помічник для риболовлі у Калуському районі та Івано-Франківській області.",
    "",
    "Обери дію нижче:",
  ].join("\n");
}
