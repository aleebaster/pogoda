import { appConfig } from "@/config/app";
import type { BiteForecast } from "@/types/fishing";
import type { WeatherForecast } from "@/types/weather";

export async function getAiAdvice(weather: WeatherForecast, forecast: BiteForecast): Promise<string> {
  const prompt = buildPrompt(weather, forecast);
  const local = await askLmStudio(prompt);
  if (local) return local;
  const openAi = await askOpenAi(prompt);
  if (openAi) return openAi;
  return ruleBasedAdvice(weather, forecast);
}

async function askLmStudio(prompt: string): Promise<string | null> {
  try {
    const response = await fetch(`${appConfig.lmStudioUrl.replace(/\/$/, "")}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: appConfig.lmStudioModel,
        messages: [
          { role: "system", content: "Ти досвідчений український рибалка. Відповідай коротко, практично, людською мовою." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 350,
      }),
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return null;
    const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return json.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

async function askOpenAi(prompt: string): Promise<string | null> {
  if (!appConfig.openAiKey) return null;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${appConfig.openAiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 350,
      }),
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return null;
    const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return json.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

function buildPrompt(weather: WeatherForecast, forecast: BiteForecast): string {
  return `Поясни прогноз риболовлі для ${weather.location.label}. Погода: ${weather.current.summary}, ${weather.current.temperatureMin}-${weather.current.temperatureMax}°C, тиск ${weather.current.pressure}, вітер ${weather.current.windSpeed} м/с, дощ ${weather.current.rainProbability}%. Кльов ${forecast.score}%, активна риба: ${forecast.fish.slice(0, 3).map((item) => `${item.fish} ${item.score}%`).join(", ")}. Дай пораду, час, наживку.`;
}

function ruleBasedAdvice(weather: WeatherForecast, forecast: BiteForecast): string {
  const topFish = forecast.fish[0];
  const warnings = forecast.warnings.length ? ` Обережно: ${forecast.warnings.join(", ")}.` : "";
  return `${forecast.shouldGo ? "Їхати варто" : "Краще обрати інший час"}: кльов ${forecast.score}%, ${forecast.label}. Найкращий час ${forecast.bestTime}. Ставка на ${topFish.fish.toLowerCase()}, наживка: ${topFish.bait.join(", ")}.${warnings}`;
}
