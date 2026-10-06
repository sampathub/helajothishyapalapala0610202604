export interface BirthDetails {
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:MM
  birthPlace: string; // City / Town in Sri Lanka
  district: string; // Sri Lankan District
  gender: string; // Male / Female
  language: 'sinhala' | 'english';
}

export interface PlanetaryPlacement {
  planet: string; // Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu, Ascendant
  planetSinhala: string; // ඉර, සඳ, කුජ, බුධ, ගුරු, කිවි, සෙනසුරු, රාහු, කේතු, ලග්නය
  sign: string; // Aries, Taurus, etc.
  signSinhala: string; // මේෂ, වෘෂභ, මිථුන, කටක,සිංහ, කන්‍යා, තුලා, වෘශ්චික, ධනු, මකර, කුම්භ, මීන
  house: number; // 1 to 12
  degree: string; // e.g. 14° 23'
  isRetrograde?: boolean;
  navamsaSign?: string;
  navamsaSignSinhala?: string;
  navamsaHouse?: number;
}

export interface AstroCalculations {
  moonLongitudeFullEn: string;
  moonLongitudeFullSi: string;
  nakshatraNameSi: string;
  nakshatraNameEn: string;
  pada: number;
  padaTotalLengthMinutes: number;
  padaTraveledMinutes: number;
  padaTraveledFormatted: string;
  padaRemainingMinutes: number;
  padaRemainingFormatted: string;
  dashaLordSi: string;
  dashaLordEn: string;
  dashaTotalYears: number;
  balanceDashaEn: string;
  balanceDashaSi: string;
  ganaEn?: string;
  ganaSi?: string;
  yoniEn?: string;
  yoniSi?: string;
  lingaEn?: string;
  lingaSi?: string;
}

export interface TimezoneInfo {
  offsetHours: number;
  timezoneLabel: string;
  isHistoricalAdjusted: boolean;
  adjustmentNoteSi?: string;
  adjustmentNoteEn?: string;
}

export interface KendrayaChart {
  lagna: string; // Ascendant name
  lagnaSinhala: string; // ලග්නය
  nakshatra: string; // Birth star
  nakshatraSinhala: string; // නැකත
  rashi: string; // Moon sign
  rashiSinhala: string; // චන්ද්‍ර රාශිය
  housePlacements: { [houseNumber: number]: string[] }; // Planets located in each of the 12 houses (1-indexed, e.g., { 1: ["Lagna", "Sun"], 2: ["Moon"], ... })
  navamsaHousePlacements?: { [houseNumber: number]: string[] }; // Planets in Navamsa
  navamsaLagna?: string;
  navamsaLagnaSinhala?: string;
  planetaryDetails: PlanetaryPlacement[];
  calculations?: AstroCalculations;
  timezoneInfo?: TimezoneInfo;
}

export interface Predictions {
  general: string;
  career: string;
  wealth: string;
  health: string;
  marriage: string;
  dasha: string; // Vimshottari dasha details
  luckyNumbers: number[];
  luckyColors: string[];
  auspiciousDays: string[];
}

export interface AstrologyResult {
  birthDetails: BirthDetails;
  chart: KendrayaChart;
  predictions?: Predictions;
  chatHistory?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
