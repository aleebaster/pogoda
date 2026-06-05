import { defaultLocation } from "@/config/app";
import { getAiAdvice } from "@/services/ai/assistant";
import { buildBiteForecast } from "@/services/fishing/engine";
import { getWeatherForecast } from "@/services/weather/sinoptik";

async function main() {
  const weather = await getWeatherForecast(defaultLocation);
  const bite = buildBiteForecast(weather);
  const advice = await getAiAdvice(weather, bite);
  console.log(JSON.stringify({ advice, aiNeverBlocks: true }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
