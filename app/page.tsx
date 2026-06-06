import Image from "next/image";
import { fishingSpots } from "@/data/fishingSpots";
import { defaultLocation } from "@/config/app";
import { buildBiteForecast } from "@/services/fishing/engine";
import { getWeatherForecast } from "@/services/weather/sinoptik";
import { recommendSpots } from "@/services/waterSearch/waterSearch";
import { googleMapsRouteUrl } from "@/services/waterSearch/routes";

const images = {
  hero: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85",
  lake: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80",
  angler: "https://images.unsplash.com/photo-1517420879524-86d64ac2f339?auto=format&fit=crop&w=900&q=80",
  river: "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=900&q=80",
  carp: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=80",
};

export default async function Home() {
  const weather = await getWeatherForecast(defaultLocation);
  const bite = buildBiteForecast(weather);
  const spots = recommendSpots(defaultLocation, bite);
  const dobrivliany = spots.find((spot) => spot.id === "dobrovlyany-ponds") ?? spots[0];

  return (
    <main className="min-h-screen overflow-hidden bg-[#06140f] text-emerald-50">
      <Hero score={bite.score} shouldGo={bite.shouldGo} />

      <section id="forecast" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-amber-200/80">Live fishing intelligence</p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">Сьогодні на воді</h2>
          </div>
          <p className="max-w-2xl text-emerald-100/70">Sinoptik + Open-Meteo fallback, рибальська модель кльову, місця Калуського району та Івано-Франківщини.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard image={images.lake} title="🎣 Кльов" value={`${bite.score}%`} text={`${bite.emoji} ${bite.label}`} />
          <MetricCard image={images.river} title="🌦 Погода" value={`${weather.current.temperatureMin}..${weather.current.temperatureMax}°C`} text={`Вітер ${weather.current.windSpeed} м/с, тиск ${weather.current.pressure} мм`} />
          <MetricCard image={images.angler} title="🐟 Активна риба" value={bite.fish[0].fish} text={bite.fish.slice(0, 4).map((fish) => `${fish.fish} ${fish.score}%`).join(" • ")} />
          <MetricCard image={images.carp} title="🪱 Наживка" value={bite.bait[0]} text={bite.bait.slice(0, 4).join(" / ")} />
        </div>
      </section>

      <section id="places" className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-emerald-950/40 backdrop-blur-xl md:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-200/70">Top waters</p>
              <h2 className="mt-2 text-3xl font-black">🏆 Найкращі місця сьогодні</h2>
            </div>
            <span className="rounded-full bg-emerald-400/15 px-4 py-2 text-sm text-emerald-100">{spots.length} водойм</span>
          </div>
          <div className="grid gap-4">
            {spots.slice(0, 5).map((spot, index) => (
              <article className="group grid gap-4 rounded-3xl border border-white/10 bg-black/20 p-4 transition hover:-translate-y-1 hover:border-emerald-300/40 md:grid-cols-[150px_1fr]" key={spot.id}>
                <div className="relative min-h-32 overflow-hidden rounded-2xl">
                  <Image src={index % 2 === 0 ? images.lake : images.river} alt={spot.name} fill sizes="150px" className="object-cover transition duration-500 group-hover:scale-110" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold">{spot.name}</h3>
                    <span className="rounded-full bg-amber-300 px-3 py-1 text-sm font-black text-emerald-950">{spot.todayScore}%</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-sm">{spot.distanceKm} км</span>
                  </div>
                  <p className="mt-2 text-emerald-100/70">{spot.notes}</p>
                  <p className="mt-3 text-sm text-emerald-100/80">🐟 {spot.species.join(", ")}</p>
                  <p className="mt-1 text-sm text-emerald-100/60">🚗 {spot.accessibility}</p>
                  <a className="mt-4 inline-flex rounded-full bg-emerald-300 px-5 py-2 font-bold text-emerald-950 transition hover:bg-amber-200" href={googleMapsRouteUrl(spot, defaultLocation)} target="_blank" rel="noreferrer">🗺 Як доїхати</a>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <PlacePreview spot={dobrivliany} score={bite.score} bait={bite.bait} temp={`${weather.current.temperatureMin}..${weather.current.temperatureMax}°C`} />
          <MapPanel />
        </aside>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          <Feature title="📊 Індекс рибалки" text="Один показник, який зводить тиск, вітер, дощ, температуру і активність риби." />
          <Feature title="🌙 Нічна рибалка" text="Окремі поради для сома, теплих вечорів, ям і повільної течії." />
          <Feature title="🧠 AI Помічник" text="LM Studio локально, OpenAI optional, rule-based fallback на Vercel без збоїв." />
        </div>
      </section>
    </main>
  );
}

function Hero({ score, shouldGo }: { score: number; shouldGo: boolean }) {
  return (
    <section className="relative min-h-[760px] overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <Image src={images.hero} alt="Світанок на озері для риболовлі" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,18,12,.95),rgba(3,18,12,.62),rgba(3,18,12,.25)),radial-gradient(circle_at_80%_15%,rgba(251,191,36,.35),transparent_28%)]" />
      <div className="relative mx-auto flex min-h-[720px] max-w-7xl flex-col justify-between">
        <nav className="flex items-center justify-between rounded-full border border-white/10 bg-black/25 px-5 py-3 backdrop-blur-md">
          <span className="font-black">🎣 Pogoda</span>
          <span className="hidden text-sm text-emerald-100/75 sm:block">Калуш • Івано-Франківщина • Україна</span>
        </nav>
        <div className="max-w-4xl pb-14">
          <div className="mb-6 inline-flex rounded-full border border-amber-200/30 bg-amber-200/10 px-4 py-2 text-sm text-amber-100 backdrop-blur">🔥 Кльов сьогодні: {score}% • {shouldGo ? "варто їхати" : "краще зачекати"}</div>
          <h1 className="text-5xl font-black leading-[0.95] md:text-7xl lg:text-8xl">🎣 Рибальський помічник України</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-50/80 md:text-2xl">Коли клює? Де ловити? Яка риба активна? Преміальний прогноз для рибалки з погодою, водоймами і маршрутами.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#forecast" className="rounded-full bg-emerald-300 px-7 py-4 text-center font-black text-emerald-950 shadow-xl shadow-emerald-950/30 transition hover:bg-amber-200">🌦 Перевірити кльов</a>
            <a href="#places" className="rounded-full border border-white/20 bg-white/10 px-7 py-4 text-center font-black backdrop-blur transition hover:bg-white/20">📍 Знайти місця поруч</a>
            <a href="#forecast" className="rounded-full border border-white/20 bg-black/20 px-7 py-4 text-center font-black backdrop-blur transition hover:bg-black/40">🐟 Яка риба активна</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ image, title, value, text }: { image: string; title: string; value: string; text: string }) {
  return <article className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.07] shadow-xl backdrop-blur"><div className="relative h-40"><Image src={image} alt={title} fill sizes="(max-width:768px) 100vw, 25vw" className="object-cover transition duration-500 group-hover:scale-110" /><div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-transparent" /></div><div className="p-5"><p className="text-emerald-200">{title}</p><p className="mt-2 text-3xl font-black">{value}</p><p className="mt-2 text-sm leading-6 text-emerald-100/70">{text}</p></div></article>;
}

function PlacePreview({ spot, score, bait, temp }: { spot: typeof fishingSpots[number] & { todayScore?: number; distanceKm?: number }; score: number; bait: string[]; temp: string }) {
  return <article className="overflow-hidden rounded-[2rem] border border-amber-200/20 bg-amber-100/[0.08] shadow-2xl backdrop-blur"><div className="relative h-64"><Image src={images.angler} alt={spot.name} fill sizes="(max-width:1024px) 100vw, 40vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" /><div className="absolute bottom-5 left-5"><p className="text-sm uppercase tracking-[0.3em] text-amber-100">Preview місця</p><h3 className="text-3xl font-black">{spot.name}</h3></div></div><div className="space-y-3 p-6"><p>⭐ Кльов: <b>{spot.todayScore ?? score}%</b></p><p>🌦 Погода: <b>{temp}</b></p><p>🐟 {spot.species.join(", ")}</p><p>🪱 {bait.slice(0, 4).join(" / ")}</p><p className="text-emerald-100/70">{spot.notes}</p><a className="inline-flex rounded-full bg-amber-200 px-5 py-3 font-black text-emerald-950" href={googleMapsRouteUrl(spot, defaultLocation)} target="_blank" rel="noreferrer">🗺 Як доїхати</a></div></article>;
}

function MapPanel() {
  return <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur"><div className="p-5"><h3 className="text-2xl font-black">🗺 Карта водойм</h3><p className="mt-2 text-emerald-100/70">Річки, озера, ставки і платники поруч із Калушем.</p></div><iframe title="Карта водойм Калуського району" src="https://www.openstreetmap.org/export/embed.html?bbox=24.15%2C48.88%2C24.72%2C49.28&layer=mapnik&marker=49.0119%2C24.3731" className="h-80 w-full border-0" loading="lazy" /><div className="grid gap-2 p-5 text-sm">{fishingSpots.slice(0, 5).map((spot) => <a className="rounded-2xl bg-black/20 px-4 py-3 transition hover:bg-emerald-300/10" href={googleMapsRouteUrl(spot, defaultLocation)} target="_blank" rel="noreferrer" key={spot.id}>📍 {spot.name} • {spot.rating}/5 • {spot.species.slice(0, 3).join(", ")}</a>)}</div></div>;
}

function Feature({ title, text }: { title: string; text: string }) {
  return <div className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/[0.1] to-white/[0.03] p-6 shadow-xl backdrop-blur"><h3 className="text-2xl font-black">{title}</h3><p className="mt-3 leading-7 text-emerald-100/70">{text}</p></div>;
}
