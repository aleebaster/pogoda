import { defaultLocation } from "@/config/app";
import { buildBiteForecast } from "@/services/fishing/engine";
import { getWeatherForecast } from "@/services/weather/sinoptik";

export default async function Home() {
  const weather = await getWeatherForecast(defaultLocation);
  const bite = buildBiteForecast(weather);

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#14532d,transparent_35%),linear-gradient(135deg,#06130f,#0f2418_55%,#07130f)] px-5 py-8 text-emerald-50">
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="rounded-[2rem] border border-emerald-300/20 bg-white/10 p-6 shadow-2xl backdrop-blur md:p-10">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-emerald-200">Kalush Fishing Intelligence</p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">Рибальський прогноз, Telegram bot і майбутній сайт в одному repo.</h1>
          <p className="mt-5 max-w-2xl text-lg text-emerald-100/80">Sinoptik weather parsing, smart bite score, local LM Studio first, OpenAI optional, rule-based fallback always on.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card title="🎣 Кльов" value={`${bite.score}%`} text={`${bite.emoji} ${bite.label}`} />
          <Card title="🌦 Погода" value={`${weather.current.temperatureMin}..${weather.current.temperatureMax}°C`} text={weather.current.summary} />
          <Card title="🕒 Найкращий час" value={bite.bestTime} text={bite.shouldGo ? "Варто їхати" : "Краще зачекати"} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Panel title="Активність риби" items={bite.fish.slice(0, 7).map((fish) => `${fish.fish}: ${fish.score}% - ${fish.bait[0]}`)} />
          <Panel title="Причини прогнозу" items={[...bite.reasons, ...bite.warnings.map((warning) => `Увага: ${warning}`)]} />
        </div>
      </section>
    </main>
  );
}

function Card({ title, value, text }: { title: string; value: string; text: string }) {
  return <div className="rounded-3xl border border-white/10 bg-black/25 p-6"><p className="text-emerald-200">{title}</p><p className="mt-3 text-3xl font-black">{value}</p><p className="mt-2 text-emerald-100/75">{text}</p></div>;
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-3xl border border-white/10 bg-white/10 p-6"><h2 className="mb-4 text-2xl font-bold">{title}</h2><div className="space-y-3">{items.map((item) => <p className="rounded-2xl bg-black/25 px-4 py-3" key={item}>{item}</p>)}</div></div>;
}
