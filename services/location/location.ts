import { defaultLocation } from "@/config/app";
import type { Coordinates, LocationInput } from "@/types/weather";

export function resolveLocation(location?: Partial<Coordinates> & { label?: string }): LocationInput {
  if (!location?.latitude || !location?.longitude) return defaultLocation;
  return {
    ...defaultLocation,
    label: location.label ?? "Моя геолокація",
    citySlug: nearestCitySlug(location.latitude, location.longitude),
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

function nearestCitySlug(latitude: number, longitude: number): string {
  const nearKalush = Math.abs(latitude - defaultLocation.latitude) < 0.6 && Math.abs(longitude - defaultLocation.longitude) < 0.8;
  return nearKalush ? "калуш" : "івано-франківськ";
}
