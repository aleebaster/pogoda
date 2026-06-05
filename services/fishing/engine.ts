import { clamp } from "@/lib/math";
import type { BiteForecast, FishActivity, FishName } from "@/types/fishing";
import type { WeatherForecast } from "@/types/weather";

type FishProfile = {
  fish: FishName;
  idealTemp: [number, number];
  bait: string[];
  locationHint: string;
  bestTime: string;
  likesClouds: boolean;
  rainTolerance: number;
};

const fishProfiles: FishProfile[] = [
  { fish: "Карась", idealTemp: [16, 26], bait: ["опариш", "черв'як", "манка"], locationHint: "теплі мілкі затоки, стави", bestTime: "05:10-08:40", likesClouds: true, rainTolerance: 45 },
  { fish: "Короп", idealTemp: [18, 28], bait: ["кукурудза", "бойли", "метод-мікс"], locationHint: "платники, бровки, теплі мілини", bestTime: "05:30-09:00", likesClouds: true, rainTolerance: 40 },
  { fish: "Щука", idealTemp: [8, 20], bait: ["воблер", "силікон", "живець"], locationHint: "трава, коряжник, межа течії", bestTime: "06:00-10:00", likesClouds: true, rainTolerance: 55 },
  { fish: "Окунь", idealTemp: [10, 24], bait: ["мікроджиг", "мотиль", "черв'як"], locationHint: "каміння, містки, берегові звалки", bestTime: "06:00-09:30", likesClouds: false, rainTolerance: 50 },
  { fish: "Лящ", idealTemp: [14, 24], bait: ["черв'як", "опариш", "горох"], locationHint: "глибші ями, руслові бровки", bestTime: "04:50-08:20", likesClouds: true, rainTolerance: 45 },
  { fish: "Сом", idealTemp: [20, 30], bait: ["пучок черв'яків", "жаба", "печінка"], locationHint: "ями, теплі вечірні виходи", bestTime: "20:00-23:30", likesClouds: true, rainTolerance: 35 },
  { fish: "Форель", idealTemp: [6, 16], bait: ["вертушка", "німфа", "черв'як"], locationHint: "холодна течія, перекати", bestTime: "06:00-09:00", likesClouds: false, rainTolerance: 60 },
];

export function buildBiteForecast(weather: WeatherForecast): BiteForecast {
  const today = weather.current;
  const temp = (today.temperatureMin + today.temperatureMax) / 2;
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 45;

  if (today.pressure >= 750 && today.pressure <= 762) {
    score += 20;
    reasons.push("стабільний комфортний тиск");
  } else {
    score -= 12;
    warnings.push("тиск поза оптимальним діапазоном");
  }

  if (today.windSpeed <= 4) {
    score += 15;
    reasons.push("слабкий вітер не заважає кльову");
  } else if (today.windSpeed >= 8) {
    score -= 18;
    warnings.push("сильний вітер ускладнює ловлю");
  }

  if (today.cloudiness >= 45 && today.cloudiness <= 85) {
    score += 10;
    reasons.push("хмарність добра для обережної риби");
  }

  if (today.rainProbability >= 70) {
    score -= 20;
    warnings.push("висока ймовірність дощу");
  } else if (today.rainProbability >= 25) {
    score += 6;
    reasons.push("легкий дощ або волога можуть активізувати рибу");
  }

  if (temp >= 14 && temp <= 24) {
    score += 12;
    reasons.push("температура води/повітря близька до оптимальної");
  } else if (temp > 29) {
    score -= 15;
    warnings.push("спека знижує денну активність");
  }

  if (today.humidity >= 55 && today.humidity <= 85) {
    score += 6;
    reasons.push("вологість нормальна для ранкового кльову");
  }

  const finalScore = clamp(score);
  const fish = fishProfiles.map((profile) => scoreFish(profile, weather, finalScore)).sort((a, b) => b.score - a.score);
  const topBait = Array.from(new Set(fish.slice(0, 3).flatMap((item) => item.bait))).slice(0, 4);

  return {
    score: finalScore,
    label: labelFor(finalScore),
    emoji: emojiFor(finalScore),
    shouldGo: finalScore >= 58,
    reasons: reasons.slice(0, 5),
    warnings: warnings.slice(0, 4),
    bestTime: bestTimeFor(weather),
    bait: topBait,
    fish,
  };
}

function scoreFish(profile: FishProfile, weather: WeatherForecast, baseScore: number): FishActivity {
  const today = weather.current;
  const temp = (today.temperatureMin + today.temperatureMax) / 2;
  let score = baseScore;
  const reasons: string[] = [];

  if (temp >= profile.idealTemp[0] && temp <= profile.idealTemp[1]) {
    score += 16;
    reasons.push("температура підходить виду");
  } else {
    score -= Math.min(20, Math.abs(temp - (profile.idealTemp[0] + profile.idealTemp[1]) / 2));
  }

  if (profile.likesClouds && today.cloudiness > 50) {
    score += 8;
    reasons.push("хмарність додає сміливості рибі");
  }

  if (today.rainProbability > profile.rainTolerance) score -= 12;
  if (today.windSpeed <= 4) score += 6;

  return {
    fish: profile.fish,
    score: clamp(score),
    confidence: clamp(72 + (weather.source === "sinoptik" ? 12 : 0) - (today.rainProbability > 70 ? 8 : 0)),
    bestTime: profile.bestTime,
    bait: profile.bait,
    locationHint: profile.locationHint,
    reasons: reasons.length ? reasons : ["загальні умови сумісні з активністю"],
  };
}

function bestTimeFor(weather: WeatherForecast): string {
  const temp = (weather.current.temperatureMin + weather.current.temperatureMax) / 2;
  if (temp > 25) return "05:00-08:30 та 19:30-22:00";
  if (weather.current.cloudiness > 60) return "06:00-10:00 та 17:30-20:30";
  return "05:20-09:00";
}

function labelFor(score: number): string {
  if (score >= 80) return "відмінний кльов";
  if (score >= 60) return "добрий кльов";
  if (score >= 30) return "середній кльов";
  return "слабкий кльов";
}

function emojiFor(score: number): string {
  if (score >= 80) return "🔥";
  if (score >= 60) return "🟢";
  if (score >= 30) return "🟡";
  return "🔴";
}
