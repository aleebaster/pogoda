export type FishName = "Карась" | "Короп" | "Щука" | "Окунь" | "Лящ" | "Сом" | "Форель";

export type FishActivity = {
  fish: FishName;
  score: number;
  confidence: number;
  bestTime: string;
  bait: string[];
  locationHint: string;
  reasons: string[];
};

export type BiteForecast = {
  score: number;
  label: string;
  emoji: string;
  shouldGo: boolean;
  reasons: string[];
  warnings: string[];
  bestTime: string;
  bait: string[];
  fish: FishActivity[];
};

export type FishingSpot = {
  id: string;
  name: string;
  type: "річка" | "озеро" | "став" | "платник";
  latitude: number;
  longitude: number;
  district: string;
  region: string;
  species: FishName[];
  difficulty: "легко" | "середньо" | "складно";
  rating: number;
  paid: boolean;
  accessibility: string;
  seasonality: string;
  bestTime: string;
  notes: string;
};

export type SpotRecommendation = FishingSpot & {
  distanceKm: number;
  todayScore: number;
  reason: string;
};
