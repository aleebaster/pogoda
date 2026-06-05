import type TelegramBot from "node-telegram-bot-api";

export const menuActions = {
  bite: "🎣 Кльов",
  weather: "🌦 Погода",
  spots: "📍 Де ловити",
  fish: "🐟 Активна риба",
  routes: "🗺 Маршрути",
  hot: "🔥 Де клює зараз",
  topSpots: "🏆 ТОП місця",
  biteIndex: "📊 Індекс кльову",
  night: "🌙 Нічна рибалка",
  morning: "🌅 Ранковий прогноз",
  bait: "🪱 Наживка",
  location: "📍 Локація",
  ai: "🧠 AI Помічник",
  notifications: "🔔 Сповіщення",
  settings: "⚙️ Налаштування",
  favorites: "⭐ Обрані місця",
  kalushDistrict: "🏞 Калуський район",
} as const;

export type MenuAction = keyof typeof menuActions;

export const mainMenu: TelegramBot.ReplyKeyboardMarkup = {
  keyboard: [
    [button(menuActions.bite), button(menuActions.weather)],
    [button(menuActions.spots), button(menuActions.fish)],
    [button(menuActions.routes), button(menuActions.hot)],
    [button(menuActions.topSpots), button(menuActions.biteIndex)],
    [button(menuActions.night), button(menuActions.morning)],
    [button(menuActions.bait), button(menuActions.location)],
    [button(menuActions.ai), button(menuActions.notifications)],
    [button(menuActions.settings), button(menuActions.favorites)],
    [button(menuActions.kalushDistrict)],
  ],
  resize_keyboard: true,
  one_time_keyboard: false,
  is_persistent: true,
};

function button(text: string): TelegramBot.KeyboardButton {
  return { text };
}

export function getMenuAction(text: string): MenuAction | null {
  const entry = Object.entries(menuActions).find(([, label]) => label === text.trim());
  return entry ? entry[0] as MenuAction : null;
}

export function mainMenuText(): string {
  return [
    "🎣 <b>Pogoda Fishing Assistant</b>",
    "",
    "Розумний помічник для риболовлі по всій Україні: погода, кльов, водойми, маршрути.",
    "",
    "Нижнє меню закріплене. Натискай плитки або напиши місто/село текстом: Калуш, Брошнів, Войнилів, Добрівляни...",
  ].join("\n");
}
