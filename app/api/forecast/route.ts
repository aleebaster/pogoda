import { NextResponse } from "next/server";
import { defaultLocation } from "@/config/app";
import { buildBiteForecast } from "@/services/fishing/engine";
import { resolveLocation, resolveManualLocation } from "@/services/location/location";
import { getWeatherForecast } from "@/services/weather/sinoptik";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitude = Number(url.searchParams.get("lat"));
  const longitude = Number(url.searchParams.get("lon"));
  const q = url.searchParams.get("q");
  const location = q ? await resolveManualLocation(q) : Number.isFinite(latitude) && Number.isFinite(longitude) ? resolveLocation({ latitude, longitude }) : defaultLocation;
  const weather = await getWeatherForecast(location);
  return NextResponse.json({ weather, bite: buildBiteForecast(weather) });
}
