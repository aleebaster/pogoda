import type TelegramBot from "node-telegram-bot-api";
import type { SpotRecommendation } from "@/types/fishing";
import type { Coordinates } from "@/types/weather";

export function googleMapsRouteUrl(spot: Pick<SpotRecommendation, "latitude" | "longitude">, origin?: Coordinates): string {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", `${spot.latitude},${spot.longitude}`);
  if (origin) url.searchParams.set("origin", `${origin.latitude},${origin.longitude}`);
  return url.toString();
}

export function osmRouteUrl(spot: Pick<SpotRecommendation, "latitude" | "longitude">, origin?: Coordinates): string {
  if (origin) return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${origin.latitude}%2C${origin.longitude}%3B${spot.latitude}%2C${spot.longitude}`;
  return `https://www.openstreetmap.org/?mlat=${spot.latitude}&mlon=${spot.longitude}#map=14/${spot.latitude}/${spot.longitude}`;
}

export function estimateDriveMinutes(distanceKm: number): number {
  return Math.max(3, Math.round((distanceKm / 42) * 60));
}

export function spotRouteKeyboard(spot: SpotRecommendation, origin?: Coordinates): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "🗺 Відкрити маршрут Google Maps", url: googleMapsRouteUrl(spot, origin) }],
      [{ text: "📍 Побудувати маршрут OSM", url: osmRouteUrl(spot, origin) }],
      [{ text: `🚗 Час ~${estimateDriveMinutes(spot.distanceKm)} хв`, callback_data: `route_info:${spot.id}` }, { text: `📏 ${spot.distanceKm} км`, callback_data: `route_info:${spot.id}` }],
    ],
  };
}

export function spotsRouteKeyboard(spots: SpotRecommendation[], origin?: Coordinates): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      ...spots.slice(0, 5).map((spot) => [
        { text: `🗺 ${spot.name}`, url: googleMapsRouteUrl(spot, origin) },
        { text: `🚗 ${estimateDriveMinutes(spot.distanceKm)} хв • ${spot.distanceKm} км`, callback_data: `route_info:${spot.id}` },
      ]),
    ],
  };
}
