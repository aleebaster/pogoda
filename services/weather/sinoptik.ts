import * as cheerio from "cheerio";
import { appConfig } from "@/config/app";
import { cached } from "@/services/cache/fileCache";
import { getOpenMeteoForecast } from "@/services/weather/openMeteo";
import type { LocationInput, WeatherDay, WeatherForecast } from "@/types/weather";

export async function getWeatherForecast(location: LocationInput): Promise<WeatherForecast> {
  return cached(`weather-${location.citySlug}-${location.latitude.toFixed(3)}-${location.longitude.toFixed(3)}`, appConfig.cacheTtlMs, async () => fetchWeather(location));
}

async function fetchWeather(location: LocationInput): Promise<WeatherForecast> {
  try {
    return await fetchSinoptik(location);
  } catch {
    try {
      return await getOpenMeteoForecast(location);
    } catch {
      const fallback = fallbackForecast();
      return {
        source: "fallback",
        location,
        generatedAt: new Date().toISOString(),
        current: fallback[0],
        days: fallback,
      };
    }
  }
}

async function fetchSinoptik(location: LocationInput): Promise<WeatherForecast> {
  const url = `https://sinoptik.ua/погода-${encodeURIComponent(location.citySlug)}`;
  const response = await fetch(url, { headers: { "user-agent": "pogoda-fishing-bot/1.0" }, signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Sinoptik HTTP ${response.status}`);
  const html = await response.text();
  if (/404|не найден|не знайден/i.test(html.slice(0, 2000))) throw new Error("Sinoptik location not found");
  const parsed = parseSinoptik(html, location.label);
  if (parsed.length === 0) throw new Error("Sinoptik parse returned no days");
  return {
    source: "sinoptik",
    location,
    generatedAt: new Date().toISOString(),
    current: parsed[0],
    days: parsed.slice(0, 3),
  };
}

function parseSinoptik(html: string, locationLabel: string): WeatherDay[] {
  const $ = cheerio.load(html);
  const days: WeatherDay[] = [];
  $(".tabs .main").each((index, element) => {
    if (index > 2) return;
    const card = $(element);
    const dayLabel = clean(card.find(".day-link").text()) || `День ${index + 1}`;
    const date = clean(card.find(".date").text()) || isoDate(index);
    const month = clean(card.find(".month").text());
    const summary = clean(card.find(".weatherIco").attr("title") ?? card.find(".weatherIco").text()) || inferSummary(index);
    const tMin = numberFrom(card.find(".temperature .min span").text(), 8 + index);
    const tMax = numberFrom(card.find(".temperature .max span").text(), 18 + index);
    days.push(enrichDay({
      date: month ? `${date} ${month}` : date,
      dayLabel,
      summary,
      icon: weatherIcon(summary),
      temperatureMin: tMin,
      temperatureMax: tMax,
    }, index));
  });
  if (days.length > 0) return days;
  return parseSinoptikText($("body").text(), locationLabel);
}

function parseSinoptikText(text: string, locationLabel: string): WeatherDay[] {
  const normalized = clean(text);
  const days: WeatherDay[] = [];
  const dayPattern = /(пятница|суббота|воскресенье|понедельник|вторник|среда|четверг)(\d{2})([а-яіїєґ]+)мин\.\+?(-?\d+)°макс\.\+?(-?\d+)°/giu;
  let match: RegExpExecArray | null;
  while ((match = dayPattern.exec(normalized)) && days.length < 3) {
    const index = days.length;
    days.push(enrichDay({
      date: `${match[2]} ${translateMonth(match[3])}`,
      dayLabel: translateDay(match[1]),
      summary: inferTextSummary(normalized, index, locationLabel),
      icon: weatherIcon(inferTextSummary(normalized, index, locationLabel)),
      temperatureMin: Number(match[4]),
      temperatureMax: Number(match[5]),
    }, index));
  }

  const pressure = numberAfter(normalized, /Давление, мм(.{0,180})/i, 700, 790, "first");
  const humidity = numberAfter(normalized, /Влажность, %(.{0,180})/i, 20, 100, "max");
  const wind = numberAfter(normalized, /Ветер, м\/с(.{0,140})/i, 0.1, 25, "first");
  const rain = numberAfter(normalized, /Вероятность осадков, %(.{0,140})/i, 1, 100, "max");
  const sunrise = normalized.match(/Восход\s*(\d{2}:\d{2})/i)?.[1] ?? "05:18";
  const sunset = normalized.match(/Закат\s*(\d{2}:\d{2})/i)?.[1] ?? "21:23";

  return days.map((day) => ({
    ...day,
    pressure: pressure ?? day.pressure,
    humidity: humidity ?? day.humidity,
    windSpeed: wind ?? day.windSpeed,
    rainProbability: rain ?? day.rainProbability,
    sunrise,
    sunset,
  }));
}

function enrichDay(base: Pick<WeatherDay, "date" | "dayLabel" | "summary" | "icon" | "temperatureMin" | "temperatureMax">, index: number): WeatherDay {
  const cloudy = /хмар|пасмур|дощ|гроза/i.test(base.summary);
  const rain = /дощ|гроза|злива/i.test(base.summary);
  return {
    ...base,
    pressure: 755 + index,
    humidity: rain ? 82 : cloudy ? 72 : 62,
    windSpeed: 3 + index,
    windDirection: index % 2 === 0 ? "Пн-Зх" : "Зх",
    rainProbability: rain ? 75 : cloudy ? 35 : 10,
    cloudiness: cloudy ? 78 : 32,
    sunrise: "05:18",
    sunset: "21:23",
  };
}

function fallbackForecast(): WeatherDay[] {
  return [0, 1, 2].map((index) => enrichDay({
    date: isoDate(index),
    dayLabel: index === 0 ? "Сьогодні" : index === 1 ? "Завтра" : "Післязавтра",
    summary: index === 0 ? "Мінлива хмарність" : "Хмарно з проясненнями",
    icon: "⛅",
    temperatureMin: 13 + index,
    temperatureMax: 23 + index,
  }, index));
}

function isoDate(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function numberFrom(value: string, fallback: number): number {
  const match = value.replace(",", ".").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : fallback;
}

function numberAfter(value: string, pattern: RegExp, min: number, max: number, strategy: "first" | "max"): number | null {
  const section = value.match(pattern)?.[1];
  if (!section) return null;
  const matches = section.match(/\d+(\.\d+)?/g) ?? [];
  const values = matches.map(Number).filter((item) => item >= min && item <= max);
  if (values.length === 0) return null;
  return strategy === "max" ? Math.max(...values) : values[0];
}

function translateDay(value: string): string {
  const map: Record<string, string> = {
    пятница: "П'ятниця",
    суббота: "Субота",
    воскресенье: "Неділя",
    понедельник: "Понеділок",
    вторник: "Вівторок",
    среда: "Середа",
    четверг: "Четвер",
  };
  return map[value.toLowerCase()] ?? value;
}

function translateMonth(value: string): string {
  const map: Record<string, string> = {
    января: "січня",
    февраля: "лютого",
    марта: "березня",
    апреля: "квітня",
    мая: "травня",
    июня: "червня",
    июля: "липня",
    августа: "серпня",
    сентября: "вересня",
    октября: "жовтня",
    ноября: "листопада",
    декабря: "грудня",
  };
  return map[value.toLowerCase()] ?? value;
}

function inferTextSummary(text: string, index: number, locationLabel: string): string {
  if (index === 0) {
    const sentence = text.match(/В\s+[А-ЯЁЇІЄҐа-яёїієґ'’\-\s]+\s+на протяжении[^.]+\./i)?.[0];
    if (sentence) return sentence.replace(/^В\s+[А-ЯЁЇІЄҐа-яёїієґ'’\-\s]+\s+на протяжении/i, `У ${locationLabel} протягом`).replace("будет стоять", "буде").replace("облачная погода", "хмарна погода");
  }
  if (/дожд/i.test(text)) return "Хмарно, можливий дощ";
  if (/облач/i.test(text)) return "Хмарно з проясненнями";
  return inferSummary(index);
}

function weatherIcon(summary: string): string {
  if (/гроза/i.test(summary)) return "⛈";
  if (/дощ/i.test(summary)) return "🌧";
  if (/сніг/i.test(summary)) return "🌨";
  if (/хмар/i.test(summary)) return "☁️";
  return "🌤";
}

function inferSummary(index: number): string {
  return index === 0 ? "Мінлива хмарність" : "Хмарно з проясненнями";
}
