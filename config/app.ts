import "dotenv/config";
import type { LocationInput } from "@/types/weather";

export const defaultLocation: LocationInput = {
  label: "Калуш, Івано-Франківська область",
  citySlug: "калуш",
  region: "Івано-Франківська область",
  district: "Калуський район",
  latitude: 49.0119,
  longitude: 24.3731,
  source: "default",
};

export const appConfig = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  chatId: process.env.CHAT_ID ?? "",
  lmStudioUrl: process.env.LM_STUDIO_URL ?? "http://127.0.0.1:1234",
  lmStudioModel: process.env.LM_STUDIO_MODEL ?? "qwen2.5-7b-instruct",
  openAiKey: process.env.OPENAI_API_KEY ?? "",
  mapsKey: process.env.MAPS_API_KEY ?? "",
  cacheTtlMs: 20 * 60 * 1000,
  timezone: "Europe/Kyiv",
};
