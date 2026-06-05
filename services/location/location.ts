import { defaultLocation } from "@/config/app";
import { knownUkraineLocations } from "@/data/ukraineLocations";
import type { Coordinates, LocationInput } from "@/types/weather";

export function resolveLocation(location?: Partial<Coordinates> & { label?: string; source?: LocationInput["source"] }): LocationInput {
  if (!location?.latitude || !location?.longitude) return defaultLocation;
  const nearest = findNearestKnownLocation(location.latitude, location.longitude);
  return {
    label: location.label ?? nearest.label,
    citySlug: nearest.citySlug,
    region: nearest.region,
    district: nearest.district,
    latitude: location.latitude,
    longitude: location.longitude,
    source: location.source ?? "telegram-gps",
  };
}

export async function resolveManualLocation(input: string): Promise<LocationInput> {
  const normalized = normalize(input);
  const known = knownUkraineLocations.find((item) => item.aliases.some((alias) => normalize(alias) === normalized));
  if (known) return toLocationInput(known, "manual");

  const geocoded = await geocodeUkraine(input);
  if (geocoded) return { ...geocoded, source: "manual" };

  return {
    ...defaultLocation,
    label: input.trim(),
    citySlug: slugifyLocation(input),
    source: "manual",
  };
}

export function resolveDistrictLocation(district: string): LocationInput {
  const normalized = normalize(district);
  if (normalized.includes("калусь")) return { ...defaultLocation, source: "district" };
  const known = knownUkraineLocations.find((item) => normalize(item.district).includes(normalized) || normalized.includes(normalize(item.district)));
  return known ? toLocationInput(known, "district") : { ...defaultLocation, source: "district" };
}

function findNearestKnownLocation(latitude: number, longitude: number): Omit<LocationInput, "source"> {
  const known = knownUkraineLocations
    .map((item) => ({ item, distance: Math.hypot(item.latitude - latitude, item.longitude - longitude) }))
    .sort((a, b) => a.distance - b.distance)[0]?.item;
  return known ? stripAliases(known) : defaultLocation;
}

function toLocationInput(location: Omit<LocationInput, "source">, source: LocationInput["source"]): LocationInput {
  return { ...stripAliases(location), source };
}

function stripAliases(location: Omit<LocationInput, "source">): Omit<LocationInput, "source"> {
  return {
    label: location.label,
    citySlug: location.citySlug,
    region: location.region,
    district: location.district,
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

async function geocodeUkraine(input: string): Promise<Omit<LocationInput, "source"> | null> {
  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", input);
    url.searchParams.set("count", "5");
    url.searchParams.set("language", "uk");
    url.searchParams.set("format", "json");
    const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) return null;
    const json = await response.json() as { results?: Array<{ name: string; latitude: number; longitude: number; admin1?: string; admin2?: string; country_code?: string }> };
    const result = json.results?.find((item) => item.country_code === "UA") ?? json.results?.[0];
    if (!result) return null;
    return {
      label: result.name,
      citySlug: slugifyLocation(result.name),
      region: result.admin1 ?? "Україна",
      district: result.admin2 ?? "Україна",
      latitude: result.latitude,
      longitude: result.longitude,
    };
  } catch {
    return null;
  }
}

function normalize(input: string): string {
  return input.toLowerCase().replace(/[’']/g, "").replace(/\s+/g, " ").trim();
}

export function slugifyLocation(input: string): string {
  return normalize(input).replace(/\s+/g, "-");
}
