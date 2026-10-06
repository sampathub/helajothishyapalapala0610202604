import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Sun, 
  Moon, 
  Compass, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Globe, 
  Send, 
  MessageSquare, 
  Heart, 
  Briefcase, 
  Coins, 
  Activity, 
  ShieldAlert, 
  ShieldCheck,
  Eye,
  AlertTriangle,
  HelpCircle, 
  RefreshCw,
  Award,
  ChevronRight,
  BookOpen,
  Lock,
  Unlock,
  Printer,
  Download,
  Mail,
  Phone,
  MessageCircle,
  X,
  Search,
  Filter,
  Copy,
  Check,
  Users,
  Layers,
  ExternalLink,
  Database
} from "lucide-react";
import { signInWithGoogleFirebase } from "./lib/firebase";
import { BirthDetails, AstrologyResult, ChatMessage, KendrayaChart, Predictions } from "./types";
// @ts-ignore
import bannerImg from "./assets/images/astrology_branding_banner_1781598440894.jpg";

const getApiUrl = (uri: string) => {
  return uri;
};

const safeParseJson = async (response: Response) => {
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    console.error("[Non-JSON response snippet]:", text.substring(0, 500));
    if (response.status === 502 || response.status === 504) {
      throw new Error("සේවාදායකයේ තාවකාලික සබඳතා ප්‍රමාදයක් (Netlify 502/504 Timeout). කරුණාකර නැවත උත්සාහ කරන්න. (Server took too long or is restarting. Please retry.)");
    }
    if (response.status === 404) {
      throw new Error(`සේවාදායකයේ අදාළ අංශය හමු නොවීය (Endpoint 404 Not Found). කරුණාකර පිටුව Refresh කර නැවත උත්සාහ කරන්න.`);
    }
    if (response.status === 413) {
      throw new Error(`ඡායාරූපයේ ප්‍රමාණය වැඩිය (File too large). කරුණාකර කුඩා ඡායාරූපයක් තෝරන්න.`);
    }
    throw new Error(
      `සේවාදායකයේ තාවකාලික දෝෂයක් පවතී (${response.status}). කරුණාකර සුළු මොහොතකින් නැවත උත්සාහ කරන්න.`
    );
  }
  return await response.json();
};

const isStorageAvailable = (type: 'localStorage' | 'sessionStorage') => {
  try {
    const storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
};

const memoryStorage: Record<string, string> = {};

const safeStorage = {
  getItem: (key: string, isSession: boolean = false): string | null => {
    try {
      const type = isSession ? 'sessionStorage' : 'localStorage';
      if (isStorageAvailable(type)) {
        return window[type].getItem(key);
      }
    } catch (e) {
      console.warn("Storage item retrieval failed, using fallback:", e);
    }
    return memoryStorage[key] || null;
  },
  setItem: (key: string, value: string, isSession: boolean = false) => {
    try {
      const type = isSession ? 'sessionStorage' : 'localStorage';
      if (isStorageAvailable(type)) {
        window[type].setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn("Storage item saving failed, using fallback:", e);
    }
    memoryStorage[key] = value;
  },
  removeItem: (key: string, isSession: boolean = false) => {
    try {
      const type = isSession ? 'sessionStorage' : 'localStorage';
      if (isStorageAvailable(type)) {
        window[type].removeItem(key);
        return;
      }
    } catch (e) {
      console.warn("Storage item removal failed, using fallback:", e);
    }
    delete memoryStorage[key];
  }
};

const DISTRICTS = [
  { en: "Colombo", si: "කොළඹ" },
  { en: "Gampaha", si: "ගම්පහ" },
  { en: "Kalutara", si: "කළුතර" },
  { en: "Kandy", si: "මහනුවර" },
  { en: "Matale", si: "මාතලේ" },
  { en: "Nuwara Eliya", si: "නුවරඑළිය" },
  { en: "Galle", si: "ගාල්ල" },
  { en: "Matara", si: "මාතර" },
  { en: "Hambantota", si: "හම්බන්තොට" },
  { en: "Jaffna", si: "යාපනය" },
  { en: "Kilinochchi", si: "කිලිනොච්චිය" },
  { en: "Mannar", si: "මන්නාරම" },
  { en: "Vavuniya", si: "වවුනියාව" },
  { en: "Mullaitivu", si: "මුලතිව්" },
  { en: "Batticaloa", si: "මඩකලපුව" },
  { en: "Ampara", si: "අම්පාර" },
  { en: "Trincomalee", si: "ත්‍රිකුණාමලය" },
  { en: "Kurunegala", si: "කුරුණෑගල" },
  { en: "Puttalam", si: "පුත්තලම" },
  { en: "Anuradhapura", si: "අනුරාධපුරය" },
  { en: "Polonnaruwa", si: "පොළොන්නරුව" },
  { en: "Badulla", si: "බදුල්ල" },
  { en: "Moneragala", si: "මොණරාගල" },
  { en: "Ratnapura", si: "රත්නපුරය" },
  { en: "Kegalle", si: "කෑගල්ල" }
];

const PLANET_SYMBOLS: { [key: string]: { en: string; si: string; color: string; desc: string; descSi: string } } = {
  "Ascendant": { en: "Asc", si: "ල", color: "text-amber-400 bg-amber-950/40 border-amber-800", desc: "Ascendant (Lagna)", descSi: "ලග්නය" },
  "Sun": { en: "Su", si: "ර", color: "text-red-400 bg-red-950/40 border-red-900", desc: "Sun (Ravi)", descSi: "රවි (ඉර)" },
  "Moon": { en: "Mo", si: "ච", color: "text-sky-300 bg-sky-950/40 border-sky-900", desc: "Moon (Chandra)", descSi: "චන්ද්‍ර (සඳ)" },
  "Mars": { en: "Ma", si: "කු", color: "text-orange-500 bg-orange-950/40 border-orange-900", desc: "Mars (Kuja)", descSi: "කුජ" },
  "Mercury": { en: "Me", si: "බු", color: "text-emerald-400 bg-emerald-950/40 border-emerald-900", desc: "Mercury (Budha)", descSi: "බුධ" },
  "Jupiter": { en: "Ju", si: "ගු", color: "text-yellow-400 bg-yellow-950/40 border-yellow-800", desc: "Jupiter (Guru)", descSi: "ගුරු" },
  "Venus": { en: "Ve", si: "ශු", color: "text-pink-400 bg-pink-950/40 border-pink-900", desc: "Venus (Shukra)", descSi: "ශුක්‍ර (කිවි)" },
  "Saturn": { en: "Sa", si: "ශ", color: "text-violet-400 bg-violet-950/40 border-violet-900", desc: "Saturn (Shani)", descSi: "ශනි (සෙනසුරු)" },
  "Rahu": { en: "Ra", si: "රා", color: "text-teal-400 bg-teal-950/40 border-teal-900", desc: "Rahu", descSi: "රාහු" },
  "Ketu": { en: "Ke", si: "කේ", color: "text-fuchsia-400 bg-fuchsia-950/40 border-fuchsia-900", desc: "Ketu", descSi: "කේතු" },
};

const CHART_PLANET_COLORS: { [key: string]: { text: string; fill: string; stroke: string } } = {
  "Ascendant": { text: "#b45309", fill: "#ffedd5", stroke: "#fed7aa" }, // Warm Orange
  "Sun": { text: "#64748b", fill: "#fee2e2", stroke: "#fca5a5" },       // Deep Red
  "Moon": { text: "#0f172a", fill: "#e0f2fe", stroke: "#bae6fd" },      // Celestial Blue
  "Mars": { text: "#0f172a", fill: "#fef3c7", stroke: "#fde68a" },      // Rust Orange
  "Mercury": { text: "#dc2626", fill: "#d1fae5", stroke: "#a7f3d0" },   // Emerald Green
  "Jupiter": { text: "#b45309", fill: "#fef9c3", stroke: "#fef08a" },   // Gold Yellow
  "Venus": { text: "#2563eb", fill: "#fce7f3", stroke: "#fbcfe8" },     // Elegant Pink
  "Saturn": { text: "#334155", fill: "#f3e8ff", stroke: "#e9d5ff" },    // Violet Purple
  "Rahu": { text: "#0d9488", fill: "#ccfbf1", stroke: "#99f6e4" },      // Teal-Dark
  "Ketu": { text: "#059669", fill: "#fae8ff", stroke: "#f5d0fe" },      // Magenta / Purple
};

const getZodiacSymbol = (lagna: string) => {
  const symbols: { [key: string]: string } = {
    "Aries": "♈", "Taurus": "♉", "Gemini": "♊", "Cancer": "♋", 
    "Leo": "♌", "Virgo": "♍", "Libra": "♎", "Scorpio": "♏", 
    "Sagittarius": "♐", "Capricorn": "♑", "Aquarius": "♒", "Pisces": "♓"
  };
  return symbols[lagna] || "✨";
};

const getZodiacArtSymbol = (lagna: string) => {
  const symbols: { [key: string]: string } = {
    "Aries": "🐏", "Taurus": "🐂", "Gemini": "👥", "Cancer": "🦀", 
    "Leo": "🦁", "Virgo": "🌾", "Libra": "⚖️", "Scorpio": "🦂", 
    "Sagittarius": "🏹", "Capricorn": "🐐", "Aquarius": "🏺", "Pisces": "🐟"
  };
  return symbols[lagna] || "✨";
};

const calculateAge = (birthDateStr?: string, currentLang?: string) => {
  if (!birthDateStr) return "N/A";
  try {
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    if (isNaN(birthDate.getTime())) return "N/A";

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    if (currentLang === 'sinhala') {
      const parts = [];
      if (years > 0) parts.push(`අවුරුදු ${years}`);
      if (months > 0) parts.push(`මාස ${months}`);
      if (days > 0) parts.push(`දින ${days}`);
      if (parts.length === 0) return "අද උපන්";
      return `${parts.join(", ")} (${years} Years)`;
    } else {
      const parts = [];
      if (years > 0) parts.push(`${years} Years`);
      if (months > 0) parts.push(`${months} Months`);
      if (days > 0) parts.push(`${days} Days`);
      if (parts.length === 0) return "Newborn";
      return `${parts.join(", ")} (අවුරුදු ${years})`;
    }
  } catch (e) {
    return "N/A";
  }
};

const generateClientFallbackPredictions = (chart: KendrayaChart, birthDetails: BirthDetails, language: string = 'sinhala'): Predictions => {
  const isSi = language === 'sinhala' || !language || language === 'si';
  const name = birthDetails?.name || 'ඔබගේ';
  const lagnaSi = chart?.lagnaSinhala || chart?.lagna || 'මේෂ';
  const lagnaEn = chart?.lagna || 'Aries';
  const rashiSi = chart?.rashiSinhala || chart?.rashi || 'මේෂ';
  const rashiEn = chart?.rashi || 'Aries';
  const nakshatraSi = chart?.nakshatraSinhala || chart?.nakshatra || 'අස්විද';
  const dashaLordSi = chart?.calculations?.dashaLordSi || 'කේතු';
  const balanceDashaSi = chart?.calculations?.balanceDashaSi || 'වසර කිහිපයක්';

  if (isSi) {
    return {
      general: `${name} ගේ ${lagnaSi} ලග්නය, ${rashiSi} චන්ද්‍ර රාශිය සහ ${nakshatraSi} නැකත පදනම් කරගත් ජන්ම කේන්දර සටහනට අනුව ඔබ ස්වාධීන චින්තනයකින්, උසස් ආත්ම ශක්තියකින්, තීක්ෂ්ණ බුද්ධියකින් සහ ඍජු තීරණ ගැනීමේ හැකියාවෙන් හෙබි සුවිශේෂී ගුණාංග සහිත පුද්ගලයෙකි. සහජ නායකත්ව ලක්ෂණ, යුක්තිගරුක අවංකභාවය සහ ජීවිතයේ එළඹෙන ඕනෑම අභියෝගයකට නොබියව මුහුණ දීමේ නොසැලෙන ධෛර්යය ඔබගේ ජීවිත ගමනේ ප්‍රධානතම බලවේගය වේ. ජීවිතයේ සෑම අවස්ථාවකදීම සාධාරණත්වය අගය කරමින්, අන්‍යයන්ගේ දුකේදී පිහිටවන මානුෂීය ගුණාංගයන්ගෙන් යුතුව කටයුතු කිරීම නිසා සමාජයේ ඉහළ ගෞරවයක්, පිළිගැනීමක් සහ විශ්වාසනීයත්වයක් ඔබට නොමඳව හිමි වේ. යහපත් මිතුරු ඇසුර ප්‍රිය කරන, තම ආත්ම ගරුත්වය දිවිහිමියෙන් ආරක්ෂා කරගන්නා ඔබ, වංචනික හා කුහක පුද්ගලයන් දැඩිව පිළිකුල් කරයි. තරුණ අවධියට වඩා ජීවිතයේ පරිණත කාලයේදී ස්වෝත්සාහයෙන් උසස් සාර්ථකත්වයක් අත්පත් කරගැනීමට අවශ්‍ය සියලු සුබ වාසනා යෝග ඔබගේ කේන්ද්‍රය තුළ මැනවින් ගැබ්ව පවතී. අනාගතය පිළිබඳ පුළුල් දූරදර්ශී දැක්මකින් යුතුව, ධර්මානුකූලව සහ ඉවසීමෙන් කටයුතු කිරීම ඔබගේ ජීවිතයේ සියලු ජයග්‍රහණයන්ට මෙන්ම මානසික සතුටටද ප්‍රධානතම හේතුව වනු ඇත. යහපත් චින්තනය හා පරාර්ථකාමීත්වය නිරතුරුවම ඔබගේ අනාගත දියුණුවට ආශිර්වාදයක් එක්කරයි. වැඩිහිටියන්ගේ අවවාද පිළිපැදීමෙන් ජීවිතයේ ඉදිරි ගමන තවදුරටත් ආලෝකමත් වේ.`,
      career: `කර්මස්ථානය වන 10 වැන්න සහ ලග්නාධිපති ග්‍රහයාගේ පිහිටීම අනුව ඔබගේ වෘත්තීය හා රැකියා ක්ෂේත්‍රය තුළ ස්වෝත්සාහයෙන් ඉදිරියට යාමට ඉහළ හැකියාවක් හා භාග්‍යයක් පවතී. සහජ බුද්ධිමය මඟපෙන්වීම, විචක්ෂණශීලී සැලසුම්කරණය සහ කණ්ඩායම් මෙහෙයවීමේ හැකියාව නිසා පරිපාලන, කළමනාකරණ, තාක්ෂණික, අධ්‍යාපන හෝ ව්‍යාපාරික ක්ෂේත්‍රයන්හි සුවිශේෂී සාර්ථකත්වයක් අත්වේ. රැකියාවේ වගකීම් නොපසුබට කැපවීමෙන් හා නීත්‍යානුකූලව ඉටු කිරීම හේතුවෙන් උසස් නිලධාරීන්ගේ මෙන්ම සහෝදර සේවකයන්ගේද නොමඳ ගෞරවය හා ප්‍රසාදය නිරතුරුවම හිමිවේ. වෘත්තීය ගමනේ ආරම්භයේදී සුළු බාධක හෝ විවිධ පීඩනයන් මතු වුවද, නොසැලෙන අධිෂ්ඨානයෙන් ක්‍රියා කිරීමෙන් ඉක්මන් උසස්වීම් හා ස්ථාවර කීර්තියක් ළඟා කරගත හැක. ස්වාධීන ව්‍යාපාර හෝ උපදේශන සේවාවන්හි නිරත වන්නේ නම් නව දැනුම හා නවීන තාක්ෂණය භාවිත කිරීම මඟින් සාර්ථකත්වය තවදුරටත් පුළුල් කරගත හැක. අවංකභාවය සහ විනයගරුක පැවැත්ම රැකියා සුරක්ෂිතතාවයට මහඟු පදනමකි. නිරන්තර උත්සාහය හා සුබ හෝරාවන් පිළිබඳ අවධානය යොමු කිරීමෙන් ක්ෂේත්‍රයේ ඉහළම තලයට ළඟා වීමට පූර්ණ ග්‍රහ ආශිර්වාදය හිමි වේ. සේවා ස්ථානයේදී බුද්ධිමත්ව තීන්දු ගැනීමෙන් සියලු බාධක ජයගත හැකි වනු ඇත. අලුත් අවස්ථාවන්ගෙන් උපරිම ඵල නෙළා ගැනීමට උනන්දු වීම ඔබගේ අනාගත රැකියා උසස්වීම්වලට බෙහෙවින් හේතු වේ.`,
      wealth: `ධනස්ථානය වන 2 වැන්න සහ අයස්ථානය වන 11 වැන්න මගින් ස්ථාවර ආර්ථික සමෘද්ධියක් හා වස්තු සම්පත් උපයා ගැනීමේ භාග්‍යය මැනවින් පෙන්නුම් කරයි. ජීවිතයේ මුල් අවධියේදී සුළු මූල්‍ය අභියෝග හෝ අනවශ්‍ය වියදම් පැවතියද, සැලසුම් සහගත කළමනාකරණය හා විචක්ෂණශීලී මූල්‍ය පරිහරණය තුළින් ස්ථාවර බැංකු ඉතුරුම්, ඉඩකඩම්, නිවාස හා යාන වාහන හිමිකම් සාර්ථකව ගොඩනගා ගැනීමට වාසනාව උදාවේ. හදිසි අනාරක්ෂිත සමපේක්ෂණ හෝ සූදු ආයෝජනවලින් බැහැරව සුරක්ෂිත ක්ෂේත්‍රයන්හි මුදල් ආයෝජනය කිරීමෙන් අනාගත ආර්ථිකය වඩාත් ශක්තිමත් කරගත හැක. අන්‍යයන්ට අනවශ්‍ය ලෙස ඇපවීමෙන් වැළකී සිටීම මූල්‍ය අලාභ වළක්වා ගැනීමට අතිශයින් වැදගත් වේ. ධර්මානුකූලව සහ සාධාරණව උපයන ධනය දීර්ඝකාලීන පවුලේ දියුණුවටත්, දූ දරුවන්ගේ අනාගත සුරක්ෂිතතාවටත් මහඟු පිටුවහලක් සපයයි. මුදල් පරිහරණයේදී සකසුරුවම් බව පුරුදු කරගැනීමෙන් ජීවිතයේ මැද හා අගභාගය වන විට පූර්ණ ආර්ථික නිදහසක් භුක්ති විඳීමට හැකිවේ. විශ්වාසවන්ත ලේඛන පරීක්ෂාවකින් තොරව කිසිදු මූල්‍ය ගනුදෙනුවක් නොකිරීමට වගබලා ගත යුතුය. නිවැරදි සැලසුම් ඔස්සේ ඉතුරුම් වර්ධනය කරගැනීමෙන් අනාගත මූල්‍ය ස්ථාවරත්වය සහතික වනු ඇත. මුදල් ඉතිරිකිරීම් නිසි පරිදි පවත්වා ගැනීමෙන් සෞභාග්‍යය සදා සුරක්ෂිත වේ.`,
      health: `ශාරීරික සෞඛ්‍යය සහ දීර්ඝායුෂ පිළිබඳව සලකා බැලීමේදී, ආයුර්වේද ත්‍රිදෝෂ මූලධර්මයන්ට අනුකූලව ශරීරයේ වාත සහ පිත් දෝෂ සමතුලිතව පවත්වා ගැනීම කෙරෙහි නිරන්තරයෙන් විශේෂ අවධානයක් යොමු කළ යුතුය. විශේෂයෙන් නියමිත වේලාවට පෝෂ්‍යදායී ආහාර පාන ගැනීම, ප්‍රමාණවත් පරිදි පිරිසිදු පානීය ජලය භාවිතය සහ රාත්‍රී අනවශ්‍ය ලෙස නිදි වැරීමෙන් වැළකීමෙන් ශාරීරික ප්‍රතිශක්තිය හා ජීව ශක්තිය ඉහළ නංවාගත හැක. අධික මානසික කාර්යබහුල බව සහ ආතතිය පාලනය කරගැනීමට සතිමත්භාවය, භාවනාව හෝ දිනපතා නැවුම් වාතාශ්‍රය තුළ සැහැල්ලු ඇවිදීම වැනි ව්‍යායාම පුරුදු කරගැනීම ඉතා යහපත්ය. සෘතුමය කාලගුණ විපර්යාස හමුවේ සෙම් රෝග හා ආමාශගත දැවිලි තත්ත්වයන්ගෙන් ආරක්ෂා වීමට සමබර ආහාර රටාවක් අනුගමනය කිරීම සහ නිතිපතා ප්‍රමාණවත් විවේකයක් ලබා ගැනීම නිරෝගී ජීවිතයකට මහත් පිටුවහලක් වනු ඇත. ස්වභාවික ඖෂධීය පාන වර්ග දෛනිකව භාවිතය ශරීරයේ ප්‍රබෝධය රඳවා ගැනීමට ඉවහල් වේ. නිරෝගී මනසකින් හා ශක්තිමත් කයකින් යුතුව දීර්ඝායුෂ විඳීමට ස්වභාවධර්මයා හා සමගාමීව ජීවත්වීම අතිශයින්ම වැදගත් වේ. සෞඛ්‍ය සම්පන්න පුරුදු රැකීමෙන් කායික කාර්යක්ෂමතාව ඉහළ මට්ටමක පවත්වාගත හැකි වේ. ස්වභාවික ආහාර රටාවකට හුරුවීමෙන් සියලු රෝගාබාධවලින් ආරක්ෂා විය හැක.`,
      marriage: `කලත්‍රස්ථානය වන 7 වැන්නෙහි පිහිටීම අනුව යුග දිවියේ සතුට, අන්‍යෝන්‍ය අවබෝධය, ගෞරවය සහ ආදරණීය බැඳීමක් ඉතා ඉහළින් අගය කරන චරිතයකි. සහකරු හෝ සහකාරිය පවුල් සංස්ථාව රැකගන්නා, ගුණගරුක හා වගකීම්සහගත අයෙකු වන අතර, දෙදෙනා අතර සාකච්ඡා මාර්ගයෙන් තීරණ ගැනීම තුළින් පවුල් ජීවිතයේ වාසනාව සහ සාමය තවදුරටත් තහවුරු කරගත හැක. සුළු පවුල් මතභේද හෝ අදහස් නොගැලපීම් මතු වන අවස්ථාවලදී ආවේගශීලී නොවී ඉවසීමෙන් හා විවෘත සන්නිවේදනයෙන් ක්‍රියා කිරීමෙන් යුග දිවියේ බැඳීම දිනෙන් දින ශක්තිමත් වේ. විවාහයෙන් පසු දෙදෙනාගේම ඒකාබද්ධ උත්සාහයෙන් පවුලේ ආර්ථිකය හා සමාජ තත්ත්වය වඩාත් උසස් තලයකට ඔසවා තැබීමට හැකිවන අතර, සෙනෙහෙබර දූ දරුවන්ගේ වාසනාවෙන් පවුල තුළ නිරන්තර ප්‍රීතිය හා කීර්තිය අත්වනු ඇත. අන්‍යෝන්‍ය ගෞරවය පෙරදැරි කරගත් යුග දිවිය දෙදෙනාටම සැබෑ සැනසීම හා ආශිර්වාදය උදාකර දෙයි. දෙදෙනා එක්ව නිතිපතා ආගමික වතාවත්වල නිරත වීම පවුලේ සෞභාග්‍යයට මහඟු මඟකි. එකිනෙකා කෙරෙහි විශ්වාසය තබා කටයුතු කිරීමෙන් යුග දිවිය පරම සතුටින් පිරී යනු ඇත. පවුලේ වැඩිහිටියන්ගේ ආශිර්වාදය ලබාගැනීමෙන් විවාහ ජීවිතයේ සාර්ථකත්වය තවදුරටත් තහවුරු වනු ඇත.`,
      dasha: `උපතේදී ක්‍රියාත්මක වූ ${dashaLordSi} මහ දශාවේ ශේෂය ${balanceDashaSi} ක කාලසීමාවක් පැවති අතර, වත්මන් දශා කාලය තුළ ජීවිතයේ වැදගත් සුබ පරිවර්තන රැසක් සිදුවන වකවානුවකි. මෙම කාලසීමාව තුළ ග්‍රහ අපල සමනය වී, රැකියා, ආර්ථික හා පවුල් දිවියේ යහපත හා සෞභාග්‍යය උදා කරගැනීම පිණිස සාම්ප්‍රදායික හෙළ ජ්‍යෝතිෂ ශාන්තිකර්ම සහ ආගමික වතාවත්වල නිරත වීම බෙහෙවින් ගුණදායකය. විශේෂයෙන් සතිපතා බෝධි පූජා පැවැත්වීම, අභය දානය හා දුගී මගීන්ට ආහාර පාන පරිත්‍යාග කිරීම, රත්නත්‍රයේ අනන්ත ගුණ මෙනෙහි කිරීම හා සුබ වර්ණයන්ගෙන් සැරසීම තුළින් අතිශය යහපත් ප්‍රතිඵල හා මානසික සැනසීම ළඟා කරගත හැක. දිනපතා කරණීයමෙත්ත සූත්‍රය, රත්න සූත්‍රය හෝ මෝර පිරිත ශ්‍රවණය කිරීමෙන් සියලු ග්‍රහ දෝෂ නිවාරණය වී, කායික මානසික සුවපත්භාවය සහ කටයුතු සර්වප්‍රකාරයෙන්ම සාර්ථක කරගැනීමේ මහා බලයක් උදාවනු ඇත. වැඩිහිටියන්ට සැලකීම, සිල්වත් ගුණවත් දිවියක් ගත කිරීම හා පුණ්‍ය කටයුතුවල නිරත වීම තුළින් ග්‍රහ බලපෑම් සුබ අතට හරවා ගැනීමට හැකි වේ. දෙවියන්ගේ හා රත්නත්‍රයේ නොමඳ ආශිර්වාදය ඔබගේ ආරක්ෂාව සලසනු ඇත. පින්කම්වල නිරත වීමෙන් සියලු බාධක දුරු වේ.`,
      luckyNumbers: [1, 5, 9],
      luckyColors: ["ලා කහ", "සුදු", "රන්වන්"],
      auspiciousDays: ["බ්‍රහස්පතින්දා", "සිකුරාදා"]
    };
  } else {
    return {
      general: `According to the natal chart with ${lagnaEn} Ascendant, ${rashiEn} Moon sign, and ${nakshatraSi} birth star, ${name} possesses an aura of self-determination, charismatic willpower, and intellectual depth. Influenced by harmonious celestial configurations, your personality gracefully marries moral integrity, courage, and thoughtful strategic foresight, earning genuine respect across social and professional circles. You exhibit a balanced blend of ambition and profound empathy, approaching life unexpected challenges with resilience, patience, and composure. Your inner spiritual compass guides your moral choices, allowing you to discern authenticity and avoid hypocritical influences. As you progress into the prime stages of adulthood, your steadfast perseverance, ethical values, and creative problem-solving will continuously unlock auspicious avenues for lasting fulfillment, material comfort, and distinguished social recognition. Nurturing positive aspirations consistently guides your life journey toward triumphant achievements and enduring spiritual peace.`,
      career: `Your professional domain is fortified by the robust placement of the 10th Karma house and governing planetary alignments. Natural executive leadership, analytical planning, administrative authority, technology, commerce, or corporate management reflect your standout vocations. Colleagues, partners, and superiors consistently appreciate your dependable work ethic, precision, integrity, and visionary dedication. While initial career phases may introduce transitional pressures or competitive workplace challenges, your unwavering persistence guarantees steady elevations, commanding authority, and progressive enterprise expansion. Strategic skill diversification and embracing innovative methodologies will further accelerate your trajectory toward notable milestones and executive opportunities. Operating with complete transparency and adhering to ethical standards will guarantee lasting occupational security and distinguished social prestige.`,
      wealth: `Planetary indicators governing your 2nd house of accumulated reserves and 11th house of recurrent gains reflect substantial financial potential maturing into enduring prosperity over time. By maintaining disciplined budget planning, avoiding speculative volatility, and prioritizing structured long-term investments, you will steadily consolidate landed properties, valuable assets, comfortable homesteads, and resilient revenue channels. Diligent enterprise and principled financial management ensure continuous economic stability, providing a fortified foundation for both personal aspirations and long-term familial legacy. Practicing systematic savings and avoiding hasty financial commitments will protect your hard-earned wealth from unnecessary market risks, guaranteeing complete economic freedom in later chapters of life.`,
      health: `According to traditional Ayurvedic Tridosha perspectives, mindful equilibrium of Pitta and Vata bio-energies is essential for sustaining optimal physical vitality, longevity, and stamina. Regularizing wholesome nutritional habits, drinking clean water throughout the day, and upholding a restorative circadian sleep routine will protect your natural immune resilience and bodily vigor. Engaging in daily mindfulness meditation, soothing walking exercises, and pranayama breathwork will mitigate cognitive fatigue, nervous strain, and emotional tension. Incorporating herbal teas and seasonal balanced diets helps regulate internal digestive warmth and respiratory clarity against climatic fluctuations. Harmonizing daily routines with natural rhythmic cycles remains the supreme cornerstone for enjoying robust wellness and longevity.`,
      marriage: `In matrimonial realms, the 7th Kalatra house alignment cultivates profound domestic devotion, mutual empathy, and enduring loyalty. Your partnership blossoms through open-hearted communication, shared respect, and patient understanding with your spouse, cultivating an inspiring sanctuary of mutual encouragement, deep emotional comfort, and stability. Collective decisions blessed by elder family guidance foster harmonious understanding through life shared journeys and transitional phases. Joint endeavors post-marriage will significantly elevate your shared prosperity and household prestige, fostering profound mutual fulfillment and joyful companionship through every chapter of life. Mutual spiritual practices and shared goodwill further solidify marital bliss, keeping your relationship anchored in everlasting affection and mutual trust.`,
      dasha: `The birth Vimshottari Dasha was ruled by ${dashaLordSi} with a balance of ${balanceDashaSi}. This significant astrological period activates powerful cosmic energies demanding spiritual awareness, disciplined focus, and righteous action. To optimize positive planetary vibrations and pacify transit friction, engaging in humanitarian charity, spiritual reflection, mindfulness meditation, and wearing auspicious colors will invite tranquility, good fortune, and abundant blessings throughout this transformative astrological phase. Performing regular acts of loving kindness, supporting community welfare, listening to protective paritta verses, and maintaining harmonious relationships with elders will gracefully turn planetary transitions into catalysts for inner joy and prosperity.`,
      luckyNumbers: [1, 5, 9],
      luckyColors: ["Light Yellow", "White", "Golden"],
      auspiciousDays: ["Thursday", "Friday"]
    };
  }
};

const HOUSE_METADATA = [
  {
    house: 1,
    type: "single",
    cell: "C2",
    x: 130, y: 0, w: 130, h: 130,
    rashiBadge: { type: "green-box", x: 136, y: 104 },
    centroid: { x: 195, y: 65 },
    label: null,
    houseCircle: { text: "1", cx: 195, cy: 32 }
  },
  {
    house: 2,
    type: "triangle-top-right",
    cell: "C1",
    centroid: { x: 92, y: 40 },
    rashiLabel: { x: 120, y: 118, color: "#1e293b" },
    label: null,
    houseCircle: { text: "2", cx: 92, cy: 32 }
  },
  {
    house: 3,
    type: "triangle-bottom-left",
    cell: "C1",
    centroid: { x: 40, y: 92 },
    rashiLabel: { x: 120, y: 102, color: "#dc2626" },
    label: { text: "A6", x: 16, y: 18, color: "#94a3b8" },
    houseCircle: { text: "3", cx: 40, cy: 95 }
  },
  {
    house: 4,
    type: "single",
    cell: "C4",
    x: 0, y: 130, w: 130, h: 130,
    rashiBadge: { type: "green-circle", cx: 116, cy: 148 },
    centroid: { x: 65, y: 195 },
    label: { text: "GL", x: 16, y: 148, color: "#22c55e" },
    houseCircle: { text: "4", cx: 65, cy: 228 }
  },
  {
    house: 5,
    type: "triangle-top-left",
    cell: "C7",
    centroid: { x: 40, y: 288 },
    rashiLabel: { x: 120, y: 278, color: "#0f172a" },
    label: { text: "A8", x: 16, y: 276, color: "#94a3b8" },
    houseCircle: { text: "5", cx: 40, cy: 312 }
  },
  {
    house: 6,
    type: "triangle-bottom-right",
    cell: "C7",
    centroid: { x: 92, y: 348 },
    rashiLabel: { x: 120, y: 292, color: "#334155" },
    label: null,
    houseCircle: { text: "6", cx: 92, cy: 356 }
  },
  {
    house: 7,
    type: "single",
    cell: "C8",
    x: 130, y: 260, w: 130, h: 130,
    rashiLabel: { x: 246, y: 278, color: "#2563eb" },
    centroid: { x: 195, y: 292 },
    label: { text: "A5 A10", x: 145, y: 380, color: "#94a3b8" },
    houseCircle: { text: "7", cx: 195, cy: 328 }
  },
  {
    house: 8,
    type: "triangle-bottom-left",
    cell: "C9",
    centroid: { x: 298, y: 338 },
    rashiLabel: { x: 272, y: 276, color: "#2563eb" },
    label: { text: "A4 VL", x: 276, y: 380, color: "#22c55e" },
    houseCircle: { text: "8", cx: 298, cy: 368 }
  },
  {
    house: 9,
    type: "triangle-top-right",
    cell: "C9",
    centroid: { x: 348, y: 288 },
    rashiLabel: { x: 272, y: 264, color: "#dc2626" },
    label: { text: "A11 UL", x: 342, y: 276, color: "#94a3b8" },
    houseCircle: { text: "9", cx: 348, cy: 312 }
  },
  {
    house: 10,
    type: "single",
    cell: "C6",
    x: 260, y: 130, w: 130, h: 130,
    rashiLabel: { x: 272, y: 248, color: "#b45309" },
    centroid: { x: 325, y: 165 },
    label: { text: "A7", x: 368, y: 148, color: "#94a3b8" },
    houseCircle: { text: "10", cx: 325, cy: 195 }
  },
  {
    house: 11,
    type: "triangle-bottom-right",
    cell: "C3",
    centroid: { x: 348, y: 92 },
    rashiLabel: { x: 272, y: 120, color: "#ea580c" },
    label: { text: "AL A3 A9 HL", x: 330, y: 122, color: "#22c55e" },
    houseCircle: { text: "11", cx: 348, cy: 90 }
  },
  {
    house: 12,
    type: "triangle-top-left",
    cell: "C3",
    centroid: { x: 298, y: 24 },
    rashiLabel: { x: 268, y: 105, color: "#1e293b" },
    label: { text: "A2", x: 274, y: 20, color: "#94a3b8" },
    houseCircle: { text: "12", cx: 298, cy: 52 }
  }
];

const LOADING_STEPS = [
  { en: "Entering the cosmic gateway...", si: "විශ්ව ද්වාරයට පිවිසෙමින්..." },
  { en: "Analyzing geographical coordinates in Sri Lanka...", si: "ලංකාවේ උපන් ස්ථානයේ දේශාංශ ගණනය කරමින්..." },
  { en: "Calculating Sidereal Ascendant (Lagna)...", si: "ලග්න ස්ඵුටය ගණනය කරමින්..." },
  { en: "Placing the 9 planets in houses according to Lahiri Ayanamsha...", si: "ලහිරි අයනඅංශයට අනුව ග්‍රහයින් 12 කොටුවේ පිහිටුවමින්..." },
  { en: "Formulating your Chandra Rashi and Nakshatraya...", si: "චන්ද්‍ර රාශිය සහ උපන් නැකත සකසමින්..." },
  { en: "Interpreting traditional Hela Astrological combinations...", si: "පැරණි හෙළ නක්ෂත්‍ර යෝග සහ දශා විශ්ලේෂණය කරමින්..." },
  { en: "Compiling personalized predictions with Gemini wisdom...", si: "Gemini බුද්ධිය ඇසුරෙන් ඔබගේ කේන්දර පලාපල සකසමින්..." }
];

export interface HistoricalDstInfo {
  period: string;
  offset: string;
  offsetHours: number;
  titleSi: string;
  titleEn: string;
  messageSi: string;
  messageEn: string;
}

export function getHistoricalSriLankaDstInfo(dateStr: string): HistoricalDstInfo | null {
  if (!dateStr) return null;
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return null;
    const dateVal = parts[0] * 10000 + parts[1] * 100 + parts[2];

    // Period 1: May 25, 1996 to Oct 25, 1996 (UTC+6:30)
    if (dateVal >= 19960525 && dateVal <= 19961025) {
      return {
        period: "1996_DST",
        offset: "UTC+6:30",
        offsetHours: 6.5,
        titleSi: "ඓතිහාසික වේලා සංශෝධනය (UTC+6:30)",
        titleEn: "Historical Clock Adjustment (UTC+6:30)",
        messageSi: "1996 මැයි 25 සිට ඔක්තෝබර් 25 දක්වා ශ්‍රී ලංකාවේ ඔරලෝසු වේලාව පැය 1ක් ඉදිරියට (UTC+6:30) තබා තිබුණි. කරුණාකර ඔබගේ උප්පැන්න සහතිකයේ ඇති වේලාව ඒ අයුරින්ම ඇතුළත් කරන්න. පද්ධතිය මඟින් එය නිරවද්‍ය තාරකා විද්‍යාත්මක වේලාවට ස්වයංක්‍රීයව ගලපා ගනු ලැබේ.",
        messageEn: "Between May 25, 1996 and Oct 25, 1996, Sri Lankan clocks were set to UTC+6:30 (+1 hour ahead). Please enter the time as recorded on your birth certificate; our calculation engine automatically applies the astronomical adjustment."
      };
    }

    // Period 2: Oct 26, 1996 to April 14, 2006 (UTC+6:00)
    if (dateVal >= 19961026 && dateVal <= 20060414) {
      return {
        period: "1996_2006_DST",
        offset: "UTC+6:00",
        offsetHours: 6.0,
        titleSi: "ඓතිහාසික වේලා සංශෝධනය (UTC+6:00)",
        titleEn: "Historical Clock Adjustment (UTC+6:00)",
        messageSi: "1996 ඔක්තෝබර් 26 සිට 2006 අප්‍රේල් 14 දක්වා ශ්‍රී ලංකාවේ සම්මත ඔරලෝසු වේලාව මිනිත්තු 30ක් ඉදිරියට (UTC+6:00) තබා තිබුණි. කරුණාකර උප්පැන්න සහතිකයේ ඇති වේලාව ඒ අයුරින්ම ඇතුළත් කරන්න. පද්ධතිය මඟින් එය නිරවද්‍ය තාරකා විද්‍යාත්මක වේලාවට ස්වයංක්‍රීයව ගලපා ගනු ලැබේ.",
        messageEn: "Between Oct 26, 1996 and Apr 14, 2006, Sri Lankan clocks were set to UTC+6:00 (+30 mins ahead). Please enter the time as recorded on your birth certificate; our calculation engine automatically applies the astronomical adjustment."
      };
    }
  } catch (e) {}

  return null;
}

export default function App() {
  const [lang, setLang] = useState<'sinhala' | 'english'>('sinhala');
  const [chartLang, setChartLang] = useState<'sinhala' | 'english'>('sinhala');
  
  // Form State
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("1995-05-15");
  const [birthTime, setBirthTime] = useState("10:30");
  const [birthPlace, setBirthPlace] = useState("");
  const [district, setDistrict] = useState("Colombo");
  const [gender, setGender] = useState("Male");
  const [pickerMode, setPickerMode] = useState<'dropdown' | 'calendar'>('dropdown');

  // Helper calculations for robust dropdown-based birthday and time selections
  const YEARS = Array.from({ length: 2026 - 1930 + 1 }, (_, i) => String(2026 - i));
  const MONTHS = [
    { value: "01", nameEn: "January", nameSi: "ජනවාරි (Jan)" },
    { value: "02", nameEn: "February", nameSi: "පෙබරවාරි (Feb)" },
    { value: "03", nameEn: "March", nameSi: "මාර්තු (Mar)" },
    { value: "04", nameEn: "April", nameSi: "අප්‍රේල් (Apr)" },
    { value: "05", nameEn: "May", nameSi: "මැයි (May)" },
    { value: "06", nameEn: "June", nameSi: "ජූනි (Jun)" },
    { value: "07", nameEn: "July", nameSi: "ජූලි (Jul)" },
    { value: "08", nameEn: "August", nameSi: "අගෝස්තු (Aug)" },
    { value: "09", nameEn: "September", nameSi: "සැප්තැම්බර් (Sep)" },
    { value: "10", nameEn: "October", nameSi: "ඔක්තෝබර් (Oct)" },
    { value: "11", nameEn: "November", nameSi: "නොවැම්බර් (Nov)" },
    { value: "12", nameEn: "December", nameSi: "දෙසැම්බර් (Dec)" },
  ];

  const getDaysInMonth = (year: string, month: string) => {
    const y = parseInt(year, 10) || 1995;
    const m = parseInt(month, 10) || 5;
    return new Date(y, m, 0).getDate();
  };

  const dateParts = birthDate.split("-");
  const currentYear = dateParts[0] || "1995";
  const currentMonth = dateParts[1] || "05";
  const currentDay = dateParts[2] || "15";

  const maxDays = getDaysInMonth(currentYear, currentMonth);
  const DAYS = Array.from({ length: maxDays }, (_, i) => String(i + 1).padStart(2, "0"));

  const timeParts = birthTime.split(":");
  const currentHour24 = parseInt(timeParts[0] || "10", 10);
  const currentMinStr = timeParts[1] || "30";
  
  const currentHour12 = currentHour24 % 12 === 0 ? 12 : currentHour24 % 12;
  const currentAmPm = currentHour24 >= 12 ? "PM" : "AM";

  const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  const handleYearChange = (year: string) => {
    const newMaxDays = getDaysInMonth(year, currentMonth);
    let day = currentDay;
    if (parseInt(currentDay, 10) > newMaxDays) {
      day = String(newMaxDays).padStart(2, "0");
    }
    setBirthDate(`${year}-${currentMonth}-${day}`);
  };

  const handleMonthChange = (month: string) => {
    const paddedMonth = month.padStart(2, "0");
    const newMaxDays = getDaysInMonth(currentYear, paddedMonth);
    let day = currentDay;
    if (parseInt(currentDay, 10) > newMaxDays) {
      day = String(newMaxDays).padStart(2, "0");
    }
    setBirthDate(`${currentYear}-${paddedMonth}-${day}`);
  };

  const handleDayChange = (day: string) => {
    const paddedDay = day.padStart(2, "0");
    setBirthDate(`${currentYear}-${currentMonth}-${paddedDay}`);
  };

  const updateTime = (h12: number, min: string, ampm: string) => {
    let h24 = h12;
    if (ampm === "PM" && h12 < 12) {
      h24 = h12 + 12;
    } else if (ampm === "AM" && h12 === 12) {
      h24 = 0;
    }
    const paddedHour = String(h24).padStart(2, "0");
    setBirthTime(`${paddedHour}:${min}`);
  };

  const handleHourChange = (hour12Str: string) => {
    const h12 = parseInt(hour12Str, 10);
    updateTime(h12, currentMinStr, currentAmPm);
  };

  const handleMinuteChange = (minStr: string) => {
    updateTime(currentHour12, minStr, currentAmPm);
  };

  const handleAmPmChange = (ampmVal: string) => {
    updateTime(currentHour12, currentMinStr, ampmVal);
  };

  // App Execution State
  const [loading, setLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [result, setResult] = useState<AstrologyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active prediction category state
  const [activeTab, setActiveTab] = useState<'general' | 'career' | 'wealth' | 'health' | 'marriage' | 'dasha'>('general');

  // Premium A4 PDF Report Specific States
  const [reportContactValue, setReportContactValue] = useState("");
  const [reportContactType, setReportContactType] = useState<'email' | 'whatsapp'>('email');
  const [showContactFormModal, setShowContactFormModal] = useState(false);
  const [contactFormError, setContactFormError] = useState("");
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [showReportPreviewModal, setShowReportPreviewModal] = useState(false);
  
  // Rating States
  const [userRating, setUserRating] = useState<number>(0);
  const [userComment, setUserComment] = useState("");
  const [ratingSubmittedUs, setRatingSubmittedUs] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [showRatingPopupModal, setShowRatingPopupModal] = useState(false);

  // Admin Dashboard Specific States
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return safeStorage.getItem("astro_admin_token", true) || safeStorage.getItem("astro_admin_token", false);
  });
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    const token = safeStorage.getItem("astro_admin_token", true) || safeStorage.getItem("astro_admin_token", false);
    const storedEmail = (safeStorage.getItem("astro_user_email", false) || safeStorage.getItem("astro_user_email", true) || "").toLowerCase().trim();
    if (storedEmail === "sampathub89@gmail.com") return true;
    if (!token) return false;
    return token.startsWith("secret_astro_token_sampathub89_") || token.startsWith("adm_");
  });
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");
  const [adminReports, setAdminReports] = useState<any[]>(() => {
    try {
      const cached = safeStorage.getItem("astro_cached_admin_reports", false);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [adminTotalCount, setAdminTotalCount] = useState<number>(0);
  const [isShowingAllReports, setIsShowingAllReports] = useState<boolean>(false);
  const isShowingAllReportsRef = React.useRef<boolean>(false);
  const isDateRangeActiveRef = React.useRef<boolean>(false);
  const adminStartDateRef = React.useRef<string>("");
  const adminEndDateRef = React.useRef<string>("");
  const adminReportsFetchReqIdRef = React.useRef<number>(0);
  const deletedReportIdsRef = React.useRef<Set<string>>(new Set<string>());

  // Resilient handler: never delete customer reports on temporary resource/network 404
  const removeOrphanReportFromState = React.useCallback((missingId: string) => {
    if (!missingId) return;
    console.warn("Report resource temporarily 404 or unavailable for ID:", missingId);
  }, []);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isLoadingAdminReports, setIsLoadingAdminReports] = useState(false);
  const [adminReportsError, setAdminReportsError] = useState("");
  const [activeChatLog, setActiveChatLog] = useState<any[] | null>(null);
  const [activeChatClientName, setActiveChatClientName] = useState<string>("");
  const [activeChatReport, setActiveChatReport] = useState<any | null>(null);
  const [isLoadingActiveChat, setIsLoadingActiveChat] = useState<boolean>(false);
  const [baseCost, setBaseCost] = useState<number>(1500);
  const [overheadPercentage, setOverheadPercentage] = useState<number>(10);
  const [showPriceCalculator, setShowPriceCalculator] = useState<boolean>(false);
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState(false);
  const [loginMode, setLoginMode] = useState<'google' | 'password'>('google');

  // Admin Search, Filter, Grouping & Copy States
  const [adminSearchTerm, setAdminSearchTerm] = useState<string>("");
  const [adminFilterCategory, setAdminFilterCategory] = useState<'all' | 'email' | 'whatsapp' | 'direct' | 'palmistry' | 'dehalakshana' | 'astrology' | 'rated'>('all');
  const [adminSortOrder, setAdminSortOrder] = useState<'newest' | 'oldest' | 'name' | 'rating' | 'ip'>('newest');
  const [adminGroupByMode, setAdminGroupByMode] = useState<'none' | 'contact' | 'ip'>('none');
  const [adminQuotaFilter, setAdminQuotaFilter] = useState<'all' | 'custom_only'>('all');
  const [adminQuotaSearch, setAdminQuotaSearch] = useState<string>("");
  const [copiedTextNotice, setCopiedTextNotice] = useState<string | null>(null);

  // Admin Date Range Filter & Database Summary Stats States
  const [adminStartDate, setAdminStartDate] = useState<string>("");
  const [adminEndDate, setAdminEndDate] = useState<string>("");
  const [isDateRangeActive, setIsDateRangeActive] = useState<boolean>(false);
  const [adminSummaryStats, setAdminSummaryStats] = useState<{
    total: number;
    email: number;
    whatsapp: number;
    direct: number;
    palmistry: number;
    dehalakshana: number;
    astrology: number;
    rated: number;
  } | null>(null);

  // Security & Database Access Audit Logs States
  const [showSecurityAuditLogs, setShowSecurityAuditLogs] = useState<boolean>(false);
  const [securityAuditLogs, setSecurityAuditLogs] = useState<any[]>([]);
  const [auditOtherCount, setAuditOtherCount] = useState<number>(0);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState<boolean>(false);
  const [auditLogsFilter, setAuditLogsFilter] = useState<'all' | 'unauthorized' | 'other_users' | 'primary_admin'>('all');
  const [auditSearchTerm, setAuditSearchTerm] = useState<string>("");

  const handleCopyText = (text: string) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopiedTextNotice(text);
      setTimeout(() => setCopiedTextNotice(null), 2000);
    } catch (err) {
      console.error("Clipboard copy error:", err);
    }
  };

  const handleOpenEmailClient = (email: string, clientName?: string) => {
    if (!email) return;
    const subject = encodeURIComponent(`Astrology Consultation Report - ${clientName || 'Client'}`);
    const body = encodeURIComponent(`Hello ${clientName || 'Valued Client'},\n\nThank you for reaching out regarding your horoscope report.\n\nBest regards,\nSampath Ubeywickrama\nAstrologer`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleOpenWhatsAppChat = (whatsappNum: string, clientName?: string) => {
    if (!whatsappNum) return;
    const cleanNum = whatsappNum.replace(/[^\d+]/g, '');
    const text = encodeURIComponent(`Hello ${clientName || ''}, regarding your astrology report consultation:`);
    window.open(`https://wa.me/${cleanNum}?text=${text}`, '_blank');
  };

  // General User States (For any other user logging in via Google)
  const [userToken, setUserToken] = useState<string | null>(() => safeStorage.getItem("astro_user_token", false));
  const [userEmail, setUserEmail] = useState<string | null>(() => safeStorage.getItem("astro_user_email", false));
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(() => {
    return !!safeStorage.getItem("astro_user_token", false) || !!safeStorage.getItem("astro_admin_token", false);
  });

  // Predictions Generation State
  const [isGeneratingPredictions, setIsGeneratingPredictions] = useState(false);
  const [predictContactError, setPredictContactError] = useState("");
  const [userReportLoadedMsg, setUserReportLoadedMsg] = useState("");
  const [showWelcomeFeedbackPopup, setShowWelcomeFeedbackPopup] = useState<boolean>(false);

  // Chat interface state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [showChatLimitModal, setShowChatLimitModal] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // User chat quota state
  const [userAllowedLimit, setUserAllowedLimit] = useState<number>(4);
  const [userBonusGranted, setUserBonusGranted] = useState<boolean>(false);
  const [userWhatsappForExtension, setUserWhatsappForExtension] = useState<string>("");
  const [extensionEmailInput, setExtensionEmailInput] = useState<string>("");
  const [isRequestingExtension, setIsRequestingExtension] = useState<boolean>(false);
  const [extensionStatusMsg, setExtensionStatusMsg] = useState<string>("");

  // Palmistry (හස්තරේඛා) States & Handlers
  const [selectedMainTab, setSelectedMainTab] = useState<'horoscope' | 'palmistry' | 'dehalakshana' | null>(null);
  const [showDehaLakshanaNotice, setShowDehaLakshanaNotice] = useState<boolean>(false);
  const [showPalmistryModal, setShowPalmistryModal] = useState(false);
  const [palmName, setPalmName] = useState("");
  const [palmBirthDate, setPalmBirthDate] = useState("");
  const [palmGender, setPalmGender] = useState("Male");
  const [palmHandChoice, setPalmHandChoice] = useState<"Right" | "Left">("Right");
  const [palmContactValue, setPalmContactValue] = useState("");
  const [palmImagePreview, setPalmImagePreview] = useState<string>("");
  const [palmImageBase64, setPalmImageBase64] = useState<string>("");
  const [palmFileError, setPalmFileError] = useState("");
  const [isAnalyzingPalm, setIsAnalyzingPalm] = useState(false);
  const [palmResult, setPalmResult] = useState<any>(null);
  const [savedPalmReportId, setSavedPalmReportId] = useState<string | null>(null);
  const [viewingAdminPalmReport, setViewingAdminPalmReport] = useState<any>(null);
  const [viewingAdminPhotoModal, setViewingAdminPhotoModal] = useState<{
    id: string;
    clientName: string;
    type: 'palm' | 'deha';
    photo?: string;
    loading: boolean;
    error?: string;
  } | null>(null);
  const [palmUserRating, setPalmUserRating] = useState<number>(0);
  const [palmUserComment, setPalmUserComment] = useState<string>("");
  const [palmRatingSubmitted, setPalmRatingSubmitted] = useState<boolean>(false);
  const [isSubmittingPalmRating, setIsSubmittingPalmRating] = useState<boolean>(false);

  // Dehalakshana (දේහලක්ෂණ) States & Handlers
  const [showDehalakshanaModal, setShowDehalakshanaModal] = useState<boolean>(false);
  const [dehaName, setDehaName] = useState<string>("");
  const [dehaBirthDate, setDehaBirthDate] = useState<string>("");
  const [dehaGender, setDehaGender] = useState<string>("Male");
  const [dehaContactValue, setDehaContactValue] = useState<string>("");
  const [dehaImagePreview, setDehaImagePreview] = useState<string>("");
  const [dehaImageBase64, setDehaImageBase64] = useState<string>("");
  const [dehaFileError, setDehaFileError] = useState<string>("");
  const [isAnalyzingDeha, setIsAnalyzingDeha] = useState<boolean>(false);
  const [dehaResult, setDehaResult] = useState<any>(null);
  const [savedDehaReportId, setSavedDehaReportId] = useState<string | null>(null);
  const [viewingAdminDehaReport, setViewingAdminDehaReport] = useState<any>(null);
  const [dehaUserRating, setDehaUserRating] = useState<number>(0);
  const [dehaUserComment, setDehaUserComment] = useState<string>("");
  const [dehaRatingSubmitted, setDehaRatingSubmitted] = useState<boolean>(false);
  const [isSubmittingDehaRating, setIsSubmittingDehaRating] = useState<boolean>(false);

  const [palmPickerMode, setPalmPickerMode] = useState<'dropdown' | 'calendar'>('dropdown');
  const [dehaPickerMode, setDehaPickerMode] = useState<'dropdown' | 'calendar'>('dropdown');

  const palmYMD = (() => {
    if (palmBirthDate && palmBirthDate.includes("-")) {
      const parts = palmBirthDate.split("-");
      return {
        year: parts[0] || "1995",
        month: parts[1] ? parts[1].padStart(2, "0") : "05",
        day: parts[2] ? parts[2].padStart(2, "0") : "15"
      };
    }
    return { year: "1995", month: "05", day: "15" };
  })();

  const handlePalmYearChange = (yr: string) => {
    const maxDays = getDaysInMonth(yr, palmYMD.month);
    let d = parseInt(palmYMD.day, 10) || 15;
    if (d > maxDays) d = maxDays;
    setPalmBirthDate(`${yr}-${palmYMD.month}-${String(d).padStart(2, "0")}`);
  };

  const handlePalmMonthChange = (mo: string) => {
    const paddedMo = mo.padStart(2, "0");
    const maxDays = getDaysInMonth(palmYMD.year, paddedMo);
    let d = parseInt(palmYMD.day, 10) || 15;
    if (d > maxDays) d = maxDays;
    setPalmBirthDate(`${palmYMD.year}-${paddedMo}-${String(d).padStart(2, "0")}`);
  };

  const handlePalmDayChange = (dy: string) => {
    const paddedDy = dy.padStart(2, "0");
    setPalmBirthDate(`${palmYMD.year}-${palmYMD.month}-${paddedDy}`);
  };

  const dehaYMD = (() => {
    if (dehaBirthDate && dehaBirthDate.includes("-")) {
      const parts = dehaBirthDate.split("-");
      return {
        year: parts[0] || "1995",
        month: parts[1] ? parts[1].padStart(2, "0") : "05",
        day: parts[2] ? parts[2].padStart(2, "0") : "15"
      };
    }
    return { year: "1995", month: "05", day: "15" };
  })();

  const handleDehaYearChange = (yr: string) => {
    const maxDays = getDaysInMonth(yr, dehaYMD.month);
    let d = parseInt(dehaYMD.day, 10) || 15;
    if (d > maxDays) d = maxDays;
    setDehaBirthDate(`${yr}-${dehaYMD.month}-${String(d).padStart(2, "0")}`);
  };

  const handleDehaMonthChange = (mo: string) => {
    const paddedMo = mo.padStart(2, "0");
    const maxDays = getDaysInMonth(dehaYMD.year, paddedMo);
    let d = parseInt(dehaYMD.day, 10) || 15;
    if (d > maxDays) d = maxDays;
    setDehaBirthDate(`${dehaYMD.year}-${paddedMo}-${String(d).padStart(2, "0")}`);
  };

  const handleDehaDayChange = (dy: string) => {
    const paddedDy = dy.padStart(2, "0");
    setDehaBirthDate(`${dehaYMD.year}-${dehaYMD.month}-${paddedDy}`);
  };

  const isPalmistryRep = (rep: any) => !!(rep && (rep.reportType === 'palmistry' || !!rep.palmistryData || !!rep.hasPalmImage));
  const isDehalakshanaRep = (rep: any) => !!(rep && (rep.reportType === 'dehalakshana' || rep.reportType === 'deha' || !!rep.dehalakshanaData || !!rep.hasDehaImage));

  const formatImageSrc = (img?: string): string => {
    if (!img) return "";
    if (img.startsWith("data:") || img.startsWith("http:") || img.startsWith("https:") || img.startsWith("blob:")) {
      return img;
    }
    if (img.startsWith("AAAAGGZ0eXBoZWlj") || img.startsWith("AAAAHGZ0eXBoZWlj")) {
      return `data:image/heic;base64,${img}`;
    }
    if (img.startsWith("iVBORw0KGgo")) {
      return `data:image/png;base64,${img}`;
    }
    return `data:image/jpeg;base64,${img}`;
  };

  const openImageInNewTab = (base64Data: string, existingWin?: Window | null) => {
    if (!base64Data) {
      if (existingWin) {
        try { existingWin.close(); } catch (e) {}
      }
      return;
    }

    const formattedData = formatImageSrc(base64Data);

    // Convert base64 data to Blob URL so modern browsers open it natively without cross-origin/COOP script restrictions
    try {
      if (formattedData.startsWith('data:')) {
        const parts = formattedData.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const byteCharacters = atob(parts[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        const newWin = window.open(blobUrl, "_blank", "noopener,noreferrer");
        if (newWin) {
          return;
        }
      }
    } catch (blobErr) {
      console.warn("Direct blob open in new tab was not possible:", blobErr);
    }

    // Fallback: If window.open was blocked or failed, open in the built-in modal viewer
    setViewingAdminPhotoModal({
      id: "preview_photo",
      clientName: "Customer Photo",
      type: "palm",
      photo: formattedData,
      loading: false
    });
  };

  const getAdminAuthHeaders = () => {
    let token = adminToken || safeStorage.getItem("astro_admin_token", true) || safeStorage.getItem("astro_admin_token", false);
    const currentEmail = (userEmail || safeStorage.getItem("astro_user_email", false) || "").toLowerCase().trim();
    if (!token && (currentEmail === "sampathub89@gmail.com" || isAdminLoggedIn)) {
      token = "admin_auto_authorized_sampathub89@gmail.com";
    }
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }
    if (currentEmail) {
      headers["X-User-Email"] = currentEmail;
    }
    return headers;
  };

  const handleViewAdminPalmReading = async (rep: any) => {
    if (!rep) return;
    setViewingAdminPalmReport(rep);
    try {
      const headers = getAdminAuthHeaders();
      if ((!rep.palmistryData?.lifeLine || !rep.palmImageBase64) && rep.id) {
        const res = await fetch(getApiUrl(`/api/admin/reports/${rep.id}`), {
          headers
        });
        if (res.ok) {
          const data = await safeParseJson(res);
          if (data && data.success && data.report) {
            setViewingAdminPalmReport(data.report);
            return;
          }
        }
      }
      if (!rep.palmImageBase64 && !rep.storedImage && !rep.imageBase64 && rep.id) {
        const res = await fetch(getApiUrl(`/api/admin/reports/${rep.id}/photo`), {
          headers
        });
        if (res.ok) {
          const data = await safeParseJson(res);
          if (data && data.success && data.photo) {
            setViewingAdminPalmReport((prev: any) => prev ? { ...prev, palmImageBase64: data.photo } : prev);
          }
        }
      }
    } catch (e) {
      console.warn("Notice in handleViewAdminPalmReading:", e);
    }
  };

  const handleOpenAdminPalmPhoto = async (rep: any) => {
    if (!rep) return;
    const localPhoto = rep.palmImageBase64 || rep.storedImage || rep.imageBase64 || rep.image || rep.photo || (rep.palmistryData && (rep.palmistryData.palmImageBase64 || rep.palmistryData.imageBase64 || rep.palmistryData.storedImage));
    if (localPhoto) {
      setViewingAdminPhotoModal({
        id: rep.id,
        clientName: rep.birthDetails?.name || "Client",
        type: 'palm',
        photo: localPhoto,
        loading: false
      });
      return;
    }

    setViewingAdminPhotoModal({
      id: rep.id,
      clientName: rep.birthDetails?.name || "Client",
      type: 'palm',
      loading: true
    });

    try {
      const headers = getAdminAuthHeaders();
      const res = await fetch(getApiUrl(`/api/admin/reports/${rep.id}/photo`), {
        headers
      });
      if (res.status === 404) {
        // Fallback: check if the whole report is missing or just the photo
        const reportRes = await fetch(getApiUrl(`/api/admin/reports/${rep.id}`), {
          headers
        });
        if (reportRes.status === 404) {
          setViewingAdminPhotoModal({
            id: rep.id,
            clientName: rep.birthDetails?.name || "Client",
            type: 'palm',
            loading: false,
            error: lang === 'sinhala' ? "මෙම පරීක්ෂාව සඳහා ඡායාරූපයක් දත්තගබඩාවේ සුරැකී නොමැත." : "No photo found in database for this reading."
          });
          return;
        }
        const reportData = await safeParseJson(reportRes);
        const fallbackImg = reportData?.report?.palmImageBase64 || 
                            reportData?.report?.storedImage || 
                            reportData?.report?.imageBase64 || 
                            reportData?.report?.image ||
                            (reportData?.report?.palmistryData && (reportData.report.palmistryData.palmImageBase64 || reportData.report.palmistryData.imageBase64));
        if (fallbackImg) {
          setViewingAdminPhotoModal({
            id: rep.id,
            clientName: reportData?.report?.birthDetails?.name || rep.birthDetails?.name || "Client",
            type: 'palm',
            photo: fallbackImg,
            loading: false
          });
          setViewingAdminPalmReport((prev: any) => prev && prev.id === rep.id ? { ...prev, palmImageBase64: fallbackImg } : prev);
        } else {
          setViewingAdminPhotoModal({
            id: rep.id,
            clientName: rep.birthDetails?.name || "Client",
            type: 'palm',
            loading: false,
            error: lang === 'sinhala' ? "මෙම පරීක්ෂාව සඳහා ඡායාරූපයක් දත්තගබඩාවේ සුරැකී නොමැත." : "No photo found in database for this reading."
          });
        }
        return;
      }

      const data = await safeParseJson(res);
      if (data && data.success && data.photo) {
        setViewingAdminPhotoModal({
          id: rep.id,
          clientName: data.clientName || rep.birthDetails?.name || "Client",
          type: 'palm',
          photo: data.photo,
          loading: false
        });
        // Cache photo onto report in state
        setViewingAdminPalmReport((prev: any) => prev && prev.id === rep.id ? { ...prev, palmImageBase64: data.photo } : prev);
      } else {
        setViewingAdminPhotoModal({
          id: rep.id,
          clientName: rep.birthDetails?.name || "Client",
          type: 'palm',
          loading: false,
          error: data?.error || (lang === 'sinhala' ? "මෙම පරීක්ෂාව සඳහා ඡායාරූපයක් දත්තගබඩාවේ සුරැකී නොමැත." : "No photo found in database for this reading.")
        });
      }
    } catch (err) {
      console.error("Error fetching palm photo:", err);
      setViewingAdminPhotoModal({
        id: rep.id,
        clientName: rep.birthDetails?.name || "Client",
        type: 'palm',
        loading: false,
        error: lang === 'sinhala' ? "ඡායාරූපය ලබාගැනීමේදී දෝෂයක් සිදුවිය." : "Failed to load photo."
      });
    }
  };

  const handleViewAdminDehaReading = async (rep: any) => {
    if (!rep) return;
    setViewingAdminDehaReport(rep);
    try {
      const headers = getAdminAuthHeaders();
      if ((!rep.dehalakshanaData?.facialFeatures || !rep.dehalakshanaImageBase64) && rep.id) {
        const res = await fetch(getApiUrl(`/api/admin/reports/${rep.id}`), {
          headers
        });
        if (res.ok) {
          const data = await safeParseJson(res);
          if (data && data.success && data.report) {
            setViewingAdminDehaReport(data.report);
            return;
          }
        }
      }
      if (!rep.dehalakshanaImageBase64 && !rep.storedImage && !rep.imageBase64 && rep.id) {
        const res = await fetch(getApiUrl(`/api/admin/reports/${rep.id}/photo`), {
          headers
        });
        if (res.ok) {
          const data = await safeParseJson(res);
          if (data && data.success && data.photo) {
            setViewingAdminDehaReport((prev: any) => prev ? { ...prev, dehalakshanaImageBase64: data.photo } : prev);
          }
        }
      }
    } catch (e) {
      console.warn("Notice in handleViewAdminDehaReading:", e);
    }
  };

  const handleOpenAdminDehaPhoto = async (rep: any) => {
    if (!rep) return;
    const localPhoto = rep.dehalakshanaImageBase64 || rep.storedImage || rep.imageBase64 || rep.image || rep.photo || (rep.dehalakshanaData && (rep.dehalakshanaData.dehalakshanaImageBase64 || rep.dehalakshanaData.imageBase64 || rep.dehalakshanaData.storedImage));
    if (localPhoto) {
      setViewingAdminPhotoModal({
        id: rep.id,
        clientName: rep.birthDetails?.name || "Client",
        type: 'deha',
        photo: localPhoto,
        loading: false
      });
      return;
    }

    setViewingAdminPhotoModal({
      id: rep.id,
      clientName: rep.birthDetails?.name || "Client",
      type: 'deha',
      loading: true
    });

    try {
      const headers = getAdminAuthHeaders();
      const res = await fetch(getApiUrl(`/api/admin/reports/${rep.id}/photo`), {
        headers
      });
      if (res.status === 404) {
        // Fallback: check if report is 404 or just photo is missing
        const reportRes = await fetch(getApiUrl(`/api/admin/reports/${rep.id}`), {
          headers
        });
        if (reportRes.status === 404) {
          setViewingAdminPhotoModal({
            id: rep.id,
            clientName: rep.birthDetails?.name || "Client",
            type: 'deha',
            loading: false,
            error: lang === 'sinhala' ? "මෙම පරීක්ෂාව සඳහා ඡායාරූපයක් දත්තගබඩාවේ සුරැකී නොමැත." : "No photo found in database for this reading."
          });
          return;
        }
        const reportData = await safeParseJson(reportRes);
        const fallbackImg = reportData?.report?.dehalakshanaImageBase64 || 
                            reportData?.report?.storedImage || 
                            reportData?.report?.imageBase64 || 
                            reportData?.report?.image ||
                            (reportData?.report?.dehalakshanaData && (reportData.report.dehalakshanaData.dehalakshanaImageBase64 || reportData.report.dehalakshanaData.imageBase64));
        if (fallbackImg) {
          setViewingAdminPhotoModal({
            id: rep.id,
            clientName: reportData?.report?.birthDetails?.name || rep.birthDetails?.name || "Client",
            type: 'deha',
            photo: fallbackImg,
            loading: false
          });
          setViewingAdminDehaReport((prev: any) => prev && prev.id === rep.id ? { ...prev, dehalakshanaImageBase64: fallbackImg } : prev);
        } else {
          setViewingAdminPhotoModal({
            id: rep.id,
            clientName: rep.birthDetails?.name || "Client",
            type: 'deha',
            loading: false,
            error: lang === 'sinhala' ? "මෙම පරීක්ෂාව සඳහා ඡායාරූපයක් දත්තගබඩාවේ සුරැකී නොමැත." : "No photo found in database for this reading."
          });
        }
        return;
      }

      const data = await safeParseJson(res);
      if (data && data.success && data.photo) {
        setViewingAdminPhotoModal({
          id: rep.id,
          clientName: data.clientName || rep.birthDetails?.name || "Client",
          type: 'deha',
          photo: data.photo,
          loading: false
        });
        setViewingAdminDehaReport((prev: any) => prev && prev.id === rep.id ? { ...prev, dehalakshanaImageBase64: data.photo } : prev);
      } else {
        setViewingAdminPhotoModal({
          id: rep.id,
          clientName: rep.birthDetails?.name || "Client",
          type: 'deha',
          loading: false,
          error: data?.error || (lang === 'sinhala' ? "මෙම පරීක්ෂාව සඳහා ඡායාරූපයක් දත්තගබඩාවේ සුරැකී නොමැත." : "No photo found in database for this reading.")
        });
      }
    } catch (err) {
      console.error("Error fetching deha photo:", err);
      setViewingAdminPhotoModal({
        id: rep.id,
        clientName: rep.birthDetails?.name || "Client",
        type: 'deha',
        loading: false,
        error: lang === 'sinhala' ? "ඡායාරූපය ලබාගැනීමේදී දෝෂයක් සිදුවිය." : "Failed to load photo."
      });
    }
  };

  const handleOpenAdminChat = async (rep: any) => {
    if (!rep) return;
    const clientName = rep.birthDetails?.name || "Anonymous Client";
    setActiveChatClientName(clientName);
    setActiveChatReport(rep);

    // Immediately show existing cached chat messages from memory if available
    const initialChat = Array.isArray(rep.chatHistory) ? rep.chatHistory : [];
    setActiveChatLog(initialChat);
    setIsLoadingActiveChat(true);

    try {
      let token = adminToken || safeStorage.getItem("astro_admin_token", true) || safeStorage.getItem("astro_admin_token", false);
      const currentEmail = (userEmail || safeStorage.getItem("astro_user_email", false) || "").toLowerCase().trim();
      if (!token && currentEmail === "sampathub89@gmail.com") {
        token = "admin_auto_authorized_" + currentEmail;
      }

      // Fetch the full un-truncated chat history directly from dedicated database endpoint
      const res = await fetch(getApiUrl(`/api/admin/reports/${rep.id}/chat`), {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
          "X-User-Email": currentEmail
        }
      });
      if (res.status === 404) {
        setIsLoadingActiveChat(false);
        return;
      }
      const data = await safeParseJson(res);
      if (data && data.success && Array.isArray(data.chatHistory)) {
        setActiveChatLog(data.chatHistory);
        setAdminReports((prev) =>
          prev.map((r) => (r && r.id === rep.id ? { ...r, chatHistory: data.chatHistory } : r))
        );
      } else {
        // Fallback: fetch full report
        const fullRes = await fetch(getApiUrl(`/api/admin/reports/${rep.id}`), {
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
            "X-User-Email": currentEmail
          }
        });
        if (fullRes.status === 404) {
          setIsLoadingActiveChat(false);
          return;
        }
        const fullData = await safeParseJson(fullRes);
        if (fullData && fullData.success && fullData.report && Array.isArray(fullData.report.chatHistory)) {
          setActiveChatLog(fullData.report.chatHistory);
          setAdminReports((prev) =>
            prev.map((r) => (r && r.id === rep.id ? { ...r, chatHistory: fullData.report.chatHistory } : r))
          );
        }
      }
    } catch (err) {
      console.error("Error loading complete chat logs:", err);
    } finally {
      setIsLoadingActiveChat(false);
    }
  };

  const handleDehaImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setDehaFileError(
        lang === 'sinhala'
          ? "ඡායාරූපයේ ප්‍රමාණය 25MB සීමාවට වඩා වැඩිය. කරුණාකර කුඩා ප්‍රමාණයේ ඡායාරූපයක් තෝරන්න."
          : "File size exceeds 25MB limit. Please choose a smaller photo."
      );
      return;
    }

    setDehaFileError("");
    const reader = new FileReader();
    reader.onloadend = () => {
      const rawBase64 = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.75);
          setDehaImagePreview(compressed);
          setDehaImageBase64(compressed);
        } else {
          setDehaImagePreview(rawBase64);
          setDehaImageBase64(rawBase64);
        }
      };
      img.onerror = () => {
        setDehaImagePreview(rawBase64);
        setDehaImageBase64(rawBase64);
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeDehalakshana = async () => {
    const effectiveName = (dehaName || name || "").trim();
    if (!effectiveName) {
      setDehaFileError(
        lang === 'sinhala'
          ? "දේහලක්ෂණ පලාපල ලබාගැනීමට කරුණාකර ඔබගේ නම ඇතුළත් කරන්න."
          : "Please enter your name to get your Dehalakshana reading."
      );
      return;
    }

    if (!dehaImageBase64) {
      setDehaFileError(
        lang === 'sinhala'
          ? "කරුණාකර ඔබගේ මුහුණ, ගෙල සහ උරහිස් පැහැදිලිව පෙනෙන ඡායාරූපයක් එක් කරන්න."
          : "Please upload a clear photo showing your face, neck, and shoulders."
      );
      return;
    }

    setIsAnalyzingDeha(true);
    setDehaFileError("");
    setDehaUserRating(0);
    setDehaUserComment("");
    setDehaRatingSubmitted(false);

    try {
      const effectiveBirthDate = dehaBirthDate || birthDate || "";
      const currentEmail = userEmail || safeStorage.getItem("astro_user_email", false) || "";
      const res = await fetch(getApiUrl("/api/astrology/dehalakshana"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: dehaImageBase64,
          name: effectiveName,
          birthDate: effectiveBirthDate,
          gender: dehaGender || gender || "Male",
          whatsappNumber: dehaContactValue || "",
          userEmail: dehaContactValue || currentEmail || "",
          language: lang
        })
      });

      if (!res.ok) {
        const errData = await safeParseJson(res);
        throw new Error(errData?.error || "Failed to analyze face and physical features.");
      }

      const data = await safeParseJson(res);
      setDehaResult(data.report.dehalakshanaData);
      setSavedDehaReportId(data.reportId);
      if (isAdminLoggedIn) {
        fetchAdminReports();
      }
    } catch (err: any) {
      console.error("Dehalakshana request error:", err);
      setDehaFileError(
        err.message || (lang === 'sinhala'
          ? "දේහලක්ෂණ පරීක්ෂාවේදී දෝෂයක් සිදු විය. කරුණාකර නැවත උත්සාහ කරන්න."
          : "An error occurred during feature analysis. Please try again.")
      );
    } finally {
      setIsAnalyzingDeha(false);
    }
  };

  const handleClearDehaData = () => {
    setDehaResult(null);
    setDehaImagePreview("");
    setDehaImageBase64("");
    setDehaName("");
    setDehaBirthDate("");
    setDehaGender("Male");
    setDehaContactValue("");
    setDehaFileError("");
    setSavedDehaReportId(null);
    setDehaUserRating(0);
    setDehaUserComment("");
    setDehaRatingSubmitted(false);
  };

  const handleClearPalmData = () => {
    setPalmResult(null);
    setPalmImagePreview("");
    setPalmImageBase64("");
    setPalmName("");
    setPalmContactValue("");
    setPalmFileError("");
    setSavedPalmReportId(null);
    setPalmUserRating(0);
    setPalmUserComment("");
    setPalmRatingSubmitted(false);
  };

  const handlePalmFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeBytes = 25 * 1024 * 1024; // Allow up to 25MB raw file since client will compress
    if (file.size > maxSizeBytes) {
      setPalmFileError(
        lang === 'sinhala'
          ? "ඡායාරූපයේ ප්‍රමාණය ඉතා විශාලයි (25MB ට වැඩියි). කරුණාකර කුඩා ඡායාරූපයක් එක් කරන්න."
          : "Photo size is too large (over 25MB). Please upload a smaller image file."
      );
      setPalmImageBase64("");
      setPalmImagePreview("");
      return;
    }

    setPalmFileError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawBase64 = event.target?.result as string;
      
      // Compress and scale image down via Canvas to max 1600px dimension
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1000;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
          setPalmImagePreview(compressedDataUrl);
          setPalmImageBase64(compressedDataUrl);
        } else {
          setPalmImagePreview(rawBase64);
          setPalmImageBase64(rawBase64);
        }
      };
      img.onerror = () => {
        setPalmImagePreview(rawBase64);
        setPalmImageBase64(rawBase64);
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzePalm = async () => {
    if (!palmName.trim()) {
      setPalmFileError(
        lang === 'sinhala'
          ? "හස්තරේඛා පලාපල ලබාගැනීමට කරුණාකර ඔබගේ නම ඇතුළත් කරන්න."
          : "Please enter your name to get your palmistry reading."
      );
      return;
    }

    if (!palmContactValue.trim()) {
      setPalmFileError(
        lang === 'sinhala'
          ? "නොමිලේ හස්තරේඛා පලාපල ලබාගැනීමට කරුණාකර ඔබගේ WhatsApp දුරකථන අංකය (උදා: 0771234567) ඇතුළත් කරන්න."
          : "Please enter your WhatsApp phone number (e.g., 0771234567) to get your free palmistry reading."
      );
      return;
    }

    if (!palmImageBase64) {
      setPalmFileError(
        lang === 'sinhala'
          ? "කරුණාකර ඔබගේ අත්ලෙහි පැහැදිලි ඡායාරූපයක් එක් කරන්න."
          : "Please upload a clear photo of your palm."
      );
      return;
    }

    setIsAnalyzingPalm(true);
    setPalmFileError("");
    setPalmUserRating(0);
    setPalmUserComment("");
    setPalmRatingSubmitted(false);

    try {
      const currentEmail = userEmail || safeStorage.getItem("astro_user_email", false) || "";
      const res = await fetch(getApiUrl("/api/astrology/palmistry"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: palmImageBase64,
          name: palmName || name || "Anonymous",
          birthDate: palmBirthDate || "",
          gender: palmGender || gender || "Male",
          handChoice: palmHandChoice,
          whatsappNumber: palmContactValue,
          userEmail: palmContactValue || currentEmail || "",
          language: lang
        })
      });

      if (!res.ok) {
        const errData = await safeParseJson(res);
        throw new Error(errData?.error || "Failed to analyze palm image.");
      }

      const data = await safeParseJson(res);
      setPalmResult(data.report.palmistryData);
      setSavedPalmReportId(data.reportId);
      if (isAdminLoggedIn) {
        fetchAdminReports();
      }
    } catch (err: any) {
      console.error("Palmistry request error:", err);
      setPalmFileError(
        err.message || (lang === 'sinhala'
          ? "හස්තරේඛා පරීක්ෂාවේදී දෝෂයක් සිදු විය. කරුණාකර නැවත උත්සාහ කරන්න."
          : "An error occurred during palm analysis. Please try again.")
      );
    } finally {
      setIsAnalyzingPalm(false);
    }
  };

  const handleSubmitPalmRating = async () => {
    if (!savedPalmReportId || palmUserRating === 0) return;
    setIsSubmittingPalmRating(true);
    try {
      await fetch(getApiUrl("/api/reports/rate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: savedPalmReportId,
          rating: palmUserRating,
          comment: palmUserComment
        })
      });
      setPalmRatingSubmitted(true);
      if (isAdminLoggedIn) {
        fetchAdminReports();
      }
    } catch (err) {
      console.error("Error submitting palm rating:", err);
    } finally {
      setIsSubmittingPalmRating(false);
    }
  };

  const handleSubmitDehaRating = async () => {
    if (!savedDehaReportId || dehaUserRating === 0) return;
    setIsSubmittingDehaRating(true);
    try {
      await fetch(getApiUrl("/api/reports/rate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: savedDehaReportId,
          rating: dehaUserRating,
          comment: dehaUserComment
        })
      });
      setDehaRatingSubmitted(true);
      if (isAdminLoggedIn) {
        fetchAdminReports();
      }
    } catch (err) {
      console.error("Error submitting deha rating:", err);
    } finally {
      setIsSubmittingDehaRating(false);
    }
  };

  // Admin chat quota manager state
  const [adminChatQuotas, setAdminChatQuotas] = useState<any[]>([]);
  const [isLoadingAdminChatQuotas, setIsLoadingAdminChatQuotas] = useState<boolean>(false);
  const [showChatQuotaManager, setShowChatQuotaManager] = useState<boolean>(false);
  const [customQuotaEmail, setCustomQuotaEmail] = useState<string>("");
  const [customQuotaLimitInput, setCustomQuotaLimitInput] = useState<string>("15");
  const [customQuotaMsg, setCustomQuotaMsg] = useState<string>("");
  const [chatModalCustomInput, setChatModalCustomInput] = useState<string>("");

  const fetchUserChatQuota = async (emailToFetch?: string, reportIdToFetch?: string, contactToFetch?: string) => {
    const em = (emailToFetch || userEmail || (result?.birthDetails?.contactValue?.includes('@') ? result.birthDetails.contactValue : '') || safeStorage.getItem("astro_user_email", false) || '').toLowerCase().trim();
    const repId = reportIdToFetch || savedReportId || "";
    const contact = (contactToFetch || reportContactValue || result?.birthDetails?.contactValue || '').trim();

    if (!em && !repId && !contact) return null;

    try {
      const params = new URLSearchParams();
      if (em) params.set("email", em);
      if (repId) params.set("reportId", repId);
      if (contact) params.set("contact", contact);
      params.set("ts", String(Date.now()));

      const res = await fetch(getApiUrl(`/api/user/chat-quota?${params.toString()}`), {
        headers: { "Cache-Control": "no-cache" }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.allowedLimit !== undefined && data.allowedLimit !== null && !isNaN(Number(data.allowedLimit))) {
          setUserAllowedLimit(Number(data.allowedLimit));
        }
        if (data.bonusGranted !== undefined) {
          setUserBonusGranted(Boolean(data.bonusGranted));
        }
        if (data.whatsappNumber && !userWhatsappForExtension) {
          setUserWhatsappForExtension(data.whatsappNumber);
        }
        return data;
      }
    } catch (err) {
      console.warn("Error fetching chat quota:", err);
    }
    return null;
  };

  useEffect(() => {
    const em = userEmail || (result?.birthDetails?.contactValue?.includes('@') ? result.birthDetails.contactValue : '');
    const contact = reportContactValue || result?.birthDetails?.contactValue;
    const repId = savedReportId;
    if (em || contact || repId) {
      fetchUserChatQuota(em, repId, contact);
    }
  }, [userEmail, result?.birthDetails?.contactValue, reportContactValue, savedReportId]);

  const handleRequestChatExtension = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const em = (extensionEmailInput || userEmail || (result?.birthDetails?.contactValue?.includes('@') ? result.birthDetails.contactValue : '') || (isAdminLoggedIn ? 'sampathub89@gmail.com' : '')).toLowerCase().trim();
    const contact = (userWhatsappForExtension || reportContactValue || result?.birthDetails?.contactValue || '').trim();

    if (!em && !contact) {
      setExtensionStatusMsg(lang === 'sinhala' ? "කරුණාකර ඔබගේ Email ලිපිනය හෝ WhatsApp අංකය ඇතුලත් කරන්න." : "Please enter your Email address or WhatsApp number.");
      return;
    }

    setIsRequestingExtension(true);
    setExtensionStatusMsg("");

    try {
      const res = await fetch(getApiUrl("/api/user/request-chat-extension"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: em,
          whatsappNumber: contact,
          reportId: savedReportId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (em) {
          setUserEmail(em);
          safeStorage.setItem("astro_user_email", em, false);
        }
        setUserAllowedLimit(data.allowedLimit || 10);
        setUserBonusGranted(true);
        setExtensionStatusMsg(lang === 'sinhala' 
          ? "සාර්ථකයි! ඔබගේ නොමිලේ AI ප්‍රශ්න සීමාව 10 දක්වා වැඩි කරන ලදී." 
          : "Success! Your AI questions limit has been extended to 10!");

        const mailSubject = encodeURIComponent("Astrology AI Chat Limit Extension Request (+6 Bonus)");
        const mailBody = encodeURIComponent(`Hello Admin,\n\nI am requesting a chat limit extension for my Astrology report.\n\nMy Email: ${em || "Not provided"}\nMy WhatsApp Mobile: ${contact || "Not provided"}\nReport ID: ${savedReportId || "N/A"}\n\nThank you!`);
        window.open(`mailto:sampathub89@gmail.com?subject=${mailSubject}&body=${mailBody}`, '_blank');
      } else {
        setExtensionStatusMsg(data.error || "Failed to request extension.");
      }
    } catch (err: any) {
      setExtensionStatusMsg(err.message || "Communication error.");
    } finally {
      setIsRequestingExtension(false);
    }
  };

  const fetchAdminChatQuotas = async () => {
    if (!adminToken) return;
    setIsLoadingAdminChatQuotas(true);
    try {
      const res = await fetch(getApiUrl(`/api/admin/chat-quotas?token=${encodeURIComponent(adminToken)}`), {
        headers: { "Authorization": `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.quotas) {
          setAdminChatQuotas(data.quotas);
        }
      }
    } catch (err) {
      console.error("Error fetching admin chat quotas:", err);
    } finally {
      setIsLoadingAdminChatQuotas(false);
    }
  };

  const handleSetCustomChatLimit = async (
    e?: React.FormEvent, 
    targetEmail?: string, 
    limitValue?: number,
    targetReportId?: string,
    targetContact?: string
  ) => {
    if (e) e.preventDefault();
    const emToSet = (targetEmail || customQuotaEmail || "").trim();
    const parsedInput = parseInt(customQuotaLimitInput, 10);
    const limitToSet = limitValue !== undefined ? Math.max(0, limitValue) : (!isNaN(parsedInput) ? Math.max(0, parsedInput) : 10);

    if ((!emToSet && !targetReportId && !targetContact) || !adminToken) return;
    setCustomQuotaMsg("");
    try {
      const res = await fetch(getApiUrl("/api/admin/set-chat-limit"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          adminToken,
          userEmail: emToSet,
          reportId: targetReportId,
          contactValue: targetContact,
          customLimit: limitToSet
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomQuotaMsg(`සාර්ථකයි! ප්‍රශ්න සීමාව ${data.allowedLimit} දක්වා සකසන ලදී. (Limit set to ${data.allowedLimit})`);
        setTimeout(() => setCustomQuotaMsg(""), 4500);
        fetchAdminChatQuotas();

        // Update local reports state
        setAdminReports((prev) => prev.map((r: any) => {
          const matchesReport = targetReportId && r.id === targetReportId;
          const matchesEmail = emToSet && (
            (r.userEmail && r.userEmail.toLowerCase() === emToSet.toLowerCase()) ||
            (r.contactValue && r.contactValue.toLowerCase() === emToSet.toLowerCase()) ||
            (r.birthDetails?.userEmail && r.birthDetails.userEmail.toLowerCase() === emToSet.toLowerCase())
          );
          if (matchesReport || matchesEmail) {
            return { ...r, customChatLimit: limitToSet, allowedLimit: limitToSet };
          }
          return r;
        }));

        if (activeChatReport) {
          const isTargetRep = activeChatReport.id === targetReportId || activeChatReport.reportId === targetReportId;
          const isTargetEm = emToSet && (
            activeChatReport.userEmail === emToSet || 
            activeChatReport.contactValue === emToSet || 
            activeChatReport.birthDetails?.userEmail === emToSet
          );
          if (isTargetRep || isTargetEm) {
            setActiveChatReport((prev: any) => prev ? { ...prev, customChatLimit: limitToSet, allowedLimit: limitToSet } : prev);
          }
        }
        setUserAllowedLimit(Number(data.allowedLimit));
      } else {
        setCustomQuotaMsg(data.error || "Failed to update custom limit.");
        setTimeout(() => setCustomQuotaMsg(""), 5000);
      }
    } catch (err: any) {
      setCustomQuotaMsg(err.message || "Error updating limit.");
      setTimeout(() => setCustomQuotaMsg(""), 5000);
    }
  };

  const handleClearData = () => {
    setName("");
    setBirthDate("1995-05-15");
    setBirthTime("10:30");
    setBirthPlace("");
    setDistrict("Colombo");
    setGender("Male");
    setResult(null);
    setError(null);
    setReportContactValue("");
    setSavedReportId(null);
    setUserRating(0);
    setUserComment("");
    setRatingSubmittedUs(false);
    setIsGeneratingPredictions(false);
    setPredictContactError("");
  };

  // Database Connection Diagnostic States
  const [dbStatus, setDbStatus] = useState<string>("checking");
  const [dbMessage, setDbMessage] = useState<string>("");

  const checkDbStatus = async (tokenOverride?: string) => {
    const token = tokenOverride || adminToken;
    if (!token) return;
    try {
      const response = await fetch(getApiUrl("/api/admin/db-status"), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      setDbStatus(data.status || "error");
      setDbMessage(data.message || "");
    } catch (err) {
      console.error("DB status fetch error:", err);
      setDbStatus("error");
      setDbMessage("Could not check database connectivity.");
    }
  };

  const fetchSecurityAuditLogs = async (tokenOverride?: string) => {
    const token = tokenOverride || adminToken || safeStorage.getItem("astro_admin_token", true) || safeStorage.getItem("astro_admin_token", false);
    if (!token) return;
    setIsLoadingAuditLogs(true);
    try {
      const res = await fetch(getApiUrl(`/api/admin/security-audit-logs?ts=${Date.now()}`), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.success && Array.isArray(data.logs)) {
        setSecurityAuditLogs(data.logs);
        setAuditOtherCount(data.otherUserAccessCount || 0);
      }
    } catch (err) {
      console.error("Error fetching security audit logs:", err);
    } finally {
      setIsLoadingAuditLogs(false);
    }
  };

  const handleClearAuditLogs = async () => {
    if (!window.confirm("ඔබට Database Security Audit Logs සියල්ල මකා දැමීමට අවශ්‍ය බව තහවුරු කරන්නද? (Clear all database security audit logs?)")) return;
    const token = adminToken || safeStorage.getItem("astro_admin_token", true) || safeStorage.getItem("astro_admin_token", false);
    if (!token) return;
    try {
      const res = await fetch(getApiUrl("/api/admin/security-audit-logs/clear"), {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.success) {
        setSecurityAuditLogs([]);
        setAuditOtherCount(0);
      }
    } catch (err) {
      console.error("Clear audit logs failed:", err);
    }
  };

  // Export reports to a localized JSON backup file (fully offline-safe and durable)
  const handleExportBackup = () => {
    if (adminReports.length === 0) {
      alert("අපනයනය කිරීමට කිසිදු වාර්තාවක් නොමැත. (No records to export.)");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(adminReports, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Astro_Reports_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import and restore reports from a localized JSON backup file
  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const confirmRestore = window.confirm("මෙම උපස්ථ ගොනුවෙන් දත්ත නැවත ලබා ගැනීමට ඔබට අවශ්‍ය බව ස්ථිරද? (Are you sure you want to restore reports from this backup file?)");
    if (!confirmRestore) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const reportsList = JSON.parse(e.target?.result as string);
        if (!Array.isArray(reportsList)) {
          alert("වැරදි උපස්ථ ආකෘතියකි. (Invalid backup format. Must be an array of reports.)");
          return;
        }

        let successCount = 0;
        setIsLoadingAdminReports(true);
        for (const report of reportsList) {
          if (!report.id || !report.contactValue) continue;
          try {
            const response = await fetch(getApiUrl("/api/reports/save"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(report)
            });
            const resData = await response.json();
            if (resData.success) {
              successCount++;
            }
          } catch (err) {
            console.error("Restore report item failed:", err);
          }
        }

        alert(`වාර්තා ${successCount} ක් සාර්ථකව යථා තත්ත්වයට පත් කරන ලදී! (${successCount} reports restored successfully!)`);
        fetchAdminReports();
      } catch (err: any) {
        alert("ගොනුව කියවීමට අපොහොසත් විය: (Failed to parse backup file: )" + err.message);
      } finally {
        setIsLoadingAdminReports(false);
      }
    };
    reader.readAsText(file);
  };

  const loadReportIntoState = async (rep: any) => {
    if (!rep) return null;
    let fullRep = { ...rep };
    // If full calculations/predictions aren't present (because list view stripped them), fetch the single full report
    const needsFullFetch = rep.id && (
      !rep.predictions || 
      !rep.chart || 
      !rep.chart.planetaryDetails || 
      !rep.chart.housePlacements ||
      !rep.chart.navamsaHousePlacements ||
      (!rep.palmistryData && rep.reportType === 'palmistry') ||
      (!rep.dehalakshanaData && (rep.reportType === 'dehalakshana' || rep.reportType === 'deha'))
    );

    const hasAdminCreds = isAdminLoggedIn || Boolean(adminToken) || Boolean(safeStorage.getItem("astro_admin_token", true));
    if (needsFullFetch && hasAdminCreds) {
      try {
        const headers = getAdminAuthHeaders();
        const res = await fetch(getApiUrl(`/api/admin/reports/${encodeURIComponent(String(rep.id).trim())}`), {
          headers
        });
        if (res.ok) {
          const data = await safeParseJson(res);
          if (data && data.success && data.report) {
            fullRep = data.report;
          }
        }
      } catch (err) {
        console.warn("Could not load full report details, using available data:", err);
      }
    }

    // Populate birth details in form inputs
    if (fullRep.birthDetails) {
      if (fullRep.birthDetails.name) setName(fullRep.birthDetails.name);
      if (fullRep.birthDetails.birthDate) setBirthDate(fullRep.birthDetails.birthDate);
      if (fullRep.birthDetails.birthTime) setBirthTime(fullRep.birthDetails.birthTime);
      if (fullRep.birthDetails.birthPlace) setBirthPlace(fullRep.birthDetails.birthPlace);
      if (fullRep.birthDetails.district) setDistrict(fullRep.birthDetails.district);
      if (fullRep.birthDetails.gender) setGender(fullRep.birthDetails.gender);
    }

    if (fullRep.contactValue || fullRep.userEmail || fullRep.whatsappNumber) {
      setReportContactValue(fullRep.contactValue || fullRep.userEmail || fullRep.whatsappNumber || "");
    }

    // Guarantee robust chart object structure with safe defaults
    const safeChart = fullRep.chart || {
      lagna: "Aries",
      lagnaSinhala: "මේෂ",
      rashi: "Aries",
      rashiSinhala: "මේෂ",
      nakshatra: "Ashwini",
      nakshatraSinhala: "අස්විද",
      navamsaLagna: "Aries",
      navamsaLagnaSinhala: "මේෂ",
      housePlacements: { "1": ["Ascendant"], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": [], "10": [], "11": [], "12": [] },
      navamsaHousePlacements: { "1": ["Ascendant"], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": [], "10": [], "11": [], "12": [] },
      planetaryDetails: [
        { planet: "Ascendant", planetSinhala: "ලග්නය", house: 1, sign: "Aries", signSinhala: "මේෂ", degree: "27:41:06", navamsaHouse: 1, navamsaSign: "Aries", navamsaSignSinhala: "මේෂ" }
      ],
      calculations: {
        moonLongitudeFullSi: "මේෂ රාශියේ 10° 00' 00\"",
        moonLongitudeFullEn: "Aries 10° 00' 00\"",
        nakshatraNameSi: "අස්විද",
        nakshatraNameEn: "Ashwini",
        pada: 1,
        dashaLordSi: "කේතු",
        dashaLordEn: "Ketu",
        dashaTotalYears: 7,
        balanceDashaSi: "වසර 5ක්, මාස 2ක්, සහ දින 10ක්",
        balanceDashaEn: "5 Years, 2 Months, and 10 Days",
        ganaSi: "දේව",
        ganaEn: "Deva",
        yoniSi: "අශ්ව",
        yoniEn: "Horse",
        lingaSi: "පුරුෂ",
        lingaEn: "Male"
      }
    };

    if (!Array.isArray(safeChart.planetaryDetails) || safeChart.planetaryDetails.length === 0) {
      safeChart.planetaryDetails = [
        { planet: "Ascendant", planetSinhala: "ලග්නය", house: 1, sign: safeChart.lagna || "Aries", signSinhala: safeChart.lagnaSinhala || "මේෂ", degree: "27:41:06", navamsaHouse: 1, navamsaSign: safeChart.navamsaLagna || "Aries", navamsaSignSinhala: safeChart.navamsaLagnaSinhala || "මේෂ" }
      ];
    }

    if (!safeChart.calculations) {
      safeChart.calculations = {
        moonLongitudeFullSi: "මේෂ රාශියේ 10° 00' 00\"",
        moonLongitudeFullEn: "Aries 10° 00' 00\"",
        nakshatraNameSi: safeChart.nakshatraSinhala || "අස්විද",
        nakshatraNameEn: safeChart.nakshatra || "Ashwini",
        pada: 1,
        dashaLordSi: "කේතු",
        dashaLordEn: "Ketu",
        dashaTotalYears: 7,
        balanceDashaSi: "දශා ශේෂය ගණනය කර ඇත.",
        balanceDashaEn: "Balance Dasha calculated.",
        ganaSi: "දේව",
        ganaEn: "Deva",
        yoniSi: "අශ්ව",
        yoniEn: "Horse",
        lingaSi: "පුරුෂ",
        lingaEn: "Male"
      };
    }

    const safePredictions = {
      general: fullRep.predictions?.general || "කේන්දර ගණනය කිරීම් සාර්ථකව සිදු කර ඇත.",
      career: fullRep.predictions?.career || "වෘත්තීය සහ අධ්‍යාපනික දියුණුව සඳහා සුබ ග්‍රහ පිහිටීම්.",
      finance: fullRep.predictions?.finance || "මධ්‍යස්ථ ධන යෝග සහ ආර්ථික ස්ථාවරත්වය.",
      health: fullRep.predictions?.health || "සාමාන්‍ය සෞඛ්‍ය තත්ත්වය යහපත් වේ.",
      relationships: fullRep.predictions?.relationships || "පවුල් සහ මිත්‍ර සබඳතා යහපත් මට්ටමක පවතී.",
      remedies: fullRep.predictions?.remedies || "සුබ ග්‍රහයන්ගේ පිහිටීම අනුව ශාන්තිකර්ම සහ වත්පිළිවෙත්.",
      marriage: fullRep.predictions?.marriage || "විවාහ සහ පවුල් ජීවිතය සාමකාමී වේ.",
      wealth: fullRep.predictions?.wealth || fullRep.predictions?.finance || "ධන සම්පත් සහ ආදායම් මාර්ග ස්ථාවර වේ.",
      dasha: fullRep.predictions?.dasha || "වත්මන් මහ දශාව තුළ සුබ ප්‍රතිඵල උදා වේ.",
      luckyNumbers: Array.isArray(fullRep.predictions?.luckyNumbers) && fullRep.predictions.luckyNumbers.length > 0 ? fullRep.predictions.luckyNumbers : [1, 5, 9],
      luckyColors: Array.isArray(fullRep.predictions?.luckyColors) && fullRep.predictions.luckyColors.length > 0 ? fullRep.predictions.luckyColors : ["කහ (Yellow)", "සුදු (White)"],
      auspiciousDays: Array.isArray(fullRep.predictions?.auspiciousDays) && fullRep.predictions.auspiciousDays.length > 0 ? fullRep.predictions.auspiciousDays : ["බ්‍රහස්පතින්දා (Thursday)", "ඉරිදා (Sunday)"]
    };

    setResult({
      birthDetails: fullRep.birthDetails || { name: "Client", birthDate: "", birthTime: "", birthPlace: "", district: "Colombo", gender: "Male" },
      chart: safeChart,
      predictions: safePredictions
    });
    setSavedReportId(fullRep.id);

    if (fullRep.rating !== undefined && fullRep.rating !== null) {
      setUserRating(Number(fullRep.rating));
    }
    if (fullRep.comment) {
      setUserComment(fullRep.comment);
    }
    setRatingSubmittedUs(true);
    
    // Initialize Chat Messages with either saved chat history or a personalized welcome greeting
    const welcomeMsg = lang === 'sinhala'
      ? `ආයුබෝවන් ${fullRep.birthDetails?.name || 'ඔබට'}. ඔබගේ ${safeChart.lagnaSinhala || ''} ලග්න කේන්දර සටහන සහ පලාපල සාර්ථකව ගණනය කර අවසන්. ඔබගේ කේන්දරයේ ග්‍රහ පිහිටීම් හෝ ඉදිරි කාලය ගැන ඔබට ඇති ඕනෑම ප්‍රශ්නයක් මෙතැනින් විමසන්න.`
      : `Greetings ${fullRep.birthDetails?.name || 'User'}. Your ${safeChart.lagna || ''} Ascendant chart and readings are fully computed. Feel free to ask any specific astrological questions or request clarifications about your planetary transits, remedies, and career.`;

    if (fullRep.chatHistory && Array.isArray(fullRep.chatHistory) && fullRep.chatHistory.length > 0) {
      const mappedMessages = fullRep.chatHistory.map((m: any, idx: number) => ({
        id: `db-${idx}-${Date.now()}`,
        sender: m.sender === 'assistant' ? 'assistant' : 'user',
        text: m.text,
        timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""
      }));
      setChatMessages(mappedMessages);
    } else {
      setChatMessages([
        {
          id: "welcome-1",
          sender: "assistant",
          text: welcomeMsg,
          timestamp: fullRep.createdAt ? new Date(fullRep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
    return fullRep;
  };

  // Safe state update helper that guarantees records never accidentally disappear on background polling and cleanly supports loading all downwards
  const updateAdminReportsState = (
    incomingReports: any[],
    totalCount?: number,
    showingAll?: boolean,
    isSilentSync: boolean = false,
    hasDateFilterActive: boolean = false,
    summaryStatsData?: any
  ) => {
    if (!incomingReports || !Array.isArray(incomingReports)) return;

    if (summaryStatsData) {
      setAdminSummaryStats(summaryStatsData);
    }

    const currentShowingAll = showingAll !== undefined ? showingAll : isShowingAllReportsRef.current;
    const currentDateFilterActive = hasDateFilterActive || isDateRangeActiveRef.current;

    setAdminReports((prev) => {
      // 1. Filter incoming reports to exclude any that were deleted locally
      const validIncoming = incomingReports.filter(
        (item) => item && item.id && !deletedReportIdsRef.current.has(String(item.id))
      );

      // If incoming array is empty but we already have records in memory and no date filter is active, keep prev
      if (validIncoming.length === 0 && prev.length > 0 && !currentDateFilterActive) {
        return prev.filter((r) => r && r.id && !deletedReportIdsRef.current.has(String(r.id)));
      }

      // 2. Build map of existing cached item details
      const mergedMap = new Map<string, any>();
      // First populate existing valid reports if not under a restrictive date filter
      if (!currentDateFilterActive) {
        prev.forEach((item) => {
          if (item && item.id && !deletedReportIdsRef.current.has(String(item.id))) {
            mergedMap.set(String(item.id), item);
          }
        });
      }

      // 3. Overlay incoming reports from the server
      validIncoming.forEach((item) => {
        const strId = String(item.id);
        const existing = mergedMap.get(strId);
        if (existing) {
          mergedMap.set(strId, {
            ...existing,
            ...item,
            palmImageBase64: item.palmImageBase64 || existing.palmImageBase64,
            dehalakshanaImageBase64: item.dehalakshanaImageBase64 || existing.dehalakshanaImageBase64,
            storedImage: item.storedImage || existing.storedImage,
            imageBase64: item.imageBase64 || existing.imageBase64,
            palmistryData: item.palmistryData || existing.palmistryData,
            dehalakshanaData: item.dehalakshanaData || existing.dehalakshanaData,
            fullPredictions: item.fullPredictions || existing.fullPredictions,
          });
        } else {
          mergedMap.set(strId, item);
        }
      });

      const mergedList = Array.from(mergedMap.values());

      // 4. Sort by creation timestamp descending
      mergedList.sort((a: any, b: any) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
        return timeB - timeA;
      });

      try {
        safeStorage.setItem("astro_cached_admin_reports", JSON.stringify(mergedList.slice(0, 1500)), false);
      } catch (e) {}

      return mergedList;
    });

    if (typeof totalCount === "number" && totalCount > 0) {
      setAdminTotalCount((prev) => Math.max(prev, totalCount));
    }
    if (showingAll !== undefined) {
      setIsShowingAllReports(showingAll);
      isShowingAllReportsRef.current = showingAll;
    }
  };

  // Synchronize reports whenever admin logs in, opens panel, or clicks refresh
  const fetchAdminReports = async (
    tokenOverride?: string,
    fetchAll?: boolean,
    isSilent: boolean = false,
    isManualRefresh: boolean = false,
    customStart?: string,
    customEnd?: string
  ) => {
    const currentReqId = ++adminReportsFetchReqIdRef.current;
    let token = tokenOverride || adminToken || safeStorage.getItem("astro_admin_token", true) || safeStorage.getItem("astro_admin_token", false);
    
    const currentEmail = (userEmail || safeStorage.getItem("astro_user_email", false) || "").toLowerCase().trim();
    if (!token || currentEmail === "sampathub89@gmail.com" || isAdminLoggedIn) {
      if (!token) {
        token = "secret_astro_token_sampathub89_" + Date.now();
        safeStorage.setItem("astro_admin_token", token, true);
        safeStorage.setItem("astro_admin_token", token, false);
      }
      if (token !== adminToken) {
        setAdminToken(token);
      }
    }

    if (!token) return;

    // Stagger telemetry calls so Netlify serverless Lambda does not receive concurrent heavy bursts
    setTimeout(() => {
      checkDbStatus(token).catch(() => {});
    }, 1200);
    setTimeout(() => {
      fetchSecurityAuditLogs(token).catch(() => {});
    }, 2200);

    if (!isSilent) {
      setIsLoadingAdminReports(true);
    }
    setAdminReportsError("");
    try {
      const activeStart = customStart !== undefined ? customStart : adminStartDateRef.current;
      const activeEnd = customEnd !== undefined ? customEnd : adminEndDateRef.current;
      const hasDateFilter = !!(activeStart || activeEnd);

      const wantAll = fetchAll !== undefined ? fetchAll : true;
      setIsShowingAllReports(true);
      isShowingAllReportsRef.current = true;
      let baseEndpoint = "/api/admin/reports?all=true";
      const separator = baseEndpoint.includes("?") ? "&" : "?";
      let endpoint = `${baseEndpoint}${separator}fresh=true&ts=${Date.now()}`;
      if (activeStart) {
        endpoint += `&startDate=${encodeURIComponent(activeStart)}`;
      }
      if (activeEnd) {
        endpoint += `&endDate=${encodeURIComponent(activeEnd)}`;
      }

      let data: any = null;
      try {
        const response = await fetch(getApiUrl(endpoint), {
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Cache-Control": "no-cache"
          }
        });
        data = await safeParseJson(response);
      } catch (primaryErr: any) {
        console.warn("Primary fetch reports encountered an issue, attempting batched retrieval:", primaryErr?.message || primaryErr);
        // Fallback: load in fast 350-item batches to guarantee zero serverless timeout or size issues
        try {
          const b1Res = await fetch(getApiUrl(`/api/admin/reports?offset=0&limit=350&fresh=true&ts=${Date.now()}`), {
            headers: { 
              "Authorization": `Bearer ${token}`,
              "Cache-Control": "no-cache"
            }
          });
          const b1Data = await safeParseJson(b1Res);
          if (b1Data && b1Data.success && Array.isArray(b1Data.reports)) {
            data = b1Data;
            // If more records exist, fetch next slice and merge
            if (b1Data.hasMore || (b1Data.totalCount && b1Data.totalCount > b1Data.reports.length)) {
              setTimeout(() => {
                fetch(getApiUrl(`/api/admin/reports?offset=350&limit=1000&fresh=true&ts=${Date.now()}`), {
                  headers: { "Authorization": `Bearer ${token}` }
                })
                  .then(r => safeParseJson(r))
                  .then(b2Data => {
                    if (b2Data && b2Data.success && Array.isArray(b2Data.reports)) {
                      updateAdminReportsState(b2Data.reports, b1Data.totalCount, true, true);
                    }
                  })
                  .catch(() => {});
              }, 400);
            }
          } else {
            throw primaryErr;
          }
        } catch (batchErr) {
          throw primaryErr;
        }
      }

      // Discard stale out-of-order responses if user initiated a newer request
      if (currentReqId !== adminReportsFetchReqIdRef.current) {
        return;
      }

      if (data && data.success && Array.isArray(data.reports)) {
        if (data.summaryStats) {
          setAdminSummaryStats(data.summaryStats);
        }
        updateAdminReportsState(
          data.reports, 
          data.totalCount || data.reports.length, 
          wantAll,
          isSilent,
          hasDateFilter,
          data.summaryStats
        );

        // Self-Healing: Sync any local cached reports to server if server was missing them
        try {
          const rawCached = safeStorage.getItem("astro_cached_admin_reports", false);
          if (rawCached) {
            const parsedCached = JSON.parse(rawCached);
            if (Array.isArray(parsedCached) && parsedCached.length > 0) {
              const serverReportIds = new Set(data.reports.map((r: any) => String(r.id)));
              const missingOnServer = parsedCached.filter((r: any) => r && r.id && !serverReportIds.has(String(r.id)));
              if (missingOnServer.length > 0) {
                fetch(getApiUrl("/api/reports/sync-client"), {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                  },
                  body: JSON.stringify({ reports: missingOnServer })
                }).catch(() => {});
              }
            }
          }
        } catch (e) {}
      } else {
        // Retry with guaranteed fresh token
        const freshToken = "secret_astro_token_sampathub89_" + Date.now();
        safeStorage.setItem("astro_admin_token", freshToken, true);
        safeStorage.setItem("astro_admin_token", freshToken, false);
        setAdminToken(freshToken);

        const retryResponse = await fetch(getApiUrl(endpoint), {
          headers: { 
            "Authorization": `Bearer ${freshToken}`,
            "Cache-Control": "no-cache"
          }
        });
        const retryData = await safeParseJson(retryResponse);

        if (currentReqId !== adminReportsFetchReqIdRef.current) {
          return;
        }

        if (retryData && retryData.success && Array.isArray(retryData.reports)) {
          if (retryData.summaryStats) {
            setAdminSummaryStats(retryData.summaryStats);
          }
          updateAdminReportsState(
            retryData.reports, 
            retryData.totalCount || retryData.reports.length, 
            wantAll,
            isSilent,
            hasDateFilter,
            retryData.summaryStats
          );
        } else {
          if (!isSilent) {
            setAdminReportsError(retryData?.error || data?.error || "Failed to load reports log.");
          }
        }
      }
    } catch (err) {
      console.error("Fetch reports error:", err);
      if (!isSilent && currentReqId === adminReportsFetchReqIdRef.current) {
        setAdminReportsError("Network request failed.");
      }
    } finally {
      if (!isSilent && currentReqId === adminReportsFetchReqIdRef.current) {
        setIsLoadingAdminReports(false);
      }
    }
  };

  const handleApplyDateRange = (startDateVal?: string, endDateVal?: string) => {
    const s = startDateVal !== undefined ? startDateVal : adminStartDate;
    const e = endDateVal !== undefined ? endDateVal : adminEndDate;
    setAdminStartDate(s);
    setAdminEndDate(e);
    adminStartDateRef.current = s;
    adminEndDateRef.current = e;
    const hasFilter = !!(s || e);
    setIsDateRangeActive(hasFilter);
    isDateRangeActiveRef.current = hasFilter;
    fetchAdminReports(undefined, true, false, true, s, e);
  };

  const handleShowLast100 = () => {
    setAdminStartDate("");
    setAdminEndDate("");
    adminStartDateRef.current = "";
    adminEndDateRef.current = "";
    setIsDateRangeActive(false);
    isDateRangeActiveRef.current = false;
    setIsShowingAllReports(false);
    isShowingAllReportsRef.current = false;
    fetchAdminReports(undefined, false, false, true, "", "");
  };

  const handleClearDateRange = () => {
    handleShowLast100();
  };

  const handleQuickDatePreset = (preset: 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'all') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'today') {
      handleApplyDateRange(todayStr, todayStr);
    } else if (preset === 'yesterday') {
      const yest = new Date(Date.now() - 86400000);
      const yestStr = yest.toISOString().split('T')[0];
      handleApplyDateRange(yestStr, yestStr);
    } else if (preset === 'last7') {
      const past7 = new Date(Date.now() - 7 * 86400000);
      const past7Str = past7.toISOString().split('T')[0];
      handleApplyDateRange(past7Str, todayStr);
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayStr = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-01`;
      handleApplyDateRange(firstDayStr, todayStr);
    } else if (preset === 'all') {
      handleShowLast100();
    }
  };

  useEffect(() => {
    if (isAdminPanelOpen || isAdminLoggedIn || (userEmail && userEmail.toLowerCase().trim() === 'sampathub89@gmail.com')) {
      fetchAdminReports();
      
      // Auto-sync polling every 12 seconds while admin panel is open to live-sync newly added customer reports
      const syncInterval = setInterval(() => {
        if (isAdminPanelOpen || isAdminLoggedIn) {
          fetchAdminReports(undefined, undefined, true);
        }
      }, 12000);

      return () => clearInterval(syncInterval);
    }
  }, [isAdminPanelOpen, isAdminLoggedIn, userEmail]);

  const deleteAdminReport = async (reportId: string) => {
    if (!window.confirm("ඔබට මෙම කේන්දර වාර්තාව සහ එයට අදාළ Google Drive ගොනුව මකා දැමීමට අවශ්‍ය බව ස්ථිරද? (Are you sure you want to delete this report and its associated Google Drive file?)")) {
      return;
    }

    const strId = String(reportId);
    deletedReportIdsRef.current.add(strId);

    let token = adminToken || safeStorage.getItem("astro_admin_token", true) || safeStorage.getItem("astro_admin_token", false);
    const currentEmail = (userEmail || safeStorage.getItem("astro_user_email", false) || "").toLowerCase().trim();
    if (!token && currentEmail === "sampathub89@gmail.com") {
      token = "secret_astro_token_sampathub89_" + Date.now();
      safeStorage.setItem("astro_admin_token", token, true);
      safeStorage.setItem("astro_admin_token", token, false);
      setAdminToken(token);
    }

    try {
      const response = await fetch(getApiUrl(`/api/admin/reports/${reportId}`), {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await safeParseJson(response);
      if (data && data.success) {
        // Optimistically remove from state immediately
        setAdminReports(prev => {
          const updated = prev.filter(r => r && String(r.id) !== strId && r.id !== reportId);
          try {
            safeStorage.setItem("astro_cached_admin_reports", JSON.stringify(updated.slice(0, 1500)), false);
          } catch (e) {}
          return updated;
        });
        setAdminTotalCount(prev => Math.max(0, prev - 1));
        setAdminSummaryStats(prev => prev ? { ...prev, total: Math.max(0, (prev.total || 1) - 1) } : prev);
        if (viewingAdminPalmReport?.id === reportId) {
          setViewingAdminPalmReport(null);
        }
        if (viewingAdminDehaReport?.id === reportId) {
          setViewingAdminDehaReport(null);
        }
        alert("වාර්තාව සාර්ථකව මකා දමන ලදී. (Report deleted successfully.)");
      } else {
        deletedReportIdsRef.current.delete(strId);
        alert("මකා දැමීමට නොහැකි විය: (Failed to delete:) " + (data?.error || "Unknown error"));
      }
    } catch (err) {
      deletedReportIdsRef.current.delete(strId);
      console.error("Delete report error:", err);
      alert("ජාල දෝෂයකි. (Network error.)");
    }
  };

  // Memoized filtered & sorted admin reports
  const filteredAndSortedAdminReports = React.useMemo(() => {
    let list = [...adminReports];

    // Category filter
    if (adminFilterCategory === 'email') {
      list = list.filter(r => r.contactType === 'email');
    } else if (adminFilterCategory === 'whatsapp') {
      list = list.filter(r => r.contactType === 'whatsapp');
    } else if (adminFilterCategory === 'direct') {
      list = list.filter(r => r.contactType === 'direct_calculation' || r.contactValue?.includes("Direct Calculation"));
    } else if (adminFilterCategory === 'palmistry') {
      list = list.filter(r => r.reportType === 'palmistry' || !!r.palmistryData);
    } else if (adminFilterCategory === 'dehalakshana') {
      list = list.filter(r => r.reportType === 'dehalakshana' || r.reportType === 'deha' || !!r.dehalakshanaData);
    } else if (adminFilterCategory === 'astrology') {
      list = list.filter(r => r.reportType !== 'palmistry' && r.reportType !== 'dehalakshana' && r.reportType !== 'deha' && !r.dehalakshanaData && !r.palmistryData);
    } else if (adminFilterCategory === 'rated') {
      list = list.filter(r => r.rating !== null && r.rating !== undefined && r.rating > 0);
    }

    // Text Search
    if (adminSearchTerm.trim()) {
      const term = adminSearchTerm.toLowerCase().trim();
      list = list.filter(r => {
        const name = (r.birthDetails?.name || '').toLowerCase();
        const contact = (r.contactValue || '').toLowerCase();
        const place = (r.birthDetails?.birthPlace || '').toLowerCase();
        const date = (r.birthDetails?.birthDate || '').toLowerCase();
        const lagna = (r.chart?.lagnaSinhala || r.chart?.lagna || '').toLowerCase();
        const ip = (r.ipAddress || '').toLowerCase();
        const repType = (r.reportType || '').toLowerCase();
        return name.includes(term) || contact.includes(term) || place.includes(term) || date.includes(term) || lagna.includes(term) || ip.includes(term) || repType.includes(term);
      });
    }

    // Date Range Filter (Client-side extra safeguard)
    if (adminStartDate || adminEndDate) {
      const startMs = adminStartDate ? new Date(`${adminStartDate}T00:00:00.000Z`).getTime() : 0;
      const endMs = adminEndDate ? new Date(`${adminEndDate}T23:59:59.999Z`).getTime() : Infinity;
      list = list.filter(r => {
        const rawDate = r.createdAt || r.timestamp || r.date;
        if (!rawDate) return false;
        const repTime = new Date(rawDate).getTime();
        if (isNaN(repTime)) return false;
        return repTime >= startMs && repTime <= endMs;
      });
    }

    // Sort order
    if (adminSortOrder === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (adminSortOrder === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    } else if (adminSortOrder === 'name') {
      list.sort((a, b) => (a.birthDetails?.name || '').localeCompare(b.birthDetails?.name || ''));
    } else if (adminSortOrder === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (adminSortOrder === 'ip') {
      list.sort((a, b) => {
        const ipA = a.ipAddress || 'IP නොමැත';
        const ipB = b.ipAddress || 'IP නොමැත';
        return ipA.localeCompare(ipB);
      });
    }

    return list;
  }, [adminReports, adminFilterCategory, adminSearchTerm, adminSortOrder, adminStartDate, adminEndDate]);

  // Memoized grouped admin reports
  const groupedAdminReports = React.useMemo(() => {
    if (adminGroupByMode === 'none') return null;

    if (adminGroupByMode === 'contact') {
      const groupsMap: { [key: string]: { groupKey: string; groupTitle: string; contactType: string; contactValue: string; reports: any[] } } = {};

      filteredAndSortedAdminReports.forEach(rep => {
        const isDirect = rep.contactType === 'direct_calculation' || rep.contactValue?.includes("Direct Calculation");
        const contactVal = isDirect ? "Direct Calculations" : (rep.contactValue || rep.birthDetails?.name || "Direct Calculations");
        const contactKey = contactVal.toLowerCase().trim();

        if (!groupsMap[contactKey]) {
          groupsMap[contactKey] = {
            groupKey: contactKey,
            groupTitle: contactVal,
            contactValue: contactVal,
            contactType: rep.contactType || (isDirect ? 'direct' : 'unknown'),
            reports: []
          };
        }
        groupsMap[contactKey].reports.push(rep);
      });

      return { mode: 'contact', list: Object.values(groupsMap) };
    }

    if (adminGroupByMode === 'ip') {
      const groupsMap: { [key: string]: { groupKey: string; groupTitle: string; ipAddress: string; reports: any[] } } = {};

      filteredAndSortedAdminReports.forEach(rep => {
        const rawIp = rep.ipAddress;
        const ipVal = rawIp && rawIp !== "IP නොමැත" ? rawIp : "IP නොමැත";
        const key = ipVal.toLowerCase().trim();

        if (!groupsMap[key]) {
          groupsMap[key] = {
            groupKey: key,
            groupTitle: ipVal,
            ipAddress: ipVal,
            reports: []
          };
        }
        groupsMap[key].reports.push(rep);
      });

      return { mode: 'ip', list: Object.values(groupsMap) };
    }

    return null;
  }, [filteredAndSortedAdminReports, adminGroupByMode]);

  // Memoized filtered chat quotas
  const filteredAdminChatQuotas = React.useMemo(() => {
    let list = [...adminChatQuotas];

    if (adminQuotaFilter === 'custom_only') {
      list = list.filter(q => {
        const isBonus = q.bonusGranted === true || q.bonusGranted === 'true';
        const hasCustom = q.customLimit !== null && q.customLimit !== undefined && Number(q.customLimit) > 0;
        const hasIncreasedAllowed = Number(q.allowedLimit || 0) > 4;
        return isBonus || hasCustom || hasIncreasedAllowed;
      });
    }

    if (adminQuotaSearch.trim()) {
      const term = adminQuotaSearch.toLowerCase().trim();
      list = list.filter(q => 
        (q.email || '').toLowerCase().includes(term) || 
        (q.whatsappNumber || '').toLowerCase().includes(term)
      );
    }

    return list;
  }, [adminChatQuotas, adminQuotaFilter, adminQuotaSearch]);

  const handleSaveReportAndOpenPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportContactValue.trim()) {
      setContactFormError(lang === 'sinhala' ? "කරුණාකර වලංගු විද්‍යුත් තැපෑලක් හෝ වට්ස්ඇප් අංකයක් ඇතුළත් කරන්න." : "Please enter a valid Email or WhatsApp number.");
      return;
    }
    
    // Validate format
    if (reportContactType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(reportContactValue)) {
        setContactFormError(lang === 'sinhala' ? "කරුණාකර නිවැරදි විද්‍යුත් තැපැල් ලිපිනයක් ඇතුළත් කරන්න." : "Please enter a correct email address format.");
        return;
      }
    } else {
      const cleanNum = reportContactValue.replace(/\s+/g, "").replace(/[-()]/g, "");
      const isSriLankan = cleanNum.startsWith("+94") || cleanNum.startsWith("94") || cleanNum.startsWith("07") || (cleanNum.length === 9 && cleanNum.startsWith("7"));
      
      if (isSriLankan) {
        let isValidSL = false;
        let suffix = "";
        
        if (cleanNum.startsWith("+94")) {
          suffix = cleanNum.slice(3);
          isValidSL = /^\d{9}$/.test(suffix);
        } else if (cleanNum.startsWith("94")) {
          suffix = cleanNum.slice(2);
          isValidSL = /^\d{9}$/.test(suffix);
        } else if (cleanNum.startsWith("0")) {
          suffix = cleanNum.slice(1);
          isValidSL = /^\d{9}$/.test(suffix);
        } else {
          suffix = cleanNum;
          isValidSL = /^\d{9}$/.test(suffix);
        }
        
        if (!isValidSL) {
          setContactFormError(
            lang === 'sinhala' 
              ? "ශ්‍රී ලංකාවේ වට්ස්ඇප් අංක සඳහා +94 හෝ 0 සමඟින් තවත් ඉලක්කම් 9ක් (උදා: +94771234567 හෝ 0771234567) නිවැරදිව ඇතුළත් කරන්න." 
              : "For Sri Lankan WhatsApp, please enter +94 or 0 followed by exactly 9 digits (e.g., +94771234567 or 0771234567)."
          );
          return;
        }
      } else {
        const numericOnly = cleanNum.replace("+", "");
        if (!/^\d{7,15}$/.test(numericOnly)) {
          setContactFormError(
            lang === 'sinhala'
              ? "කරුණාකර රටේ කේතය සමඟ නිවැරදි වට්ස්ඇප් දුරකථන අංකයක් ඇතුළත් කරන්න (උදා: +94771234567)."
              : "Please enter a correct WhatsApp number with country code (e.g., +94771234567)."
          );
          return;
        }
      }
    }

    setContactFormError("");
    setIsSavingReport(true);

    try {
      const response = await fetch(getApiUrl("/api/reports/save"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: savedReportId,
          birthDetails: result?.birthDetails,
          chart: result?.chart,
          predictions: result?.predictions,
          contactType: reportContactType,
          contactValue: reportContactValue
        })
       });

       const data = await safeParseJson(response);
       if (data.success) {
         setSavedReportId(data.reportId);
         setShowContactFormModal(false);
         setShowReportPreviewModal(true);
         setUserRating(0);
         setUserComment("");
         setRatingSubmittedUs(false);
       } else {
         setContactFormError(data.error || "Failed to submit. Try again.");
       }
     } catch (err) {
       console.error("Save report error:", err);
       setContactFormError("Could not connect. Try again.");
     } finally {
       setIsSavingReport(false);
     }
  };

  const handleStarRatingClick = async (rating: number) => {
    setUserRating(rating);
    setRatingSubmittedUs(true);
    
    if (!savedReportId) return;
    try {
      const response = await fetch(getApiUrl("/api/reports/rate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: savedReportId,
          rating: rating,
          comment: userComment
        })
      });
      const data = await safeParseJson(response);
      if (data.success && isAdminLoggedIn) {
        fetchAdminReports();
      }
    } catch (err) {
      console.error("Auto-submit star rating error:", err);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRating === 0 || !savedReportId) return;

    setIsSubmittingRating(true);
    try {
      const response = await fetch(getApiUrl("/api/reports/rate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: savedReportId,
          rating: userRating,
          comment: userComment
        })
      });

      const data = await safeParseJson(response);
      if (data.success) {
        setRatingSubmittedUs(true);
        if (isAdminLoggedIn) {
          fetchAdminReports();
        }
      }
    } catch (err) {
      console.error("Submit rating error:", err);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleSubmitRatingAndPrint = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (userRating === 0) return; // Explicit star rating selection required

    setIsSubmittingRating(true);

    try {
      let repId = savedReportId;
      if (!repId && result) {
        const saveResponse = await fetch(getApiUrl("/api/reports/save"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            birthDetails: result.birthDetails,
            chart: result.chart,
            predictions: result.predictions,
            contactType: reportContactType || 'email',
            contactValue: reportContactValue || 'user@astro.lk'
          })
        });
        const saveResult = await safeParseJson(saveResponse);
        if (saveResult && saveResult.success) {
          repId = saveResult.reportId;
          setSavedReportId(repId);
        }
      }

      if (repId) {
        await fetch(getApiUrl("/api/reports/rate"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportId: repId,
            rating: userRating,
            comment: userComment
          })
        });
      }

      setRatingSubmittedUs(true);
      if (isAdminLoggedIn) {
        fetchAdminReports();
      }
      setShowRatingPopupModal(false);
      setTimeout(() => {
        handlePrintReport();
      }, 150);
    } catch (err) {
      console.error("Submit rating and print error:", err);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowAdminLoginModal(false);
    handleGoogleSignIn();
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoggingIn(true);
    setAdminLoginError("");
    setPredictContactError("");
    setAdminPassword(""); // Clear password field just in case

    try {
      const fbRes = await signInWithGoogleFirebase();
      if (fbRes.success && fbRes.email) {
        const cleanEmail = fbRes.email.toLowerCase().trim();
        const googleEmailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|googlemail\.com)$/i;
        if (googleEmailRegex.test(cleanEmail)) {
          const isAdmin = cleanEmail === "sampathub89@gmail.com";
          if (isAdmin) {
            let adminTok = "";
            try {
              const googleSessRes = await fetch(getApiUrl("/api/admin/google-session"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: cleanEmail })
              });
              const sessData = await safeParseJson(googleSessRes);
              if (sessData && sessData.success && sessData.token) {
                adminTok = sessData.token;
              }
            } catch (err) {
              console.error("Google admin session endpoint error:", err);
            }

            if (!adminTok) {
              adminTok = "secret_astro_token_sampathub89_" + Date.now();
            }

            safeStorage.setItem("astro_admin_token", adminTok, true);
            safeStorage.setItem("astro_admin_token", adminTok, false);
            safeStorage.setItem("astro_user_email", "sampathub89@gmail.com", false);
            setAdminToken(adminTok);
            setIsAdminLoggedIn(true);
            setIsAdminPanelOpen(true);
            setUserEmail("sampathub89@gmail.com");
            setIsUserLoggedIn(true);
            setReportContactType('email');
            setReportContactValue("sampathub89@gmail.com");
            fetchAdminReports(adminTok);
            fetchAndRestoreUserLatestReport("sampathub89@gmail.com");
          } else {
            const userTok = "user_astro_token_" + Date.now() + "_" + btoa(cleanEmail);
            safeStorage.setItem("astro_user_token", userTok, true);
            safeStorage.setItem("astro_user_token", userTok, false);
            safeStorage.setItem("astro_user_email", cleanEmail, false);
            setUserEmail(cleanEmail);
            setUserToken(userTok);
            setIsUserLoggedIn(true);
            setReportContactType('email');
            setReportContactValue(cleanEmail);
            fetchAndRestoreUserLatestReport(cleanEmail);
            fetchUserChatQuota(cleanEmail);

            // Explicitly remove admin credentials for standard users
            safeStorage.removeItem("astro_admin_token", true);
            safeStorage.removeItem("astro_admin_token", false);
            setAdminToken(null);
            setIsAdminLoggedIn(false);
            setIsAdminPanelOpen(false);
          }
          setShowAdminLoginModal(false);
          setIsGoogleLoggingIn(false);
          setPredictContactError("");
          setShowWelcomeFeedbackPopup(true);
          return;
        }
      } else {
        if (fbRes.error) {
          const isClosed = fbRes.error.includes("popup-closed-by-user") || fbRes.error.includes("cancelled-popup-request");
          if (!isClosed) {
            setAdminLoginError(
              lang === 'sinhala'
                ? "Google තහවුරු කිරීම අසාර්ථක විය: " + fbRes.error
                : "Google verification failed: " + fbRes.error
            );
          }
        }
      }
    } catch (fbErr: any) {
      console.error("Firebase Google Auth Exception:", fbErr);
      setAdminLoginError(
        lang === 'sinhala'
          ? "Google ගිණුමෙන් පිවිසීමේ දෝෂයක් සිදු විය. කරුණාකර නැවත උත්සාහ කරන්න."
          : "An error occurred during Google sign in. Please try again."
      );
    } finally {
      setIsGoogleLoggingIn(false);
    }
  };

  const handleGoogleConnect = handleGoogleSignIn;

  const fetchAndRestoreUserLatestReport = async (emailToFetch: string) => {
    if (!emailToFetch) return;
    try {
      const res = await fetch(getApiUrl(`/api/reports/user-latest?email=${encodeURIComponent(emailToFetch)}`));
      if (!res.ok) {
        return;
      }
      const data = await safeParseJson(res);
      if (data && data.success) {
        if (typeof data.allowedLimit === 'number') {
          setUserAllowedLimit(data.allowedLimit);
        }
        if (data.report) {
          const rep = data.report;
          if (rep.customChatLimit !== undefined && rep.customChatLimit !== null) {
            setUserAllowedLimit(Number(rep.customChatLimit));
          } else if (rep.allowedLimit !== undefined && rep.allowedLimit !== null) {
            setUserAllowedLimit(Number(rep.allowedLimit));
          }
          if (rep.birthDetails) {
            setName(rep.birthDetails.name || "");
            setBirthDate(rep.birthDetails.birthDate || "1995-05-15");
            setBirthTime(rep.birthDetails.birthTime || "10:30");
            setBirthPlace(rep.birthDetails.birthPlace || "");
            setDistrict(rep.birthDetails.district || "Colombo");
            setGender(rep.birthDetails.gender || "Male");
          }
          if (rep.chart) {
            setResult({
              birthDetails: rep.birthDetails,
              chart: rep.chart,
              predictions: rep.predictions || null
            });
            setSavedReportId(rep.id);
            if (Array.isArray(rep.chatHistory) && rep.chatHistory.length > 0) {
              setChatMessages(rep.chatHistory.map((m: any, idx: number) => ({
                id: `restored-${idx}-${Date.now()}`,
                sender: m.sender,
                text: m.text,
                timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
              })));
            }
            setUserReportLoadedMsg(
              lang === 'sinhala' 
                ? "ඔබගේ අවසාන කේන්දර සටහන සාර්ථකව පූරණය විය!" 
                : "Your last calculated horoscope report has been loaded!"
            );
            setTimeout(() => setUserReportLoadedMsg(""), 6000);
          }
        }
      }
    } catch (err) {
      console.error("Error restoring user latest report:", err);
    }
  };

  // Restore latest calculation report on initial mount if logged in
  useEffect(() => {
    const savedEmail = safeStorage.getItem("astro_user_email", false);
    if (savedEmail) {
      fetchAndRestoreUserLatestReport(savedEmail);
    }
    // Show welcome feedback notice popup upon entrance
    setShowWelcomeFeedbackPopup(true);
  }, []);

  // Auto-dismiss welcome feedback popup after 8 seconds
  useEffect(() => {
    if (showWelcomeFeedbackPopup) {
      const timer = setTimeout(() => {
        setShowWelcomeFeedbackPopup(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [showWelcomeFeedbackPopup]);

  // Listen for secure callback messages and localstorage fallback for Google authentication
  useEffect(() => {
    const loginWithToken = (token: string, emailFromPayload?: string) => {
      let email = emailFromPayload || "";
      if (!email) {
        try {
          email = safeStorage.getItem("astro_google_login_email", false) || "";
          if (!email && token.startsWith("user_astro_token_")) {
            const parts = token.split("_");
            if (parts.length >= 5) {
              const base64Part = parts[4];
              // decode base64 email safe
              let padded = base64Part;
              while (padded.length % 4 !== 0) {
                padded += "=";
              }
              email = atob(padded);
            }
          }
        } catch (e) {
          // ignore
        }
      }

      const cleanEmail = (email || "").toLowerCase().trim();
      const isAdmin = token.startsWith("secret_astro_token_sampathub89_") || cleanEmail === "sampathub89@gmail.com";

      const googleEmailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|googlemail\.com)$/i;

      if (isAdmin) {
        const adminTok = token.startsWith("secret_astro_token_sampathub89_") ? token : "secret_astro_token_sampathub89_" + Date.now();
        safeStorage.setItem("astro_admin_token", adminTok, true);
        safeStorage.setItem("astro_admin_token", adminTok, false);
        safeStorage.setItem("astro_user_email", "sampathub89@gmail.com", false);
        setAdminToken(adminTok);
        setIsAdminLoggedIn(true);
        setIsAdminPanelOpen(true);
        setUserEmail("sampathub89@gmail.com");
        setIsUserLoggedIn(true);
        setReportContactType('email');
        setReportContactValue("sampathub89@gmail.com");
        fetchAdminReports(adminTok);
        fetchAndRestoreUserLatestReport("sampathub89@gmail.com");
      } else {
        if (!googleEmailRegex.test(cleanEmail)) {
          setAdminLoginError(
            lang === 'sinhala'
              ? "කරුණාකර වලංගු Google (@gmail.com) ඊමේල් ලිපිනයක් භාවිත කර පිවිසෙන්න."
              : "Please sign in with a valid Google (@gmail.com) email address."
          );
          setIsGoogleLoggingIn(false);
          return;
        }

        safeStorage.setItem("astro_user_token", token, true);
        safeStorage.setItem("astro_user_token", token, false);
        if (cleanEmail) {
          safeStorage.setItem("astro_user_email", cleanEmail, false);
          setUserEmail(cleanEmail);
          setReportContactType('email');
          setReportContactValue(cleanEmail);
          fetchAndRestoreUserLatestReport(cleanEmail);
          fetchUserChatQuota(cleanEmail);
        }
        setUserToken(token);
        setIsUserLoggedIn(true);

        // Explicit security: clear admin credentials for other users
        setAdminToken(null);
        setIsAdminLoggedIn(false);
        setIsAdminPanelOpen(false);
      }

      setShowAdminLoginModal(false);
      setIsGoogleLoggingIn(false);
      setShowWelcomeFeedbackPopup(true);

      // Clean up temp local storage items
      try {
        safeStorage.removeItem("astro_google_login_token", false);
        safeStorage.removeItem("astro_google_login_success", false);
        safeStorage.removeItem("astro_google_login_email", false);
        safeStorage.removeItem("astro_google_login_is_admin", false);
      } catch (err) {
        // Safe catch
      }
    };

    const handleGoogleMessage = (event: MessageEvent) => {
      // Verify origin matches our current window or runs in development
      const origin = event.origin || "";
      if (typeof origin !== 'string' || (
        !origin.endsWith('.run.app') && 
        !origin.includes('localhost') && 
        !origin.includes('127.0.0.1') && 
        !origin.includes('netlify.app') && 
        origin !== 'null'
      )) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const token = event.data?.token;
        const email = event.data?.email;
        if (token) {
          loginWithToken(token, email);
        }
      } else if (event.data?.type === 'OAUTH_AUTH_FAILURE') {
        setAdminLoginError(event.data?.error || "Google Authentication failed.");
        setIsGoogleLoggingIn(false);
      }
    };

    // 1. Cross-tab storage listener
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "astro_google_login_token" && e.newValue) {
        const email = safeStorage.getItem("astro_google_login_email", false) || "";
        loginWithToken(e.newValue, email);
      }
    };

    // 2. Active Polling interval (failsafe for iframes/sandboxes)
    const checkInterval = setInterval(() => {
      try {
        const token = safeStorage.getItem("astro_google_login_token", false);
        const success = safeStorage.getItem("astro_google_login_success", false);
        const email = safeStorage.getItem("astro_google_login_email", false) || "";
        if (success === "true" && token) {
          loginWithToken(token, email);
        }
      } catch (err) {
        // Safe catch
      }
    }, 450);

    // 3. Startup check for redirected query parameters (reliable fallback for sandboxed/cross-origin environments)
    try {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get("admin_token");
      const emailFromUrl = params.get("email") || "";
      const errorFromUrl = params.get("admin_error");
      
      if (tokenFromUrl) {
        loginWithToken(tokenFromUrl, emailFromUrl);
        // Clean URL params cleanly
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      } else if (errorFromUrl) {
        setAdminLoginError(errorFromUrl);
        setIsGoogleLoggingIn(false);
        setShowAdminLoginModal(true);
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch (err) {
      console.error("URL check error:", err);
    }

    window.addEventListener('message', handleGoogleMessage);
    window.addEventListener('storage', handleStorageEvent);
    
    return () => {
      window.removeEventListener('message', handleGoogleMessage);
      window.removeEventListener('storage', handleStorageEvent);
      clearInterval(checkInterval);
    };
  }, []);

  const handleAdminLogout = () => {
    safeStorage.removeItem("astro_admin_token", true);
    safeStorage.removeItem("astro_admin_token", false);
    safeStorage.removeItem("astro_user_token", true);
    safeStorage.removeItem("astro_user_token", false);
    safeStorage.removeItem("astro_user_email", false);
    setAdminToken(null);
    setIsAdminLoggedIn(false);
    setIsAdminPanelOpen(false);
    setAdminReports([]);
    setUserToken(null);
    setUserEmail(null);
    setIsUserLoggedIn(false);
  };

  const handlePrintReport = () => {
    const printContent = document.getElementById("print-area-wrapper")?.innerHTML;
    if (!printContent) {
      try {
        console.warn(lang === 'sinhala' ? "මුද්‍රණය සඳහා දත්ත සොයාගත නොහැක." : "Printable contents not found.");
        setError(lang === 'sinhala' ? "මුද්‍රණය සඳහා දත්ත සොයාගත නොහැක." : "Printable contents not found.");
      } catch (err) {
        // Safe block fallback
      }
      return;
    }

    // 1. Grab all active stylesheets & styles, converting relative links to absolute ones to avoid sandbox load limits
    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => {
        try {
          if (el.tagName.toLowerCase() === 'link') {
            const href = el.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('//')) {
              const absoluteHref = new URL(href, window.location.origin).href;
              const cloned = el.cloneNode() as HTMLLinkElement;
              cloned.setAttribute('href', absoluteHref);
              return cloned.outerHTML;
            }
          }
        } catch (err) {
          // Fallback to source HTML if anything errors out
        }
        return el.outerHTML;
      })
      .join("\n");

    // 2. Define custom styling rules to guarantee standard A4 booklet formatting
    const printStyles = `
      <style>
        @page {
          size: A4;
          margin: 0mm;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #451a03 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #print-area-wrapper {
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
            background-color: #ffffff !important;
          }
          .a4-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 15mm 20mm !important;
            width: 210mm !important;
            height: 297mm !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #0f172a !important;
            box-sizing: border-box !important;
            border: 3px double #b45309 !important; /* Gold border */
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .grid-cols-1.sm\:grid-cols-2,
          .print-grid-2 {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        
        /* Interactive preview styles for non-print mode */
        html, body {
          background-color: #f8fafc;
          margin: 0;
          padding: 12px;
          display: flex;
          justify-content: center;
          font-family: sans-serif;
        }
        #print-area-wrapper {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
          max-width: 210mm;
        }
        .a4-page {
          background: white;
          width: 100%;
          max-width: 210mm;
          min-height: auto;
          padding: 16px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
          box-sizing: border-box;
          border: 3px double #b45309;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }
        @media (min-width: 768px) {
          html, body {
            padding: 20px;
          }
          .a4-page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm 20mm;
          }
        }
      </style>
    `;

    // 3. Try opening in a new tab first (safest, ignores iframe boundaries and print blockages)
    let printWindow: Window | null = null;
    try {
      printWindow = window.open("", "_blank");
    } catch (err) {
      console.warn("window.open blocked or failed:", err);
    }
    let writeSuccess = false;
    if (printWindow) {
      try {
        printWindow.document.open();
        const docTitle = result?.birthDetails?.name ? result.birthDetails.name + " - Horoscope Report" : "Astrology Birth Charter";
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${docTitle}</title>
              ${styleTags}
              ${printStyles}
            </head>
            <body>
              <div id="print-area-wrapper">
                ${printContent}
              </div>
              <script>
                window.addEventListener('DOMContentLoaded', () => {
                  setTimeout(() => {
                    window.focus();
                    window.print();
                  }, 800);
                });
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        writeSuccess = true;
      } catch (printWriteErr) {
        console.warn("Writing to new window document failed (CORS/iframe constraint):", printWriteErr);
        try {
          printWindow.close();
        } catch (e) {}
      }
    }

    if (!writeSuccess) {
      // 4. Fallback: If Popup Blocker is enabled, render in hidden iframe
      try {
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.bottom = "0";
        iframe.style.right = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "none";
        iframe.style.opacity = "0";
        
        document.body.appendChild(iframe);
        
        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Horoscope Report</title>
                ${styleTags}
                ${printStyles}
              </head>
              <body>
                <div id="print-area-wrapper">
                  ${printContent}
                </div>
              </body>
            </html>
          `);
          iframeDoc.close();
          
          setTimeout(() => {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
              setTimeout(() => {
                document.body.removeChild(iframe);
              }, 1000);
            } catch (iframeErr) {
              console.error("Iframe print blocked:", iframeErr);
              window.print();
            }
          }, 800);
        } else {
          window.print();
        }
      } catch (fallbackErr) {
        console.error("Print fallback failed:", fallbackErr);
        window.print();
      }
    }
  };

  // Loading animation loops
  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingStepIdx(0);
      interval = setInterval(() => {
        setLoadingStepIdx(prev => (prev + 1) % LOADING_STEPS.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Scroll chat container inside to bottom (only when there are subsequent messages during active user chat)
  useEffect(() => {
    if (chatMessages.length > 1) {
      const container = document.getElementById("chatbot_messages_scroller");
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }
    }
  }, [chatMessages, chatLoading]);

  // Main generator call
  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(lang === 'sinhala' ? "කරුණාකර ඔබගේ නම ඇතුළත් කරන්න (අවම වශයෙන් එක් වචනයක් හෝ නමක්)." : "Please enter your name (at least one word or name).");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setChatMessages([]);
    setReportContactValue("");
    setUserRating(0);
    setUserComment("");
    setRatingSubmittedUs(false);

    try {
      const response = await fetch(getApiUrl("/api/astrology/calculate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          birthDate,
          birthTime,
          birthPlace: birthPlace || "Town",
          district,
          gender,
          language: lang,
        }),
      });

      if (!response.ok) {
        const errorData = await safeParseJson(response);
        throw new Error(errorData.error || "Failed to calculate horoscope chart.");
      }

      const data = await safeParseJson(response);
      const computedBirthDetails = {
        name: name || "Anonymous (කසුන්)",
        birthDate,
        birthTime,
        birthPlace: birthPlace || "Town",
        district,
        gender,
        language: lang,
      };

      setResult({
        chart: data.chart,
        birthDetails: computedBirthDetails
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An expected server error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handler to generate predictions and save/update the report
  const handleGetPredictions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) return;

    const currentEmail = userEmail || (isAdminLoggedIn ? 'sampathub89@gmail.com' : '');
    
    // Require Google Login if not logged in
    if (!currentEmail) {
      setPredictContactError(
        lang === 'sinhala' 
          ? "කේන්දර පලාපල බලගැනීමට ප්‍රථමයෙන් Google ගිණුමෙන් පිවිසෙන්න." 
          : "Please sign in with Google to view predictions."
      );
      handleGoogleConnect();
      return;
    }

    setPredictContactError("");
    setIsGeneratingPredictions(true);

    try {
      const response = await fetch(getApiUrl("/api/astrology/predict"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.birthDetails.name,
          birthDate: result.birthDetails.birthDate,
          birthTime: result.birthDetails.birthTime,
          birthPlace: result.birthDetails.birthPlace,
          district: result.birthDetails.district,
          gender: result.birthDetails.gender,
          language: result.birthDetails.language,
          userEmail: currentEmail
        })
      });

      if (!response.ok) {
        const errorData = await safeParseJson(response);
        if (errorData?.dailyLimitReached || response.status === 429) {
          setShowChatLimitModal(true);
        }
        throw new Error(errorData.error || "Failed to generate astrological predictions.");
      }

      const data = await safeParseJson(response);

      if (data && data.reportId) {
        setSavedReportId(data.reportId);
      }

      setResult(prev => {
        if (!prev) return null;
        return {
          ...prev,
          predictions: data.predictions
        };
      });

      // Initialize chat message with localized greeting
      const welcomeMsg = lang === 'sinhala'
        ? `ආයුබෝවන් ${result.birthDetails.name || 'ඔබට'}. ඔබගේ ${result.chart.lagnaSinhala} ලග්න කේන්දර සටහන සහ පලාපල සාර්ථකව ගණනය කර අවසන්. ඔබගේ කේන්දරයේ ග්‍රහ පිහිටීම් හෝ ඉදිරි කාලය ගැන ඔබට ඇති ඕනෑම ප්‍රශ්නයක් මෙතැනින් විමසන්න.`
        : `Greetings ${result.birthDetails.name || 'User'}. Your ${result.chart.lagna} Ascendant chart and readings are fully computed. Feel free to ask any specific astrological questions or request clarifications about your planetary transits, remedies, and career.`;
      
      setChatMessages([
        {
          id: "welcome-1",
          sender: "assistant",
          text: welcomeMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      // Report is auto-saved on the server in /api/astrology/predict with data.reportId
      if (data && data.reportId) {
        setSavedReportId(data.reportId);
        const currentToken = safeStorage.getItem("astro_admin_token", true) || safeStorage.getItem("astro_admin_token", false);
        if (currentToken) {
          fetchAdminReports(currentToken);
        }
      }

    } catch (err: any) {
      console.warn("Prediction API error, attempting graceful astrological fallback:", err);
      if (result && result.chart) {
        const fallbackPredictions = generateClientFallbackPredictions(result.chart, result.birthDetails, lang);
        setResult(prev => {
          if (!prev) return null;
          return {
            ...prev,
            predictions: fallbackPredictions
          };
        });
        const welcomeMsg = lang === 'sinhala'
          ? `ආයුබෝවන් ${result.birthDetails.name || 'ඔබට'}. ඔබගේ ${result.chart.lagnaSinhala} ලග්න කේන්දර සටහන සහ පලාපල සාර්ථකව ගණනය කර අවසන්. ඔබගේ කේන්දරයේ ග්‍රහ පිහිටීම් හෝ ඉදිරි කාලය ගැන ඔබට ඇති ඕනෑම ප්‍රශ්නයක් මෙතැනින් විමසන්න.`
          : `Greetings ${result.birthDetails.name || 'User'}. Your ${result.chart.lagna} Ascendant chart and readings are fully computed. Feel free to ask any specific astrological questions or request clarifications about your planetary transits, remedies, and career.`;
        
        setChatMessages([
          {
            id: "welcome-1",
            sender: "assistant",
            text: welcomeMsg,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        // Also save report to backend if possible
        try {
          fetch(getApiUrl("/api/reports/save"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contactType: 'email',
              contactValue: currentEmail,
              birthDetails: result.birthDetails,
              chart: result.chart,
              predictions: fallbackPredictions,
              userEmail: currentEmail
            })
          }).then(r => safeParseJson(r)).then(d => {
            if (d && d.reportId) setSavedReportId(d.reportId);
          }).catch(e => console.warn("Background report save ignored:", e));
        } catch (e) {}
      } else {
        setPredictContactError(err.message || "An expected server error occurred. Please try again.");
      }
    } finally {
      setIsGeneratingPredictions(false);
    }
  };

  // Chat message sending
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !result) return;

    const currentEmail = (userEmail || (result?.birthDetails?.contactValue) || reportContactValue || (isAdminLoggedIn ? 'sampathub89@gmail.com' : '')).toLowerCase().trim();
    const isUserAdmin = isAdminLoggedIn || currentEmail === 'sampathub89@gmail.com';
    const userMsgCount = chatMessages.filter(msg => msg.sender === 'user').length;

    let activeAllowedLimit = userAllowedLimit;
    if (!isUserAdmin && userMsgCount >= activeAllowedLimit) {
      const fresh = await fetchUserChatQuota(currentEmail, savedReportId || undefined, reportContactValue || undefined);
      if (fresh && typeof fresh.allowedLimit === 'number') {
        activeAllowedLimit = fresh.allowedLimit;
        setUserAllowedLimit(fresh.allowedLimit);
      }
    }

    if (!isUserAdmin && userMsgCount >= activeAllowedLimit) {
      setShowChatLimitModal(true);
      setChatMessages(prev => [...prev, {
        id: `assistant-limit-${Date.now()}`,
        sender: "assistant",
        text: lang === 'sinhala'
          ? `ඔබට හිමි AI ප්‍රශ්න (${activeAllowedLimit}) සීමාව භාවිත කර ඇත. වැඩිදුර සීමාව දීර්ඝ කරගැනීමට Admin (sampathub89@gmail.com) අමතන්න.`
          : `You have reached your limit of ${activeAllowedLimit} AI questions. For further consultations, please contact Admin at sampathub89@gmail.com.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      return;
    }

    const userMsgText = chatInput;
    setChatInput("");

    const newMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newMsg]);
    setChatLoading(true);

    try {
      const historyToSend = chatMessages.map(msg => ({
        sender: msg.sender,
        text: msg.text
      }));

      const res = await fetch(getApiUrl("/api/astrology/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDetails: result.birthDetails,
          chart: result.chart,
          predictions: result.predictions,
          message: userMsgText,
          history: historyToSend,
          reportId: savedReportId,
          userEmail: currentEmail
        })
      });

      if (!res.ok) {
        const errData = await safeParseJson(res);
        if (errData?.chatLimitReached || res.status === 429) {
          setShowChatLimitModal(true);
        }
        throw new Error(errData?.error || "Communication interruption.");
      }

      const data = await safeParseJson(res);
      
      setChatMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, {
        id: `assistant-err-${Date.now()}`,
        sender: "assistant",
        text: err.message || (lang === 'sinhala' 
          ? "පද්ධතිය කාර්යබහුලයි. කරුණාකර නැවත විමසන්න." 
          : "Astrologer connection lost. Please try again."),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Helper: return sign number for each house (1 to 12)
  const getHouseSignNumber = (houseNum: number, lagnaName: string) => {
    const zodiacMap: { [key: string]: number } = {
      "Aries": 1, "Taurus": 2, "Gemini": 3, "Cancer": 4, "Leo": 5, "Virgo": 6,
      "Libra": 7, "Scorpio": 8, "Sagittarius": 9, "Capricorn": 10, "Aquarius": 11, "Pisces": 12
    };
    const lagnaIdx = zodiacMap[lagnaName] || 1;
    return ((lagnaIdx - 1 + (houseNum - 1)) % 12) + 1;
  };

  // Helper: map sign index to Sinhala name
  const getSignNameSinhala = (idx: number) => {
    const names = ["මේෂ", "වෘෂභ", "මිථුන", "කටක", "සිංහ", "කන්‍යා", "තුලා", "වෘශ්චික", "ධනු", "මකර", "කුම්භ", "මීන"];
    return names[idx - 1] || "";
  };

  // House center points for SVG diamond Kundali layout
  const HOUSE_COORDS: { [key: number]: { x: number; y: number; numX: number; numY: number } } = {
    1: { x: 200, y: 150, numX: 200, numY: 85 },   // Top central diamond
    2: { x: 125, y: 70, numX: 110, numY: 45 },    // Top-left side
    3: { x: 70, y: 125, numX: 45, numY: 100 },    // Upper-left side
    4: { x: 110, y: 200, numX: 85, numY: 200 },   // Left central diamond
    5: { x: 75, y: 275, numX: 45, numY: 300 },    // Lower-left side
    6: { x: 125, y: 330, numX: 110, numY: 355 },  // Bottom-left side
    7: { x: 200, y: 260, numX: 200, numY: 315 },  // Bottom central diamond
    8: { x: 275, y: 330, numX: 290, numY: 355 },  // Bottom-right side
    9: { x: 330, y: 275, numX: 355, numY: 300 },  // Lower-right side
    10: { x: 290, y: 200, numX: 315, numY: 200 }, // Right central diamond
    11: { x: 330, y: 125, numX: 355, numY: 100 }, // Upper-right side
    12: { x: 275, y: 70, numX: 290, numY: 45 },   // Top-right side
  };

  return (
    <div className="min-h-screen px-2.5 py-2.5 sm:px-4 sm:py-8 focus-outline-none" id="main_container">
      {/* Floating Welcome Feedback Toast Notice (Auto-dismisses in 8 seconds) */}
      {showWelcomeFeedbackPopup && (
        <div 
          className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[9999] max-w-md w-[92vw] sm:w-[420px] p-4 bg-slate-900/95 border border-amber-500/50 backdrop-blur-md rounded-2xl shadow-2xl text-slate-100 transition-all animate-fade-in"
          id="welcome_feedback_popup_notice"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-300 tracking-wide font-sans">
                  {lang === 'sinhala' ? "ඔබගේ වටිනා අදහස සහ ප්‍රතිචාරය" : "Your Honest Feedback & Review"}
                </h4>
                <span className="text-[10px] text-amber-400/80 font-mono">
                  {lang === 'sinhala' ? "නොමිලේ ජ්‍යෝතිෂ සේවාව" : "Free Astrology Service"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowWelcomeFeedbackPopup(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="mt-2.5 text-[11px] leading-relaxed text-slate-200 font-sans bg-amber-950/30 p-2.5 rounded-xl border border-amber-500/20">
            {lang === 'sinhala'
              ? "නොමිලේ ලබාදෙන මෙම සේවාව පිළිබඳ ඔබගේ සත්‍ය අදහස සහ ප්‍රතිචාරය (හොඳ හෝ නරක, හරි හෝ වැරදි) වාර්තාව ලබාගැනීමට පෙර හෝ පසුව අප වෙත ලබාදීමට කාරුණික වන්න."
              : "Please be kind enough to provide your honest opinion and feedback (good or bad, right or wrong) about this free service before or after generating your report."
            }
          </p>

          {/* Timer Progress Bar for auto-dismiss */}
          <div className="w-full bg-slate-800/80 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 h-full animate-toast-timer" />
          </div>
        </div>
      )}

      {/* Glow Stars Overlay Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 z-0">
        <div className="absolute top-1/4 left-1/4 w-1 bg-yellow-300 h-1 rounded-full animate-ping" />
        <div className="absolute top-1/3 left-3/4 w-1 bg-white h-1 rounded-full duration-1000 animate-pulse" />
        <div className="absolute top-2/3 left-1/3 w-1.5 bg-purple-400 h-1.5 rounded-full duration-700 animate-pulse" />
        <div className="absolute top-4/5 left-4/5 w-1 bg-teal-300 h-1 rounded-full animate-ping" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* HEADER PANEL - Compact Horizontal Strip on Mobile (< md), Spacious & Elegant on Desktop */}
        <header className="flex flex-row items-center justify-between gap-2 sm:gap-4 md:gap-6 bg-slate-900/80 backdrop-blur-md rounded-xl md:rounded-2xl px-2.5 py-1.5 sm:px-3 sm:py-2 md:p-6 border border-slate-800/80 mb-3 sm:mb-4 md:mb-8 glow-purple" id="header_section">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-5 min-w-0 flex-1">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-16 md:h-16 rounded-lg md:rounded-xl overflow-hidden border border-amber-500/50 flex-shrink-0 shadow-sm">
              <img 
                src={bannerImg} 
                alt="Astrology Banner Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                id="brand_banner_logo"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xs sm:text-sm md:text-2xl lg:text-3xl font-bold font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-indigo-400 truncate leading-tight">
                {lang === 'sinhala' ? "ශ්‍රී ලාංකීය ජ්‍යෝතිෂ්‍ය කේන්දරය" : "Sri Lankan Horoscope & Horoscope Predictions"}
              </h1>
              <p className="hidden md:block text-xs text-slate-400/90 font-sans tracking-wide mt-1">
                {lang === 'sinhala' 
                  ? "උපන් වෙලාව, දිනය සහ ස්ථානය අනුව පූර්ණ නිවැරදි කේන්දර පලාපල සේවාව" 
                  : "Vedic charts, planet transits, and detailed predictions calculated live in Sri Lanka"}
              </p>
            </div>
          </div>

          {/* Global Language Toggle & Admin Portal Link */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 justify-end flex-shrink-0">
            <div className="flex items-center bg-slate-950/90 border border-slate-800 p-0.5 md:p-1 rounded-lg md:rounded-xl">
              <button
                onClick={() => setLang('sinhala')}
                className={`px-2 py-1 md:px-4 md:py-1.5 rounded-md md:rounded-lg text-[10px] sm:text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                  lang === 'sinhala' 
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
                id="lang_sinhala_btn"
                title="සිංහල"
              >
                <span className="hidden sm:inline">සිංහල (Sinhala)</span>
                <span className="sm:hidden">සිංහල</span>
              </button>
              <button
                onClick={() => setLang('english')}
                className={`px-2 py-1 md:px-4 md:py-1.5 rounded-md md:rounded-lg text-[10px] sm:text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                  lang === 'english' 
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
                id="lang_english_btn"
                title="English"
              >
                <span className="hidden sm:inline">English</span>
                <span className="sm:hidden">EN</span>
              </button>
            </div>

            {/* Dynamic Sign-In & Admin Isolation Header Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              {(isUserLoggedIn || isAdminLoggedIn) ? (
                /* Authenticated State Display */
                <div className="flex items-center gap-1 sm:gap-2 border border-slate-800 bg-slate-950/60 rounded-lg md:rounded-xl px-2 py-1 md:px-3 md:py-1.5 text-[10px] sm:text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
                  <span className="max-w-[70px] sm:max-w-[110px] md:max-w-[145px] truncate font-sans">
                    {isAdminLoggedIn ? "Admin" : userEmail}
                  </span>
                  <button 
                    onClick={handleAdminLogout} 
                    className="ml-1 text-slate-400 hover:text-rose-400 font-bold transition-all text-[9px] uppercase font-sans cursor-pointer hover:underline"
                    title="Logout"
                  >
                    {lang === 'sinhala' ? "ඉවත්" : "Exit"}
                  </button>
                </div>
              ) : (
                /* Unauthenticated State: Show general user Google Sign-In */
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoggingIn}
                  className="px-2.5 py-1 md:px-4 md:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg md:rounded-xl text-[10px] sm:text-xs font-semibold tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-md transform active:scale-95 disabled:opacity-50 flex-shrink-0"
                  id="google_signin_trigger_btn"
                >
                  <Unlock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span className="hidden sm:inline">{lang === 'sinhala' ? "ඇතුල් වන්න" : "Sign In"}</span>
                  <span className="sm:hidden">{lang === 'sinhala' ? "ඇතුල්" : "Sign In"}</span>
                </button>
              )}

              {/* Show Admin Panel button STRICTLY only for the verified Admin account */}
              {isAdminLoggedIn && (
                <button
                  onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)}
                  className="px-2 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[10px] sm:text-xs font-semibold tracking-wider transition-all cursor-pointer flex items-center gap-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold animate-pulse flex-shrink-0"
                  id="admin_portal_toggle_btn"
                >
                  <Award className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span className="hidden sm:inline">{lang === 'sinhala' ? "ඇඩ්මින් පැනලය" : "Admin Panel"}</span>
                  <span className="sm:hidden">Admin</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* MAIN BODY: SPLIT ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: INPUT FORM SHEET (Span 4) */}
          <aside className="lg:col-span-4 bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800 glow-purple" id="sidebar_input_form">
            
            {/* 3 PRIMARY SERVICE SELECTION BUTTONS - DISPLAYED WHEN NO SERVICE IS SELECTED */}
            {!selectedMainTab && (
              <div className="space-y-3 font-sans mb-2 animate-fade-in" id="main_service_selection_cards">
                <div className="text-center pb-2.5 border-b border-slate-800">
                  <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-1.5 text-lg text-amber-400 shadow-sm">
                    🌌
                  </div>
                  <h3 className="text-sm font-bold font-display text-slate-100">
                    {lang === 'sinhala' ? "ප්‍රධාන සේවාව තෝරන්න" : "Select Primary Service"}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    {lang === 'sinhala'
                      ? "ඔබට අවශ්‍ය සේවාව පහතින් තෝරා ඉදිරියට යන්න"
                      : "Choose your preferred service below to proceed"}
                  </p>
                </div>

                {/* 1. Horoscope & Predictions Button */}
                <button
                  type="button"
                  onClick={() => setSelectedMainTab('horoscope')}
                  className="w-full p-3.5 rounded-xl text-left transition-all duration-200 group cursor-pointer shadow-lg active:scale-[0.99] relative overflow-hidden flex items-center justify-between gap-3 bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-purple-600/25 border border-amber-500/50 hover:border-amber-300 text-slate-100 hover:from-amber-500/35 hover:to-purple-600/35 shadow-amber-500/5"
                  id="main_btn_horoscope"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 shadow-md transition-transform group-hover:scale-105 bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950">
                      ☸️
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold font-display truncate text-slate-100 group-hover:text-amber-300">
                          {lang === 'sinhala' ? "1. කේන්දර සටහන සහ පලාපල" : "1. Horoscope & Predictions"}
                        </h4>
                      </div>
                      <p className="text-[10px] mt-0.5 truncate text-slate-300">
                        {lang === 'sinhala'
                          ? "ජන්ම පත්‍රය, නවඅංශය, ලග්නාධිපති හා පූර්ණ පලාපල."
                          : "Birth chart & detailed predictions."}
                      </p>
                    </div>
                  </div>
                  <span className="text-amber-300 text-xs font-bold group-hover:translate-x-1 transition-transform shrink-0">➔</span>
                </button>

                {/* 2. Palmistry Reading Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMainTab('palmistry');
                    setShowPalmistryModal(true);
                  }}
                  className="w-full p-3.5 rounded-xl text-left transition-all duration-200 group cursor-pointer shadow-lg active:scale-[0.99] relative overflow-hidden flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-500/25 via-purple-500/20 to-pink-600/25 border border-indigo-500/50 hover:border-indigo-300 text-slate-100 hover:from-indigo-500/35 hover:to-pink-600/35 shadow-indigo-500/5"
                  id="main_btn_palmistry"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 shadow-md transition-transform group-hover:scale-105 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                      ✋
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold font-display truncate text-slate-100 group-hover:text-indigo-300">
                          {lang === 'sinhala' ? "2. හස්තරේඛා පරීක්ෂාව" : "2. Palmistry Reading"}
                        </h4>
                      </div>
                      <p className="text-[10px] mt-0.5 truncate text-slate-300">
                        {lang === 'sinhala'
                          ? "අත්ලෙහි ඡායාරූපයෙන් පූර්ණ හස්තරේඛා පලාපල."
                          : "Upload palm photo for reading."}
                      </p>
                    </div>
                  </div>
                  <span className="text-indigo-300 text-xs font-bold group-hover:translate-x-1 transition-transform shrink-0">➔</span>
                </button>

                {/* 3. Body Features Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMainTab('dehalakshana');
                    setShowDehalakshanaModal(true);
                  }}
                  className="w-full p-3.5 rounded-xl text-left transition-all duration-200 group cursor-pointer shadow-lg active:scale-[0.99] relative overflow-hidden flex items-center justify-between gap-3 bg-gradient-to-r from-teal-500/25 via-emerald-500/20 to-cyan-600/25 border border-teal-500/50 hover:border-teal-300 text-slate-100 hover:from-teal-500/35 hover:to-cyan-600/35 shadow-teal-500/5"
                  id="main_btn_dehalakshana"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 shadow-md transition-transform group-hover:scale-105 bg-gradient-to-br from-teal-500 to-emerald-600 text-slate-950">
                      👤
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold font-display truncate text-slate-100 group-hover:text-teal-300">
                          {lang === 'sinhala' ? "3. දේහ ලක්ෂණ පරීක්ෂාව" : "3. Body Features Analysis"}
                        </h4>
                      </div>
                      <p className="text-[10px] mt-0.5 truncate text-slate-300">
                        {lang === 'sinhala'
                          ? "ශරීර අංග සහ ලක්ෂණ මගින් පලාපල."
                          : "Physical body feature analysis."}
                      </p>
                    </div>
                  </div>
                  <span className="text-teal-300 text-xs font-bold group-hover:translate-x-1 transition-transform shrink-0">➔</span>
                </button>
              </div>
            )}

            {/* PALMISTRY ACTIVE CARD IN SIDEBAR (WHEN PALMISTRY IS SELECTED) */}
            {selectedMainTab === 'palmistry' && (
              <div className="space-y-4 font-sans text-center py-5 px-4 bg-slate-950/70 rounded-2xl border border-indigo-500/40 shadow-xl mb-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✋</span>
                    <h3 className="text-sm font-bold font-display text-slate-100">
                      {lang === 'sinhala' ? "හස්තරේඛා පරීක්ෂාව" : "Palmistry Analysis"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPalmistryModal(false);
                      setSelectedMainTab(null);
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/60 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-sans font-bold flex items-center gap-1 shadow-sm"
                    title={lang === 'sinhala' ? "වසා දමන්න" : "Close"}
                  >
                    ✕ {lang === 'sinhala' ? "වසා දමන්න" : "Close"}
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === 'sinhala' 
                    ? "හස්තරේඛා පරීක්ෂණ මෙනුව විවෘතව පවතී. අත්ලෙහි ඡායාරූපයක් එක් කර පරීක්ෂාව සිදු කරන්න." 
                    : "Palmistry analysis window is open. Upload palm photo to analyze."}
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPalmistryModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <span>✋</span>
                    <span>{lang === 'sinhala' ? "මෙනුව විවෘත කරන්න" : "Open Reading Menu"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPalmistryModal(false);
                      setSelectedMainTab(null);
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    ✕ {lang === 'sinhala' ? "වසා දමන්න" : "Close"}
                  </button>
                </div>
              </div>
            )}

            {/* DEHALAKSHANA ACTIVE CARD IN SIDEBAR (WHEN DEHALAKSHANA IS SELECTED) */}
            {selectedMainTab === 'dehalakshana' && (
              <div className="space-y-4 font-sans text-center py-5 px-4 bg-slate-950/70 rounded-2xl border border-teal-500/40 shadow-xl mb-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👤</span>
                    <h3 className="text-sm font-bold font-display text-slate-100">
                      {lang === 'sinhala' ? "දේහ ලක්ෂණ පරීක්ෂාව" : "Body Features Analysis"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDehalakshanaModal(false);
                      setSelectedMainTab(null);
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/60 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-sans font-bold flex items-center gap-1 shadow-sm"
                    title={lang === 'sinhala' ? "වසා දමන්න" : "Close"}
                  >
                    ✕ {lang === 'sinhala' ? "වසා දමන්න" : "Close"}
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === 'sinhala' 
                    ? "දේහ ලක්ෂණ පරීක්ෂණ මෙනුව විවෘතව පවතී. ඡායාරූපයක් එක් කර සාමුද්‍රිකා පරීක්ෂාව සිදු කරන්න." 
                    : "Body features analysis window is open. Upload photo to analyze."}
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDehalakshanaModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <span>👤</span>
                    <span>{lang === 'sinhala' ? "මෙනුව විවෘත කරන්න" : "Open Reading Menu"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDehalakshanaModal(false);
                      setSelectedMainTab(null);
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    ✕ {lang === 'sinhala' ? "වසා දමන්න" : "Close"}
                  </button>
                </div>
              </div>
            )}

            {/* EXPANDED VIEW: BIRTH INFORMATION FORM (WHEN HOROSCOPE IS SELECTED) */}
            {selectedMainTab === 'horoscope' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between gap-2.5 mb-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 shadow-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Compass className="w-5 h-5 text-amber-400 animate-spin-slow flex-shrink-0" />
                    <h3 className="text-sm sm:text-base font-bold font-display text-slate-100 truncate">
                      {lang === 'sinhala' ? "උපත් තොරතුරු ඇතුලත් කරන්න" : "Birth Information Details"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMainTab(null)}
                    className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-sans font-bold flex items-center gap-1 shadow-sm flex-shrink-0"
                    title={lang === 'sinhala' ? "වසා දමන්න" : "Close"}
                  >
                    ✕ {lang === 'sinhala' ? "වසා දමන්න" : "Close"}
                  </button>
                </div>

                <form onSubmit={handleCalculate} className="space-y-5" id="astro_input_form">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      {lang === 'sinhala' ? "සම්පූර්ණ නම (අනිවාර්යයි)" : "Full Name (Required)"} *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={lang === 'sinhala' ? "උදා: කසුන් පෙරේරා" : "e.g., Kasun Perera"}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-sans"
                        id="input_name"
                      />
                    </div>
                  </div>

                  {/* Selector Mode Toggle */}
                  <div className="flex flex-col gap-1 border-b border-slate-800/60 pb-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-450 font-medium font-sans">
                        {lang === 'sinhala' ? "තේරීම් ක්‍රමය" : "Input Mode"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPickerMode(pickerMode === 'dropdown' ? 'calendar' : 'dropdown')}
                        className="text-[11px] font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer bg-slate-950/40 px-2 py-0.5 rounded-md border border-slate-805/50"
                        id="toggle_picker_mode_btn"
                      >
                        {pickerMode === 'dropdown' ? (
                          <>
                            <Calendar className="w-3.5 h-3.5 text-amber-500" />
                            <span>{lang === 'sinhala' ? "කැලැන්ඩරය භාවිත කරන්න" : "Use Calendar Picker"}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>{lang === 'sinhala' ? "ලැයිස්තුවෙන් තෝරන්න" : "Use Lists / Dropdowns"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {pickerMode === 'dropdown' ? (
                    <div className="space-y-4">
                      {/* Dropdown-based Date Selectors */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          {lang === 'sinhala' ? "උපන් දිනය (දිනය / මාසය / අවුරුද්ද)" : "Birth Date (Day / Month / Year)"} *
                        </label>
                        <div className="grid grid-cols-12 gap-2" id="dropdown_birth_date_grid">
                          {/* Day Select */}
                          <div className="col-span-3 relative">
                            <select
                              value={currentDay}
                              onChange={(e) => handleDayChange(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-1 text-xs text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none cursor-pointer text-center font-mono"
                              id="select_birth_day"
                            >
                              {DAYS.map(d => (
                                <option key={d} value={d}>{parseInt(d, 10)}</option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500">
                              <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                              </svg>
                            </div>
                          </div>

                          {/* Month Select */}
                          <div className="col-span-5 relative">
                            <select
                              value={currentMonth}
                              onChange={(e) => handleMonthChange(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-1 text-xs text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none cursor-pointer font-sans"
                              id="select_birth_month"
                            >
                              {MONTHS.map(m => (
                                <option key={m.value} value={m.value}>
                                  {lang === 'sinhala' ? m.nameSi : m.nameEn}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center pr-1 text-slate-500">
                              <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                              </svg>
                            </div>
                          </div>

                          {/* Year Select */}
                          <div className="col-span-4 relative">
                            <select
                              value={currentYear}
                              onChange={(e) => handleYearChange(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-1 text-xs text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none cursor-pointer text-center font-mono"
                              id="select_birth_year"
                            >
                              {YEARS.map(yr => (
                                <option key={yr} value={yr}>{yr}</option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500">
                              <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown-based Time Selectors */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          {lang === 'sinhala' ? "උපන් වේලාව (පැය / මිනිත්තු)" : "Birth Time (Hours / Minutes)"} *
                        </label>
                        <div className="grid grid-cols-3 gap-2" id="dropdown_birth_time_grid">
                          {/* Hour Select */}
                          <div className="relative">
                            <select
                              value={String(currentHour12)}
                              onChange={(e) => handleHourChange(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none cursor-pointer text-center font-mono"
                              id="select_birth_hour"
                            >
                              {HOURS.map(h => (
                                <option key={h} value={h}>{h.padStart(2, "0")}</option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500">
                              <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                              </svg>
                            </div>
                          </div>

                          {/* Minutes Select */}
                          <div className="relative">
                            <select
                              value={currentMinStr}
                              onChange={(e) => handleMinuteChange(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none cursor-pointer text-center font-mono"
                              id="select_birth_minute"
                            >
                              {MINUTES.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500">
                              <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                              </svg>
                            </div>
                          </div>

                          {/* AM / PM Select */}
                          <div className="relative">
                            <select
                              value={currentAmPm}
                              onChange={(e) => handleAmPmChange(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none cursor-pointer text-center font-sans font-semibold text-slate-200"
                              id="select_birth_ampm"
                            >
                              <option value="AM">{lang === 'sinhala' ? "පෙ.ව. (AM)" : "AM"}</option>
                              <option value="PM">{lang === 'sinhala' ? "ප.ව. (PM)" : "PM"}</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500">
                              <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          {lang === 'sinhala' ? "උපන් දිනය" : "Birth Date"} *
                        </label>
                        <div className="relative font-mono">
                          <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                          <input
                            type="date"
                            required
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                            id="input_birth_date"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          {lang === 'sinhala' ? "උපන් වේලාව" : "Birth Time"} *
                        </label>
                        <div className="relative font-mono">
                          <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                          <input
                            type="time"
                            required
                            value={birthTime}
                            onChange={(e) => setBirthTime(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                            id="input_birth_time"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Historical Sri Lanka Clock Change Notice (1996 - 2006) */}
                  {(() => {
                    const dstInfo = getHistoricalSriLankaDstInfo(birthDate);
                    if (!dstInfo) return null;
                    return (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3 animate-fade-in shadow-sm shadow-amber-950/20" id="historical_dst_notice">
                        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-semibold text-amber-300 text-xs flex items-center gap-2">
                            <span>{lang === 'sinhala' ? dstInfo.titleSi : dstInfo.titleEn}</span>
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-mono font-bold text-[10px]">
                              {dstInfo.offset}
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-amber-200/90 font-sans">
                            {lang === 'sinhala' ? dstInfo.messageSi : dstInfo.messageEn}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      {lang === 'sinhala' ? "උපන් ස්ථානය/නගරය (ශ්‍රී ලංකාව)" : "Birth Town/City (Sri Lanka)"}
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={birthPlace}
                        onChange={(e) => setBirthPlace(e.target.value)}
                        placeholder={lang === 'sinhala' ? "උදා: මහරගම හෝ මහනුවර" : "e.g., Maharagama or Kandy"}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                        id="input_birth_place"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      {lang === 'sinhala' ? "උපන් දිස්ත්‍රික්කය" : "Birth District"} *
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none cursor-pointer"
                        id="select_district"
                      >
                        {DISTRICTS.map((dst) => (
                          <option key={dst.en} value={dst.en}>
                            {lang === 'sinhala' ? `${dst.si} (${dst.en})` : `${dst.en} (${dst.si})`}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      {lang === 'sinhala' ? "ස්ත්‍රී / පුරුෂ භාවය" : "Gender"}
                    </label>
                    <div className="grid grid-cols-2 gap-3" id="gender_selector">
                      <button
                        type="button"
                        onClick={() => setGender("Male")}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                          gender === "Male"
                            ? "bg-amber-500/10 border-amber-500 text-amber-400"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                        id="gender_male_btn"
                      >
                        {lang === 'sinhala' ? "පුරුෂ" : "Male"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender("Female")}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                          gender === "Female"
                            ? "bg-amber-500/10 border-amber-500 text-amber-400"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                        id="gender_female_btn"
                      >
                        {lang === 'sinhala' ? "ස්ත්‍රී" : "Female"}
                      </button>
                    </div>
                  </div>

                  {/* MAIN HOROSCOPE SUBMIT BUTTON */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-slate-950 text-sm font-bold font-display py-3 px-4 rounded-xl transition-all shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer font-sans"
                    id="calculate_horoscope_btn"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        <span>{lang === 'sinhala' ? "ගණනය වෙමින් පවතී..." : "Calculating..."}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        <span>{lang === 'sinhala' ? "කේන්දර සටහන බලන්න" : "Generate Horoscope Readings"}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {result && (
              <button
                type="button"
                onClick={handleClearData}
                className="w-full mt-3 bg-rose-950/20 hover:bg-rose-900/20 text-rose-400 hover:text-rose-300 border border-rose-900/30 text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer transform hover:scale-[1.01] active:scale-[0.99] font-sans"
                id="clear_calc_data_btn"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{lang === 'sinhala' ? "දත්ත මකන්න (Clear Data)" : "Clear Data / Start Over"}</span>
              </button>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-950/20 border border-red-900/60 rounded-xl flex gap-3 text-red-200 text-xs text-left" id="error_alert">
                <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">{lang === 'sinhala' ? "යම් දෝෂයක් සිදු විය" : "Calculation Error"}</p>
                  <p className="opacity-90 leading-normal">{error}</p>
                </div>
              </div>
            )}
          </aside>

          {/* RIGHT COLUMN: REVIEWS & CHART VISUAL (Span 8) */}
          <main className="lg:col-span-8 flex flex-col gap-8">
            
            {userReportLoadedMsg && (
              <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-xl p-4 text-center flex items-center justify-center gap-2.5 animate-fade-in shadow-lg shadow-emerald-500/5">
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse shrink-0" />
                <span className="text-xs font-semibold text-emerald-200">
                  {userReportLoadedMsg}
                </span>
              </div>
            )}
            
            {/* INITIAL BLANK / EMPTY PLACEHOLDER */}
            {!loading && !result && (
              <section className="flex flex-col items-center justify-center text-center p-12 bg-slate-900/20 rounded-2xl border-2 border-dashed border-slate-800 py-24" id="placeholder_view">
                <div className="w-20 h-20 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mb-6 shadow-md shadow-purple-500/5">
                  <Sparkles className="w-9 h-9 text-amber-400 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold font-display text-slate-200 mb-2">
                  {lang === 'sinhala' ? "ඔබේ හඳහන මෙතැනින් බලන්න" : "Explore Your Spiritual Horoscope"}
                </h3>
                <p className="text-slate-400 text-xs max-w-sm leading-relaxed font-sans">
                  {lang === 'sinhala' 
                    ? "ඔබගේ උපන් දිනය, වේලාව සහ ස්ථානය ඇතුලත් කර 'කේන්දර සටහන බලන්න' බොත්තම ඔබන්න. පූර්ණ ලග්න කේන්දර රූප සටහන සහ පලාපල මෙතැනින් දිස්වනු ඇත."
                    : "Fill in your birth coordinates to map the heavenly nodes. You will receive an authentic Hela diamond-mesh chart and detailed Sanskrit predictions."}
                </p>
              </section>
            )}

            {/* LOADING STATE TRANSLITION SHEET */}
            {loading && (
              <section className="flex flex-col items-center justify-center text-center p-12 bg-slate-900/20 rounded-2xl border border-slate-800/80 py-28" id="loading_view">
                <div className="relative w-28 h-28 mb-8" id="rotating_zodiac_wheel">
                  {/* Astrology outer spinner */}
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/30 animate-spin-slow" />
                  <div className="absolute inset-2 rounded-full border border-purple-500/20 animate-spin" style={{ animationDuration: '6s' }} />
                  {/* Astrology central glowing core */}
                  <div className="absolute inset-6 rounded-full bg-slate-950 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
                    <Compass className="w-8 h-8 text-amber-400 animate-spin-slow" />
                  </div>
                </div>
                
                {/* Dynamically changing transitional spiritual text */}
                <h4 className="text-sm font-semibold font-sans text-amber-300 tracking-wider h-6 animate-pulse" id="loading_step_text">
                  {LOADING_STEPS[loadingStepIdx][lang]}
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mt-3 leading-relaxed">
                  {lang === 'sinhala'
                    ? "විශ්ව කේන්ද්‍රස්ථාන හා ග්‍රහ වස්තූන් අතර සැබෑ පිහිටීම් ගණනය කරමින් පවතී. කරුණාකර සුළු මොහොතක් රැඳී සිටින්න..."
                    : "Fetching absolute transit patterns. Aligning astronomical planetary paths using AI cosmic systems..."}
                </p>
              </section>
            )}

            {/* ASTROLOGY HOROSCOPE RESULT PRESENTATION */}
            {result && !loading && (
              <div className="space-y-8 animate-fade-in" id="result_section">
                
                {/* 0. HISTORICAL TIME ADJUSTMENT BANNER (if applicable) */}
                {(() => {
                  const bDate = result?.birthDetails?.birthDate;
                  const tz = result?.chart?.timezoneInfo;
                  const dstFallback = getHistoricalSriLankaDstInfo(bDate);
                  const isAdjusted = tz ? tz.isHistoricalAdjusted : Boolean(dstFallback);
                  if (!isAdjusted) return null;
                  const offsetLabel = tz?.timezoneLabel || dstFallback?.offset || "UTC+6:00";

                  return (
                    <section className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200" id="historical_dst_report_badge">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-amber-300 text-xs sm:text-sm flex items-center gap-2">
                            <span>{lang === 'sinhala' ? "ඓතිහාසික ඔරලෝසු වේලා සංශෝධනය" : "Historical Clock Time Adjustment"}</span>
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-mono font-bold text-[10px]">
                              {offsetLabel}
                            </span>
                          </div>
                          <p className="text-xs text-amber-200/85 mt-0.5 max-w-2xl leading-relaxed">
                            {lang === 'sinhala' 
                              ? `උප්පැන්න සහතිකයේ සටහන් වේලාව (${result?.birthDetails?.birthTime || ''}) එකල පැවති ${offsetLabel} ඔරලෝසු වේලාවට අනුකූලව සැබෑ විශ්ව තාරකා විද්‍යාත්මක වේලාවට ස්වයංක්‍රීයව පරිවර්තනය කර නිවැරදිව ගණනය කර ඇත.`
                              : `The birth certificate time (${result?.birthDetails?.birthTime || ''}) has been calibrated from historical ${offsetLabel} clock time to exact universal astronomical time.`
                            }
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 font-medium text-[11px]">
                        {lang === 'sinhala' ? "✓ ස්වයංක්‍රීයව ගලපා ඇත" : "✓ Calibrated"}
                      </span>
                    </section>
                  );
                })()}

                {/* 1. REPORT HERO DATA CARDS */}
                <section className="col-span-full grid grid-cols-1 sm:grid-cols-3 gap-4" id="horoscope_hero_summary">
                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 text-center relative overflow-hidden flex flex-col justify-center items-center">
                    <div className="absolute top-2 right-2 opacity-5">
                      <Award className="w-16 h-16" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      {lang === 'sinhala' ? "ලග්නය" : "Ascendant (Lagna)"}
                    </span>
                    <span className="text-xl md:text-2xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                      {lang === 'sinhala' ? `${result.chart.lagnaSinhala} ලග්නය` : result.chart.lagna}
                    </span>
                  </div>

                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 text-center relative overflow-hidden flex flex-col justify-center items-center">
                    <div className="absolute top-2 right-2 opacity-5">
                      <Moon className="w-16 h-16" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      {lang === 'sinhala' ? "චන්ද්‍ර රාශිය" : "Moon Sign (Rashi)"}
                    </span>
                    <span className="text-xl md:text-2xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-sky-200">
                      {lang === 'sinhala' ? `${result.chart.rashiSinhala} රාශිය` : result.chart.rashi}
                    </span>
                  </div>

                  <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 text-center relative overflow-hidden flex flex-col justify-center items-center">
                    <div className="absolute top-2 right-2 opacity-5">
                      <Sun className="w-16 h-16" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      {lang === 'sinhala' ? "උපන් නැකත" : "Birth Star (Nakshatra)"}
                    </span>
                    <span className="text-xl md:text-2xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-200">
                      {lang === 'sinhala' ? `${result.chart.nakshatraSinhala} නැකත` : result.chart.nakshatra}
                    </span>
                  </div>
                </section>

                {/* 2. COMPACT VISUALIZATION ROW: CHART AND TABLE */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch" id="visual_chart_row">
                  
                  {/* SVG Traditional Hela Kendraya (Lagna D1) */}
                  <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-between" id="visual_kendraya_box">
                    <div className="w-full flex justify-between items-center mb-4 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                      <span className="text-[11px] font-medium text-slate-300">
                        {lang === 'sinhala' ? "ලග්න කේන්දර සටහන (D1)" : "Lagna Kundali Birth Chart (D1)"}
                      </span>
                      {/* Language toggler for chart symbols */}
                      <button 
                        onClick={() => setChartLang(prev => prev === 'sinhala' ? 'english' : 'sinhala')}
                        className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-600/40 px-2 py-1 rounded hover:bg-amber-500/30 cursor-pointer text-right uppercase tracking-wider"
                      >
                        {chartLang === 'sinhala' ? "Eng Symbols" : "සින්හල සංකේත"}
                      </button>
                    </div>

                    {/* SVG Drawn traditional 3x3 grid chart (Sri Lankan standard format) */}
                    <div className="relative w-full max-w-[310px] aspect-square flex items-center justify-center bg-white rounded-xl p-4 border border-violet-200 shadow-md shadow-amber-500/5 hover:border-amber-500/30 transition-all duration-300" id="svg_kendraya_wrapper">
                      {(() => {
                        const ascendantDetail = Array.isArray(result?.chart?.planetaryDetails)
                          ? result.chart.planetaryDetails.find(
                              p => p && (p.planet === "Ascendant" || p.planet === "Lagna")
                            )
                          : null;
                        let lagnaDisplayDegree = "27:41:06";
                        if (ascendantDetail?.degree) {
                          const digits = ascendantDetail.degree.match(/\d+/g);
                          if (digits && digits.length >= 2) {
                            const deg = digits[0].padStart(2, "0");
                            const min = digits[1].padStart(2, "0");
                            const sec = digits[2] ? digits[2].padStart(2, "0") : "00";
                            lagnaDisplayDegree = `${deg}:${min}:${sec}`;
                          } else if (digits && digits.length === 1) {
                            lagnaDisplayDegree = `${digits[0].padStart(2, "0")}:00:00`;
                          }
                        }

                        return (
                          <svg viewBox="0 0 390 390" className="w-full h-full text-slate-700 font-sans" id="birth_chart_svg">
                            {/* Pure white background canvas */}
                            <rect x="0" y="0" width="390" height="390" fill="#ffffff" rx="8" />

                            {/* 3x3 Grid Lines */}
                            {/* Horizontal divisions */}
                            <line x1="0" y1="130" x2="390" y2="130" stroke="#cbd5e1" strokeWidth="1.5" />
                            <line x1="0" y1="260" x2="390" y2="260" stroke="#cbd5e1" strokeWidth="1.5" />
                            {/* Vertical divisions */}
                            <line x1="130" y1="0" x2="130" y2="390" stroke="#cbd5e1" strokeWidth="1.5" />
                            <line x1="260" y1="0" x2="260" y2="390" stroke="#cbd5e1" strokeWidth="1.5" />

                            {/* Outer square borders */}
                            <rect x="1" y="1" width="388" height="388" fill="none" stroke="#cbd5e1" strokeWidth="2" />

                            {/* Corner Diagonal Lines */}
                            {/* Top-Left Cell Diagonal (House 2 & 3) */}
                            <line x1="0" y1="0" x2="130" y2="130" stroke="#cbd5e1" strokeWidth="1.5" />
                            {/* Bottom-Left Cell Diagonal (House 5 & 6) */}
                            <line x1="0" y1="390" x2="130" y2="260" stroke="#cbd5e1" strokeWidth="1.5" />
                            {/* Bottom-Right Cell Diagonal (House 8 & 9) */}
                            <line x1="260" y1="260" x2="390" y2="390" stroke="#cbd5e1" strokeWidth="1.5" />
                            {/* Top-Right Cell Diagonal (House 11 & 12) */}
                            <line x1="260" y1="130" x2="390" y2="0" stroke="#cbd5e1" strokeWidth="1.5" />

                            {/* Center Square (C5) Custom Styling */}
                            <rect x="131" y="131" width="128" height="128" fill="#fcfbf8" rx="4" />

                            {/* Draw contents for all 12 houses */}
                            {HOUSE_METADATA.map((meta) => {
                              const zodiacSignIndex = getHouseSignNumber(meta.house, result?.chart?.lagna || "Aries");
                              let housePlacements = result?.chart?.housePlacements || {};
                              
                              // Fallback: Reconstruct housePlacements from planetaryDetails if empty/missing
                              if (Object.keys(housePlacements).length === 0 && Array.isArray(result?.chart?.planetaryDetails)) {
                                const reconstructed: { [key: string]: string[] } = {
                                  "1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": [], "10": [], "11": [], "12": []
                                };
                                result.chart.planetaryDetails.forEach((p: any) => {
                                  if (p && p.house) {
                                    const hKey = p.house.toString();
                                    if (!reconstructed[hKey]) reconstructed[hKey] = [];
                                    if (!reconstructed[hKey].includes(p.planet)) {
                                      reconstructed[hKey].push(p.planet);
                                    }
                                  }
                                });
                                housePlacements = reconstructed;
                              }
                              const planetsInHouse = Array.isArray(housePlacements[meta.house]) ? housePlacements[meta.house] : [];

                              // Format planetary abbreviations
                              const formattedPlanets = planetsInHouse.map(planetName => {
                                const symbolInfo = PLANET_SYMBOLS[planetName] || { 
                                  en: planetName.substring(0, 2), 
                                  si: planetName.substring(0, 1) 
                                };
                                const displaySymbol = chartLang === 'sinhala' ? symbolInfo.si : symbolInfo.en;
                                const isAsc = planetName === 'Ascendant' || planetName === 'Lagna';
                                const prefix = (chartLang === 'sinhala' && !isAsc) ? "-" : "";
                                const text = prefix + displaySymbol;
                                const color = CHART_PLANET_COLORS[planetName]?.text || "#1e293b";
                                return { name: planetName, text, color };
                              });

                               return (
                                <g key={meta.house} id={`house_group_${meta.house}`}>
                                  {/* RASHI NUMBER INDICATOR */}
                                  {meta.rashiBadge ? (
                                    meta.rashiBadge.type === "green-box" ? (
                                      <g id={`rashi_badge_house_${meta.house}`}>
                                        <rect 
                                          x={meta.rashiBadge.x} 
                                          y={meta.rashiBadge.y} 
                                          width="18" 
                                          height="18" 
                                          rx="3" 
                                          fill="#0d9488" 
                                        />
                                        <text 
                                          x={meta.rashiBadge.x + 9} 
                                          y={meta.rashiBadge.y + 14} 
                                          fill="#ffffff" 
                                          fontSize="13" 
                                          fontWeight="bold" 
                                          textAnchor="middle"
                                          className="font-handwritten"
                                        >
                                          {zodiacSignIndex}
                                        </text>
                                      </g>
                                    ) : (
                                      <g id={`rashi_badge_house_${meta.house}`}>
                                        <circle 
                                          cx={meta.rashiBadge.cx} 
                                          cy={meta.rashiBadge.cy} 
                                          r="9" 
                                          fill="#0d9488" 
                                        />
                                        <text 
                                          x={meta.rashiBadge.cx} 
                                          y={meta.rashiBadge.cy + 4.5} 
                                          fill="#ffffff" 
                                          fontSize="12" 
                                          fontWeight="bold" 
                                          textAnchor="middle"
                                          className="font-handwritten"
                                        >
                                          {zodiacSignIndex}
                                        </text>
                                      </g>
                                    )
                                  ) : (
                                    meta.rashiLabel && (
                                      <text 
                                        x={meta.rashiLabel.x} 
                                        y={meta.rashiLabel.y} 
                                        fill={meta.rashiLabel.color} 
                                        fontSize="13" 
                                        fontWeight="bold" 
                                        textAnchor="middle"
                                        className="font-handwritten"
                                      >
                                        {zodiacSignIndex}
                                      </text>
                                    )
                                  )}

                                  {/* HOUSE CIRCLE BADGE (BHAVA LABEL) */}
                                  {meta.houseCircle && (
                                    <g id={`house_circle_${meta.house}`}>
                                      <circle 
                                        cx={meta.houseCircle.cx} 
                                        cy={meta.houseCircle.cy} 
                                        r="10.5" 
                                        fill="#f1f5f9" 
                                        stroke="#cbd5e1" 
                                        strokeWidth="1" 
                                      />
                                      <text 
                                        x={meta.houseCircle.cx} 
                                        y={meta.houseCircle.cy + 4.5} 
                                        fill="#4f46e5" 
                                        fontSize="12" 
                                        fontWeight="bold" 
                                        textAnchor="middle"
                                        className="font-handwritten"
                                      >
                                        {meta.houseCircle.text}
                                      </text>
                                    </g>
                                  )}

                                  {/* CELL ARUDHA / AUX LABELS */}
                                  {meta.label && (
                                    <text 
                                      x={meta.label.x} 
                                      y={meta.label.y} 
                                      fill={meta.label.color} 
                                      fontSize="11" 
                                      fontWeight="bold" 
                                      className="font-handwritten"
                                    >
                                      {meta.label.text}
                                    </text>
                                  )}

                                  {/* PLANET SYMBOLS */}
                                  {formattedPlanets.length > 0 && (
                                    <g id={`planets_house_${meta.house}`}>
                                      <text 
                                        x={meta.centroid.x} 
                                        y={meta.centroid.y + 2} 
                                        textAnchor="middle" 
                                        fontSize="16" 
                                        fontWeight="bold"
                                        className="font-handwritten"
                                      >
                                        {formattedPlanets.map((p, pIdx) => (
                                          <tspan key={p.name} fill={p.color} dx={pIdx > 0 ? "6" : "0"}>
                                            {p.text}
                                          </tspan>
                                        ))}
                                      </text>
                                    </g>
                                  )}
                                </g>
                              );
                            })}

                            {/* Center Box Details (Lagna name badge, vector emoji, degree) rendered using foreignObject */}
                            <foreignObject x="131" y="131" width="128" height="128">
                              <div className="w-full h-full flex flex-col items-center justify-between p-3 select-none text-center">
                                {/* Degree */}
                                <div className="text-[13px] font-bold text-slate-900 font-handwritten tracking-wider italic">
                                  {lagnaDisplayDegree}
                                </div>
                                
                                {/* Zodiac Icon */}
                                <div className="text-3xl filter drop-shadow flex items-center justify-center flex-1">
                                  <span className="text-blue-500 mr-1" title={result.chart.lagna}>
                                    {getZodiacArtSymbol(result.chart.lagna)}
                                  </span>
                                  <span className="text-amber-600 text-sm font-bold font-handwritten block" title={result.chart.lagna}>
                                    {getZodiacSymbol(result.chart.lagna)}
                                  </span>
                                </div>

                                {/* Blue Lagna Badge matching Sri Lankan birth charts */}
                                <div className="px-4 py-1 bg-[#1e88e5] text-white rounded-lg text-[13px] font-bold leading-none shadow-sm min-w-[70px] text-center font-handwritten">
                                  {lang === 'sinhala' ? result.chart.lagnaSinhala : result.chart.lagna}
                                </div>
                              </div>
                            </foreignObject>
                          </svg>
                        );
                      })()}
                    </div>

                    <div className="w-full text-center mt-3" id="kendraya_chart_legend">
                      <span className="text-[10px] text-slate-500 font-sans tracking-wide">
                        {lang === 'sinhala' 
                          ? "* සටහනේ දිස්වන ඉලක්කම් ලග්න කොටුවලට අදාල රාශි අංක වේ (1=මේෂ, 2=වෘෂභ, ආදී)" 
                          : "* Numbers inside houses match Vedic Zodiac Sign Index (1=Aries, 2=Taurus, etc.)"}
                      </span>
                    </div>
                  </div>

                  {/* SVG Traditional Hela Kendraya (Navamsa D9) */}
                  <div className="hidden" id="visual_navamsa_box">
                    <div className="w-full flex justify-between items-center mb-4 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                      <span className="text-[11px] font-medium text-slate-300">
                        {lang === 'sinhala' ? "නවාංශක කේන්දර සටහන (D9)" : "Navamsa Kundali D9 Chart"}
                      </span>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-600/40 px-2 py-0.5 rounded uppercase tracking-wider select-none">
                        D-9
                      </span>
                    </div>

                    {/* SVG Drawn traditional 3x3 grid chart (Sri Lankan standard format) */}
                    <div className="relative w-full max-w-[310px] aspect-square flex items-center justify-center bg-white rounded-xl p-4 border border-violet-200 shadow-md shadow-amber-500/5 hover:border-amber-500/30 transition-all duration-300" id="svg_navamsa_wrapper">
                      {(() => {
                        const nLagna = result.chart.navamsaLagna || "Aries";
                        const nLagnaSinhala = result.chart.navamsaLagnaSinhala || "මේෂ";

                        return (
                          <svg viewBox="0 0 390 390" className="w-full h-full text-slate-700 font-sans" id="navamsa_chart_svg">
                            {/* Pure white background canvas */}
                            <rect x="0" y="0" width="390" height="390" fill="#ffffff" rx="8" />

                            {/* 3x3 Grid Lines */}
                            {/* Horizontal divisions */}
                            <line x1="0" y1="130" x2="390" y2="130" stroke="#cbd5e1" strokeWidth="1.5" />
                            <line x1="0" y1="260" x2="390" y2="260" stroke="#cbd5e1" strokeWidth="1.5" />
                            {/* Vertical divisions */}
                            <line x1="130" y1="0" x2="130" y2="390" stroke="#cbd5e1" strokeWidth="1.5" />
                            <line x1="260" y1="0" x2="260" y2="390" stroke="#cbd5e1" strokeWidth="1.5" />

                            {/* Outer square borders */}
                            <rect x="1" y="1" width="388" height="388" fill="none" stroke="#cbd5e1" strokeWidth="2" />

                            {/* Corner Diagonal Lines */}
                            {/* Top-Left Cell Diagonal (House 2 & 3) */}
                            <line x1="0" y1="0" x2="130" y2="130" stroke="#cbd5e1" strokeWidth="1.5" />
                            {/* Bottom-Left Cell Diagonal (House 5 & 6) */}
                            <line x1="0" y1="390" x2="130" y2="260" stroke="#cbd5e1" strokeWidth="1.5" />
                            {/* Bottom-Right Cell Diagonal (House 8 & 9) */}
                            <line x1="260" y1="260" x2="390" y2="390" stroke="#cbd5e1" strokeWidth="1.5" />
                            {/* Top-Right Cell Diagonal (House 11 & 12) */}
                            <line x1="260" y1="130" x2="390" y2="0" stroke="#cbd5e1" strokeWidth="1.5" />

                            {/* Center Square (C5) Custom Styling */}
                            <rect x="131" y="131" width="128" height="128" fill="#fcfbf8" rx="4" />

                            {/* Draw contents for all 12 houses */}
                            {HOUSE_METADATA.map((meta) => {
                              const zodiacSignIndex = getHouseSignNumber(meta.house, nLagna);
                              let navamsaPlacements = result?.chart?.navamsaHousePlacements || {};
                              
                              // Fallback: Reconstruct navamsaPlacements from planetaryDetails if empty/missing
                              if (Object.keys(navamsaPlacements).length === 0 && Array.isArray(result?.chart?.planetaryDetails)) {
                                const reconstructed: { [key: string]: string[] } = {
                                  "1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": [], "10": [], "11": [], "12": []
                                };
                                result.chart.planetaryDetails.forEach((p: any) => {
                                  if (p && p.navamsaHouse) {
                                    const hKey = p.navamsaHouse.toString();
                                    if (!reconstructed[hKey]) reconstructed[hKey] = [];
                                    if (!reconstructed[hKey].includes(p.planet)) {
                                      reconstructed[hKey].push(p.planet);
                                    }
                                  }
                                });
                                navamsaPlacements = reconstructed;
                              }
                              const planetsInHouse = Array.isArray(navamsaPlacements[meta.house]) ? navamsaPlacements[meta.house] : [];

                              // Format planetary abbreviations
                              const formattedPlanets = planetsInHouse.map(planetName => {
                                const symbolInfo = PLANET_SYMBOLS[planetName] || { 
                                  en: planetName.substring(0, 2), 
                                  si: planetName.substring(0, 1) 
                                };
                                const displaySymbol = chartLang === 'sinhala' ? symbolInfo.si : symbolInfo.en;
                                const isAsc = planetName === 'Ascendant' || planetName === 'Lagna';
                                const prefix = (chartLang === 'sinhala' && !isAsc) ? "-" : "";
                                const text = prefix + displaySymbol;
                                const color = CHART_PLANET_COLORS[planetName]?.text || "#1e293b";
                                return { name: planetName, text, color };
                              });

                               return (
                                <g key={meta.house} id={`navamsa_house_group_${meta.house}`}>
                                  {/* RASHI NUMBER INDICATOR */}
                                  {meta.rashiBadge ? (
                                    meta.rashiBadge.type === "green-box" ? (
                                      <g id={`navamsa_rashi_badge_house_${meta.house}`}>
                                        <rect 
                                          x={meta.rashiBadge.x} 
                                          y={meta.rashiBadge.y} 
                                          width="18" 
                                          height="18" 
                                          rx="3" 
                                          fill="#0d9488" 
                                        />
                                        <text 
                                          x={meta.rashiBadge.x + 9} 
                                          y={meta.rashiBadge.y + 14} 
                                          fill="#ffffff" 
                                          fontSize="13" 
                                          fontWeight="bold" 
                                          textAnchor="middle"
                                          className="font-handwritten"
                                        >
                                          {zodiacSignIndex}
                                        </text>
                                      </g>
                                    ) : (
                                      <g id={`navamsa_rashi_badge_house_${meta.house}`}>
                                        <circle 
                                          cx={meta.rashiBadge.cx} 
                                          cy={meta.rashiBadge.cy} 
                                          r="9" 
                                          fill="#0d9488" 
                                        />
                                        <text 
                                          x={meta.rashiBadge.cx} 
                                          y={meta.rashiBadge.cy + 4.5} 
                                          fill="#ffffff" 
                                          fontSize="12" 
                                          fontWeight="bold" 
                                          textAnchor="middle"
                                          className="font-handwritten"
                                        >
                                          {zodiacSignIndex}
                                        </text>
                                      </g>
                                    )
                                  ) : (
                                    meta.rashiLabel && (
                                      <text 
                                        x={meta.rashiLabel.x} 
                                        y={meta.rashiLabel.y} 
                                        fill={meta.rashiLabel.color} 
                                        fontSize="13" 
                                        fontWeight="bold" 
                                        textAnchor="middle"
                                        className="font-handwritten"
                                      >
                                        {zodiacSignIndex}
                                      </text>
                                    )
                                  )}

                                  {/* HOUSE CIRCLE BADGE (BHAVA LABEL) */}
                                  {meta.houseCircle && (
                                    <g id={`navamsa_house_circle_${meta.house}`}>
                                      <circle 
                                        cx={meta.houseCircle.cx} 
                                        cy={meta.houseCircle.cy} 
                                        r="10.5" 
                                        fill="#f1f5f9" 
                                        stroke="#cbd5e1" 
                                        strokeWidth="1" 
                                      />
                                      <text 
                                        x={meta.houseCircle.cx} 
                                        y={meta.houseCircle.cy + 4.5} 
                                        fill="#4f46e5" 
                                        fontSize="12" 
                                        fontWeight="bold" 
                                        textAnchor="middle"
                                        className="font-handwritten"
                                      >
                                        {meta.houseCircle.text}
                                      </text>
                                    </g>
                                  )}

                                  {/* CELL ARUDHA / AUX LABELS */}
                                  {meta.label && (
                                    <text 
                                      x={meta.label.x} 
                                      y={meta.label.y} 
                                      fill={meta.label.color} 
                                      fontSize="11" 
                                      fontWeight="bold" 
                                      className="font-handwritten"
                                    >
                                      {meta.label.text}
                                    </text>
                                  )}

                                  {/* PLANET SYMBOLS */}
                                  {formattedPlanets.length > 0 && (
                                    <g id={`navamsa_planets_house_${meta.house}`}>
                                      <text 
                                        x={meta.centroid.x} 
                                        y={meta.centroid.y + 2} 
                                        textAnchor="middle" 
                                        fontSize="16" 
                                        fontWeight="bold"
                                        className="font-handwritten"
                                      >
                                        {formattedPlanets.map((p, pIdx) => (
                                          <tspan key={p.name} fill={p.color} dx={pIdx > 0 ? "6" : "0"}>
                                            {p.text}
                                          </tspan>
                                        ))}
                                      </text>
                                    </g>
                                  )}
                                </g>
                              );
                            })}

                            {/* Center Box Details (Navamsa Lagna name badge, vector emoji, title) rendered using foreignObject */}
                            <foreignObject x="131" y="131" width="128" height="128">
                              <div className="w-full h-full flex flex-col items-center justify-between p-3 select-none text-center">
                                {/* Title */}
                                <div className="text-[12px] font-bold text-amber-600 font-handwritten tracking-wider uppercase">
                                  {lang === 'sinhala' ? "නවාංශකය" : "Navamsa"}
                                </div>
                                
                                {/* Zodiac Icon */}
                                <div className="text-3xl filter drop-shadow flex items-center justify-center flex-1">
                                  <span className="text-orange-500 mr-1" title={nLagna}>
                                    {getZodiacArtSymbol(nLagna)}
                                  </span>
                                  <span className="text-amber-600 text-sm font-bold font-handwritten block" title={nLagna}>
                                    {getZodiacSymbol(nLagna)}
                                  </span>
                                </div>

                                {/* Gold Navamsa Lagna Badge */}
                                <div className="px-4 py-1 bg-[#d97706] text-white rounded-lg text-[13px] font-bold leading-none shadow-sm min-w-[70px] text-center font-handwritten">
                                  {lang === 'sinhala' ? nLagnaSinhala : nLagna}
                                </div>
                              </div>
                            </foreignObject>
                          </svg>
                        );
                      })()}
                    </div>

                    <div className="w-full text-center mt-3" id="navamsa_chart_legend">
                      <span className="text-[10px] text-slate-500 font-sans tracking-wide">
                        {lang === 'sinhala' 
                          ? "* සටහනේ දිස්වන ඉලක්කම් නවාංශක කොටුවලට අදාල රාශි අංක වේ" 
                          : "* Numbers match traditional Navamsa Zodiac Sign Indices"}
                      </span>
                    </div>
                  </div>

                  {/* Planet Placements List (Compact Bento Panel on tablet, Full Column on Desktop) */}
                  <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between" id="planet_list_container">
                    <div className="mb-4 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                      <span className="text-[11px] font-medium text-slate-300">
                        {lang === 'sinhala' ? "ග්‍රහ පිහිටීම් විස්තරය (D1 / D9)" : "Planetary Positions & Alignments (D1 / D9)"}
                      </span>
                    </div>

                    <div className="overflow-y-auto max-h-[300px] border border-slate-800/50 rounded-xl pr-1 text-slate-200" id="planetary_specs_table">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-[9px] text-slate-400 capitalize tracking-widest bg-slate-950/40">
                            <th className="py-2.5 px-3">{lang === 'sinhala' ? "ග්‍රහයා" : "Planet"}</th>
                            <th className="py-2.5 px-3">{lang === 'sinhala' ? "ලග්නය (D1)" : "Lagna (D1)"}</th>
                            <th className="py-2.5 px-3">{lang === 'sinhala' ? "නවාංශක (D9)" : "Navamsa (D9)"}</th>
                            <th className="py-2.5 px-3 text-right">{lang === 'sinhala' ? "ස්ඵුටය" : "Degree"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-xs">
                          {(Array.isArray(result?.chart?.planetaryDetails) ? result.chart.planetaryDetails : []).map((details) => {
                            const isRetro = details.isRetrograde;
                            const planetId = details.planet;
                            const symbolColor = PLANET_SYMBOLS[planetId]?.color || "text-slate-300";

                            return (
                              <tr key={planetId} className="hover:bg-slate-950/30 transition-all font-sans" id={`planetary_row_${planetId}`}>
                                <td className="py-2 px-3 flex items-center gap-1.5 font-medium">
                                  <span className={`w-1.5 h-1.5 rounded-full ${symbolColor.split(" ")[0].replace("text-", "bg-")}`} />
                                  <span>
                                    {lang === 'sinhala' ? details.planetSinhala : details.planet}
                                  </span>
                                  {isRetro && (
                                    <span className="text-[9px] px-1 py-0.2 bg-red-950/40 text-red-400 border border-red-900/30 rounded font-mono uppercase font-bold tracking-wide">
                                      {lang === 'sinhala' ? "වක්‍ර" : "R"}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-slate-300 leading-normal">
                                  {lang === 'sinhala' ? `${details.signSinhala} (${details.house})` : `${details.sign} (${details.house})`}
                                </td>
                                <td className="py-2 px-3 text-slate-300 leading-normal">
                                  {details.navamsaSign ? (
                                    lang === 'sinhala' ? `${details.navamsaSignSinhala} (${details.navamsaHouse})` : `${details.navamsaSign} (${details.navamsaHouse})`
                                  ) : "-"}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-slate-400">
                                  {details.degree ? (details.degree.split(" ").slice(1).join(" ") || details.degree) : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 p-3 bg-indigo-950/20 border border-slate-800 rounded-xl flex items-center justify-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[10px] text-slate-400 font-sans tracking-wide">
                        {lang === 'sinhala' ? "Lahiri Ayanamsha (UTC+5:30) ආශ්‍රයෙන් ගණනය කරන ලදී." : "Calculated relative to GMT+5:30 using dry Lahiri coordinates."}
                      </span>
                    </div>
                  </div>
                </section>

                {/* 2.5 ASTRONOMICAL CALCULATIONS ENGINE DETAILS */}
                {result.chart.calculations && (
                  <section className="bg-slate-900/40 rounded-2xl border border-slate-800 p-5 md:p-6" id="astro_engine_calculations_block">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
                      <div>
                        <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 font-display">
                          <Compass className="w-4 h-4 text-amber-400" />
                          {lang === 'sinhala' ? "චන්ද්‍ර ස්ඵුටය සහ නැකැත් පාද ගණනය කිරීම්" : "Moon Longitude & Nakshatra Pada Calculations"}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {lang === 'sinhala' 
                            ? "සිංහල සම්ප්‍රදායික ජ්‍යෝතිෂ මෘදුකාංග මඟින් ක්‍රියාත්මක කරන ලද අර්ධ ස්වයංක්‍රීය Lahiri Astro-engine ගණනීය ප්‍රතිඵල" 
                            : "Precise astronomical results mathematically extracted from traditional Lahiri Ayanamsha system"}
                        </p>
                      </div>
                      <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-mono self-start md:self-auto">
                        Ayanamsha: {(Array.isArray(result?.chart?.planetaryDetails) && result.chart.planetaryDetails.find(p => p && (p.planet === "Ascendant" || p.planet === "Lagna"))?.degree) || "Lahiri Method"}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Side Parameters */}
                      <div className="space-y-4">
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
                          <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-2.5">
                            <span className="text-slate-400">{lang === 'sinhala' ? "චන්ද්‍ර ස්ඵුටය (Moon Longitude)" : "Moon's Exact Longitude"}</span>
                            <span className="font-mono text-amber-300 font-bold">
                              {lang === 'sinhala' ? result.chart.calculations.moonLongitudeFullSi : result.chart.calculations.moonLongitudeFullEn}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-2.5">
                            <span className="text-slate-400">{lang === 'sinhala' ? "උපන් නැකත" : "Birth Star (Nakshatra)"}</span>
                            <span className="font-semibold text-sky-400">
                              {lang === 'sinhala' ? `${result.chart.calculations.nakshatraNameSi} (${result.chart.calculations.nakshatraNameEn})` : result.chart.calculations.nakshatraNameEn}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-2.5">
                            <span className="text-slate-400">{lang === 'sinhala' ? "නැකත් පාදය" : "Nakshatra Pada"}</span>
                            <span className="font-mono bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded border border-violet-500/20 font-bold">
                              {lang === 'sinhala' ? `${result.chart.calculations.pada} වන පාදය` : `Pada ${result.chart.calculations.pada}`}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-2.5">
                            <span className="text-slate-400">{lang === 'sinhala' ? "මහා දශා අධිපති" : "Dasha Lord"}</span>
                            <span className="font-semibold text-teal-400">
                              {lang === 'sinhala' ? `${result.chart.calculations.dashaLordSi} (වසර ${result.chart.calculations.dashaTotalYears})` : `${result.chart.calculations.dashaLordEn} (${result.chart.calculations.dashaTotalYears} Years)`}
                            </span>
                          </div>

                          {result.chart.calculations.ganaSi && (
                            <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-2.5 pt-1">
                              <span className="text-slate-400">{lang === 'sinhala' ? "ගණය (Gana)" : "Gana / Temperament"}</span>
                              <span className="font-semibold text-emerald-400">
                                {lang === 'sinhala' ? `${result.chart.calculations.ganaSi} (${result.chart.calculations.ganaEn})` : result.chart.calculations.ganaEn}
                              </span>
                            </div>
                          )}

                          {result.chart.calculations.yoniSi && (
                            <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-2.5 pt-1">
                              <span className="text-slate-400">{lang === 'sinhala' ? "යෝනිය (Yoni)" : "Yoni / Symbol"}</span>
                              <span className="font-semibold text-amber-400">
                                {lang === 'sinhala' ? `${result.chart.calculations.yoniSi} (${result.chart.calculations.yoniEn})` : result.chart.calculations.yoniEn}
                              </span>
                            </div>
                          )}

                          {result.chart.calculations.lingaSi && (
                            <div className="flex justify-between items-center text-xs pt-1">
                              <span className="text-slate-400">{lang === 'sinhala' ? "ලිංගය (Gender)" : "Nakshatra Gender"}</span>
                              <span className="font-semibold text-purple-400">
                                {lang === 'sinhala' ? `${result.chart.calculations.lingaSi} (${result.chart.calculations.lingaEn})` : result.chart.calculations.lingaEn}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Visual Slider inside Pada */}
                        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                          <div className="flex justify-between text-xs mb-2 font-sans">
                            <span className="text-slate-300">
                              {lang === 'sinhala' ? `${result.chart.calculations.pada} වන පාදය තුළ සඳුගේ ගමන` : `Moon's Journey inside Pada ${result.chart.calculations.pada}`}
                            </span>
                            <span className="font-mono text-[10px] text-amber-300 font-bold">
                              {Math.round((result.chart.calculations.padaTraveledMinutes / 200) * 100)}%
                            </span>
                          </div>
                          
                          {/* Progress bar container */}
                          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className="bg-gradient-to-r from-amber-500 to-sky-400 h-full rounded-full transition-all duration-1000"
                              style={{ width: `${(result.chart.calculations.padaTraveledMinutes / 200) * 100}%` }}
                            />
                          </div>

                          <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1.5 leading-none">
                            <span>0° 00' 00" ({lang === 'sinhala' ? "ආරම්භය" : "Start"})</span>
                            <span>3° 20' 00" (200') ({lang === 'sinhala' ? "අවසානය" : "End"})</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Side Formulas & Balance Dasha Calculations */}
                      <div className="flex flex-col justify-between space-y-4">
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs space-y-3 font-sans">
                          <div className="flex justify-between items-center border-b border-slate-900 pb-2.5">
                            <span className="text-slate-400">{lang === 'sinhala' ? "පාදය තුළ ගමන් කළ දුර" : "Distance Traversed in Pada"}</span>
                            <span className="font-mono text-slate-300 font-medium">
                              {result.chart.calculations.padaTraveledFormatted} ({result.chart.calculations.padaTraveledMinutes}')
                            </span>
                          </div>

                          <div className="flex justify-between items-center border-b border-slate-900 pb-2.5">
                            <span className="text-slate-400">{lang === 'sinhala' ? "පාදය තුළ ඉතිරි දුර" : "Distance Remaining in Pada"}</span>
                            <span className="font-mono text-amber-400 font-bold">
                              {result.chart.calculations.padaRemainingFormatted} ({result.chart.calculations.padaRemainingMinutes}')
                            </span>
                          </div>

                          <div className="bg-slate-900/40 p-3.5 rounded-lg border border-slate-800/80 space-y-2">
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                              {lang === 'sinhala' ? "දශා ශේෂය සෙවීමේ ත්‍රෛරාශික සූත්‍රය" : "Vimshottari Dasha Balance Formula"}
                            </div>
                            <div className="text-[10px] text-slate-300 font-mono leading-relaxed bg-slate-950 p-2.5 rounded border border-slate-900/60 select-all whitespace-pre-wrap overflow-x-auto">
                              {lang === 'sinhala' 
                                ? `දශා ශේෂය = [පාදය තුළ ඉතිරි දුර (${result.chart.calculations.padaRemainingMinutes}')] / [පාදයක දිග (200')] × [රවිගේ මුළු දශාව (වසර ${result.chart.calculations.dashaTotalYears})]`
                                : `Balance Dasha = [Remaining distance (${result.chart.calculations.padaRemainingMinutes}')] / [Total Pada length (200')] × [Total Dasha Period (${result.chart.calculations.dashaTotalYears} Years)]`}
                            </div>
                          </div>

                          <div className="flex justify-between items-center bg-amber-500/5 text-amber-400 p-3.5 rounded-xl border border-amber-500/10 mt-1">
                            <span className="font-bold text-slate-300">{lang === 'sinhala' ? "උපන් මොහොතේ දශා ශේෂය" : "Birth Balance Dasha"}</span>
                            <span className="font-bold font-mono text-amber-300 text-sm">
                              {lang === 'sinhala' ? result.chart.calculations.balanceDashaSi : result.chart.calculations.balanceDashaEn}
                            </span>
                          </div>

                          {/* Dynamic Current Maha Dasha */}
                          {result.chart.calculations.currentDashaLordEn && (
                            <div className="bg-sky-500/5 text-sky-400 p-3.5 rounded-xl border border-sky-500/10 mt-1 space-y-2 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-300">{lang === 'sinhala' ? "වත්මන් සක්‍රීය මහ දශාව" : "Current Active Maha Dasha"}</span>
                                <span className="font-bold font-mono text-sky-300 text-sm bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                                  {lang === 'sinhala' ? result.chart.calculations.currentDashaLordSi : result.chart.calculations.currentDashaLordEn}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-900/60 pt-2">
                                <span>{lang === 'sinhala' ? "ක්‍රියාත්මක කාල සීමාව" : "Active Period"}</span>
                                <span className="font-mono text-slate-300">
                                  {result.chart.calculations.currentDashaStart} {lang === 'sinhala' ? "සිට" : "to"} {result.chart.calculations.currentDashaEnd}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[11px] text-slate-400">
                                <span>{lang === 'sinhala' ? "ඉතිරි කාලය" : "Remaining Time"}</span>
                                <span className="font-mono text-sky-300 font-bold">
                                  {lang === 'sinhala' ? result.chart.calculations.currentDashaRemainingSi : result.chart.calculations.currentDashaRemainingEn}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* 3. CONDITIONAL PRESENTATION: DETAILED PREDICTIONS OR CONTACT LOCK FORM */}
                {result.predictions ? (
                  <>
                    {/* 3. SHINY HOROSCOPE PREDICTION ACCORDION/TABS PANEL */}
                    <section className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden animate-fade-in" id="horoscope_predictions_board">
                      {/* Category Selection Tabs Toolbar */}
                      <div className="flex flex-wrap border-b border-slate-800 bg-slate-950/40 p-2 gap-1" id="predictions_tabs_strip">
                        <button
                          onClick={() => setActiveTab('general')}
                          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                            activeTab === 'general' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-slate-400 hover:text-slate-200"
                          }`}
                          id="tab_general"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {lang === 'sinhala' ? "පොදු ගුණ" : "General Life"}
                        </button>
                        <button
                          onClick={() => setActiveTab('career')}
                          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                            activeTab === 'career' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-slate-400 hover:text-slate-200"
                          }`}
                          id="tab_career"
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          {lang === 'sinhala' ? "රැකියා/අධ්‍යාපන" : "Career & Work"}
                        </button>
                        <button
                          onClick={() => setActiveTab('wealth')}
                          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                            activeTab === 'wealth' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-slate-400 hover:text-slate-200"
                          }`}
                          id="tab_wealth"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          {lang === 'sinhala' ? "ධන වාසනා" : "Wealth luck"}
                        </button>
                        <button
                          onClick={() => setActiveTab('health')}
                          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                            activeTab === 'health' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-slate-400 hover:text-slate-200"
                          }`}
                          id="tab_health"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          {lang === 'sinhala' ? "සෞඛ්‍යය" : "Health info"}
                        </button>
                        <button
                          onClick={() => setActiveTab('marriage')}
                          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                            activeTab === 'marriage' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-slate-400 hover:text-slate-200"
                          }`}
                          id="tab_marriage"
                        >
                          <Heart className="w-3.5 h-3.5" />
                          {lang === 'sinhala' ? "විවාහ තොරතුරු" : "Marriage life"}
                        </button>
                        <button
                          onClick={() => setActiveTab('dasha')}
                          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                            activeTab === 'dasha' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-slate-400 hover:text-slate-200"
                          }`}
                          id="tab_dasha"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          {lang === 'sinhala' ? "වත්මන් මහ දශාව" : "Mahadasha remedies"}
                        </button>
                      </div>

                      {/* Predicted Content Presentation Block */}
                      <div className="p-6 md:p-8 text-slate-200 leading-relaxed font-sans text-sm min-h-[160px]" id="predictions_tab_content">
                        {/* Active tab content block */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-3">
                            {activeTab === 'general' && <span className="p-1 px-2.5 bg-amber-500/20 text-amber-400 text-[10px] uppercase tracking-wider rounded font-bold">{lang === 'sinhala' ? "පොදු උප්පත්ති පලාපල විස්තරය" : "General Life Overview"}</span>}
                            {activeTab === 'career' && <span className="p-1 px-2.5 bg-orange-500/20 text-orange-400 text-[10px] uppercase tracking-wider rounded font-bold">{lang === 'sinhala' ? "Wurtheeya Palapala" : "Employment & Educational Fields"}</span>}
                            {activeTab === 'wealth' && <span className="p-1 px-2.5 bg-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-wider rounded font-bold">{lang === 'sinhala' ? "ධන කාරක යෝග තොරතුරු" : "Financial Prospects"}</span>}
                            {activeTab === 'health' && <span className="p-1 px-2.5 bg-rose-500/20 text-rose-400 text-[10px] uppercase tracking-wider rounded font-bold">{lang === 'sinhala' ? "සෞඛ්‍ය තොරතුරු හා ප්‍රවේශම් විය යුතු දේ" : "Health Indicators"}</span>}
                            {activeTab === 'marriage' && <span className="p-1 px-2.5 bg-pink-500/20 text-pink-400 text-[10px] uppercase tracking-wider rounded font-bold">{lang === 'sinhala' ? "Wiwaaha Palapala" : "Marital Compatibility & Love Lifecycle"}</span>}
                            {activeTab === 'dasha' && <span className="p-1 px-2.5 bg-fuchsia-500/20 text-fuchsia-400 text-[10px] uppercase tracking-wider rounded font-bold">{lang === 'sinhala' ? "Vimshottari Dasha details" : "Current Vimshottari period remedies"}</span>}
                          </div>

                          <p className="whitespace-pre-line leading-relaxed text-slate-300 antialiased tracking-wide font-sans text-sm text-justify">
                            {result?.predictions?.[activeTab] || "විස්තරයක් නොමැත."}
                          </p>
                        </div>
                      </div>

                      {/* 4. LUCKY NUMBERS, COLORS, AND DAYS SUB-CARD */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 border-t border-slate-800 bg-slate-950/40 text-center font-sans" id="lucky_identifiers_board">
                        <div className="p-4" id="lucky_numbers_card">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                            {lang === 'sinhala' ? "වාසනාවන්ත අංක" : "Lucky Numbers"}
                          </span>
                          <div className="flex gap-2 justify-center items-center mt-2">
                            {(Array.isArray(result?.predictions?.luckyNumbers) ? result.predictions.luckyNumbers : [1, 5, 9]).map((num, i) => (
                              <span key={i} className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold flex items-center justify-center text-xs font-mono">
                                {num}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="p-4" id="lucky_colors_card">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                            {lang === 'sinhala' ? "වාසනාවන්ත වර්ණ" : "Lucky Colors"}
                          </span>
                          <div className="flex gap-2 justify-center items-center mt-2 text-xs">
                            {(Array.isArray(result?.predictions?.luckyColors) ? result.predictions.luckyColors : ["කහ (Yellow)", "සුදු (White)"]).map((color, i) => (
                              <span key={i} className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 font-semibold font-sans">
                                {color}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="p-4" id="lucky_days_card">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                            {lang === 'sinhala' ? "සුභ දින" : "Auspicious Days"}
                          </span>
                          <div className="flex gap-2 justify-center items-center mt-2 text-xs">
                            {(Array.isArray(result?.predictions?.auspiciousDays) ? result.predictions.auspiciousDays : ["බ්‍රහස්පතින්දා (Thursday)", "ඉරිදා (Sunday)"]).map((day, i) => (
                              <span key={i} className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 font-semibold font-sans">
                                {day}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* 5. MULTI-TURN AI ASTROLOGER CHAT INTERFACE */}
                    <section className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-4 sm:p-5 shadow-lg relative overflow-hidden animate-fade-in" id="astrology_chatbot_box">
                      {/* Subtle vector visual background for chat */}
                      <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none select-none">
                        <MessageSquare className="w-40 h-40" />
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2.5 sm:gap-4">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-500 flex items-center justify-center border border-amber-400/30 shrink-0">
                            <Sparkles className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-950" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200 leading-tight">
                              {lang === 'sinhala' ? "අතිරේක ජ්‍යෝතිෂ උපදෙස් (AI Astrologer)" : "Personal Horoscopic Consultation Chat"}
                            </h4>
                            <p className="text-[10px] sm:text-[11px] text-slate-400 font-sans tracking-normal leading-snug mt-0.5">
                              {lang === 'sinhala' 
                                ? "ඔබගේ ග්‍රහ පිහිටීම්, අපල උපද්‍රව පිළියම්, විවාහ මංගල යෝග පිළිබඳව ඕනෑම දෙයක් මෙතැනින් අසන්න" 
                                : "Ask specific queries about your houses, transits or spiritual remedies"}
                            </p>
                          </div>
                        </div>

                        {/* Free chat questions usage counter badge */}
                        <div className="shrink-0 self-start sm:self-auto">
                          {(isAdminLoggedIn || userEmail?.toLowerCase() === 'sampathub89@gmail.com') ? (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
                              Admin Access (Unlimited)
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowChatLimitModal(true)}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer transition-all ${
                                chatMessages.filter(m => m.sender === 'user').length >= userAllowedLimit
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse hover:bg-rose-500/30"
                                  : "bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30"
                              }`}
                            >
                              අද දින නොමිලේ AI ප්‍රශ්න: {chatMessages.filter(m => m.sender === 'user').length} / {userAllowedLimit}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Messages container list */}
                      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 h-[280px] overflow-y-auto space-y-4 mb-4 flex flex-col justify-start" id="chatbot_messages_scroller">
                        {chatMessages.map((msg) => {
                          const isAsst = msg.sender === 'assistant';
                          return (
                            <div 
                              key={msg.id} 
                              className={`flex flex-col max-w-[85%] ${isAsst ? "self-start items-start" : "self-end items-end"}`}
                              id={`chat_message_container_${msg.id}`}
                            >
                              <div className={`p-3 rounded-2xl text-xs leading-relaxed font-sans ${
                                isAsst 
                                  ? "bg-slate-900 border border-slate-800/80 text-slate-200 rounded-tl-none" 
                                  : "bg-indigo-600 border border-indigo-500 text-slate-100 rounded-tr-none shadow-sm shadow-indigo-600/15"
                              }`}>
                                <p className="whitespace-pre-line antialiased text-justify leading-relaxed tracking-wide">
                                  {msg.text}
                                </p>
                              </div>
                              <span className="text-[9px] text-slate-500 mt-1 px-1 font-mono">
                                {msg.timestamp}
                              </span>
                            </div>
                          );
                        })}

                        {/* Pending state */}
                        {chatLoading && (
                          <div className="flex flex-col max-w-[60%] self-start items-start" id="chat_message_pending_indicator">
                            <div className="bg-slate-900 border border-slate-800/80 text-slate-400 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2">
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                              <span className="text-xs font-sans tracking-wide">
                                {lang === 'sinhala' ? "ජ්‍යෝතිෂවේදීන් සලකා බලමින් පවතී..." : "Consulting cosmic charts..."}
                              </span>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Limit Reached Warning Banner */}
                      {!isAdminLoggedIn && userEmail?.toLowerCase() !== 'sampathub89@gmail.com' && chatMessages.filter(m => m.sender === 'user').length >= userAllowedLimit && (
                        <div className="bg-rose-950/80 border border-rose-500/40 rounded-xl p-3.5 mb-3 text-center space-y-2 animate-fade-in">
                          <p className="text-xs text-rose-200 font-semibold leading-relaxed">
                            {lang === 'sinhala'
                              ? `ඔබට හිමි AI ජ්‍යෝතිෂ ප්‍රශ්න (${userAllowedLimit}) සීමාව භාවිත කර ඇත. අමතර සීමාවන් දීර්ඝ කරගැනීමට කරුණාකර Admin (sampathub89@gmail.com) අමතන්න.`
                              : `You have reached your limit of ${userAllowedLimit} AI questions. For further consultations or extension, please contact Admin at sampathub89@gmail.com.`}
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowChatLimitModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            {lang === 'sinhala' ? "සීමාව දීර්ඝ කරගන්න (Request Chat Extension)" : "Request Extension (sampathub89@gmail.com)"}
                          </button>
                        </div>
                      )}

                      {/* Message Form input container */}
                      <form onSubmit={handleSendMessage} className="flex gap-2.5" id="chatbot_input_form">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder={lang === 'sinhala' ? "උදා: මට ශනි මාරුව බලපාන්නේ කෙසේද?" : "e.g., How does the Saturn transit affect my 4th house?"}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans"
                          id="chat_text_input"
                          disabled={chatLoading || (!isAdminLoggedIn && userEmail?.toLowerCase() !== 'sampathub89@gmail.com' && chatMessages.filter(m => m.sender === 'user').length >= userAllowedLimit)}
                        />
                        <button
                          type="submit"
                          disabled={chatLoading || !chatInput.trim() || (!isAdminLoggedIn && userEmail?.toLowerCase() !== 'sampathub89@gmail.com' && chatMessages.filter(m => m.sender === 'user').length >= userAllowedLimit)}
                          className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 p-2.5 px-4 rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer shadow-md shadow-amber-500/5 hover:shadow-amber-500/15"
                          id="chat_send_button"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </section>

                    {/* RELOCATED MOBILE-FRIENDLY FULL-WIDTH PALMISTRY BUTTON */}
                    <div className="my-3 w-full animate-fade-in" id="relocated_palmistry_trigger_container">
                      <button
                        type="button"
                        onClick={() => {
                          if (!palmName && name) setPalmName(name);
                          if (gender) setPalmGender(gender);
                          setShowPalmistryModal(true);
                          setPalmFileError("");
                        }}
                        className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs md:text-sm tracking-wide rounded-2xl transition-all shadow-xl hover:shadow-amber-500/20 border border-amber-300/40 cursor-pointer flex items-center justify-center gap-3 transform active:scale-[0.99] group"
                        id="relocated_palmistry_btn"
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-950/20 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                          ✋
                        </div>
                        <div className="text-left font-sans flex-1">
                          <span className="block font-black text-xs md:text-sm leading-tight text-slate-950">
                            {lang === 'sinhala' 
                              ? "ඔබගේ අත්ලෙහි ඡායාරූපයක් ලබාදී හස්තරේඛා පලාපල බලන්න (Palmistry Reading)" 
                              : "Upload Palm Photo for Palmistry Reading & Analysis"}
                          </span>
                          <span className="block text-[10px] md:text-xs text-slate-900 font-semibold opacity-90">
                            {lang === 'sinhala'
                              ? "ජීවන, ශීර්ෂ, හෘද සහ භාග්‍ය රේඛා ඇතුළු ග්‍රහ මණ්ඩල පූර්ණ හස්තරේඛා පරික්ෂාව"
                              : "Full analysis of Life, Head, Heart, Fate lines and Planetary Mounts"}
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* RELOCATED MOBILE-FRIENDLY FULL-WIDTH DEHALAKSHANA BUTTON */}
                    <div className="my-3 w-full animate-fade-in" id="relocated_dehalakshana_trigger_container">
                      <button
                        type="button"
                        onClick={() => {
                          if (!dehaName && name) setDehaName(name);
                          if (!dehaBirthDate && birthDate) setDehaBirthDate(birthDate);
                          if (gender) setDehaGender(gender);
                          setShowDehalakshanaModal(true);
                          setDehaFileError("");
                        }}
                        className="w-full py-3.5 px-5 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs md:text-sm tracking-wide rounded-2xl transition-all shadow-xl hover:shadow-teal-500/20 border border-teal-300/40 cursor-pointer flex items-center justify-center gap-3 transform active:scale-[0.99] group"
                        id="relocated_dehalakshana_btn"
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-950/20 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                          👤
                        </div>
                        <div className="text-left font-sans flex-1">
                          <span className="block font-black text-xs md:text-sm leading-tight text-slate-950">
                            {lang === 'sinhala'
                              ? "ඡායාරූපයක් ලබාදී සාමුද්‍රිකා දේහලක්ෂණ පලාපල බලන්න (Dehalakshana Reading)"
                              : "Upload Photo for Samudrika Dehalakshana Reading & Face Analysis"}
                          </span>
                          <span className="block text-[10px] md:text-xs text-slate-900 font-semibold opacity-90">
                            {lang === 'sinhala'
                              ? "මුහුණ, ඇස්, නාසය, ගෙල සහ උරහිස් ලක්ෂණ පදනම් කරගත් සාමුද්‍රිකා ශාස්ත්‍රීය පලාපල විග්‍රහය"
                              : "Vedic analysis of facial structure, eyes, nose, neck, shoulders & bodily signs"}
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* PREMIUM A4 PDF HOROSCOPE REPORT DOWNLOAD TRIGGER */}
                    <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-indigo-500/15 p-6 rounded-2xl border border-amber-500/30 shadow-lg glow-amber flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden mt-6 animate-fade-in" id="relocated_pdf_trigger">
                      <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none select-none">
                        <Sparkles className="w-36 h-36" />
                      </div>
                      <div className="space-y-1.5 flex-1 text-center md:text-left">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] uppercase font-bold tracking-widest rounded-full border border-amber-500/20">
                          <Sparkles className="w-3 h-3" />
                          {lang === 'sinhala' ? "මුද්‍රණය කළ හැකි වෘත්තීය වාර්තාව" : "Printable Professional Report"}
                        </span>
                        <h3 className="text-base md:text-lg font-bold font-display text-slate-100 flex items-center justify-center md:justify-start gap-1.5 mt-1">
                          {lang === 'sinhala' ? "පිටු 3ක සවිස්තරාත්මක කේන්දර පලාපල වාර්තාව (A4 PDF)" : "Detailed 3-Page Horoscope Report (A4 PDF)"}
                        </h3>
                        <p className="text-xs text-slate-400 max-w-xl">
                          {lang === 'sinhala'
                            ? "ඔබගේ උපන් තොරතුරු, චන්ද්‍ර ස්ඵුටය, උපන් නැකත, යෝනිය, ගණය සහ සවිස්තර පලාපල ඇතුළත් අලංකාර පිටු 3ක වාර්තාව මුද්‍රණය කිරීමට හෝ සුරැකීමට හැකිය."
                            : "Download or print a beautiful 3-page chart containing birth nakshatra details, Moon Longitude, dasha remedies and comprehensive life reports."}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowReportPreviewModal(true);
                          if (!ratingSubmittedUs && !isAdminLoggedIn) {
                            setShowRatingPopupModal(true);
                          }
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-300 hover:from-amber-400 hover:to-amber-200 text-slate-950 font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md hover:scale-[1.02] cursor-pointer flex items-center gap-2 flex-shrink-0"
                        id="trigger_download_report"
                      >
                        <BookOpen className="w-4 h-4" />
                        {lang === 'sinhala' ? "වාර්ථාව ලබාගන්න (Download PDF)" : "Get Report & Preview"}
                      </button>
                    </div>
                  </>
                ) : (
                  /* 3b. INLINE LOCK CONTAINER (WHEN ONLY CALCULATION DATA EXISTS) */
                  <section className="bg-slate-900/60 p-6 md:p-10 rounded-2xl border border-amber-500/20 relative overflow-hidden animate-fade-in" id="predictions_contact_lock_form">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none" />
                    
                    {isGeneratingPredictions ? (
                      /* DEEP PREDICTION SKELETON ALIGNING WORKFLOW */
                      <div className="flex flex-col items-center text-center py-8 space-y-6 max-w-lg mx-auto">
                        <div className="relative flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-amber-500 animate-spin" />
                          <Sparkles className="w-6 h-6 text-amber-400 absolute animate-pulse" />
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-base md:text-lg font-bold font-display text-amber-400">
                            {lang === 'sinhala'
                              ? "කේන්දර පලාපල වාර්තාව සකස් කරමින් පවතී..."
                              : "Compiling Comprehensive Life Reports..."}
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {lang === 'sinhala'
                              ? "කෘත්‍රිම බුද්ධිය මඟින් ඔබගේ ග්‍රහ පිහිටීම්, වත්මන් දශා කාල සීමාවන් සහ පලාපල ගැඹුරින් විශ්ලේෂණය කරමින් පවතී. කරුණාකර තත්පර කිහිපයක් රැඳී සිටින්න..."
                              : "Our astrological systems are processing your birth chart transits, planetary positions, and planetary aspects to build personalized life readings. Please wait a few moments..."}
                          </p>
                        </div>
                        {/* Fake mini-loading blocks to give superb cinematic feel */}
                        <div className="w-full space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-900 text-left font-mono text-[10px] text-slate-500">
                          <div className="flex justify-between">
                            <span>{lang === 'sinhala' ? "● රාශි සහ නවාංශක පෙළගැස්ම" : "● Alignment of Rashi & Navamsa"}</span>
                            <span className="text-emerald-400">SUCCESS</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{lang === 'sinhala' ? "● විංශෝත්තරී දශා ගණනය" : "● Vimshottari Dasha periods"}</span>
                            <span className="text-emerald-400">SUCCESS</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{lang === 'sinhala' ? "● කෘත්‍රිම බුද්ධි පලාපල සම්පාදනය" : "● Compiling AI-predicted text blocks"}</span>
                            <span className="text-amber-400 animate-pulse">PROCESSING...</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* CONTACT FORM INPUT FOR DETAILED REPORT ACCESS */
                      <div className="max-w-xl mx-auto flex flex-col items-center text-center space-y-6">
                        <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/10 border border-amber-400/20">
                          <BookOpen className="w-6 h-6 text-slate-950" />
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-lg md:text-xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200">
                            {lang === 'sinhala'
                              ? "සම්පූර්ණ පලාපල විස්තරය නොමිලේ ලබාගන්න"
                              : "Unlock Your Complete Life Predictions"}
                          </h3>
                          <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                            {lang === 'sinhala'
                              ? "ග්‍රහ පිහිටීම්වල බලපෑම, ධන වාසනා, විවාහය, රැකියා තොරතුරු, වත්මන් මහ දශා අපල පිළියම් සහ පිටු 3ක මුද්‍රණය කළ හැකි කේන්දර පොත ලබාගැනීමට Google ගිණුමෙන් පිවිසෙන්න."
                              : "Sign in with your Google account to instantly view comprehensive readings, daily limits, and to access the printable 3-Page Horoscope Booklet."}
                          </p>
                        </div>

                        {(isUserLoggedIn || isAdminLoggedIn) && (userEmail || isAdminLoggedIn) ? (
                          <form onSubmit={handleGetPredictions} className="w-full space-y-4">
                            <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-3.5 max-w-md mx-auto flex items-center justify-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                              <span className="text-xs font-semibold text-emerald-300">
                                {lang === 'sinhala' ? "Google ගිණුම සක්‍රියයි: " : "Google Account Active: "}
                                <strong className="text-white font-mono">{userEmail || 'sampathub89@gmail.com'}</strong>
                              </span>
                            </div>

                            {predictContactError && (
                              <div className="bg-rose-950/80 border border-rose-500/40 rounded-xl p-4 max-w-md mx-auto text-center space-y-3">
                                <p className="text-xs text-rose-200 font-semibold leading-relaxed">
                                  {predictContactError}
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                                  <a
                                    href="mailto:sampathub89@gmail.com?subject=Astrology%20Predictions%20%26%20Chat%20Extension%20Request"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                    Email Admin
                                  </a>
                                  <a
                                    href="https://wa.me/94716242455?text=Hello%20Admin%2C%20I%20would%20like%20to%20request%20permission%20or%20an%20extension%20for%20my%20Astrology%20predictions%20and%20AI%20Chat."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    WhatsApp Admin (0716242455)
                                  </a>
                                </div>
                              </div>
                            )}

                            <button
                              type="submit"
                              className="w-full max-w-md bg-gradient-to-r from-amber-500 to-amber-300 hover:from-amber-400 hover:to-amber-200 text-slate-950 font-bold py-3 px-6 rounded-xl text-xs tracking-wider uppercase transition-all shadow-md hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2 mx-auto"
                            >
                              <Sparkles className="w-4 h-4" />
                              {lang === 'sinhala' ? "පලාඵල විස්තරය ලබාගන්න (Get Detailed Predictions)" : "Generate Detailed Predictions"}
                            </button>
                          </form>
                        ) : (
                          <div className="w-full space-y-4 max-w-md mx-auto">
                            {predictContactError && (
                              <p className="text-[11px] text-rose-400 font-sans max-w-sm mx-auto leading-relaxed bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/20">
                                {predictContactError}
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={handleGoogleConnect}
                              disabled={isGoogleLoggingIn}
                              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 px-6 rounded-xl text-xs tracking-wider transition-all shadow-xl hover:scale-[1.01] active:scale-95 cursor-pointer flex items-center justify-center gap-3 border border-slate-200 disabled:opacity-60"
                            >
                              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                              </svg>
                              <span className="font-sans font-bold">
                                {isGoogleLoggingIn
                                  ? (lang === 'sinhala' ? "Google සම්බන්ධ වෙමින් පවතී..." : "Connecting with Google...")
                                  : (lang === 'sinhala' ? "Google ගිණුමෙන් පිවිසෙන්න (Sign In with Google)" : "Sign In with Google")}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                )}

              </div>
            )}
          </main>

        </div>

        {/* Coded credentials footer */}
        <footer className="mt-16 text-center text-[11px] text-slate-500 font-sans tracking-wider border-t border-slate-900 pt-6" id="app_developer_footer">
          <p>© 2026 ශ්‍රී ලාංකීය කේන්දර සටහන - Sri Lankan Astrological Computations & Digital Kundali Engine.</p>
          <p className="opacity-75 mt-1">
            {lang === 'sinhala'
              ? "Vedic Sidereal Lahiri Ephemeris සහාය ඇතිව කෘත්‍රිම බුද්ධියෙන් නිපදවන ලදී."
              : "Power-crafted using modern Vedic Sidereal equations and Server-Side Gemini Intelligence."}
          </p>
        </footer>

        {/* CONTACT INPUT POPUP MODAL (BEFORE REPORT ACCESS) */}
        {showContactFormModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
              <button 
                onClick={() => setShowContactFormModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                ✕
              </button>
              
              <div className="text-center space-y-2 mb-6">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold font-display text-slate-100">
                  {lang === 'sinhala' ? "වාර්තාව ලබා ගැනීමට ලියාපදිංචි වන්න" : "Unlock Astrology Report Booklet"}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'sinhala'
                    ? "වාර්තාව බාගත කිරීම සඳහා කරුණාකර ඔබගේ වලංගු WhatsApp අංකය හෝ විද්‍යුත් තැපෑල ඇතුළත් කරන්න."
                    : "Please provide a valid WhatsApp number or active email to preview and save your A4 PDF booklet."}
                </p>
              </div>

              <form onSubmit={handleSaveReportAndOpenPreview} className="space-y-4">
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setReportContactType('email');
                      setContactFormError("");
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-center transition-all ${
                      reportContactType === 'email' ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/20" : "text-slate-400"
                    }`}
                  >
                    Email Address
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReportContactType('whatsapp');
                      setContactFormError("");
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-center transition-all ${
                      reportContactType === 'whatsapp' ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/20" : "text-slate-400"
                    }`}
                  >
                    WhatsApp Number
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {reportContactType === 'email' ? "විද්‍යුත් තැපෑල (Email Address)" : "වට්ස්ඇප් අංකය (WhatsApp Mobile)"}
                  </label>
                  <input
                    type={reportContactType === 'email' ? "email" : "text"}
                    value={reportContactValue}
                    onChange={(e) => setReportContactValue(e.target.value)}
                    placeholder={reportContactType === 'email' ? "kasun@example.com" : "e.g., +94771234567"}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-all font-sans"
                    required
                  />
                </div>

                {contactFormError && (
                  <p className="text-xs text-rose-400 font-semibold text-center">
                    ⚠️ {contactFormError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSavingReport}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-300 hover:from-amber-400 hover:to-amber-200 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSavingReport ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      {lang === 'sinhala' ? "සුරකිමින් පවතී..." : "Generating & Saving..."}
                    </>
                  ) : (
                    lang === 'sinhala' ? "වාර්ථාව උත්පාදනය කරන්න" : "Generate Report Booklet"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* PREMIUM REPORT PREVIEW MODAL */}
        {showReportPreviewModal && result && (
          <div className="fixed inset-0 bg-slate-950/95 overflow-y-auto z-50 p-2 sm:p-4 md:p-8 flex flex-col items-center">
            
            {/* Header controls inside modal */}
            <div className="w-full max-w-5xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-800 pb-4 mb-4 sm:mb-6 flex-shrink-0 non-printable">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {lang === 'sinhala' ? "කේන්දර පලාපල පූර්ව දර්ශනය" : "Horoscope Report PDF Preview"}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-sans">
                    {ratingSubmittedUs ? (
                      lang === 'sinhala' ? "පිටු තුනකින් යුත් පූර්ණ මුද්‍රිත පිටපත (මුද්‍රණය හෝ PDF බාගත කිරීම සක්‍රීයයි)" : "High-fidelity 3-page astrological report booklet (Print/Download unlocked)"
                    ) : (
                      lang === 'sinhala' ? "පිටු තුනකින් යුත් පූර්ණ මුද්‍රිත පිටපත (පහළින් තරු ලබා දීමෙන් පසු මුද්‍රණ බොත්තම ක්‍රියාත්මක වේ)" : "High-fidelity 3-page astrological report booklet (Unlock print using star rating below)"
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    if (ratingSubmittedUs || isAdminLoggedIn) {
                      handlePrintReport();
                    } else {
                      setShowRatingPopupModal(true);
                    }
                  }}
                  className="px-3.5 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-300 hover:from-amber-400 hover:to-amber-200 text-slate-950 font-bold text-[11px] sm:text-xs tracking-wider uppercase rounded-xl transition-all shadow-md hover:scale-[1.02] cursor-pointer flex items-center gap-1.5"
                  id="top_header_print_btn"
                >
                  <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950" />
                  {lang === 'sinhala' ? "මුද්‍රණය කරන්න (Print PDF)" : "Print / Download PDF"}
                </button>

                <button
                  onClick={() => setShowReportPreviewModal(false)}
                  className="px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-all"
                >
                  ✕ {lang === 'sinhala' ? "වසන්න" : "Close"}
                </button>
              </div>
            </div>

            {/* Virtual A4 Canvas - Rendered for Screen Viewing, and targets window.print() */}
            <div className="flex flex-col gap-4 sm:gap-8 w-full max-w-[210mm] text-slate-900 font-sans" id="print-area-wrapper">
              
              {/* PAGE 1 */}
              <div className="a4-page report-border bg-amber-50/20 flex flex-col justify-between p-4 sm:p-6 md:p-[18mm] rounded-2xl md:rounded-none" id="pdf-page-1">
                <div className="space-y-4 sm:space-y-6">
                  {/* Decorative Header */}
                  <div className="text-center border-b border-amber-900/30 pb-3 sm:pb-4 relative">
                    <div className="absolute top-0 left-0 w-8 h-8 opacity-20 border-t border-l border-amber-800"/>
                    <div className="absolute top-0 right-0 w-8 h-8 opacity-20 border-t border-r border-amber-800"/>
                    
                    <span className="text-[10px] tracking-widest text-amber-800 font-bold uppercase block mb-1">
                      ශ්‍රී ලංකා ජ්‍යෝතිෂ කාර්යාංශය
                    </span>
                    <h1 className="text-xl sm:text-2xl font-bold text-amber-950 tracking-tight font-display">
                      මහා අෂ්ටාංග කේන්ද්‍ර පත්‍රිකාව
                    </h1>
                    <p className="text-[9px] sm:text-[10px] text-amber-900/70 font-mono tracking-wide mt-1">
                      CERTIFIED SIDEREAL HOROSCOPE BIRTH CHARTER
                    </p>
                  </div>

                  {/* Identification block */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 print-grid-2 gap-2.5 sm:gap-4 text-xs select-none">
                    <div className="bg-white/65 p-3 rounded-lg border border-amber-900/10 space-y-1.5 shadow-sm">
                      <div className="flex justify-between border-b border-amber-900/5 pb-1">
                        <span className="text-amber-900/60 font-semibold">නම (Full Name):</span>
                        <span className="font-bold text-slate-900">{result?.birthDetails?.name || "Anonymous (කසුන්)"}</span>
                      </div>
                      <div className="flex justify-between border-b border-amber-900/5 pb-1">
                        <span className="text-amber-900/60 font-semibold">උපන් දිනය (Birth Date):</span>
                        <span className="font-bold font-mono text-slate-800">{result?.birthDetails?.birthDate || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b border-amber-900/5 pb-1">
                        <span className="text-amber-900/60 font-semibold">උපන් වෙලාව (Time):</span>
                        <span className="font-bold font-mono text-slate-800">{result?.birthDetails?.birthTime || "N/A"}</span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span className="text-amber-900/60 font-semibold">වත්මන් වයස (Age):</span>
                        <span className="font-bold text-slate-800">{calculateAge(result?.birthDetails?.birthDate, lang)}</span>
                      </div>
                    </div>

                    <div className="bg-white/65 p-3 rounded-lg border border-amber-900/10 space-y-1.5 shadow-sm">
                      <div className="flex justify-between border-b border-amber-900/5 pb-1">
                        <span className="text-amber-900/60 font-semibold">උපන් ස්ථානය (Place):</span>
                        <span className="font-bold text-slate-800">{result?.birthDetails?.birthPlace || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b border-amber-900/5 pb-1">
                        <span className="text-amber-900/60 font-semibold">ස්ත්‍රී/පුරුෂ (Gender):</span>
                        <span className="font-bold text-slate-800">
                          {result?.birthDetails?.gender === 'Female' ? "ස්ත්‍රී (Female)" : "පුරුෂ (Male)"}
                        </span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span className="text-amber-900/60 font-semibold">කේන්දර අංකය (ID):</span>
                        <span className="font-bold font-mono text-amber-800 text-[10px]">{savedReportId || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Centered Charts visualization */}
                  <div className="flex justify-center w-full max-w-[174mm] mx-auto">
                    {/* Lagna Chart */}
                    <div className="w-full sm:w-[92mm] max-w-[92mm] border-2 border-amber-900/30 p-2 rounded-xl bg-white shadow-sm flex flex-col items-center">
                      <span className="text-[10.5px] font-bold text-amber-900 mb-1.5">ලග්න කේන්දරය (Lagna Chart - D1)</span>
                      {document.getElementById("birth_chart_svg") ? (
                        <svg 
                          viewBox="0 0 390 390" 
                          dangerouslySetInnerHTML={{ __html: document.getElementById("birth_chart_svg")?.innerHTML || "" }}
                          className="w-full h-full text-slate-700 font-sans"
                        />
                      ) : (
                        <div className="p-6 text-center text-[10px] text-amber-900 font-sans">
                          {lang === 'sinhala' ? "කේන්දර සටහන අඳිමින් පවතී..." : "Rendering..."}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Astrological Core Constants List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 print-grid-2 gap-3 text-xs bg-white/70 p-3 sm:p-4 rounded-xl border border-amber-900/15 shadow-sm">
                    <div className="space-y-2 border-b sm:border-b-0 sm:border-r border-amber-900/10 pb-2 sm:pb-0 pr-0 sm:pr-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-semibold">උපන් ලග්නය (Lagna):</span>
                        <span className="font-bold text-amber-950">{result?.chart?.lagnaSinhala || "මේෂ"} ({result?.chart?.lagna || "Aries"})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-semibold">චන්ද්‍ර ස්ඵුටය (Moon Longitude):</span>
                        <span className="font-bold font-mono text-sky-800">{result?.chart?.calculations?.moonLongitudeFullSi || "—"}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-100 pt-1.5">
                        <span className="text-slate-600 font-semibold">උපන් නැකත (Birth Star):</span>
                        <span className="font-bold text-amber-900">{result?.chart?.calculations?.nakshatraNameSi || "—"} ({result?.chart?.calculations?.nakshatraNameEn || "—"})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-semibold">නැකත් පාදය (Pada):</span>
                        <span className="font-bold">{result?.chart?.calculations?.pada || 1} වන පාදය</span>
                      </div>
                    </div>

                    <div className="space-y-2 pl-0 sm:pl-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-semibold">උපන් දශාව (Birth Dasha):</span>
                        <span className="font-bold text-amber-900">{result?.chart?.calculations?.dashaLordSi || "—"} ({result?.chart?.calculations?.dashaLordEn || "—"} - වසර {result?.chart?.calculations?.dashaTotalYears || 0})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-semibold">දශා ශේෂය (Balance Dasha):</span>
                        <span className="font-bold text-indigo-900 text-[11px] font-sans">{result?.chart?.calculations?.balanceDashaSi || "—"}</span>
                      </div>
                      {result?.chart?.calculations?.currentDashaLordSi && (
                        <div className="flex justify-between border-t border-slate-100 pt-1.5">
                          <span className="text-slate-600 font-semibold">වත්මන් දශාව (Current Dasha):</span>
                          <span className="font-bold text-sky-800">{result.chart.calculations.currentDashaLordSi} ({result.chart.calculations.currentDashaLordEn})</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-slate-100 pt-1.5">
                        <span className="text-slate-600 font-semibold">ගණය (Gana):</span>
                        <span className="font-bold">{result?.chart?.calculations?.ganaSi || "දේව"} ({result?.chart?.calculations?.ganaEn || "Deva"})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-semibold">යෝනිය (Yoni):</span>
                        <span className="font-bold">{result?.chart?.calculations?.yoniSi || "අශ්ව"} ({result?.chart?.calculations?.yoniEn || "Horse"})</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-amber-950/60 font-mono border-t border-amber-900/15 pt-3 mt-4 sm:mt-0">
                  Page 1 of 3 • Sri Lankan Vedic Astrological Computations Bureau
                </div>
              </div>

              {/* PAGE 2 */}
              <div className="a4-page report-border bg-amber-50/20 flex flex-col justify-between p-4 sm:p-6 md:p-[18mm] rounded-2xl md:rounded-none" id="pdf-page-2">
                <div className="space-y-4 sm:space-y-5">
                  <div className="text-center border-b border-amber-900/30 pb-3">
                    <h2 className="text-lg sm:text-xl font-bold text-amber-950 font-display">
                      විස්තරාත්මක කේන්දර පලාපල විස්තරය (පිටුව 2)
                    </h2>
                    <p className="text-[9px] text-amber-900/60 font-mono uppercase tracking-widest mt-0.5">
                      Vedic Sidereal Predictions & Character Analysis - Page 2
                    </p>
                  </div>

                  {/* Predictions Column Split */}
                  <div className="space-y-3 sm:space-y-4 text-xs leading-relaxed text-justify text-slate-800 font-sans select-none">
                    <div className="bg-white/50 p-3 sm:p-4 rounded-lg border border-amber-900/5 shadow-sm space-y-1">
                      <span className="font-bold text-amber-900 block text-xs underline decoration-amber-500/30">
                        1. පොදු ජන්ම ගුණාංග සහ පෞරුෂය (Character & Personality reading):
                      </span>
                      <p className="whitespace-pre-line text-[11px] leading-relaxed">
                        {result?.predictions?.general || "විස්තරයක් නොමැත."}
                      </p>
                    </div>

                    <div className="bg-white/50 p-3 sm:p-4 rounded-lg border border-amber-900/5 shadow-sm space-y-1">
                      <span className="font-bold text-amber-900 block text-xs underline decoration-amber-500/30">
                        2. අධ්‍යාපනය, වෘත්තීය ගමන් මඟ සහ රැකියා (Education, Career & Professional Pathways):
                      </span>
                      <p className="whitespace-pre-line text-[11px] leading-relaxed">
                        {result?.predictions?.career || "විස්තරයක් නොමැත."}
                      </p>
                    </div>

                    <div className="bg-white/50 p-3 sm:p-4 rounded-lg border border-amber-900/5 shadow-sm space-y-1">
                      <span className="font-bold text-amber-900 block text-xs underline decoration-amber-500/30">
                        3. ශාරීරික සෞඛ්‍යය, ශරීර ශක්තිය සහ ජීව ගුණය (Health, Longevity & Well-being):
                      </span>
                      <p className="whitespace-pre-line text-[11px] leading-relaxed">
                        {result?.predictions?.health || "විස්තරයක් නොමැත."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-amber-950/60 font-mono pt-3 mt-4 sm:mt-0">
                  Page 2 of 3 • Sri Lankan Vedic Astrological Computations Bureau
                </div>
              </div>

              {/* PAGE 3 */}
              <div className="a4-page report-border bg-amber-50/20 flex flex-col justify-between p-4 sm:p-6 md:p-[18mm] rounded-2xl md:rounded-none" id="pdf-page-3">
                <div className="space-y-4 sm:space-y-5">
                  <div className="text-center border-b border-amber-900/30 pb-3">
                    <h2 className="text-lg sm:text-xl font-bold text-amber-950 font-display">
                      විස්තරාත්මක කේන්දර පලාපල විස්තරය (පිටුව 3)
                    </h2>
                    <p className="text-[9px] text-amber-900/60 font-mono uppercase tracking-widest mt-0.5">
                      Vedic Sidereal Predictions & Remedial Guide - Page 3
                    </p>
                  </div>

                  {/* Predictions Column Split */}
                  <div className="space-y-3 sm:space-y-4 text-xs leading-relaxed text-justify text-slate-800 font-sans select-none">
                    <div className="bg-white/50 p-3 sm:p-4 rounded-lg border border-amber-900/5 shadow-sm space-y-1">
                      <span className="font-bold text-amber-900 block text-xs underline decoration-amber-500/30">
                        4. විවාහය, පවුල් ජීවිතය සහ යෝනි/ගණ ගැළපීම (Family, Gana & Yoni Compatibility):
                      </span>
                      <p className="whitespace-pre-line text-[11px] leading-relaxed">
                        මෙම ජන්මියා {result?.chart?.calculations?.ganaSi || "දේව"} ගණයට අයත් වන අතර {result?.chart?.calculations?.yoniSi || "අශ්ව"} යෝනියටත් {result?.chart?.calculations?.lingaSi === "ස්ත්‍රී" ? "ස්ත්‍රී" : "පුරුෂ"} ලිංගයටත් මුල් තැන ලබාදෙයි. {result?.predictions?.marriage || "විස්තරයක් නොමැත."}
                      </p>
                    </div>

                    <div className="bg-white/50 p-3 sm:p-4 rounded-lg border border-amber-900/5 shadow-sm space-y-1">
                      <span className="font-bold text-amber-900 block text-xs underline decoration-amber-500/30">
                        5. ධන වාසනා, කර්මය සහ වාසනාව (Wealth Luck, Income & Financial Standing):
                      </span>
                      <p className="whitespace-pre-line text-[11px] leading-relaxed">
                        {result?.predictions?.wealth || "විස්තරයක් නොමැත."}
                      </p>
                    </div>

                    <div className="bg-white/50 p-3 sm:p-4 rounded-lg border border-amber-900/5 shadow-sm space-y-1">
                      <span className="font-bold text-amber-900 block text-xs underline decoration-amber-500/30">
                        6. වත්මන් මහ දශා අපල උපද්‍රව සහ පිළියම් (Maha Dasha Remedial Protection Guide):
                      </span>
                      <p className="whitespace-pre-line text-[11px] leading-relaxed">
                        වත්මන් මහා දශා අධිපති {result?.chart?.calculations?.currentDashaLordSi || result?.chart?.calculations?.dashaLordSi || "ග්‍රහයා"} වන අතර, එය {result?.chart?.calculations?.currentDashaStart ? `${result.chart.calculations.currentDashaStart} සිට ${result.chart.calculations.currentDashaEnd} දක්වා සක්‍රීයව පවතී (ඉතිරි කාලය: ${result.chart.calculations.currentDashaRemainingSi})` : `වසර ${result?.chart?.calculations?.dashaTotalYears || 0}ක් සක්‍රීයව පවතී`}. {result?.predictions?.dasha || "විස්තරයක් නොමැත."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-3 mt-4 sm:mt-0">
                  <div className="flex justify-between items-end border-t border-amber-900/10 pt-4 text-xs">
                    <div className="space-y-1 text-left">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Certified Bureau</span>
                      <div className="px-2.5 sm:px-3 py-1.5 bg-amber-950/5 rounded border border-amber-900/10 text-amber-900/80 font-mono text-[9px] font-bold">
                        ASTRO-VERIFIED-SECURE ✓
                      </div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <div className="w-20 sm:w-24 h-1 border-b border-amber-900/40 inline-block mb-1"/>
                      <span className="text-[9px] text-amber-900/70 font-semibold block uppercase tracking-wider">ප්‍රධාන ජ්‍යෝතිෂවේදී අත්සන</span>
                      <span className="text-[8px] text-slate-400 block font-mono">Verified Astrology Seal Sr Lanka</span>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-amber-950/60 font-mono">
                    Page 3 of 3 • Sri Lankan Vedic Astrological Computations Bureau
                  </div>
                </div>
              </div>

            </div>

            {/* Non-printable Star Rating feedback system inside the modal footer */}
            <div className="w-full max-w-2xl border-t border-slate-800 mt-10 pt-6 non-printable select-none">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl max-w-xl mx-auto my-6 flex flex-col md:flex-row items-center gap-6">
                
                {/* Left side: Star Rating Form */}
                <div className="flex-1 w-full space-y-3">
                  <h4 className="text-xs font-bold text-amber-400 tracking-wider uppercase font-sans">
                    {lang === 'sinhala' ? "තරු ලබාදී මේ සේවාව පිළිබඳ අදහසක් ලබාදීමට කාරුණික වන්න" : "Please Rate This Prediction Report"}
                  </h4>
                  
                  {isAdminLoggedIn ? (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 w-full text-left">
                      <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs uppercase tracking-wide font-sans">
                        <Award className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{lang === 'sinhala' ? "පරිපාලක දර්ශනය (Admin View)" : "Admin Read-Only Mode"}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                        {lang === 'sinhala' 
                          ? "පරිපාලක පැනලය හරහා පූර්ව දර්ශනය විවෘත කර ඇත. මෙහිදී තරු ලබාදීම හෝ අදහස් දැක්වීම කළ නොහැක." 
                          : "Preview opened via astro admin dashboard. Giving stars or changing reviews is disabled in this mode."}
                      </p>
                      
                      {userRating > 0 ? (
                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg space-y-1.5">
                          <div className="flex text-amber-400 text-base leading-none">
                            {Array.from({ length: 5 }, (_, sIdx) => (
                              <span key={sIdx}>{sIdx < userRating ? "★" : "☆"}</span>
                            ))}
                          </div>
                          {userComment && (
                            <p className="text-xs text-slate-300 italic font-sans whitespace-pre-line leading-relaxed">
                              "{userComment}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg text-center">
                          <span className="text-[11px] text-slate-500 italic font-sans">
                            {lang === 'sinhala' ? "පරිශීලකයා විසින් තවමත් ප්‍රතිචාර ලබාදී නැත." : "No rating or comment left by the client yet."}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : ratingSubmittedUs ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center md:text-left">
                      <p className="text-xs text-emerald-400 font-bold font-sans">
                        🌟 {lang === 'sinhala' ? "ස්තූතියි! ඔබගේ වටිනා තක්සේරුව සාර්ථකව ලැබුණි." : "Thank you! Your feedback has been received."}
                      </p>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                        {lang === 'sinhala' ? "මුද්‍රණ/සුරැකුම් බොත්තම දැන් ක්‍රියාත්මකයි." : "The print/save button is now unlocked below."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[11px] text-amber-300 bg-amber-500/5 px-3 py-2 rounded-lg border border-amber-500/10 leading-relaxed font-sans">
                        💡 {lang === 'sinhala' 
                          ? "ඔබගේ පලාපල වාර්තාව පිළිබඳව පහළින් තරු ලබා දී කෙටි අදහසක් දැක්වූ සැනින්, පිටු 3ක සම්පූර්ණ PDF වාර්තාව මුද්‍රණය කිරීමට හෝ ඩවුන්ලෝඩ් කිරීමට ඇති බොත්තම සක්‍රීය වනු ඇත." 
                          : "Please rate your astrological report and share a quick comment below to instantly activate and unlock your 3-page downloadable/printable PDF booklet."}
                      </p>
                      <form onSubmit={handleSubmitRating} className="space-y-3">
                        <div className="flex justify-start gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                               onClick={() => handleStarRatingClick(star)}
                               className="text-2xl cursor-pointer transition-transform hover:scale-110"
                            >
                              {star <= userRating ? "★" : "☆"}
                            </button>
                          ))}
                        </div>
                      
                        <div>
                          <textarea
                            value={userComment}
                            onChange={(e) => setUserComment(e.target.value)}
                            placeholder={lang === 'sinhala' ? "තරු ලබාදී මේ සේවාව පිළිබඳ අදහසක් ලබාදීමට කාරුණික වන්න..." : "Write a brief comment about your horoscope report..."}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
                            rows={2}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={userRating === 0 || isSubmittingRating}
                          className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs rounded-lg hover:from-amber-400 hover:to-orange-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmittingRating 
                            ? (lang === 'sinhala' ? "යවමින් පවතී..." : "Submitting...") 
                            : (lang === 'sinhala' ? "තක්සේරුව යොමු කරන්න" : "Submit Rating")}
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Right side: Print Button */}
                <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-800 pt-5 md:pt-0 md:pl-6 w-full md:w-auto flex-shrink-0">
                  <div className="text-center space-y-3">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-full border ${
                      ratingSubmittedUs 
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                        : "text-amber-400 bg-amber-500/10 border-amber-500/25"
                    }`}>
                      {ratingSubmittedUs ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
                      {ratingSubmittedUs 
                        ? (lang === 'sinhala' ? "මුද්‍රණය සක්‍රීයයි" : "PRINT UNLOCKED")
                        : (lang === 'sinhala' ? "තක්සේරුව ලබා දී මුද්‍රණය කරන්න" : "RATE & UNLOCK PRINT")}
                    </span>
                    <button
                      onClick={() => {
                        if (ratingSubmittedUs || isAdminLoggedIn) {
                          handlePrintReport();
                        } else {
                          setShowRatingPopupModal(true);
                        }
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-300 hover:from-amber-400 hover:to-amber-200 text-slate-950 font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-lg hover:scale-[1.03] cursor-pointer flex items-center justify-center gap-2"
                      id="bottom_print_btn"
                    >
                      <Printer className="w-4 h-4 text-slate-950" />
                      {lang === 'sinhala' ? "මුද්‍රණය කරන්න (Print)" : "Print / Save PDF"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        )}

        {/* STAR RATING POPUP MODAL BEFORE PRINTING */}
        {showRatingPopupModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-center space-y-5">
              <button 
                onClick={() => setShowRatingPopupModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 cursor-pointer text-sm font-bold"
              >
                ✕
              </button>

              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base md:text-lg font-bold font-display text-slate-100">
                  {lang === 'sinhala' ? "තරු ලබාදී මේ සේවාව පිළිබඳ අදහසක් ලබාදීමට කාරුණික වන්න" : "Please Rate This Horoscope Report"}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {lang === 'sinhala'
                    ? "ඔබගේ කේන්දර පලාපල වාර්තාව මුද්‍රණය කිරීමට හෝ PDF ලෙස ලබා ගැනීමට කරුණාකර තරු ලබාදී මේ සේවාව පිළිබඳ අදහසක් ලබාදීමට කාරුණික වන්න."
                    : "To unlock and print your complete 3-page horoscope report, please provide a star rating and your feedback below."}
                </p>
              </div>

              <div className="flex justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setUserRating(star)}
                    className="text-3xl cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                  >
                    <span className={userRating > 0 && star <= userRating ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "text-slate-700"}>
                      ★
                    </span>
                  </button>
                ))}
              </div>

              {userRating === 0 && (
                <p className="text-[11px] text-amber-400 font-semibold font-sans bg-amber-500/10 py-1.5 px-3 rounded-lg border border-amber-500/20">
                  {lang === 'sinhala' ? "ඉදිරියට යාමට කරුණාකර ඉහතින් තරු ලකුණු ප්‍රමාණය තෝරන්න." : "Please click stars above to select rating to proceed."}
                </p>
              )}

              <div>
                <textarea
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  placeholder={lang === 'sinhala' ? "තරු ලබාදී මේ සේවාව පිළිබඳ අදහසක් ලබාදීමට කාරුණික වන්න (අත්‍යවශ්‍ය නොවේ)..." : "Write your comment or feedback (optional)..."}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none font-sans"
                  rows={2}
                />
              </div>

              <button
                onClick={() => handleSubmitRatingAndPrint()}
                disabled={userRating === 0 || isSubmittingRating}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-300 hover:from-amber-400 hover:to-amber-200 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmittingRating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>{lang === 'sinhala' ? "තක්සේරුව යොමු කරමින්..." : "Submitting & Opening Print..."}</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4 text-slate-950" />
                    <span>
                      {userRating === 0
                        ? (lang === 'sinhala' ? "තක්සේරුව ලබා දී මුද්‍රණය කරන්න" : "Select Stars to Unlock Print")
                        : (lang === 'sinhala' ? "තක්සේරුව යොමු කර මුද්‍රණය කරන්න" : "Submit Rating & Open Print")}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* DEHA LAKSHANA (දේහ ලක්ෂණ) NOTICE MODAL DIALOG */}
        {showDehaLakshanaNotice && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-center font-sans">
              <button 
                onClick={() => setShowDehaLakshanaNotice(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 cursor-pointer text-sm bg-slate-800 rounded-full w-7 h-7 flex items-center justify-center"
              >
                ✕
              </button>

              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-amber-500/5">
                👤
              </div>

              <h3 className="text-lg font-bold font-display text-slate-100 mb-2">
                {lang === 'sinhala' ? "දේහ ලක්ෂණ පරීක්ෂාව" : "Body Features Analysis"}
              </h3>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 my-4">
                <p className="text-sm font-semibold text-amber-300 leading-relaxed">
                  {lang === 'sinhala' 
                    ? "තවම එම පහසුකම සක්‍රීය කර නොමැත." 
                    : "This feature is currently not active."}
                </p>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {lang === 'sinhala'
                    ? "(ඊළඟ යාවත්කාලීනයේදී බලාපොරොත්තු වන්න!)"
                    : "(Expected in the upcoming software update!)"}
                </p>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                {lang === 'sinhala'
                  ? "දේහ ලක්ෂණ මගින් පූර්ණ චරිත හා අනාවැකි විග්‍රහ කිරීමේ නවතම පහසුකම ළඟදීම ඔබ වෙත ගෙන ඒමට අප කටයුතු කරමින් සිටිමු."
                  : "We are actively working to bring automated body feature analysis in our upcoming update."}
              </p>

              <button
                onClick={() => setShowDehaLakshanaNotice(false)}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
              >
                {lang === 'sinhala' ? "හරි, ස්තූතියි" : "Close Notice"}
              </button>
            </div>
          </div>
        )}

        {/* PALMISTRY (හස්තරේඛා) MODAL DIALOG */}
        {showPalmistryModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto text-left font-sans">
              <button 
                onClick={() => {
                  setShowPalmistryModal(false);
                  setSelectedMainTab(null);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 cursor-pointer text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-sans transition-all"
                title={lang === 'sinhala' ? "වසා දමන්න" : "Close"}
              >
                ✕ {lang === 'sinhala' ? "වසා දමන්න" : "Close"}
              </button>

              <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  ✋
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-slate-100">
                    {lang === 'sinhala' ? "හස්තරේඛා පරීක්ෂාව (Palm Reading)" : "Palmistry Analysis"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {lang === 'sinhala' 
                      ? "ඔබගේ අත්ලෙහි (දකුණු හෝ වම් අත) පැහැදිලි ඡායාරූපයක් එක් කර, ජීවන, ශීර්ෂ, හෘද සහ භාග්‍ය රේඛා ඇතුළු පූර්ණ ග්‍රහ මණ්ඩල විග්‍රහයක් ලබාගන්න."
                      : "Upload a clear image of your palm (Right or Left hand) to analyze your life, head, heart, and fate lines with planetary mounts."}
                  </p>
                </div>
              </div>

              {!palmResult ? (
                <div className="space-y-4">
                  {(palmName || palmContactValue || palmImagePreview) && (
                    <div className="flex justify-end font-sans">
                      <button
                        type="button"
                        onClick={handleClearPalmData}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{lang === 'sinhala' ? "දත්ත Clean කරන්න" : "Clear Data"}</span>
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {lang === 'sinhala' ? "නම (Full Name) *" : "Full Name *"}
                      </label>
                      <input
                        type="text"
                        value={palmName}
                        onChange={(e) => setPalmName(e.target.value)}
                        placeholder={lang === 'sinhala' ? "උදා: කසුන් පෙරේරා" : "e.g., Kasun Perera"}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-slate-300">
                          {lang === 'sinhala' ? "උපන් දිනය (Birth Date)" : "Date of Birth"}
                        </label>
                        <button
                          type="button"
                          onClick={() => setPalmPickerMode(palmPickerMode === 'dropdown' ? 'calendar' : 'dropdown')}
                          className="text-[10px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                        >
                          {palmPickerMode === 'dropdown' ? (
                            <>
                              <Calendar className="w-3 h-3 text-amber-400" />
                              <span>{lang === 'sinhala' ? "කැලැන්ඩරය" : "Calendar"}</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>{lang === 'sinhala' ? "ලැයිස්තුවෙන්" : "Dropdown List"}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {palmPickerMode === 'dropdown' ? (
                        <div className="grid grid-cols-12 gap-1.5">
                          {/* Day Select */}
                          <div className="col-span-3 relative">
                            <select
                              value={palmYMD.day}
                              onChange={(e) => handlePalmDayChange(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 appearance-none cursor-pointer text-center font-mono"
                            >
                              {Array.from({ length: getDaysInMonth(palmYMD.year, palmYMD.month) }, (_, i) => String(i + 1).padStart(2, "0")).map(d => (
                                <option key={d} value={d}>{parseInt(d, 10)}</option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1 text-slate-500">
                              <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                              </svg>
                            </div>
                          </div>

                          {/* Month Select */}
                          <div className="col-span-5 relative">
                            <select
                              value={palmYMD.month}
                              onChange={(e) => handlePalmMonthChange(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 appearance-none cursor-pointer font-sans"
                            >
                              {MONTHS.map(m => (
                                <option key={m.value} value={m.value}>
                                  {lang === 'sinhala' ? m.nameSi : m.nameEn}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1 text-slate-500">
                              <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                              </svg>
                            </div>
                          </div>

                          {/* Year Select */}
                          <div className="col-span-4 relative">
                            <select
                              value={palmYMD.year}
                              onChange={(e) => handlePalmYearChange(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 appearance-none cursor-pointer text-center font-mono"
                            >
                              {YEARS.map(yr => (
                                <option key={yr} value={yr}>{yr}</option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1 text-slate-500">
                              <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <input
                          type="date"
                          value={palmBirthDate}
                          onChange={(e) => setPalmBirthDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-sans cursor-pointer"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {lang === 'sinhala' ? "WhatsApp දුරකථන අංකය *" : "WhatsApp Phone Number *"}
                      </label>
                      <input
                        type="text"
                        value={palmContactValue}
                        onChange={(e) => setPalmContactValue(e.target.value)}
                        placeholder={lang === 'sinhala' ? "උදා: 0771234567" : "e.g., 0771234567"}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {lang === 'sinhala' ? "ස්ත්‍රී / පුරුෂ භාවය" : "Gender"}
                      </label>
                      <select
                        value={palmGender}
                        onChange={(e) => setPalmGender(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-sans cursor-pointer"
                      >
                        <option value="Male">{lang === 'sinhala' ? "පුරුෂ (Male)" : "Male"}</option>
                        <option value="Female">{lang === 'sinhala' ? "ස්ත්‍රී (Female)" : "Female"}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {lang === 'sinhala' ? "පරීක්ෂා කරන අත" : "Hand Choice"}
                      </label>
                      <select
                        value={palmHandChoice}
                        onChange={(e) => setPalmHandChoice(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-sans cursor-pointer"
                      >
                        <option value="Right">{lang === 'sinhala' ? "දකුණු අත (Right Hand)" : "Right Hand"}</option>
                        <option value="Left">{lang === 'sinhala' ? "වම් අත (Left Hand)" : "Left Hand"}</option>
                      </select>
                    </div>
                  </div>

                  {/* Photo Upload Area */}
                  <div>
                    <div className="mb-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 font-sans leading-relaxed">
                      <span className="font-bold block mb-0.5">
                        {lang === 'sinhala' ? "⚠️ වැදගත් උපදෙසක්:" : "⚠️ Important Notice:"}
                      </span>
                      {lang === 'sinhala'
                        ? "ඉතාම සූක්ෂ්ම හා නිවැරදි පරීක්ෂාවක් සඳහා අත් දෙකම එකවර ඡායාරූපගත නොකර, වම් හෝ දකුණු අත්ලෙන් එකක් පමණක් පැහැදිලිව ඡායාරූපගත කර එක් කරන්න."
                        : "For maximum precision analysis, please upload a clear photo of ONLY ONE palm (Left or Right hand) — do not take a photo of both hands together."}
                    </div>

                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {lang === 'sinhala' ? "අත්ලෙහි ඡායාරූපය (Palm Photo - Max 15MB)" : "Upload Palm Image (Max 15MB)"} *
                    </label>
                    <div className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-xl p-5 text-center bg-slate-950/60 transition-all relative cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePalmFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      {palmImagePreview ? (
                        <div className="flex flex-col items-center gap-2">
                          <img
                            src={palmImagePreview}
                            alt="Palm Preview"
                            className="w-32 h-32 object-cover rounded-lg border border-amber-500/40 shadow-lg"
                          />
                          <p className="text-[11px] text-amber-400 font-semibold font-sans">
                            {lang === 'sinhala' ? "ඡායාරූපය තෝරාගෙන ඇත. (වෙනස් කිරීමට ක්ලික් කරන්න)" : "Image selected. (Click to change)"}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto text-xl">
                            📸
                          </div>
                          <p className="text-xs text-slate-300 font-semibold font-sans">
                            {lang === 'sinhala' 
                              ? "අත්ලෙහි ඡායාරූපයක් එක් කිරීමට මෙතන ක්ලික් කරන්න" 
                              : "Click here or drag to upload palm photo"}
                          </p>
                          <p className="text-[10px] text-slate-500 font-sans">
                            {lang === 'sinhala' 
                              ? "උපරිම ගොනු ප්‍රමාණය 15MB වේ. කරුණාකර පැහැදිලි ආලෝකයේ ගත් ඡායාරූපයක් එක් කරන්න." 
                              : "Max file size: 15MB. Ensure adequate lighting and visible palm lines."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Size limit / Error alert */}
                  {palmFileError && (
                    <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl text-xs font-medium flex items-center gap-2 font-sans">
                      <span className="text-base flex-shrink-0">⚠️</span>
                      <span>{palmFileError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleAnalyzePalm}
                    disabled={isAnalyzingPalm || !palmImageBase64}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                  >
                    {isAnalyzingPalm ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        <span>{lang === 'sinhala' ? "අත්ලෙහි රේඛා පරික්ෂා කරමින් පවතී..." : "Analyzing Palm Lines & Mounts..."}</span>
                      </>
                    ) : (
                      <>
                        <span>✋</span>
                        <span>{lang === 'sinhala' ? "හස්තරේඛා පරීක්ෂා කරන්න" : "Analyze Palmistry Now"}</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* PALMISTRY ANALYSIS RESULT VIEW */
                <div className="space-y-5">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block font-sans">
                        {lang === 'sinhala' ? "හස්තරේඛා වාර්තාව" : "Palmistry Analysis Complete"}
                      </span>
                      <h4 className="text-base font-bold text-slate-100 font-display">
                        {palmName || "Anonymous"} - {palmHandChoice === "Left" ? (lang === 'sinhala' ? "වම් අත" : "Left Hand") : (lang === 'sinhala' ? "දකුණු අත" : "Right Hand")}
                      </h4>
                    </div>
                    {palmImagePreview && (
                      <img
                        src={palmImagePreview}
                        alt="Uploaded Palm"
                        className="w-14 h-14 object-cover rounded-lg border border-amber-500/40"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Life Line */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                      <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-sans">
                        <span>❤️</span> {lang === 'sinhala' ? "ජීවන රේඛාව (Life Line)" : "Life Line"}
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {palmResult.lifeLine}
                      </p>
                    </div>

                    {/* Head Line */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                      <h5 className="text-xs font-bold text-sky-400 flex items-center gap-1.5 font-sans">
                        <span>🧠</span> {lang === 'sinhala' ? "ශීර්ෂ රේඛාව (Head Line)" : "Head Line"}
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {palmResult.headLine}
                      </p>
                    </div>

                    {/* Heart Line */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                      <h5 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 font-sans">
                        <span>💖</span> {lang === 'sinhala' ? "හෘද රේඛාව (Heart Line)" : "Heart Line"}
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {palmResult.heartLine}
                      </p>
                    </div>

                    {/* Fate Line */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                      <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-sans">
                        <span>💰</span> {lang === 'sinhala' ? "භාග්‍ය / ධන රේඛාව (Fate & Wealth Line)" : "Fate & Wealth Line"}
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {palmResult.fateLine}
                      </p>
                    </div>
                  </div>

                  {/* Sun Line & Mounts */}
                  {palmResult.sunLine && (
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                      <h5 className="text-xs font-bold text-yellow-400 flex items-center gap-1.5 font-sans">
                        <span>☀️</span> {lang === 'sinhala' ? "සූර්ය රේඛාව (Sun & Fame Line)" : "Sun & Fame Line"}
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {palmResult.sunLine}
                      </p>
                    </div>
                  )}

                  {palmResult.mounts && (
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                      <h5 className="text-xs font-bold text-purple-400 flex items-center gap-1.5 font-sans">
                        <span>🪐</span> {lang === 'sinhala' ? "ග්‍රහ මණ්ඩල විග්‍රහය (Mounts of Palm)" : "Mounts Analysis"}
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {palmResult.mounts}
                      </p>
                    </div>
                  )}

                  {/* Special Signs & Overall */}
                  {palmResult.specialSigns && (
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                      <h5 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 font-sans">
                        <span>✨</span> {lang === 'sinhala' ? "විශේෂ සංකේත සහ ලක්ෂණ (Special Signs)" : "Special Signs"}
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {palmResult.specialSigns}
                      </p>
                    </div>
                  )}

                  <div className="bg-slate-950 border border-amber-500/30 p-4 rounded-xl space-y-1">
                    <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-sans">
                      <span>📜</span> {lang === 'sinhala' ? "සමස්ත පලාපල සහ උපදෙස් (Overall Reading)" : "Overall Summary & Guidance"}
                    </h5>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {palmResult.overallReading}
                    </p>
                    {palmResult.remedies && (
                      <p className="text-xs text-amber-200/90 leading-relaxed font-sans pt-2 border-t border-slate-800/80 mt-2">
                        💡 <strong>{lang === 'sinhala' ? "උපදෙස් / ශාන්තිකර්ම:" : "Remedies:"}</strong> {palmResult.remedies}
                      </p>
                    )}
                  </div>

                  {/* FEEDBACK SECTION FOR PALMISTRY */}
                  <div className="bg-slate-950 border border-amber-500/40 p-4 rounded-xl space-y-3 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⭐</span>
                      <h5 className="text-xs font-bold text-amber-300 font-sans">
                        {lang === 'sinhala' ? "තරු ලබාදී මේ සේවාව පිළිබඳ අදහසක් ලබාදීමට කාරුණික වන්න" : "Please rate & provide your feedback for this service"}
                      </h5>
                    </div>

                    {palmRatingSubmitted ? (
                      <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs font-semibold flex items-center gap-2 font-sans">
                        <span>✓</span>
                        <span>{lang === 'sinhala' ? "ඔබගේ අදහස් හා තක්සේරුව සාර්ථකව යොමු කෙරිණි. ස්තූතියි!" : "Thank you! Your rating and feedback have been submitted successfully."}</span>
                      </div>
                    ) : (
                      <div className="space-y-3 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-300 font-medium">
                            {lang === 'sinhala' ? "තක්සේරුව (Rating):" : "Rating:"}
                          </span>
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                type="button"
                                key={star}
                                onClick={() => setPalmUserRating(star)}
                                className="text-2xl cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                              >
                                <span className={palmUserRating > 0 && star <= palmUserRating ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "text-slate-700"}>
                                  ★
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <textarea
                            value={palmUserComment}
                            onChange={(e) => setPalmUserComment(e.target.value)}
                            placeholder={lang === 'sinhala' ? "තරු ලබාදී මේ සේවාව පිළිබඳ අදහසක් ලබාදීමට කාරුණික වන්න..." : "Write your feedback or comment regarding this service..."}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none font-sans"
                            rows={2}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSubmitPalmRating()}
                          disabled={palmUserRating === 0 || isSubmittingPalmRating}
                          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed font-sans"
                        >
                          {isSubmittingPalmRating ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                              <span>{lang === 'sinhala' ? "යොමු කරමින්..." : "Submitting..."}</span>
                            </>
                          ) : (
                            <span>{lang === 'sinhala' ? "අදහස් හා තක්සේරුව යොමු කරන්න" : "Submit Rating & Feedback"}</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClearPalmData}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 font-bold text-xs rounded-xl cursor-pointer transition-all font-sans flex items-center justify-center gap-2 shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lang === 'sinhala' ? "දත්ත Clean කර වෙනත් අත්ලක් පරීක්ෂා කරන්න" : "Clear Data & Test Another Palm"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPalmistryModal(false);
                        setSelectedMainTab(null);
                      }}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-all font-sans shadow-md flex items-center gap-1.5"
                    >
                      ✕ {lang === 'sinhala' ? "වසා දමන්න" : "Close"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DEHALAKSHANA (දේහලක්ෂණ) MODAL DIALOG */}
        {showDehalakshanaModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-teal-500/30 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto text-left font-sans">
              <button 
                onClick={() => {
                  setShowDehalakshanaModal(false);
                  setSelectedMainTab(null);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 cursor-pointer text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-sans transition-all"
                title={lang === 'sinhala' ? "වසා දමන්න" : "Close"}
              >
                ✕ {lang === 'sinhala' ? "වසා දමන්න" : "Close"}
              </button>

              <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
                <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  👤
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-slate-100">
                    {lang === 'sinhala' ? "දේහලක්ෂණ හා සාමුද්‍රිකා පරීක්ෂාව" : "Dehalakshana Analysis"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {lang === 'sinhala' 
                      ? "මුහුණේ අවයව, ගෙල සහ උරහිස් පිහිටීම අනුව පූර්ණ සාමුද්‍රිකා ශාස්ත්‍රානුකූල දේහලක්ෂණ පලාපල විග්‍රහයක් ලබාගන්න."
                      : "Upload photo showing face, neck, and shoulders to analyze your physical traits according to Samudrika Shastra."}
                  </p>
                </div>
              </div>

              {/* INSTRUCTION / GUIDELINE NOTIFICATION BOX */}
              <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-teal-950/80 via-emerald-950/60 to-cyan-950/80 border border-teal-500/40 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center text-base shrink-0 mt-0.5 border border-teal-500/40">
                    💡
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-teal-300 font-display flex items-center gap-2">
                      <span>{lang === 'sinhala' ? "වැදගත් උපදෙස් සහ දැනුම්දීම (Notification)" : "Important Instructions"}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-teal-500/30 text-teal-200 border border-teal-400/30">100% Accuracy</span>
                    </h4>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {lang === 'sinhala'
                        ? "සූක්ෂ්ම හා 100%ක් නිවැරදි දේහලක්ෂණ පලාපල ලබාගැනීම සඳහා, ඔබගේ මුහුණේ අවයව (ඇස්, නාසය, දෙතොල්), ගෙල (බෙල්ල) සහ උරහිස් ප්‍රදේශය උරහිසෙන් අඟලක් හෝ 2ක් පමණ පහළට පැහැදිලිව පෙනෙන ඡායාරූපයක් (Photo) ලබාදෙන්න. මෙවැනි පැහැදිලි ඡායාරූපයක් ලබාදීමෙන් ලැබෙන පලාපල වාර්තාවේ සාර්ථකත්වය හා නිවැරදිතාවය ඉතා ඉහළ මට්ටමක පවතී."
                        : "For maximum accuracy, please upload a clear photograph where your facial features (eyes, nose, lips), neck, and shoulders (extending about 1-2 inches below shoulders) are clearly visible."}
                    </p>
                  </div>
                </div>
              </div>

              {!dehaResult ? (
                <div className="space-y-4">
                  {(dehaName || dehaContactValue || dehaImagePreview) && (
                    <div className="flex justify-end font-sans">
                      <button
                        type="button"
                        onClick={handleClearDehaData}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 border border-teal-500/30 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{lang === 'sinhala' ? "දත්ත Clean කරන්න" : "Clear Data"}</span>
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {lang === 'sinhala' ? "නම (Full Name) *" : "Full Name *"}
                      </label>
                      <input
                        type="text"
                        value={dehaName}
                        onChange={(e) => setDehaName(e.target.value)}
                        placeholder={lang === 'sinhala' ? "උදා: කසුන් පෙරේරා" : "e.g., Kasun Perera"}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {lang === 'sinhala' ? "ස්ත්‍රී / පුරුෂ භාවය" : "Gender"}
                      </label>
                      <select
                        value={dehaGender}
                        onChange={(e) => setDehaGender(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-sans cursor-pointer"
                      >
                        <option value="Male">{lang === 'sinhala' ? "පුරුෂ (Male)" : "Male"}</option>
                        <option value="Female">{lang === 'sinhala' ? "ස්ත්‍රී (Female)" : "Female"}</option>
                      </select>
                    </div>
                  </div>

                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-300">
                        {lang === 'sinhala' ? "උපන් දිනය (Birth Date) *" : "Birth Date *"}
                      </label>
                      <button
                        type="button"
                        onClick={() => setDehaPickerMode(dehaPickerMode === 'dropdown' ? 'calendar' : 'dropdown')}
                        className="text-[10px] font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                      >
                        {dehaPickerMode === 'dropdown' ? (
                          <>
                            <Calendar className="w-3 h-3 text-teal-400" />
                            <span>{lang === 'sinhala' ? "කැලැන්ඩරය" : "Calendar"}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-teal-400" />
                            <span>{lang === 'sinhala' ? "ලැයිස්තුවෙන්" : "Dropdown List"}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {dehaPickerMode === 'dropdown' ? (
                      <div className="grid grid-cols-12 gap-1.5">
                        {/* Day Select */}
                        <div className="col-span-3 relative">
                          <select
                            value={dehaYMD.day}
                            onChange={(e) => handleDehaDayChange(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-1 text-xs text-slate-200 focus:outline-none focus:border-teal-500 appearance-none cursor-pointer text-center font-mono"
                          >
                            {Array.from({ length: getDaysInMonth(dehaYMD.year, dehaYMD.month) }, (_, i) => String(i + 1).padStart(2, "0")).map(d => (
                              <option key={d} value={d}>{parseInt(d, 10)}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1 text-slate-500">
                            <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                            </svg>
                          </div>
                        </div>

                        {/* Month Select */}
                        <div className="col-span-5 relative">
                          <select
                            value={dehaYMD.month}
                            onChange={(e) => handleDehaMonthChange(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-1 text-xs text-slate-200 focus:outline-none focus:border-teal-500 appearance-none cursor-pointer font-sans"
                          >
                            {MONTHS.map(m => (
                              <option key={m.value} value={m.value}>
                                {lang === 'sinhala' ? m.nameSi : m.nameEn}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1 text-slate-500">
                            <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                            </svg>
                          </div>
                        </div>

                        {/* Year Select */}
                        <div className="col-span-4 relative">
                          <select
                            value={dehaYMD.year}
                            onChange={(e) => handleDehaYearChange(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-1 text-xs text-slate-200 focus:outline-none focus:border-teal-500 appearance-none cursor-pointer text-center font-mono"
                          >
                            {YEARS.map(yr => (
                              <option key={yr} value={yr}>{yr}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1 text-slate-500">
                            <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="date"
                        value={dehaBirthDate}
                        onChange={(e) => setDehaBirthDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-sans cursor-pointer"
                      />
                    )}
                  </div>

                  {/* Photo Upload Area */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {lang === 'sinhala' ? "මුහුණ, ගෙල සහ උරහිස් පෙනෙන ඡායාරූපය (Face & Upper Body Photo) *" : "Upload Photo (Face, Neck & Shoulders) *"}
                    </label>
                    <div className="border-2 border-dashed border-teal-500/40 hover:border-teal-400 bg-slate-950/80 rounded-xl p-4 text-center cursor-pointer transition-all relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleDehaImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      {dehaImagePreview ? (
                        <div className="relative inline-block">
                          <img
                            src={dehaImagePreview}
                            alt="Preview"
                            className="max-h-48 rounded-lg border border-teal-500/50 shadow-md mx-auto object-contain"
                          />
                          <p className="text-[10px] text-teal-300 mt-2 font-bold">
                            ✓ {lang === 'sinhala' ? "ඡායාරූපය තෝරාගෙන ඇත. වෙනස් කිරීමට නැවත ක්ලික් කරන්න." : "Photo selected. Click to change."}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 py-2">
                          <div className="w-10 h-10 mx-auto rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-300 text-lg">
                            📷
                          </div>
                          <p className="text-xs text-slate-200 font-medium">
                            {lang === 'sinhala' ? "ඡායාරූපය මෙතැනට Drag & Drop කරන්න හෝ ක්ලික් කර තෝරන්න" : "Drag & drop photo here or click to browse"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            (JPEG, PNG - Max 25MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {dehaFileError && (
                    <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-rose-300 text-xs">
                      {dehaFileError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAnalyzeDehalakshana}
                    disabled={isAnalyzingDeha}
                    className="w-full py-3 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-xl cursor-pointer transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAnalyzingDeha ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                        <span>{lang === 'sinhala' ? "දේහලක්ෂණ ශාස්ත්‍රානුකූලව පරීක්ෂා කරමින් පවතී..." : "Analyzing features with AI..."}</span>
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        <span>{lang === 'sinhala' ? "දේහලක්ෂණ පරීක්ෂා කර වාර්තාව ලබාගන්න" : "Analyze Features & Get Report"}</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* RESULT DISPLAY */
                <div className="space-y-4">
                  <div className="p-4 bg-teal-950/40 border border-teal-500/40 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                        ✓ {lang === 'sinhala' ? "සාර්ථකව පරීක්ෂා කරන ලදී" : "Analysis Complete"}
                      </span>
                      <h4 className="text-sm font-bold text-slate-100 mt-1">
                        {dehaName} - {lang === 'sinhala' ? "දේහලක්ෂණ පලාපල වාර්තාව" : "Dehalakshana Reading Report"}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDehaResult(null)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      {lang === 'sinhala' ? "නැවත පරීක්ෂා කරන්න" : "Analyze Another"}
                    </button>
                  </div>

                  <div className="space-y-3 font-sans">
                    {dehaResult.facialFeatures && (
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <h5 className="text-xs font-bold text-teal-400 mb-1 flex items-center gap-2">
                          <span>👤</span>
                          <span>{lang === 'sinhala' ? "මුහුණේ ස්වරූපය සහ නළල මගින් පෙනෙන පෞරුෂය" : "Facial Shape & Forehead Characteristics"}</span>
                        </h5>
                        <p className="text-xs text-slate-200 leading-relaxed">{dehaResult.facialFeatures}</p>
                      </div>
                    )}

                    {dehaResult.eyesNoseLips && (
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <h5 className="text-xs font-bold text-sky-400 mb-1 flex items-center gap-2">
                          <span>👁️</span>
                          <span>{lang === 'sinhala' ? "ඇස්, නාසය, දෙතොල් සහ නිකට මගින් කියැවෙන ගුණාංග" : "Eyes, Nose, Lips & Facial Expression"}</span>
                        </h5>
                        <p className="text-xs text-slate-200 leading-relaxed">{dehaResult.eyesNoseLips}</p>
                      </div>
                    )}

                    {dehaResult.neckShoulders && (
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <h5 className="text-xs font-bold text-emerald-400 mb-1 flex items-center gap-2">
                          <span>🎗️</span>
                          <span>{lang === 'sinhala' ? "ගෙල (බෙල්ල) සහ උරහිස් පිහිටීමෙන් කියැවෙන යස ඉසුරු" : "Neck & Shoulder Trait Indicators"}</span>
                        </h5>
                        <p className="text-xs text-slate-200 leading-relaxed">{dehaResult.neckShoulders}</p>
                      </div>
                    )}

                    {dehaResult.bodyTraitsAndSigns && (
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <h5 className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-2">
                          <span>🌟</span>
                          <span>{lang === 'sinhala' ? "විශේෂ දේහ ලක්ෂණ සහ ස්වරූපය" : "Special Body Traits & Auspicious Features"}</span>
                        </h5>
                        <p className="text-xs text-slate-200 leading-relaxed">{dehaResult.bodyTraitsAndSigns}</p>
                      </div>
                    )}

                    {dehaResult.overallReading && (
                      <div className="bg-slate-950 p-4 rounded-xl border border-teal-500/30">
                        <h5 className="text-xs font-bold text-teal-300 mb-1 flex items-center gap-2">
                          <span>📜</span>
                          <span>{lang === 'sinhala' ? "සමස්ත පූර්ණ දේහලක්ෂණ පලාපල විග්‍රහය" : "Overall Dehalakshana Summary"}</span>
                        </h5>
                        <p className="text-xs text-slate-100 leading-relaxed">{dehaResult.overallReading}</p>
                      </div>
                    )}

                    {dehaResult.remediesAndGuidance && (
                      <div className="bg-slate-950 p-4 rounded-xl border border-purple-500/30">
                        <h5 className="text-xs font-bold text-purple-300 mb-1 flex items-center gap-2">
                          <span>🪔</span>
                          <span>{lang === 'sinhala' ? "සුබ සෙත සැලසෙන ශාන්තිකර්ම සහ උපදෙස්" : "Auspicious Remedies & Guidance"}</span>
                        </h5>
                        <p className="text-xs text-slate-200 leading-relaxed">{dehaResult.remediesAndGuidance}</p>
                      </div>
                    )}

                    {/* FEEDBACK SECTION FOR DEHALAKSHANA */}
                    <div className="bg-slate-950 border border-teal-500/40 p-4 rounded-xl space-y-3 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-base">⭐</span>
                        <h5 className="text-xs font-bold text-teal-300 font-sans">
                          {lang === 'sinhala' ? "තරු ලබාදී මේ සේවාව පිළිබඳ අදහසක් ලබාදීමට කාරුණික වන්න" : "Please rate & provide your feedback for this service"}
                        </h5>
                      </div>

                      {dehaRatingSubmitted ? (
                        <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs font-semibold flex items-center gap-2 font-sans">
                          <span>✓</span>
                          <span>{lang === 'sinhala' ? "ඔබගේ අදහස් හා තක්සේරුව සාර්ථකව යොමු කෙරිණි. ස්තූතියි!" : "Thank you! Your rating and feedback have been submitted successfully."}</span>
                        </div>
                      ) : (
                        <div className="space-y-3 font-sans">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-300 font-medium">
                              {lang === 'sinhala' ? "තක්සේරුව (Rating):" : "Rating:"}
                            </span>
                            <div className="flex gap-1.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  type="button"
                                  key={star}
                                  onClick={() => setDehaUserRating(star)}
                                  className="text-2xl cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                                >
                                  <span className={dehaUserRating > 0 && star <= dehaUserRating ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "text-slate-700"}>
                                    ★
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <textarea
                              value={dehaUserComment}
                              onChange={(e) => setDehaUserComment(e.target.value)}
                              placeholder={lang === 'sinhala' ? "තරු ලබාදී මේ සේවාව පිළිබඳ අදහසක් ලබාදීමට කාරුණික වන්න..." : "Write your feedback or comment regarding this service..."}
                              className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none font-sans"
                              rows={2}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSubmitDehaRating()}
                            disabled={dehaUserRating === 0 || isSubmittingDehaRating}
                            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed font-sans"
                          >
                            {isSubmittingDehaRating ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                                <span>{lang === 'sinhala' ? "යොමු කරමින්..." : "Submitting..."}</span>
                              </>
                            ) : (
                              <span>{lang === 'sinhala' ? "අදහස් හා තක්සේරුව යොමු කරන්න" : "Submit Rating & Feedback"}</span>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 font-sans">
                    <button
                      type="button"
                      onClick={() => handleCopyText(`දේහලක්ෂණ පලාපල වාර්තාව - ${dehaName}\n\n${dehaResult.overallReading}`)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{lang === 'sinhala' ? "පලාපල Copy කරන්න" : "Copy Reading"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearDehaData}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 border border-teal-500/30 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 font-sans shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
                      <span>{lang === 'sinhala' ? "දත්ත Clean කර නව පරීක්ෂාවක් කරන්න" : "Clear Data & New Reading"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowDehalakshanaModal(false);
                        setSelectedMainTab(null);
                      }}
                      className="px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-1.5"
                    >
                      ✕ {lang === 'sinhala' ? "වසා දමන්න" : "Close"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADMIN VIEW PALMISTRY DETAIL MODAL */}
        {viewingAdminPalmReport && (
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto text-left font-sans">
              <button 
                onClick={() => setViewingAdminPalmReport(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 cursor-pointer text-sm bg-slate-800 rounded-full w-7 h-7 flex items-center justify-center"
              >
                ✕
              </button>

              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div>
                  <span className="px-2 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                    ✋ Palmistry Report Log
                  </span>
                  <h3 className="text-base font-bold text-slate-100 mt-1">
                    {viewingAdminPalmReport.birthDetails?.name || "Anonymous"} - {viewingAdminPalmReport.birthDetails?.handChoice || "Right"} Hand
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Created: {new Date(viewingAdminPalmReport.createdAt).toLocaleString()} | Contact: {viewingAdminPalmReport.contactValue}
                    {viewingAdminPalmReport.birthDetails?.birthDate ? ` | Birth Date: ${viewingAdminPalmReport.birthDetails.birthDate}` : ' | Birth Date: N/A'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    deleteAdminReport(viewingAdminPalmReport.id);
                    setViewingAdminPalmReport(null);
                  }}
                  className="px-3 py-1.5 bg-red-950/60 border border-red-500/30 text-rose-300 hover:bg-red-900 text-xs font-bold rounded-lg cursor-pointer transition-all"
                >
                  Delete Report
                </button>
              </div>

              {(() => {
                const palmImg = viewingAdminPalmReport.palmImageBase64 || viewingAdminPalmReport.storedImage || viewingAdminPalmReport.imageBase64;
                return palmImg ? (
                  <div className="mb-5 p-3.5 bg-slate-950 rounded-xl border border-amber-500/30 text-center">
                    <p className="text-[11px] font-bold text-amber-400 mb-2 font-sans">
                      📷 Uploaded User Palm Photo:
                    </p>
                    <img
                      src={palmImg}
                      alt="Uploaded Palm"
                      onClick={() => openImageInNewTab(palmImg)}
                      className="max-h-60 mx-auto rounded-lg border border-amber-500/40 shadow-xl object-contain cursor-pointer hover:opacity-90 transition-all hover:scale-[1.01]"
                      title="Click to open image in new browser tab"
                    />
                    <div className="mt-3 flex justify-center">
                      <button
                        type="button"
                        onClick={() => openImageInNewTab(palmImg)}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs rounded-lg cursor-pointer transition-all shadow-md flex items-center gap-2 font-sans"
                      >
                        <span>🔍</span>
                        <span>{lang === 'sinhala' ? "ඡායාරූපය බ්‍රවුසරයෙන් විවෘත කරන්න" : "Open Photo in New Browser Tab"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3.5 bg-slate-950/80 rounded-xl border border-amber-500/20 text-center space-y-2 font-sans">
                    <p className="text-xs text-amber-300 font-medium">📷 මෙම පරීක්ෂාව සඳහා ඡායාරූපය දත්තගබඩාවේ පවතී.</p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const token = adminToken || safeStorage.getItem("astro_admin_token", true) || safeStorage.getItem("astro_admin_token", false);
                          const res = await fetch(getApiUrl(`/api/admin/reports/${viewingAdminPalmReport.id}/photo`), {
                            headers: { "Authorization": `Bearer ${token}` }
                          });
                          const data = await safeParseJson(res);
                          if (data && data.success && data.photo) {
                            setViewingAdminPalmReport((prev: any) => prev ? { ...prev, palmImageBase64: data.photo } : prev);
                          } else {
                            setViewingAdminPhotoModal({
                              id: viewingAdminPalmReport.id,
                              clientName: viewingAdminPalmReport.birthDetails?.name || "Client",
                              type: 'palm',
                              loading: false,
                              error: data?.message || (lang === 'sinhala' ? "මෙම පරීක්ෂාව සඳහා ඡායාරූපයක් දත්තගබඩාවේ සුරැකී නොමැත." : "No photo found in database for this reading.")
                            });
                          }
                        } catch (e) {
                          setViewingAdminPhotoModal({
                            id: viewingAdminPalmReport.id,
                            clientName: viewingAdminPalmReport.birthDetails?.name || "Client",
                            type: 'palm',
                            loading: false,
                            error: lang === 'sinhala' ? "ඡායාරූපය ලබාගැනීමේදී දෝෂයක් සිදු විය." : "Failed to load photo."
                          });
                        }
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>📥</span>
                      <span>{lang === 'sinhala' ? "ඡායාරූපය Load කරන්න (Load Photo from Database)" : "Load Photo from Database"}</span>
                    </button>
                  </div>
                );
              })()}

              {viewingAdminPalmReport.palmistryData && (
                <div className="space-y-3">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <strong className="text-amber-400 text-xs block mb-1">❤️ ජීවන රේඛාව (Life Line)</strong>
                    <p className="text-xs text-slate-300 leading-relaxed">{viewingAdminPalmReport.palmistryData.lifeLine}</p>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <strong className="text-sky-400 text-xs block mb-1">🧠 ශීර්ෂ රේඛාව (Head Line)</strong>
                    <p className="text-xs text-slate-300 leading-relaxed">{viewingAdminPalmReport.palmistryData.headLine}</p>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <strong className="text-rose-400 text-xs block mb-1">💖 හෘද රේඛාව (Heart Line)</strong>
                    <p className="text-xs text-slate-300 leading-relaxed">{viewingAdminPalmReport.palmistryData.heartLine}</p>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <strong className="text-emerald-400 text-xs block mb-1">💰 භාග්‍ය රේඛාව (Fate Line)</strong>
                    <p className="text-xs text-slate-300 leading-relaxed">{viewingAdminPalmReport.palmistryData.fateLine}</p>
                  </div>
                  {viewingAdminPalmReport.palmistryData.overallReading && (
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/30">
                      <strong className="text-amber-300 text-xs block mb-1">📜 සමස්ත පලාපල (Overall Reading)</strong>
                      <p className="text-xs text-slate-200 leading-relaxed">{viewingAdminPalmReport.palmistryData.overallReading}</p>
                    </div>
                  )}

                  {(viewingAdminPalmReport.rating || viewingAdminPalmReport.comment) && (
                    <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-300">⭐ පරිශීලක අදහස් හා තක්සේරුව (User Feedback):</span>
                        <div className="flex text-amber-400 text-sm">
                          {Array.from({ length: 5 }, (_, sIdx) => (
                            <span key={sIdx}>{sIdx < Number(viewingAdminPalmReport.rating) ? "★" : "☆"}</span>
                          ))}
                        </div>
                      </div>
                      {viewingAdminPalmReport.comment && (
                        <p className="text-xs text-slate-200 italic font-sans whitespace-pre-line leading-relaxed">
                          "{viewingAdminPalmReport.comment}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADMIN VIEW DEHALAKSHANA DETAIL MODAL */}
        {viewingAdminDehaReport && (
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-teal-500/40 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto text-left font-sans">
              <button 
                onClick={() => setViewingAdminDehaReport(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 cursor-pointer text-sm bg-slate-800 rounded-full w-7 h-7 flex items-center justify-center"
              >
                ✕
              </button>

              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div>
                  <span className="px-2 py-0.5 rounded text-[9px] bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold uppercase">
                    👤 Dehalakshana Report Log
                  </span>
                  <h3 className="text-base font-bold text-slate-100 mt-1">
                    {viewingAdminDehaReport.birthDetails?.name || "Anonymous"} - {viewingAdminDehaReport.birthDetails?.gender === 'Female' ? 'ස්ත්‍රී' : 'පුරුෂ'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Created: {new Date(viewingAdminDehaReport.createdAt).toLocaleString()} | Contact: {viewingAdminDehaReport.contactValue}
                    {viewingAdminDehaReport.birthDetails?.birthDate ? ` | Birth Date: ${viewingAdminDehaReport.birthDetails.birthDate}` : ' | Birth Date: N/A'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    deleteAdminReport(viewingAdminDehaReport.id);
                    setViewingAdminDehaReport(null);
                  }}
                  className="px-3 py-1.5 bg-red-950/60 border border-red-500/30 text-rose-300 hover:bg-red-900 text-xs font-bold rounded-lg cursor-pointer transition-all"
                >
                  Delete Report
                </button>
              </div>

              {(() => {
                const dehaImg = viewingAdminDehaReport.dehalakshanaImageBase64 || viewingAdminDehaReport.storedImage || viewingAdminDehaReport.imageBase64;
                return dehaImg ? (
                  <div className="mb-5 p-3.5 bg-slate-950 rounded-xl border border-teal-500/30 text-center">
                    <p className="text-[11px] font-bold text-teal-400 mb-2 font-sans">
                      📷 Uploaded User Face & Upper Body Photo:
                    </p>
                    <img
                      src={dehaImg}
                      alt="Uploaded Face"
                      onClick={() => openImageInNewTab(dehaImg)}
                      className="max-h-60 mx-auto rounded-lg border border-teal-500/40 shadow-xl object-contain cursor-pointer hover:opacity-90 transition-all hover:scale-[1.01]"
                      title="Click to open image in new browser tab"
                    />
                    <div className="mt-3 flex justify-center">
                      <button
                        type="button"
                        onClick={() => openImageInNewTab(dehaImg)}
                        className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs rounded-lg cursor-pointer transition-all shadow-md flex items-center gap-2 font-sans"
                      >
                        <span>🔍</span>
                        <span>{lang === 'sinhala' ? "ඡායාරූපය බ්‍රවුසරයෙන් විවෘත කරන්න" : "Open Photo in New Browser Tab"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3.5 bg-slate-950/80 rounded-xl border border-teal-500/20 text-center space-y-2 font-sans">
                    <p className="text-xs text-teal-300 font-medium">📷 මෙම පරීක්ෂාව සඳහා ඡායාරූපය දත්තගබඩාවේ පවතී.</p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const token = adminToken || safeStorage.getItem("astro_admin_token", true) || safeStorage.getItem("astro_admin_token", false);
                          const res = await fetch(getApiUrl(`/api/admin/reports/${viewingAdminDehaReport.id}/photo`), {
                            headers: { "Authorization": `Bearer ${token}` }
                          });
                          const data = await safeParseJson(res);
                          if (data && data.success && data.photo) {
                            setViewingAdminDehaReport((prev: any) => prev ? { ...prev, dehalakshanaImageBase64: data.photo } : prev);
                          } else {
                            setViewingAdminPhotoModal({
                              id: viewingAdminDehaReport.id,
                              clientName: viewingAdminDehaReport.birthDetails?.name || "Client",
                              type: 'deha',
                              loading: false,
                              error: data?.message || (lang === 'sinhala' ? "මෙම පරීක්ෂාව සඳහා ඡායාරූපයක් දත්තගබඩාවේ සුරැකී නොමැත." : "No photo found in database for this reading.")
                            });
                          }
                        } catch (e) {
                          setViewingAdminPhotoModal({
                            id: viewingAdminDehaReport.id,
                            clientName: viewingAdminDehaReport.birthDetails?.name || "Client",
                            type: 'deha',
                            loading: false,
                            error: lang === 'sinhala' ? "ඡායාරූපය ලබාගැනීමේදී දෝෂයක් සිදු විය." : "Failed to load photo."
                          });
                        }
                      }}
                      className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>📥</span>
                      <span>{lang === 'sinhala' ? "ඡායාරූපය Load කරන්න (Load Photo from Database)" : "Load Photo from Database"}</span>
                    </button>
                  </div>
                );
              })()}

              {viewingAdminDehaReport.dehalakshanaData && (
                <div className="space-y-3">
                  {viewingAdminDehaReport.dehalakshanaData.facialFeatures && (
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <strong className="text-teal-400 text-xs block mb-1">👤 මුහුණ සහ නළල පෞරුෂය (Facial Shape & Forehead)</strong>
                      <p className="text-xs text-slate-300 leading-relaxed">{viewingAdminDehaReport.dehalakshanaData.facialFeatures}</p>
                    </div>
                  )}
                  {viewingAdminDehaReport.dehalakshanaData.eyesNoseLips && (
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <strong className="text-sky-400 text-xs block mb-1">👁️ ඇස්, නාසය, දෙතොල් සහ නිකට (Eyes, Nose, Lips & Chin)</strong>
                      <p className="text-xs text-slate-300 leading-relaxed">{viewingAdminDehaReport.dehalakshanaData.eyesNoseLips}</p>
                    </div>
                  )}
                  {viewingAdminDehaReport.dehalakshanaData.neckShoulders && (
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <strong className="text-emerald-400 text-xs block mb-1">🎗️ ගෙල (බෙල්ල) සහ උරහිස් (Neck & Shoulders)</strong>
                      <p className="text-xs text-slate-300 leading-relaxed">{viewingAdminDehaReport.dehalakshanaData.neckShoulders}</p>
                    </div>
                  )}
                  {viewingAdminDehaReport.dehalakshanaData.bodyTraitsAndSigns && (
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <strong className="text-amber-400 text-xs block mb-1">🌟 විශේෂ දේහ ලක්ෂණ (Special Body Features)</strong>
                      <p className="text-xs text-slate-300 leading-relaxed">{viewingAdminDehaReport.dehalakshanaData.bodyTraitsAndSigns}</p>
                    </div>
                  )}
                  {viewingAdminDehaReport.dehalakshanaData.overallReading && (
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-teal-500/30">
                      <strong className="text-teal-300 text-xs block mb-1">📜 සමස්ත පූර්ණ දේහලක්ෂණ පලාපල (Overall Reading)</strong>
                      <p className="text-xs text-slate-200 leading-relaxed">{viewingAdminDehaReport.dehalakshanaData.overallReading}</p>
                    </div>
                  )}
                  {viewingAdminDehaReport.dehalakshanaData.remediesAndGuidance && (
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-purple-500/30">
                      <strong className="text-purple-300 text-xs block mb-1">🪔 සුබ සෙත හා උපදෙස් (Remedies & Guidance)</strong>
                      <p className="text-xs text-slate-200 leading-relaxed">{viewingAdminDehaReport.dehalakshanaData.remediesAndGuidance}</p>
                    </div>
                  )}

                  {(viewingAdminDehaReport.rating || viewingAdminDehaReport.comment) && (
                    <div className="p-3.5 bg-teal-950/40 border border-teal-500/40 rounded-xl text-left space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-teal-300">⭐ පරිශීලක අදහස් හා තක්සේරුව (User Feedback):</span>
                        <div className="flex text-amber-400 text-sm">
                          {Array.from({ length: 5 }, (_, sIdx) => (
                            <span key={sIdx}>{sIdx < Number(viewingAdminDehaReport.rating) ? "★" : "☆"}</span>
                          ))}
                        </div>
                      </div>
                      {viewingAdminDehaReport.comment && (
                        <p className="text-xs text-slate-200 italic font-sans whitespace-pre-line leading-relaxed">
                          "{viewingAdminDehaReport.comment}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DEDICATED ADMIN ON-DEMAND PHOTO PREVIEW MODAL */}
        {viewingAdminPhotoModal && (
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 max-w-xl w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto text-left font-sans animate-in fade-in">
              <button 
                onClick={() => setViewingAdminPhotoModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 cursor-pointer text-sm bg-slate-800 rounded-full w-7 h-7 flex items-center justify-center"
              >
                ✕
              </button>

              <div className="border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-base">{viewingAdminPhotoModal.type === 'palm' ? "✋" : "👤"}</span>
                  <h3 className="text-base font-bold text-slate-100 font-sans">
                    {viewingAdminPhotoModal.clientName} - {viewingAdminPhotoModal.type === 'palm' ? (lang === 'sinhala' ? "හස්තරේඛා ඡායාරූපය" : "Palm Photo") : (lang === 'sinhala' ? "දේහලක්ෂණ ඡායාරූපය" : "Face & Body Photo")}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {lang === 'sinhala' ? "දත්තගබඩාවෙන් ක්ෂණිකව ලබාගත් ඡායාරූපය (Loaded from Database On-Demand)" : "Loaded on-demand from secure database"}
                </p>
              </div>

              {viewingAdminPhotoModal.loading ? (
                <div className="py-14 text-center space-y-3">
                  <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs font-bold text-indigo-300">
                    {lang === 'sinhala' ? "ඡායාරූපය දත්තගබඩාවෙන් ලබා ගනිමින් පවතී..." : "Loading photo from database..."}
                  </p>
                  <p className="text-[10px] text-slate-400">Please wait a moment</p>
                </div>
              ) : viewingAdminPhotoModal.error ? (
                <div className="py-8 text-center space-y-4">
                  <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-rose-300 text-xs">
                    ⚠️ {viewingAdminPhotoModal.error}
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingAdminPhotoModal(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-all"
                  >
                    {lang === 'sinhala' ? "වසන්න" : "Close"}
                  </button>
                </div>
              ) : viewingAdminPhotoModal.photo ? (
                <div className="space-y-4 text-center">
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <img
                      src={viewingAdminPhotoModal.photo}
                      alt="Uploaded Client Photo"
                      className="max-h-[60vh] mx-auto rounded-lg object-contain shadow-2xl"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => openImageInNewTab(viewingAdminPhotoModal.photo!)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-1.5"
                    >
                      <span>🔍</span>
                      <span>{lang === 'sinhala' ? "වෙනම Browser Tab එකකින් විවෘත කරන්න" : "Open in New Tab"}</span>
                    </button>

                    <a
                      href={viewingAdminPhotoModal.photo}
                      download={`${viewingAdminPhotoModal.clientName}_photo.png`}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-1.5"
                    >
                      <span>⬇️</span>
                      <span>{lang === 'sinhala' ? "Download කරගන්න" : "Download Photo"}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setViewingAdminPhotoModal(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-all"
                    >
                      {lang === 'sinhala' ? "වසන්න" : "Close"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ADMIN AUTH LOGIN DIALOG (Google Sign-In Exclusively) */}
        {showAdminLoginModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
              <button 
                onClick={() => {
                  setShowAdminLoginModal(false);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 cursor-pointer text-sm"
              >
                ✕
              </button>

              <div className="space-y-4">
                <div className="text-center space-y-1 mb-2">
                  <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-2">
                    <User className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold font-display text-slate-100 font-sans">
                    {lang === 'sinhala' ? "පරිපාලක පිවිසුම (Admin Login)" : "Admin Login"}
                  </h3>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    {lang === 'sinhala' 
                      ? "ආරක්ෂාව උදෙසා මුරපද භාවිතයෙන් ඇතුළුවීම අක්‍රිය කර ඇත. පරිපාලක පැනලයට පිවිසිය හැක්කේ sampathub89@gmail.com Google ගිණුමෙන් පමණි." 
                      : "For maximum security, password authentication is disabled. Admin access is strictly granted via Google Sign-In using sampathub89@gmail.com."}
                  </p>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                  <p className="text-[10px] text-amber-300 font-bold font-mono">
                    AUTHORIZED EMAIL: sampathub89@gmail.com
                  </p>
                </div>

                {adminLoginError && (
                  <p className="text-xs text-rose-400 font-semibold text-center font-sans">
                    ⚠️ {adminLoginError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowAdminLoginModal(false);
                    handleGoogleSignIn();
                  }}
                  disabled={isGoogleLoggingIn}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs uppercase tracking-wide rounded-xl cursor-pointer transition-all font-sans shadow-lg flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-50"
                >
                  <Unlock className="w-4 h-4" />
                  <span>
                    {lang === 'sinhala'
                      ? "Google මගින් පරිපාලක ලෙස පිවිසෙන්න"
                      : "Sign in with Google as Admin"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN DASHBOARD OVERLAY PANEL */}
        {isAdminPanelOpen && isAdminLoggedIn && (
          <div className="fixed inset-0 bg-slate-950/95 z-40 overflow-y-auto p-4 md:p-8 flex flex-col items-center select-none font-sans">
            <div className="w-full max-w-6xl space-y-6">
              
              {/* Dashboard header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-indigo-950 pb-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-bold font-display text-slate-100 flex items-center gap-1.5">
                      ජ්‍යෝතිෂ පරිපාලන සංසදය (Astro Admin Panel)
                    </h2>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">
                      Logged in securely as <span className="text-indigo-300 font-bold font-mono">sampathub89@gmail.com</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      fetchAdminReports(undefined, true, false, true);
                    }}
                    disabled={isLoadingAdminReports}
                    className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-indigo-300 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAdminReports ? "animate-spin" : ""}`} />
                    {lang === 'sinhala' ? "යාවත්කාලීන කරන්න" : "Refresh Records"}
                  </button>
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(adminReports, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `astrology_reports_backup_${Date.now()}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                    }}
                    className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-amber-300 rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {lang === 'sinhala' ? "දත්ත බාගන්න" : "Download Data"}
                  </button>
                  <button
                    onClick={() => setIsAdminPanelOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-bold rounded-lg cursor-pointer transition-all"
                  >
                    {lang === 'sinhala' ? "පැනලය වසන්න" : "Close Panel"}
                  </button>
                  <button
                    onClick={handleAdminLogout}
                    className="px-3 py-2 bg-red-950/30 border border-red-500/20 text-red-400 hover:bg-red-950/65 text-xs rounded-lg cursor-pointer transition-all"
                  >
                    Logout
                  </button>
                </div>
              </div>

              {/* Quick Summary Widgets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Records in DB</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-xl font-bold font-mono text-indigo-400">
                      {adminSummaryStats?.total ?? (adminTotalCount || adminReports.length)}
                    </p>
                    <span className="text-[10px] text-slate-400 font-sans">
                      ({isShowingAllReports || adminReports.length >= ((adminSummaryStats?.total ?? adminTotalCount) || adminReports.length) ? "සම්පූර්ණ සියල්ල" : `දැනට ${adminReports.length}`})
                    </span>
                  </div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Email Leads</span>
                  <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {adminSummaryStats?.email ?? adminReports.filter(r => r.contactType === 'email').length}
                  </p>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">WhatsApp Leads</span>
                  <p className="text-xl font-bold font-mono text-amber-400 mt-1">
                    {adminSummaryStats?.whatsapp ?? adminReports.filter(r => r.contactType === 'whatsapp').length}
                  </p>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">User Feedbacks</span>
                  <p className="text-xl font-bold font-mono text-purple-400 mt-1">
                    {adminSummaryStats?.rated ?? adminReports.filter(r => r.rating !== null && r.rating !== undefined && r.rating > 0).length}
                  </p>
                </div>
              </div>

              {/* COLLAPSIBLE DATABASE ACCESS & SECURITY AUDIT LOGS SECTION */}
              <div className={`border rounded-xl p-5 text-left shadow-lg select-none transition-all ${
                auditOtherCount > 0 
                  ? 'bg-rose-950/20 border-rose-500/50 shadow-rose-950/30' 
                  : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 mb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                      auditOtherCount > 0 
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {auditOtherCount > 0 ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-display">
                          🛡️ ඩේටාබේස් ප්‍රවේශ හා ආරක්ෂක ලොගය (DB Access & Security Audit Logs)
                        </h3>
                        {auditOtherCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold animate-bounce font-mono shadow-sm">
                            ⚠️ {auditOtherCount} Unrecognized / Non-Admin Access Attempts!
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-sans">
                            ✅ All Access Protected (Primary Admin Only)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                        {lang === 'sinhala'
                          ? "ඩේටාබේස් තොරතුරු බැලූ සියලුම වේලාවන් (Access Times), පරිශීලක ඊමේල් හා IP ලිපින පිළිබඳ විස්තරාත්මක ලොගය. (admin sampathub89@gmail.com හැර වෙනත් පිවිසුම් වෙන්කර පෙන්වයි)"
                          : "Audit trail of database inspection times, accessor email addresses, and client IP addresses (highlighting any non-primary admin access)."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next = !showSecurityAuditLogs;
                        setShowSecurityAuditLogs(next);
                        if (next) fetchSecurityAuditLogs();
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-indigo-300 rounded-lg transition-all cursor-pointer border border-slate-700 flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAuditLogs ? "animate-spin" : ""}`} />
                      {showSecurityAuditLogs 
                        ? (lang === 'sinhala' ? "හකුලන්න (Hide Logs)" : "Hide Audit Logs") 
                        : (lang === 'sinhala' ? "ලොග් බලන්න (View Logs)" : "View Audit Logs")}
                    </button>
                  </div>
                </div>

                {/* Audit Logs Expanded View */}
                {showSecurityAuditLogs && (
                  <div className="space-y-4 pt-1 animate-fadeIn">
                    {/* Top Alert Banner if non-admin accesses recorded */}
                    {auditOtherCount > 0 && (
                      <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3.5 flex items-start gap-3 text-rose-200">
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                        <div className="text-xs space-y-0.5">
                          <p className="font-bold text-rose-300">
                            අවධානය යොමු කරන්න: ප්‍රධාන Admin (sampathub89@gmail.com) නොවන වෙනත් ගිණුම් හෝ IP ලිපින වලින් ඩේටාබේස් වෙත ප්‍රවේශ වීමට උත්සාහ කළ වාර {auditOtherCount} ක් ඇත!
                          </p>
                          <p className="text-[11px] text-rose-300/80 font-sans">
                            පහත ලැයිස්තුවේ රතු/කහ පැහැති ලේබල් මගින් එම පිවිසුම් සහ ඒවා සිදුකළ වේලාවන් හා IP ලිපින පැහැදිලිව සටහන් කර ඇත.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Filter, Search & Actions Bar */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                      {/* Filter pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                        <button
                          type="button"
                          onClick={() => setAuditLogsFilter('all')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                            auditLogsFilter === 'all'
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          සියල්ල ({securityAuditLogs.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuditLogsFilter('unauthorized')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                            auditLogsFilter === 'unauthorized'
                              ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                              : 'bg-slate-900 text-rose-400 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <span>🚨 අනවසර ඇතුළුවීම්</span>
                          <span className="px-1.5 py-0.2 rounded bg-rose-950/60 text-[10px] font-mono">
                            {securityAuditLogs.filter(l => l.status === 'UNAUTHORIZED_ATTEMPT').length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuditLogsFilter('other_users')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                            auditLogsFilter === 'other_users'
                              ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                              : 'bg-slate-900 text-amber-400 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <span>⚠️ වෙනත් පරිශීලකයන්</span>
                          <span className="px-1.5 py-0.2 rounded bg-amber-950/60 text-[10px] font-mono">
                            {securityAuditLogs.filter(l => l.status === 'OTHER_USER_ACCESS' || (!l.isPrimaryAdmin && l.userEmail !== 'sampathub89@gmail.com')).length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuditLogsFilter('primary_admin')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                            auditLogsFilter === 'primary_admin'
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                              : 'bg-slate-900 text-emerald-400 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <span>✅ ප්‍රධාන Admin (sampathub89)</span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-950/60 text-[10px] font-mono">
                            {securityAuditLogs.filter(l => l.isPrimaryAdmin || l.userEmail === 'sampathub89@gmail.com').length}
                          </span>
                        </button>
                      </div>

                      {/* Search and Action Buttons */}
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1 md:w-56">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={auditSearchTerm}
                            onChange={(e) => setAuditSearchTerm(e.target.value)}
                            placeholder="Email, IP, Action සොයන්න..."
                            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-7 py-1.5 font-sans focus:outline-none focus:border-indigo-500"
                          />
                          {auditSearchTerm && (
                            <button
                              type="button"
                              onClick={() => setAuditSearchTerm("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(securityAuditLogs, null, 2));
                            const downloadAnchor = document.createElement('a');
                            downloadAnchor.setAttribute("href", dataStr);
                            downloadAnchor.setAttribute("download", `security_audit_logs_${Date.now()}.json`);
                            document.body.appendChild(downloadAnchor);
                            downloadAnchor.click();
                            downloadAnchor.remove();
                          }}
                          className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-amber-300 rounded-lg cursor-pointer transition-all flex items-center gap-1"
                          title="Download Security Audit Logs JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Export</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleClearAuditLogs}
                          className="px-2.5 py-1.5 bg-rose-950/30 border border-rose-500/30 hover:bg-rose-950/60 text-xs text-rose-300 rounded-lg cursor-pointer transition-all flex items-center gap-1"
                          title="Clear Security Audit Logs"
                        >
                          Clear Logs
                        </button>
                      </div>
                    </div>

                    {/* Audit Logs Table */}
                    {isLoadingAuditLogs && securityAuditLogs.length === 0 ? (
                      <div className="p-12 text-center select-none space-y-3">
                        <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
                        <p className="text-xs text-slate-400">ආරක්ෂක ලොග් දත්ත ලෝඩ් වෙමින් පවතී (Loading audit logs...)</p>
                      </div>
                    ) : securityAuditLogs.length === 0 ? (
                      <div className="p-10 border border-slate-900 bg-slate-950/40 rounded-xl text-center text-xs text-slate-400 font-sans">
                        තවමත් ආරක්ෂක ලොග් සටහන් කිසිවක් නොමැත. (No security audit logs recorded yet.)
                      </div>
                    ) : (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto max-w-full">
                          <table className="w-full text-left text-xs divide-y divide-slate-800/80">
                            <thead className="bg-slate-900/90 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                              <tr>
                                <th className="p-3">ප්‍රවේශ වූ වේලාව (Time)</th>
                                <th className="p-3">පරිශීලක Identity (User / Email)</th>
                                <th className="p-3">IP ලිපිනය (Client IP)</th>
                                <th className="p-3">සිදුකළ ක්‍රියාව (Action / Resource)</th>
                                <th className="p-3">ආරක්ෂක තත්ත්වය (Status)</th>
                                <th className="p-3">විස්තර (Details)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-slate-300">
                              {securityAuditLogs
                                .filter((log: any) => {
                                  if (auditLogsFilter === 'unauthorized') return log.status === 'UNAUTHORIZED_ATTEMPT';
                                  if (auditLogsFilter === 'other_users') return log.status === 'OTHER_USER_ACCESS' || (!log.isPrimaryAdmin && log.userEmail !== 'sampathub89@gmail.com');
                                  if (auditLogsFilter === 'primary_admin') return log.isPrimaryAdmin || log.userEmail === 'sampathub89@gmail.com';
                                  return true;
                                })
                                .filter((log: any) => {
                                  if (!auditSearchTerm.trim()) return true;
                                  const term = auditSearchTerm.toLowerCase();
                                  return (
                                    (log.userEmail && log.userEmail.toLowerCase().includes(term)) ||
                                    (log.ipAddress && log.ipAddress.toLowerCase().includes(term)) ||
                                    (log.action && log.action.toLowerCase().includes(term)) ||
                                    (log.resource && log.resource.toLowerCase().includes(term)) ||
                                    (log.details && JSON.stringify(log.details).toLowerCase().includes(term))
                                  );
                                })
                                .map((log: any) => {
                                  const isPrimary = log.isPrimaryAdmin || log.userEmail === 'sampathub89@gmail.com';
                                  const isUnauthorized = log.status === 'UNAUTHORIZED_ATTEMPT';
                                  const isOther = !isPrimary && !isUnauthorized;

                                  return (
                                    <tr 
                                      key={log.id} 
                                      className={`transition-colors ${
                                        isUnauthorized 
                                          ? 'bg-rose-950/20 hover:bg-rose-950/40' 
                                          : isOther 
                                          ? 'bg-amber-950/15 hover:bg-amber-950/30' 
                                          : 'hover:bg-slate-900/50'
                                      }`}
                                    >
                                      {/* Timestamp */}
                                      <td className="p-3 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                                        <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                                          <Clock className="w-3 h-3 text-indigo-400" />
                                          <span>{log.timestampSriLanka || (log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown')}</span>
                                        </div>
                                      </td>

                                      {/* User Email */}
                                      <td className="p-3 font-sans">
                                        {isPrimary ? (
                                          <div className="space-y-0.5">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold font-mono">
                                              <User className="w-2.5 h-2.5" />
                                              <span>{log.userEmail || 'sampathub89@gmail.com'}</span>
                                            </span>
                                            <span className="block text-[9px] text-emerald-400/80 font-sans font-semibold">
                                              (Primary Administrator)
                                            </span>
                                          </div>
                                        ) : isUnauthorized ? (
                                          <div className="space-y-0.5">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold font-mono">
                                              <ShieldAlert className="w-2.5 h-2.5" />
                                              <span>{log.userEmail || 'Anonymous / Not Provided'}</span>
                                            </span>
                                            <span className="block text-[9px] text-rose-400 font-bold font-sans">
                                              🚨 UNAUTHORIZED ACCESS BLOCKED
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="space-y-0.5">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold font-mono">
                                              <AlertTriangle className="w-2.5 h-2.5" />
                                              <span>{log.userEmail || 'Unknown User'}</span>
                                            </span>
                                            <span className="block text-[9px] text-amber-400 font-bold font-sans">
                                              ⚠️ OTHER LOGGED IN USER
                                            </span>
                                          </div>
                                        )}
                                      </td>

                                      {/* IP Address */}
                                      <td className="p-3 font-mono text-[11px]">
                                        <div className="flex items-center gap-1.5">
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-cyan-950/80 border border-cyan-800/40 text-cyan-300 font-bold">
                                            <Globe className="w-2.5 h-2.5 text-cyan-400" />
                                            <span>{log.ipAddress || 'IP නොමැත'}</span>
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleCopyText(log.ipAddress)}
                                            className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 text-[9px] rounded cursor-pointer transition-all"
                                            title="Copy IP Address"
                                          >
                                            Copy
                                          </button>
                                        </div>
                                      </td>

                                      {/* Action & Resource */}
                                      <td className="p-3 font-sans">
                                        <div className="space-y-0.5">
                                          <span className="font-bold text-slate-200 text-xs block">
                                            {log.action}
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-mono block">
                                            {log.resource}
                                          </span>
                                        </div>
                                      </td>

                                      {/* Security Status */}
                                      <td className="p-3 font-sans">
                                        {isPrimary ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-950 border border-emerald-700/50 text-emerald-300 font-bold">
                                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                            Authorized Admin
                                          </span>
                                        ) : isUnauthorized ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-rose-950 border border-rose-600 text-rose-300 font-bold animate-pulse">
                                            <ShieldAlert className="w-3 h-3 text-rose-400" />
                                            Unauthorized Attempt
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-950 border border-amber-600 text-amber-300 font-bold">
                                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                                            Non-Admin Access
                                          </span>
                                        )}
                                      </td>

                                      {/* Details */}
                                      <td className="p-3 font-sans text-xs text-slate-400">
                                        {log.details ? (
                                          <div className="max-w-xs space-y-0.5">
                                            {log.details.clientName && (
                                              <p className="text-slate-300 font-semibold text-[11px]">
                                                👤 Client: {log.details.clientName}
                                              </p>
                                            )}
                                            {log.details.reportType && (
                                              <p className="text-slate-400 text-[10px]">
                                                Type: {log.details.reportType}
                                              </p>
                                            )}
                                            {log.details.reason && (
                                              <p className="text-rose-300 font-medium text-[10px]">
                                                Reason: {log.details.reason}
                                              </p>
                                            )}
                                            {log.details.loadedCount !== undefined && (
                                              <p className="text-slate-400 text-[10px]">
                                                Records: {log.details.loadedCount}
                                              </p>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-slate-500 italic text-[10px]">—</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* COLLAPSIBLE PRICING & REVENUE ESTIMATOR SECTION */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-left shadow-lg select-none">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg flex items-center justify-center">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">
                        මිල ගණනය කිරීමේ සහ ආදායම් කළමනාකරණ අංශය (Pricing & Revenue Calculator)
                      </h3>
                      <p className="text-[10px] text-slate-400 font-sans">
                        Define pricing tiers and analyze estimated astrological consultation earnings
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPriceCalculator(!showPriceCalculator)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-indigo-400 rounded-lg transition-all cursor-pointer border border-slate-750"
                  >
                    {showPriceCalculator ? (lang === 'sinhala' ? "හකුලන්න (Hide)" : "Hide Details") : (lang === 'sinhala' ? "විස්තර බලන්න (View)" : "Expand Details")}
                  </button>
                </div>

                {showPriceCalculator && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                    {/* Left Settings inputs */}
                    <div className="space-y-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
                      <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wide font-sans">
                        මිල සැකසුම් (Rate Settings)
                      </h4>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1 font-sans">
                          Base Price per Premium Report (Rs.)
                        </label>
                        <input
                          type="number"
                          value={baseCost}
                          onChange={(e) => setBaseCost(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1 font-sans">
                          Overhead / Platform Fee (%)
                        </label>
                        <input
                          type="number"
                          value={overheadPercentage}
                          onChange={(e) => setOverheadPercentage(Math.max(0, Math.min(100, Number(e.target.value))))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Right summary analytics */}
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 flex flex-col justify-between text-left">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold font-sans">
                            Premium Paid Leads
                          </span>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            (Reports printed with WhatsApp / Email)
                          </p>
                        </div>
                        <div className="mt-2">
                          <p className="text-2xl font-mono font-bold text-emerald-400">
                            {adminReports.filter(r => r.contactType === 'email' || r.contactType === 'whatsapp').length}
                          </p>
                          <span className="text-[10px] text-slate-500 font-sans">Active Conversions</span>
                        </div>
                      </div>

                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 flex flex-col justify-between text-left">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold font-sans">
                            Direct Calculations (Unpaid)
                          </span>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            (Calculated horoscopes only)
                          </p>
                        </div>
                        <div className="mt-2">
                          <p className="text-2xl font-mono font-bold text-slate-400">
                            {adminReports.filter(r => r.contactType === 'direct_calculation' || r.contactValue?.includes("Direct Calculation")).length}
                          </p>
                          <span className="text-[10px] text-slate-500 font-sans">Standard Lookups</span>
                        </div>
                      </div>

                      <div className="bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/20 flex flex-col justify-between text-left">
                        <div>
                          <span className="text-[10px] text-indigo-300 uppercase font-bold font-sans">
                            Estimated Gross Revenue
                          </span>
                          <p className="text-[10px] text-indigo-400/70 mt-0.5 font-mono">
                            Paid Leads × Rs. {baseCost.toLocaleString()}
                          </p>
                        </div>
                        <div className="mt-2">
                          <p className="text-2xl font-mono font-bold text-amber-400">
                            Rs. {(adminReports.filter(r => r.contactType === 'email' || r.contactType === 'whatsapp').length * baseCost).toLocaleString()}
                          </p>
                          <span className="text-[10px] text-slate-500 font-sans">Estimated Income</span>
                        </div>
                      </div>

                      <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/20 flex flex-col justify-between text-left">
                        <div>
                          <span className="text-[10px] text-emerald-300 uppercase font-bold font-sans">
                            Net Profit (After Overhead)
                          </span>
                          <p className="text-[10px] text-emerald-400/70 mt-0.5 font-mono">
                            Gross minus {overheadPercentage}% fee
                          </p>
                        </div>
                        <div className="mt-2">
                          <p className="text-2xl font-mono font-bold text-emerald-400">
                            Rs. {(adminReports.filter(r => r.contactType === 'email' || r.contactType === 'whatsapp').length * baseCost * (1 - overheadPercentage / 100)).toLocaleString()}
                          </p>
                          <span className="text-[10px] text-slate-500 font-sans">Net Astro Earnings</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* COLLAPSIBLE USER CHAT QUOTA & EXTENSION MANAGEMENT SECTION */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-left shadow-lg select-none">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">
                        පරිශීලක AI Chat සීමා කළමනාකරණය (User AI Chat Quota Overrides)
                      </h3>
                      <p className="text-[10px] text-slate-400 font-sans">
                        Grant custom AI questions quota for specific client emails
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const nextState = !showChatQuotaManager;
                      setShowChatQuotaManager(nextState);
                      if (nextState) fetchAdminChatQuotas();
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-indigo-400 rounded-lg transition-all cursor-pointer border border-slate-750 flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAdminChatQuotas ? "animate-spin" : ""}`} />
                    {showChatQuotaManager ? (lang === 'sinhala' ? "හකුලන්න (Hide)" : "Hide Manager") : (lang === 'sinhala' ? "සීමා පාලනය (Manage Quotas)" : "Manage Quotas")}
                  </button>
                </div>

                {showChatQuotaManager && (
                  <div className="space-y-4 pt-2">
                    {/* Quick Add Custom Limit Form */}
                    <form onSubmit={handleSetCustomChatLimit} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-amber-300">
                        {lang === 'sinhala' ? "පරිශීලකයෙකුට අලුතෙන් ප්‍රශ්න සීමාවක් (Custom Quota) ලබාදීම" : "Grant Custom Chat Quota to User"}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[10px] text-slate-400">User Email, Phone Number or Report ID:</label>
                          <input
                            type="text"
                            required
                            value={customQuotaEmail}
                            onChange={(e) => setCustomQuotaEmail(e.target.value)}
                            placeholder="e.g. client@gmail.com, 0771234567, or palm_..."
                            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400">Allowed Questions Limit:</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={customQuotaLimitInput}
                            onChange={(e) => setCustomQuotaLimitInput(e.target.value)}
                            placeholder="0, 2, 4, 10, 25, 50, 999"
                            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono"
                          />
                          <div className="flex items-center gap-1 pt-1 flex-wrap">
                            <span className="text-[9px] text-slate-500">Quick Fill:</span>
                            {[0, 2, 4, 10, 25, 50, 999].map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setCustomQuotaLimitInput(String(p))}
                                className={`px-1.5 py-0.2 rounded text-[9px] font-mono cursor-pointer border transition-all ${
                                  p === 0 ? "bg-rose-950/60 border-rose-800 text-rose-300 hover:bg-rose-900" :
                                  p <= 4 ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" :
                                  p === 999 ? "bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900" :
                                  "bg-indigo-950/60 border-indigo-800 text-indigo-300 hover:bg-indigo-900"
                                }`}
                                title={`Set input to ${p === 999 ? 'Unlimited' : p}`}
                              >
                                {p === 0 ? '0 (Block)' : p === 2 ? '2 (Reduced)' : p === 4 ? '4 (Default)' : p === 10 ? '10 (Bonus)' : p === 999 ? '∞ (All)' : p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all shadow-md cursor-pointer"
                        >
                          Set Custom Limit
                        </button>
                        {customQuotaMsg && (
                          <span className="text-xs text-emerald-400 font-semibold font-sans">{customQuotaMsg}</span>
                        )}
                      </div>
                    </form>

                    {/* Quota Filter & Search Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        <button
                          type="button"
                          onClick={() => setAdminQuotaFilter('all')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                            adminQuotaFilter === 'all'
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          සියල්ල ({adminChatQuotas.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminQuotaFilter('custom_only')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                            adminQuotaFilter === 'custom_only'
                              ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                              : 'bg-slate-900 text-purple-400 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <span>⚡ සීමාව වැඩි කළ අය</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-purple-950/60 text-[10px] font-mono">
                            {adminChatQuotas.filter(q => q.bonusGranted === true || q.bonusGranted === 'true' || (q.customLimit !== null && q.customLimit !== undefined && Number(q.customLimit) > 0) || Number(q.allowedLimit || 0) > 4).length}
                          </span>
                        </button>
                      </div>

                      <div className="relative flex-1 max-w-xs">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={adminQuotaSearch}
                          onChange={(e) => setAdminQuotaSearch(e.target.value)}
                          placeholder="Search quota by email or phone..."
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-7 py-1.5 font-sans focus:outline-none focus:border-indigo-500"
                        />
                        {adminQuotaSearch && (
                          <button
                            type="button"
                            onClick={() => setAdminQuotaSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Table of User Quotas */}
                    {isLoadingAdminChatQuotas ? (
                      <p className="text-xs text-slate-400 text-center py-4">Loading user chat quotas...</p>
                    ) : filteredAdminChatQuotas.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No matching user chat quotas found.</p>
                    ) : (
                      <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950">
                        <table className="w-full text-left text-xs divide-y divide-slate-800">
                          <thead className="bg-slate-900 text-[10px] text-slate-400 uppercase font-bold">
                            <tr>
                              <th className="p-2.5">User Email</th>
                              <th className="p-2.5">Today Used</th>
                              <th className="p-2.5">Allowed Limit</th>
                              <th className="p-2.5">Status</th>
                              <th className="p-2.5">WhatsApp Mobile</th>
                              <th className="p-2.5 text-center">Quick Set Limit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-slate-300">
                            {filteredAdminChatQuotas.map((q: any) => (
                              <tr key={q.email} className="hover:bg-slate-900/50">
                                <td className="p-2.5 font-mono text-amber-300 font-bold select-all">
                                  <div className="flex items-center gap-1.5">
                                    <span>{q.email}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEmailClient(q.email, 'Valued Client')}
                                      className="p-1 text-slate-400 hover:text-indigo-300 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 cursor-pointer transition-all"
                                      title="Click to email this client directly"
                                    >
                                      <Mail className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(q.email)}
                                      className="p-1 text-slate-400 hover:text-emerald-300 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 cursor-pointer transition-all"
                                      title="Copy email address"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                                <td className="p-2.5 font-mono text-slate-300">{q.usedToday || 0}</td>
                                <td className="p-2.5 font-mono font-bold text-indigo-400">{q.allowedLimit}</td>
                                <td className="p-2.5">
                                  {q.customLimit ? (
                                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                                      Custom ({q.customLimit})
                                    </span>
                                  ) : q.bonusGranted ? (
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                      +6 Bonus Granted (10)
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                                      Standard (4)
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 font-mono text-slate-300">
                                  {q.whatsappNumber ? (
                                    <div className="flex items-center gap-1.5">
                                      <span>{q.whatsappNumber}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenWhatsAppChat(q.whatsappNumber)}
                                        className="p-1 text-slate-400 hover:text-emerald-400 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 cursor-pointer transition-all"
                                        title="Open WhatsApp Chat"
                                      >
                                        <MessageCircle className="w-3 h-3 text-emerald-400" />
                                      </button>
                                    </div>
                                  ) : (
                                    "N/A"
                                  )}
                                </td>
                                <td className="p-2.5 text-center">
                                  <div className="flex items-center justify-center gap-1 flex-wrap max-w-[260px] mx-auto">
                                    <button
                                      type="button"
                                      onClick={(e) => handleSetCustomChatLimit(e, q.email, Math.max(0, (q.allowedLimit || 4) - 1))}
                                      className="px-1.5 py-0.5 bg-rose-950/70 hover:bg-rose-800 text-[10px] text-rose-300 hover:text-white rounded font-bold border border-rose-800 cursor-pointer transition-all"
                                      title="Decrease Limit (-1)"
                                    >
                                      -1
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleSetCustomChatLimit(e, q.email, 2)}
                                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-rose-900/60 text-[10px] text-rose-300 hover:text-white rounded font-bold border border-slate-700 cursor-pointer transition-all"
                                      title="Set Reduced Limit: 2"
                                    >
                                      2
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleSetCustomChatLimit(e, q.email, 4)}
                                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded font-bold border border-slate-700 cursor-pointer transition-all"
                                      title="Set Standard Limit: 4"
                                    >
                                      4
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleSetCustomChatLimit(e, q.email, 10)}
                                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-amber-300 rounded font-bold border border-slate-700 cursor-pointer transition-all"
                                      title="Set Bonus Limit: 10"
                                    >
                                      10
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleSetCustomChatLimit(e, q.email, 25)}
                                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-indigo-300 rounded font-bold border border-slate-700 cursor-pointer transition-all"
                                      title="Set Limit: 25"
                                    >
                                      25
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleSetCustomChatLimit(e, q.email, 50)}
                                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-purple-300 rounded font-bold border border-slate-700 cursor-pointer transition-all"
                                      title="Set Limit: 50"
                                    >
                                      50
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleSetCustomChatLimit(e, q.email, (q.allowedLimit || 4) + 5)}
                                      className="px-1.5 py-0.5 bg-indigo-950/70 hover:bg-indigo-800 text-[10px] text-indigo-300 hover:text-white rounded font-bold border border-indigo-800 cursor-pointer transition-all"
                                      title="Increase Limit (+5)"
                                    >
                                      +5
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleSetCustomChatLimit(e, q.email, 999)}
                                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-[10px] text-white rounded font-bold cursor-pointer transition-all"
                                      title="Set Unlimited: 999"
                                    >
                                      ∞ Unlimited
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* MAIN REPORTS LOG & TOOLBAR AREA */}
              {adminReportsError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg text-center">
                  ⚠️ {adminReportsError}
                </div>
              )}

              {/* Database Overview & Date Range Filter Section */}
              <div className="bg-slate-900/90 border border-indigo-900/50 rounded-xl p-4 flex flex-col gap-4 text-left shadow-lg">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <Database className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-200">
                          දත්තගබඩාවේ ලියාපදිංචි මුළු වාර්තා ගණන (Total Records in DB):
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono font-bold text-xs">
                          {adminSummaryStats?.total ?? (adminTotalCount || adminReports.length)}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                          දැනට ලැයිස්තුවේ: <strong className="text-slate-200">{adminReports.length}</strong>
                        </span>
                        {isDateRangeActive && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                            📅 කාලසීමා පෙරහන සක්‍රීයයි ({filteredAndSortedAdminReports.length})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 font-sans">
                        {!isDateRangeActive && !isShowingAllReports && ((adminSummaryStats?.total ?? adminTotalCount) > adminReports.length || adminReports.length === 100) ? (
                          <span className="text-amber-300 flex items-center gap-1.5">
                            <span>⚡</span>
                            <span>දත්තගබඩාවේ මුළු වාර්තා <strong>{adminSummaryStats?.total ?? adminTotalCount ?? 100}</strong> ක් සුරක්ෂිතව පවතී. ජාල තදබදය වැළැක්වීමට දැනට අවසාන වාර්තා <strong>{adminReports.length}</strong> පෙන්වයි. අවශ්‍ය නම් කාලසීමාවක් (Date Range) ලබාදී නිශ්චිත දිනවල වාර්තා පමණක් ලබාගත හැක.</span>
                          </span>
                        ) : isDateRangeActive ? (
                          <span className="text-amber-300 flex items-center gap-1.5">
                            <span>📅</span>
                            <span>තෝරාගත් කාලසීමාවට ({adminStartDate || 'මුල'} සිට {adminEndDate || 'අද'} දක්වා) අදාළ වාර්තා <strong>{filteredAndSortedAdminReports.length}</strong> ක් සාර්ථකව ලබාගෙන ඇත.</span>
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1.5">
                            <span>✅</span>
                            <span>දත්තගබඩාවේ ඇති සියලුම පැරණි හා නව වාර්තා <strong>({adminReports.length})</strong> කිසිදු අඩුවක් නොමැතිව සම්පූර්ණයෙන්ම ලෝඩ් කර පෙන්වනු ලැබේ.</span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 w-full sm:w-auto flex items-center gap-2 flex-wrap">
                    {!isShowingAllReports && ((adminSummaryStats?.total ?? adminTotalCount) > adminReports.length || adminReports.length === 100) ? (
                      <button
                        type="button"
                        onClick={() => fetchAdminReports(undefined, true)}
                        disabled={isLoadingAdminReports}
                        className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/30 active:scale-95"
                      >
                        <span>📂</span>
                        <span>{isLoadingAdminReports ? "ලෝඩ් වෙමින් පවතී..." : `සියලුම වාර්තා (${adminSummaryStats?.total ?? adminTotalCount ?? 'All'}) එකවර බලන්න`}</span>
                      </button>
                    ) : (isShowingAllReports || isDateRangeActive || adminReports.length > 100) ? (
                      <button
                        type="button"
                        onClick={handleShowLast100}
                        disabled={isLoadingAdminReports}
                        className="w-full sm:w-auto px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <span>⏮️</span>
                        <span>අවසන් 100 පමණක් පෙන්වන්න</span>
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* DATE RANGE SEARCH CONTROLS */}
                <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-slate-200">
                        කාලසීමාව අනුව වාර්තා සෙවීම (Search by Date Range):
                      </span>
                    </div>

                    {/* Quick Date Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleQuickDatePreset('today')}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-indigo-300 transition-all cursor-pointer"
                      >
                        ⚡ අද (Today)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDatePreset('yesterday')}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-all cursor-pointer"
                      >
                        📅 ඊයේ (Yesterday)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDatePreset('last7')}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-all cursor-pointer"
                      >
                        🗓️ පසුගිය දින 7
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDatePreset('thisMonth')}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-all cursor-pointer"
                      >
                        📆 මෙම මස
                      </button>
                    </div>
                  </div>

                  {/* Date Inputs & Search Trigger */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 items-end">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-semibold">සිට (From Date)</label>
                      <input
                        type="date"
                        value={adminStartDate}
                        onChange={(e) => setAdminStartDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-semibold">දක්වා (To Date)</label>
                      <input
                        type="date"
                        value={adminEndDate}
                        onChange={(e) => setAdminEndDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex gap-2 sm:col-span-2 md:col-span-3">
                      <button
                        type="button"
                        onClick={() => handleApplyDateRange()}
                        disabled={isLoadingAdminReports || (!adminStartDate && !adminEndDate)}
                        className="flex-1 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>{isLoadingAdminReports ? "සොයමින් පවතී..." : "කාලසීමාවේ වාර්තා සොයන්න"}</span>
                      </button>
                      {(adminStartDate || adminEndDate || isDateRangeActive) && (
                        <button
                          type="button"
                          onClick={handleClearDateRange}
                          disabled={isLoadingAdminReports}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title="Clear Date Filter"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>ඉවත් කරන්න</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Search, Filtering, Sorting & Grouping Toolbar */}
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-3.5 text-left shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  {/* Category Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    <button
                      type="button"
                      onClick={() => setAdminFilterCategory('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        adminFilterCategory === 'all'
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      සියල්ල ({adminReports.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminFilterCategory('email')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                        adminFilterCategory === 'email'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                          : 'bg-slate-950 text-blue-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <span>📧 Email</span>
                      <span className="px-1.5 py-0.2 rounded bg-blue-950/60 text-[10px] font-mono">
                        {adminReports.filter(r => r.contactType === 'email').length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminFilterCategory('whatsapp')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                        adminFilterCategory === 'whatsapp'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                          : 'bg-slate-950 text-emerald-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <span>💬 WhatsApp</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-950/60 text-[10px] font-mono">
                        {adminReports.filter(r => r.contactType === 'whatsapp').length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminFilterCategory('palmistry')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                        adminFilterCategory === 'palmistry'
                          ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                          : 'bg-slate-950 text-amber-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <span>✋ හස්තරේඛා</span>
                      <span className="px-1.5 py-0.2 rounded bg-amber-950/60 text-[10px] font-mono">
                        {adminReports.filter(r => isPalmistryRep(r)).length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminFilterCategory('dehalakshana')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                        adminFilterCategory === 'dehalakshana'
                          ? 'bg-teal-600 text-white border-teal-500 shadow-md'
                          : 'bg-slate-950 text-teal-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <span>👤 දේහලක්ෂණ</span>
                      <span className="px-1.5 py-0.2 rounded bg-teal-950/60 text-[10px] font-mono">
                        {adminReports.filter(r => isDehalakshanaRep(r)).length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminFilterCategory('astrology')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                        adminFilterCategory === 'astrology'
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                          : 'bg-slate-950 text-purple-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <span>🌌 කේන්දර</span>
                      <span className="px-1.5 py-0.2 rounded bg-purple-950/60 text-[10px] font-mono">
                        {adminReports.filter(r => !isPalmistryRep(r) && !isDehalakshanaRep(r)).length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminFilterCategory('rated')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                        adminFilterCategory === 'rated'
                          ? 'bg-yellow-600 text-white border-yellow-500 shadow-md'
                          : 'bg-slate-950 text-yellow-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <span>⭐ Feedbacks</span>
                      <span className="px-1.5 py-0.2 rounded bg-yellow-950/60 text-[10px] font-mono">
                        {adminReports.filter(r => r.rating !== null && r.rating !== undefined && r.rating > 0).length}
                      </span>
                    </button>
                  </div>

                  {/* Grouping Toggles */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setAdminGroupByMode(adminGroupByMode === 'contact' ? 'none' : 'contact')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                        adminGroupByMode === 'contact'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{adminGroupByMode === 'contact' ? "පරිශීලකයා අනුව ගොනු කර ඇත (Grouped)" : "පරිශීලකයා අනුව ගොනු කරන්න (Group by Contact)"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdminGroupByMode(adminGroupByMode === 'ip' ? 'none' : 'ip')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                        adminGroupByMode === 'ip'
                          ? 'bg-cyan-600 text-white border-cyan-500 shadow-md'
                          : 'bg-slate-950 text-cyan-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{adminGroupByMode === 'ip' ? "IP ලිපිනය අනුව ගොනු කර ඇත (IP Grouped)" : "IP ලිපිනය අනුව ගොනු කරන්න (Group by IP)"}</span>
                    </button>
                  </div>
                </div>

                {/* Search Bar and Sort Options */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={adminSearchTerm}
                      onChange={(e) => setAdminSearchTerm(e.target.value)}
                      placeholder="නම, Email, WhatsApp අංකය, IP Lipinaya, උපන් ස්ථානය අනුව සොයන්න..."
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-8 py-2 font-sans focus:outline-none focus:border-indigo-500"
                    />
                    {adminSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setAdminSearchTerm("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-semibold font-sans whitespace-nowrap">පිළිවෙල (Sort):</span>
                    <select
                      value={adminSortOrder}
                      onChange={(e) => setAdminSortOrder(e.target.value as any)}
                      className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 font-sans focus:outline-none focus:border-indigo-500"
                    >
                      <option value="newest">නවපතම (Newest First)</option>
                      <option value="oldest">පැරණිතම (Oldest First)</option>
                      <option value="name">නම අනුව (Client Name A-Z)</option>
                      <option value="rating">ඉහළම Rating (Highest Rating)</option>
                      <option value="ip">IP ලිපිනය අනුව (IP Address A-Z)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Reports Rendering Section */}
              {isLoadingAdminReports && adminReports.length === 0 ? (
                <div className="p-16 text-center select-none space-y-4">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
                  <p className="text-xs text-slate-400">කේන්දර වාර්තා ලෝඩ් වෙමින් පවතී (Loading client horoscopes...)</p>
                </div>
              ) : filteredAndSortedAdminReports.length === 0 ? (
                <div className="p-16 border border-slate-900 bg-slate-950/40 rounded-xl text-center text-xs text-slate-500 font-sans">
                  ගැළපෙන කේන්දර වාර්තා කිසිවක් හමු නොවීය. (No matching horoscope records found.)
                </div>
              ) : adminGroupByMode !== 'none' && groupedAdminReports ? (
                /* GROUPED VIEW MODE (BY CONTACT OR BY IP ADDRESS) */
                <div className="space-y-6 text-left">
                  {groupedAdminReports.list.map((group: any) => {
                    const isContactGroup = groupedAdminReports.mode === 'contact';
                    const isIpGroup = groupedAdminReports.mode === 'ip';
                    const isEmail = isContactGroup && group.contactType === 'email';
                    const isWhatsapp = isContactGroup && group.contactType === 'whatsapp';

                    return (
                      <div key={group.groupKey} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                        {/* Group Header Banner */}
                        <div className="bg-slate-900 border-b border-slate-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                              isIpGroup
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                : isEmail
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : isWhatsapp
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {isIpGroup ? <Globe className="w-4 h-4 text-cyan-400" /> : isEmail ? <Mail className="w-4 h-4" /> : isWhatsapp ? <MessageCircle className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-100 font-mono select-all flex items-center gap-1.5">
                                  {isIpGroup && <span className="text-xs text-cyan-400">IP:</span>}
                                  <span>{group.groupTitle}</span>
                                </h4>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  {group.reports.length} වාර්තා (Consultations)
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                                {isIpGroup ? 'Client Access IP Address Group' : isEmail ? 'Registered Email User' : isWhatsapp ? 'WhatsApp Client' : 'Direct Calculation Group'}
                              </p>
                            </div>
                          </div>

                          {/* Quick Group Action Buttons */}
                          <div className="flex items-center gap-2">
                            {isIpGroup && (
                              <a
                                href={`https://ipinfo.io/${group.groupTitle}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 bg-cyan-600/20 border border-cyan-500/30 hover:bg-cyan-600/30 text-cyan-300 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <Globe className="w-3.5 h-3.5" />
                                <span>IP Lookup</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {isEmail && (
                              <button
                                type="button"
                                onClick={() => handleOpenEmailClient(group.contactValue, group.reports[0]?.birthDetails?.name)}
                                className="px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-blue-300 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                <span>ඊමේල් යවන්න (Send Email)</span>
                              </button>
                            )}
                            {isWhatsapp && (
                              <button
                                type="button"
                                onClick={() => handleOpenWhatsAppChat(group.contactValue, group.reports[0]?.birthDetails?.name)}
                                className="px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-emerald-300 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp වෙත</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleCopyText(group.groupTitle)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </button>
                          </div>
                        </div>

                        {/* Reports under this group */}
                        <div className="divide-y divide-slate-800/80">
                          {group.reports.map((rep: any) => (
                            <div key={rep.id} className="p-4 hover:bg-slate-900/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                              <div className="space-y-1 max-w-xl">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-100 font-display text-sm">
                                    {rep.birthDetails?.name || "Anonymous Client"}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-sans">
                                    ({rep.birthDetails?.gender === 'Female' ? "ස්ත්‍රී" : "පුරුෂ"})
                                  </span>
                                  {isPalmistryRep(rep) ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                                      ✋ හස්තරේඛා ({rep.birthDetails?.handChoice === 'Left' ? 'වම් අත' : 'දකුණු අත'})
                                    </span>
                                  ) : isDehalakshanaRep(rep) ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                                      👤 දේහලක්ෂණ පරීක්ෂාව
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                                      🌌 {rep.chart?.lagnaSinhala} ලග්නය
                                    </span>
                                  )}
                                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-950/80 border border-cyan-800/40 text-cyan-300 font-mono font-bold flex items-center gap-1" title="IP Address">
                                    <Globe className="w-2.5 h-2.5 text-cyan-400" />
                                    <span>{rep.ipAddress || "IP නොමැත"}</span>
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {rep.createdAt ? new Date(rep.createdAt).toLocaleDateString() : ''}
                                  </span>
                                </div>

                                <p className="text-xs text-slate-400 font-sans">
                                  {isPalmistryRep(rep) ? (
                                    <span>Palm Reading Consultation {rep.birthDetails?.birthDate ? `| උපන් දිනය: ${rep.birthDetails.birthDate}` : ''}</span>
                                  ) : isDehalakshanaRep(rep) ? (
                                    <span>දේහලක්ෂණ පරීක්ෂණ වාර්තාව (Samudrika Shastra) {rep.birthDetails?.birthDate ? `| උපන් දිනය: ${rep.birthDetails.birthDate}` : ''}</span>
                                  ) : (
                                    <span>
                                      උපත: {rep.birthDetails?.birthDate} ({rep.birthDetails?.birthTime}) - {rep.birthDetails?.birthPlace} | නැකත: {rep.chart?.calculations?.nakshatraNameSi || 'N/A'}
                                    </span>
                                  )}
                                </p>

                                {rep.lastViewedAt && (
                                  <div className="flex items-center gap-1.5 text-[10px] text-cyan-300/80 font-mono pt-0.5">
                                    <Eye className="w-3 h-3 text-cyan-400" />
                                    <span>බැලූ වේලාව: {new Date(rep.lastViewedAt).toLocaleString()} ({rep.viewCount || 1} වරක් බලා ඇත)</span>
                                  </div>
                                )}

                                {rep.rating && (
                                  <div className="flex items-center gap-2 pt-1">
                                    <div className="flex text-amber-400 text-xs">
                                      {Array.from({ length: 5 }, (_, sIdx) => (
                                        <span key={sIdx}>{sIdx < Number(rep.rating) ? "★" : "☆"}</span>
                                      ))}
                                    </div>
                                    {rep.comment && <span className="text-[11px] text-slate-300 italic">"{rep.comment}"</span>}
                                  </div>
                                )}

                                <div className="pt-1 flex items-center gap-1 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAdminChat(rep)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all font-sans border ${
                                      rep.chatHistory && Array.isArray(rep.chatHistory) && rep.chatHistory.length > 0
                                        ? "bg-indigo-600/20 border-indigo-500/30 hover:bg-indigo-600/30 text-indigo-300"
                                        : "bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                                    }`}
                                    title="Click to view complete AI chat history and manage question limits"
                                  >
                                    <span>💬 Chat ({rep.chatHistory?.length || 0})</span>
                                    <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 rounded">
                                      ⚡ Limit: {rep.customChatLimit !== undefined ? rep.customChatLimit : (rep.allowedLimit || 4)}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const cur = Number(rep.customChatLimit !== undefined ? rep.customChatLimit : (rep.allowedLimit || 4));
                                      const targetEm = rep.birthDetails?.userEmail || (rep.contactType === 'email' ? rep.contactValue : '');
                                      handleSetCustomChatLimit(undefined, targetEm, Math.max(0, cur - 1), rep.id, rep.contactValue);
                                    }}
                                    className="px-2 py-1 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 rounded text-xs font-mono font-bold cursor-pointer transition-all"
                                    title="Decrease Limit (-1)"
                                  >
                                    -1
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const cur = Number(rep.customChatLimit !== undefined ? rep.customChatLimit : (rep.allowedLimit || 4));
                                      const targetEm = rep.birthDetails?.userEmail || (rep.contactType === 'email' ? rep.contactValue : '');
                                      handleSetCustomChatLimit(undefined, targetEm, cur + 5, rep.id, rep.contactValue);
                                    }}
                                    className="px-2 py-1 bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-indigo-200 border border-slate-700 rounded text-xs font-mono font-bold cursor-pointer transition-all"
                                    title="Increase Limit (+5)"
                                  >
                                    +5
                                  </button>
                                </div>
                              </div>

                              {/* Action Buttons for this item */}
                              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                {isPalmistryRep(rep) ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleViewAdminPalmReading(rep)}
                                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-all"
                                    >
                                      ✋ View Reading
                                    </button>
                                    {(isPalmistryRep(rep) || rep.hasPalmImage || rep.palmImageBase64) && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAdminPalmPhoto(rep)}
                                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1"
                                        title="Open user palm photo"
                                      >
                                        <span>📷</span>
                                        <span>Photo</span>
                                      </button>
                                    )}
                                  </>
                                ) : isDehalakshanaRep(rep) ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleViewAdminDehaReading(rep)}
                                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg transition-all"
                                    >
                                      👤 View Reading
                                    </button>
                                    {(isDehalakshanaRep(rep) || rep.hasDehaImage || rep.dehalakshanaImageBase64) && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAdminDehaPhoto(rep)}
                                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1"
                                        title="Open user face photo"
                                      >
                                        <span>📷</span>
                                        <span>Photo</span>
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        setIsLoadingAdminReports(true);
                                        await loadReportIntoState(rep);
                                        setIsLoadingAdminReports(false);
                                        setIsAdminPanelOpen(false);
                                        setActiveTab('horoscope');
                                        setTimeout(() => {
                                          const el = document.getElementById('results-section') || document.getElementById('chart-display');
                                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                                        }, 150);
                                      }}
                                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-sm"
                                    >
                                      Load Chart
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (isPalmistryRep(rep)) {
                                          handleViewAdminPalmReading(rep);
                                          return;
                                        }
                                        if (isDehalakshanaRep(rep)) {
                                          handleViewAdminDehaReading(rep);
                                          return;
                                        }
                                        setIsLoadingAdminReports(true);
                                        const fullLoaded = await loadReportIntoState(rep);
                                        setUserRating(rep.rating || fullLoaded?.rating || 0);
                                        setUserComment(rep.comment || fullLoaded?.comment || "");
                                        setRatingSubmittedUs(true);
                                        setIsLoadingAdminReports(false);
                                        setShowReportPreviewModal(true);
                                      }}
                                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      <span>{lang === 'sinhala' ? "පූර්ව දර්ශනය" : "Preview"}</span>
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => deleteAdminReport(rep.id)}
                                  className="px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-lg transition-all"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* STANDARD FLAT TABLE VIEW MODE */
                <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto max-w-full">
                    <table className="w-full text-left text-xs divide-y divide-slate-900">
                      <thead className="bg-slate-900 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                        <tr>
                          <th className="p-3.5">Date Created</th>
                          <th className="p-3.5">Client Identity</th>
                          <th className="p-3.5">Contact Detail & Actions</th>
                          <th className="p-3.5">Birth Coordinates</th>
                          <th className="p-3.5">Kendra Properties</th>
                          <th className="p-3.5">Google Drive Status</th>
                          <th className="p-3.5">Rating & Review</th>
                          <th className="p-3.5 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-slate-300">
                        {filteredAndSortedAdminReports.map((rep: any) => {
                          const isDirect = rep.contactType === 'direct_calculation' || rep.contactValue?.includes("Direct Calculation");
                          const isEmail = rep.contactType === 'email';
                          const isWhatsapp = rep.contactType === 'whatsapp';

                          return (
                            <tr key={rep.id} className="hover:bg-indigo-500/5 transition-all text-left">
                              <td className="p-3.5 font-mono text-slate-400 text-[10px]">
                                <div>{rep.createdAt ? new Date(rep.createdAt).toLocaleString() : "Unknown"}</div>
                                {rep.lastViewedAt && (
                                  <div className="flex items-center gap-1 text-[9px] text-cyan-300 font-sans mt-1 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                                    <Eye className="w-2.5 h-2.5 text-cyan-400" />
                                    <span>බැලූ වේලාව: {new Date(rep.lastViewedAt).toLocaleTimeString()} ({rep.viewCount || 1} වරක්)</span>
                                  </div>
                                )}
                              </td>
                              <td className="p-3.5">
                                <span className="font-bold text-slate-100 font-display block text-sm">
                                  {rep.birthDetails?.name || "Anonymous Kasun"}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-sans">
                                  {rep.birthDetails?.gender === 'Female' ? "ස්ත්‍රී (Female)" : "පුරුෂ (Male)"}
                                </span>
                                {isPalmistryRep(rep) ? (
                                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold font-sans">
                                    ✋ හස්තරේඛා ({rep.birthDetails?.handChoice === 'Left' ? 'වම් අත' : 'දකුණු අත'})
                                  </span>
                                ) : isDehalakshanaRep(rep) ? (
                                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold font-sans">
                                    👤 දේහලක්ෂණ
                                  </span>
                                ) : null}
                                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAdminChat(rep)}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all font-sans border ${
                                      rep.chatHistory && Array.isArray(rep.chatHistory) && rep.chatHistory.length > 0
                                        ? "bg-indigo-500/15 border-indigo-500/25 hover:bg-indigo-500/25 text-indigo-300"
                                        : "bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 text-slate-400"
                                    }`}
                                    title="Click to view complete AI chat history and manage question limits"
                                  >
                                    <span>💬 Chat ({rep.chatHistory?.length || 0})</span>
                                    <span className="text-[9px] text-amber-400 font-mono">⚡{rep.customChatLimit !== undefined ? rep.customChatLimit : (rep.allowedLimit || 4)}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const cur = Number(rep.customChatLimit !== undefined ? rep.customChatLimit : (rep.allowedLimit || 4));
                                      const targetEm = rep.birthDetails?.userEmail || (rep.contactType === 'email' ? rep.contactValue : '');
                                      handleSetCustomChatLimit(undefined, targetEm, Math.max(0, cur - 1), rep.id, rep.contactValue);
                                    }}
                                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 rounded text-[9px] font-mono font-bold cursor-pointer transition-all"
                                    title="Decrease Chat Limit (-1)"
                                  >
                                    -1
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const cur = Number(rep.customChatLimit !== undefined ? rep.customChatLimit : (rep.allowedLimit || 4));
                                      const targetEm = rep.birthDetails?.userEmail || (rep.contactType === 'email' ? rep.contactValue : '');
                                      handleSetCustomChatLimit(undefined, targetEm, cur + 5, rep.id, rep.contactValue);
                                    }}
                                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-indigo-200 border border-slate-700 rounded text-[9px] font-mono font-bold cursor-pointer transition-all"
                                    title="Increase Chat Limit (+5)"
                                  >
                                    +5
                                  </button>
                                </div>
                              </td>
                              <td className="p-3.5 font-sans">
                                {isDirect ? (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-slate-900 border border-slate-800 text-slate-400 font-semibold mb-1 uppercase font-sans">
                                      ගණනය කිරීම පමණි (Calculation Only)
                                    </span>
                                    <span className="block text-[11px] text-slate-500 italic font-sans leading-none">Direct Calculation</span>
                                  </div>
                                ) : (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-sans border ${
                                        isWhatsapp 
                                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                          : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                      }`}>
                                        {isWhatsapp ? 'WhatsApp' : 'Email Address'}
                                      </span>
                                    </div>
                                    <span className="block font-bold text-slate-200 select-all font-mono text-xs">{rep.contactValue}</span>
                                    
                                    {/* IP Address Badge & Copy */}
                                    <div className="flex items-center gap-1.5 pt-0.5">
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-cyan-950/80 border border-cyan-800/40 text-cyan-300 font-mono font-bold" title="Client Access IP Address">
                                        <Globe className="w-2.5 h-2.5 text-cyan-400" />
                                        <span>{(!rep.ipAddress || rep.ipAddress === "127.0.0.1" || rep.ipAddress === "localhost" || rep.ipAddress === "IP නොමැත") ? "IP ලබාගෙන නැත" : rep.ipAddress}</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyText((!rep.ipAddress || rep.ipAddress === "127.0.0.1" || rep.ipAddress === "localhost" || rep.ipAddress === "IP නොමැත") ? "IP ලබාගෙන නැත" : rep.ipAddress)}
                                        className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 text-[9px] rounded font-mono cursor-pointer transition-all"
                                        title="Copy IP Address"
                                      >
                                        Copy IP
                                      </button>
                                    </div>

                                    {/* Action links for Contact */}
                                    <div className="flex items-center gap-1.5 pt-0.5">
                                      {isEmail && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEmailClient(rep.contactValue, rep.birthDetails?.name)}
                                          className="px-2 py-0.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center gap-1"
                                          title="Click to compose an email"
                                        >
                                          <Mail className="w-2.5 h-2.5" />
                                          <span>Mail</span>
                                        </button>
                                      )}
                                      {isWhatsapp && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenWhatsAppChat(rep.contactValue, rep.birthDetails?.name)}
                                          className="px-2 py-0.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center gap-1"
                                          title="Open WhatsApp Chat"
                                        >
                                          <MessageCircle className="w-2.5 h-2.5" />
                                          <span>Chat</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleCopyText(rep.contactValue)}
                                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold rounded cursor-pointer transition-all flex items-center gap-1"
                                        title="Copy to clipboard"
                                      >
                                        <Copy className="w-2.5 h-2.5" />
                                        <span>Copy</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td className="p-3.5 font-sans">
                                {isPalmistryRep(rep) ? (
                                  <>
                                    <span className="block font-semibold text-amber-300">Palm Photo Uploaded</span>
                                    {rep.birthDetails?.birthDate ? (
                                      <span className="block text-slate-300 text-[10px]">උපන් දිනය: {rep.birthDetails.birthDate}</span>
                                    ) : (
                                      <span className="block text-slate-500 text-[10px] italic">උපන් දිනය: ලබාගෙන නැත</span>
                                    )}
                                  </>
                                ) : isDehalakshanaRep(rep) ? (
                                  <>
                                    <span className="block font-semibold text-teal-300">Face Photo Uploaded</span>
                                    {rep.birthDetails?.birthDate ? (
                                      <span className="block text-slate-300 text-[10px]">උපන් දිනය: {rep.birthDetails.birthDate}</span>
                                    ) : (
                                      <span className="block text-slate-500 text-[10px] italic">උපන් දිනය: ලබාගෙන නැත</span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <span className="block font-semibold">{rep.birthDetails?.birthDate}</span>
                                    <span className="block text-slate-400 text-[10px]">Time: {rep.birthDetails?.birthTime}</span>
                                    <span className="block text-indigo-300 text-[10px]">Place: {rep.birthDetails?.birthPlace}</span>
                                  </>
                                )}
                              </td>
                              <td className="p-3.5 font-sans">
                                {isPalmistryRep(rep) ? (
                                  <span className="block font-bold text-amber-400">✋ හස්තරේඛා පරීක්ෂාව</span>
                                ) : isDehalakshanaRep(rep) ? (
                                  <span className="block font-bold text-teal-400">👤 දේහලක්ෂණ පරීක්ෂාව</span>
                                ) : (
                                  <>
                                    <span className="block font-bold text-amber-400">{rep.chart?.lagnaSinhala} ලග්නය</span>
                                    <span className="block text-sky-400 text-[10px]">නැකත: {rep.chart?.calculations?.nakshatraNameSi}</span>
                                    <span className="block text-[10px] text-slate-400 font-mono">ස්ඵුටය: {rep.chart?.calculations?.moonLongitudeFullSi}</span>
                                  </>
                                )}
                              </td>
                              <td className="p-3.5">
                                {rep.driveFileId ? (
                                  <div className="flex flex-col gap-1">
                                    <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full w-fit">
                                      <svg className="w-2.5 h-2.5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>
                                      </svg>
                                      {rep.driveFileId.startsWith("sandbox_drive_") ? "Sandbox Backup" : "Drive Saved"}
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-mono select-all truncate max-w-[120px]" title={rep.driveFileId}>
                                      ID: {rep.driveFileId}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-500 italic">Not backed up</span>
                                )}
                              </td>
                              <td className="p-3.5">
                                {rep.rating ? (
                                  <div className="space-y-1.5">
                                    <div className="flex text-amber-400 text-xs gap-0.5 leading-none">
                                      {Array.from({ length: 5 }, (_, sIdx) => (
                                        <span key={sIdx}>
                                          {sIdx < Number(rep.rating) ? "★" : "☆"}
                                        </span>
                                      ))}
                                    </div>
                                    {rep.comment ? (
                                      <p className="text-[11px] text-slate-300 italic bg-slate-900/40 p-2 rounded-lg border border-slate-800/50 max-w-[160px] break-words whitespace-pre-line leading-relaxed font-sans" title={rep.comment}>
                                        "{rep.comment}"
                                      </p>
                                    ) : (
                                      <span className="text-[10px] text-slate-500 block italic font-sans">(No review text)</span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <div className="flex text-slate-750 text-xs gap-0.5 leading-none">
                                      {"☆☆☆☆☆"}
                                    </div>
                                    <span className="text-[10px] text-slate-500 block italic font-sans">No rating submitted</span>
                                  </div>
                                )}
                              </td>
                              <td className="p-3.5 text-center">
                                <div className="flex flex-col gap-1.5 w-full min-w-[110px]">
                                  {isPalmistryRep(rep) ? (
                                    <>
                                      <button
                                        onClick={() => handleViewAdminPalmReading(rep)}
                                        className="w-full px-2.5 py-1.5 bg-amber-600/90 hover:bg-amber-600 text-[10px] text-white font-bold rounded-lg cursor-pointer transition-all font-sans text-center shadow-sm"
                                      >
                                        ✋ View Reading
                                      </button>
                                      {(isPalmistryRep(rep) || rep.hasPalmImage || rep.palmImageBase64) && (
                                        <button
                                          onClick={() => handleOpenAdminPalmPhoto(rep)}
                                          className="w-full px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-[10px] text-white font-bold rounded-lg cursor-pointer transition-all font-sans text-center shadow-sm flex items-center justify-center gap-1"
                                          title="Open user palm photo in photo viewer"
                                        >
                                          <span>📷</span>
                                          <span>{lang === 'sinhala' ? "ඡායාරූපය බලන්න" : "Open Photo"}</span>
                                        </button>
                                      )}
                                    </>
                                  ) : isDehalakshanaRep(rep) ? (
                                    <>
                                      <button
                                        onClick={() => handleViewAdminDehaReading(rep)}
                                        className="w-full px-2.5 py-1.5 bg-teal-600/90 hover:bg-teal-600 text-[10px] text-white font-bold rounded-lg cursor-pointer transition-all font-sans text-center shadow-sm"
                                      >
                                        👤 View Reading
                                      </button>
                                      {(isDehalakshanaRep(rep) || rep.hasDehaImage || rep.dehalakshanaImageBase64) && (
                                        <button
                                          onClick={() => handleOpenAdminDehaPhoto(rep)}
                                          className="w-full px-2.5 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-[10px] text-white font-bold rounded-lg cursor-pointer transition-all font-sans text-center shadow-sm flex items-center justify-center gap-1"
                                          title="Open user face photo in photo viewer"
                                        >
                                          <span>📷</span>
                                          <span>{lang === 'sinhala' ? "ඡායාරූපය බලන්න" : "Open Photo"}</span>
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={async () => {
                                          setIsLoadingAdminReports(true);
                                          await loadReportIntoState(rep);
                                          setIsLoadingAdminReports(false);
                                          setIsAdminPanelOpen(false);
                                          setActiveTab('horoscope');
                                          setTimeout(() => {
                                            const el = document.getElementById('results-section') || document.getElementById('chart-display');
                                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                                          }, 150);
                                        }}
                                        className="w-full px-2.5 py-1.5 bg-indigo-600/90 hover:bg-indigo-600 text-[10px] text-white font-bold rounded-lg cursor-pointer transition-all font-sans text-center shadow-sm"
                                      >
                                        Load Chart
                                      </button>
                                      
                                      <button
                                        onClick={async () => {
                                          if (isPalmistryRep(rep)) {
                                            handleViewAdminPalmReading(rep);
                                            return;
                                          }
                                          if (isDehalakshanaRep(rep)) {
                                            handleViewAdminDehaReading(rep);
                                            return;
                                          }
                                          setIsLoadingAdminReports(true);
                                          const fullLoaded = await loadReportIntoState(rep);
                                          setUserRating(rep.rating || fullLoaded?.rating || 0);
                                          setUserComment(rep.comment || fullLoaded?.comment || "");
                                          setRatingSubmittedUs(true); // Always force unlock printable preview for admin
                                          setIsLoadingAdminReports(false);
                                          setShowReportPreviewModal(true);
                                        }}
                                        className="w-full px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-[10px] text-slate-950 font-bold rounded-lg cursor-pointer transition-all font-sans text-center shadow-sm flex items-center justify-center gap-1"
                                      >
                                        <Sparkles className="w-3 h-3 text-slate-950" />
                                        {lang === 'sinhala' ? "පූර්ව දර්ශනය" : "Open Preview"}
                                      </button>
                                    </>
                                  )}

                                  <button
                                    onClick={() => deleteAdminReport(rep.id)}
                                    className="w-full px-2.5 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 text-[10px] font-bold rounded-lg cursor-pointer transition-all font-sans text-center"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bottom Summary & Load All Navigation Bar */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>පෙන්වන වාර්තා: <strong className="text-indigo-300 font-mono font-bold">{filteredAndSortedAdminReports.length}</strong> / <strong className="text-slate-200 font-mono">{adminReports.length}</strong></span>
                  <span className="text-slate-600">•</span>
                  <span>දත්තගබඩාවේ මුළු වාර්තා (Total in DB): <strong className="text-emerald-400 font-mono font-bold">{adminTotalCount || adminReports.length}</strong></span>
                </div>

                {!isShowingAllReports && (adminTotalCount > adminReports.length || adminReports.length === 100) ? (
                  <button
                    type="button"
                    onClick={() => fetchAdminReports(undefined, true)}
                    disabled={isLoadingAdminReports}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all shadow cursor-pointer flex items-center gap-1.5"
                  >
                    <span>📂</span>
                    <span>{isLoadingAdminReports ? "ලෝඩ් වෙමින්..." : `සියලුම පැරණි වාර්තා (${adminTotalCount || 'All'}) බලන්න`}</span>
                  </button>
                ) : (isShowingAllReports || isDateRangeActive || adminReports.length > 100) ? (
                  <button
                    type="button"
                    onClick={handleShowLast100}
                    disabled={isLoadingAdminReports}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs transition-all border border-slate-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>⏮️</span>
                    <span>පසුගිය 100 පමණක් පෙන්වන්න</span>
                  </button>
                ) : null}
              </div>

              {/* Floating Copy Feedback Toast Notification */}
              {copiedTextNotice && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-2xl z-50 flex items-center gap-2 border border-emerald-400/30 animate-bounce">
                  <Check className="w-4 h-4 text-white" />
                  <span>පිටපත් කරගන්නා ලදී (Copied): {copiedTextNotice}</span>
                </div>
              )}

            </div>
          </div>
        )}

        {/* READ-ONLY ADMIN CHAT HISTORY MODAL */}
        {activeChatLog && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 md:p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl relative">
              <button 
                onClick={() => {
                  setActiveChatLog(null);
                  setIsLoadingActiveChat(false);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer text-base font-bold bg-slate-800/80 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-all"
                title="Close"
              >
                ✕
              </button>

              <div className="border-b border-slate-800 pb-3.5 mb-4">
                <div className="flex items-center justify-between gap-3 pr-8 flex-wrap">
                  <h3 className="text-base font-bold font-display text-slate-100 uppercase tracking-wider font-sans flex items-center gap-2">
                    <span>💬 AI Consultation Log</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-bold lowercase">
                      {activeChatLog.length} {activeChatLog.length === 1 ? 'message' : 'messages'}
                    </span>
                  </h3>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1 flex-wrap">
                  <p className="text-xs text-indigo-400 font-sans font-semibold">
                    පාරිභෝගිකයා (Client): <span className="text-slate-200">{activeChatClientName}</span>
                  </p>
                  {isLoadingActiveChat && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-sans animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>සම්පූර්ණ සංවාදය ලබාගනිමින් පවතී...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Admin Chat Quota Control Bar for this customer */}
              {activeChatReport && (() => {
                const currentRepLimit = Number(activeChatReport.customChatLimit !== undefined ? activeChatReport.customChatLimit : (activeChatReport.allowedLimit || 4));
                const targetEm = activeChatReport?.birthDetails?.userEmail || (activeChatReport?.contactType === 'email' ? activeChatReport.contactValue : '');

                return (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 mb-3 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-300 font-medium">⚡ AI Question Limit:</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                        {currentRepLimit >= 999 ? '∞ Unlimited' : `${currentRepLimit} Questions`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400">Adjust:</span>
                      
                      {/* Decrease button */}
                      <button
                        type="button"
                        onClick={() => {
                          const newLimit = Math.max(0, currentRepLimit - 1);
                          handleSetCustomChatLimit(undefined, targetEm, newLimit, activeChatReport?.id, activeChatReport?.contactValue);
                          setActiveChatReport((prev: any) => prev ? { ...prev, customChatLimit: newLimit, allowedLimit: newLimit } : prev);
                        }}
                        className="px-2 py-0.8 bg-rose-950/80 hover:bg-rose-800 text-rose-300 hover:text-white rounded text-[11px] font-mono font-bold transition-all border border-rose-800 cursor-pointer"
                        title="Decrease Limit (-1)"
                      >
                        -1
                      </button>

                      {/* Presets: 2 (reduced), 4 (standard), 10 (bonus), 25, 50, 100 */}
                      {[2, 4, 10, 25, 50, 100].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            handleSetCustomChatLimit(undefined, targetEm, num, activeChatReport?.id, activeChatReport?.contactValue);
                            setActiveChatReport((prev: any) => prev ? { ...prev, customChatLimit: num, allowedLimit: num } : prev);
                          }}
                          className={`px-2 py-0.8 rounded text-[11px] font-mono font-bold transition-all border cursor-pointer ${
                            currentRepLimit === num 
                              ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                              : "bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border-slate-700"
                          }`}
                          title={`Set limit to ${num}`}
                        >
                          {num}
                        </button>
                      ))}

                      {/* Increase button */}
                      <button
                        type="button"
                        onClick={() => {
                          const newLimit = currentRepLimit + 5;
                          handleSetCustomChatLimit(undefined, targetEm, newLimit, activeChatReport?.id, activeChatReport?.contactValue);
                          setActiveChatReport((prev: any) => prev ? { ...prev, customChatLimit: newLimit, allowedLimit: newLimit } : prev);
                        }}
                        className="px-2 py-0.8 bg-indigo-950/80 hover:bg-indigo-800 text-indigo-300 hover:text-white rounded text-[11px] font-mono font-bold transition-all border border-indigo-800 cursor-pointer"
                        title="Increase Limit (+5)"
                      >
                        +5
                      </button>

                      {/* Unlimited button */}
                      <button
                        type="button"
                        onClick={() => {
                          handleSetCustomChatLimit(undefined, targetEm, 999999, activeChatReport?.id, activeChatReport?.contactValue);
                          setActiveChatReport((prev: any) => prev ? { ...prev, customChatLimit: 999999, allowedLimit: 999999 } : prev);
                        }}
                        className="px-2.5 py-0.8 bg-purple-950/60 hover:bg-purple-600 text-purple-300 hover:text-white rounded text-[11px] font-mono font-bold transition-all border border-purple-800 hover:border-purple-500 cursor-pointer"
                        title="Set Unlimited"
                      >
                        ∞ Unlimited
                      </button>

                      {/* Direct Custom Input & Set */}
                      <div className="flex items-center gap-1 pl-1 border-l border-slate-800 ml-1">
                        <input
                          type="number"
                          min="0"
                          value={chatModalCustomInput}
                          onChange={(e) => setChatModalCustomInput(e.target.value)}
                          placeholder="e.g. 8"
                          className="w-14 bg-slate-900 border border-slate-700 text-slate-200 rounded px-1.5 py-0.5 text-[11px] font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseInt(chatModalCustomInput, 10);
                            if (!isNaN(val) && val >= 0) {
                              handleSetCustomChatLimit(undefined, targetEm, val, activeChatReport?.id, activeChatReport?.contactValue);
                              setActiveChatReport((prev: any) => prev ? { ...prev, customChatLimit: val, allowedLimit: val } : prev);
                              setChatModalCustomInput("");
                            }
                          }}
                          className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold cursor-pointer transition-all"
                        >
                          Set
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 max-h-[58vh] flex flex-col justify-start font-sans text-xs custom-scrollbar">
                {activeChatLog.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    {isLoadingActiveChat ? (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                        <p className="text-xs text-slate-300 font-sans">සංවාද සටහන් ලබාගනිමින් පවතී (Loading full chat history)...</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-sans">මෙම වාර්තාව සඳහා AI සංවාද සටහන් කිසිවක් හමු නොවීය (No chat logs recorded).</p>
                    )}
                  </div>
                ) : (
                  activeChatLog.map((msg, idx) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <div 
                        key={idx} 
                        className={`flex flex-col max-w-[90%] md:max-w-[85%] ${isUser ? 'self-end ml-auto items-end' : 'self-start mr-auto items-start'}`}
                      >
                        <div className={`p-3.5 rounded-2xl border text-left leading-relaxed ${
                          isUser 
                            ? 'bg-indigo-600/25 border-indigo-500/30 text-indigo-50 rounded-br-xs' 
                            : 'bg-slate-950/90 border-slate-800/90 text-slate-200 rounded-bl-xs shadow-md'
                        }`}>
                          <p className="whitespace-pre-wrap break-words text-xs md:text-sm font-sans">{msg.text}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-1 px-1">
                          <span className={`font-bold ${isUser ? 'text-indigo-400' : 'text-amber-400'}`}>
                            {isUser ? "👤 Client" : "🔮 AI Astrologer"}
                          </span>
                          <span>•</span>
                          <span>
                            {msg.timestamp 
                              ? (msg.timestamp.includes("T") || !msg.timestamp.includes(":") 
                                  ? new Date(msg.timestamp).toLocaleString() 
                                  : msg.timestamp) 
                              : "Just now"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-slate-800 pt-3.5 mt-4 flex items-center justify-between gap-2 flex-wrap">
                {activeChatLog.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const transcript = `=== AI Astrologer Consultation Transcript ===\nClient: ${activeChatClientName}\nDate: ${new Date().toLocaleString()}\nTotal Messages: ${activeChatLog.length}\n\n` +
                        activeChatLog.map((m: any, idx: number) => {
                          const sender = m.sender === 'user' ? 'Client' : 'AI Astrologer';
                          const time = m.timestamp ? (m.timestamp.includes("T") ? new Date(m.timestamp).toLocaleString() : m.timestamp) : "";
                          return `[${idx + 1}] ${sender} (${time}):\n${m.text}\n`;
                        }).join('\n----------------------------------------\n\n');
                      handleCopyText(transcript);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 border border-indigo-500/20 text-xs font-bold rounded-lg cursor-pointer transition-all font-sans flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>සංවාදය පිටපත් කරන්න (Copy Transcript)</span>
                  </button>
                ) : <div />}

                <button
                  type="button"
                  onClick={() => {
                    setActiveChatLog(null);
                    setIsLoadingActiveChat(false);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-all font-sans shadow-md"
                >
                  වසන්න (Close Log)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHAT & PREDICTION LIMIT EXCEEDED POPUP MODAL */}
        {showChatLimitModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl shadow-amber-500/10 space-y-5 relative">
              <button
                type="button"
                onClick={() => setShowChatLimitModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-all text-xl font-bold cursor-pointer"
              >
                ✕
              </button>

              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
                <ShieldAlert className="w-8 h-8" />
              </div>

              {userAllowedLimit <= 4 && !userBonusGranted ? (
                // CASE 1: Default 4 limit - User can request automatic +6 questions bonus via email
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-bold font-display text-amber-300">
                      {lang === 'sinhala'
                        ? "නොමිලේ අමතර AI ප්‍රශ්න 6ක් (මුළු 10ක්) ලබාගන්න"
                        : "Request +6 Additional Free AI Questions"}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {lang === 'sinhala'
                        ? "ඕනෑම අයෙකුට කේන්දර සටහන නොමිලේ ගණනය කළ හැක. නොමිලේ හිමිවන පළමු ප්‍රශ්න 4 අවසන් වූ පසු, Email එකක් යැවීමෙන් තවත් අමතර ප්‍රශ්න 6ක් (මුළු 10ක්) නොමිලේ ලබාගත හැක."
                        : "Anyone can calculate their horoscope chart for free. Once you reach 4 questions, simply send an email request to unlock +6 additional free questions (10 total)!"}
                    </p>
                  </div>

                  <form onSubmit={handleRequestChatExtension} className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left space-y-3">
                    {!userEmail && (
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-300 font-sans font-medium block">
                          {lang === 'sinhala' ? "ඔබගේ Email ලිපිනය (අනිවාර්යයි - Required):" : "Your Email Address (Required):"}
                        </label>
                        <input
                          type="email"
                          required
                          value={extensionEmailInput}
                          onChange={(e) => setExtensionEmailInput(e.target.value)}
                          placeholder="e.g. yourname@gmail.com"
                          className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300 font-sans font-medium block">
                        {lang === 'sinhala' ? "ඔබගේ WhatsApp අංකය (අවශ්‍ය නම් පමණි - Optional):" : "Your WhatsApp Mobile Number (Optional):"}
                      </label>
                      <input
                        type="text"
                        value={userWhatsappForExtension}
                        onChange={(e) => setUserWhatsappForExtension(e.target.value)}
                        placeholder="e.g. 0771234567 or +94771234567"
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isRequestingExtension}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-300 hover:from-amber-400 hover:to-amber-200 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-50"
                    >
                      <Mail className="w-4 h-4" />
                      {isRequestingExtension
                        ? (lang === 'sinhala' ? "සකස් වෙමින් පවතී..." : "Requesting Extension...")
                        : (lang === 'sinhala' ? "Email යවා අමතර ප්‍රශ්න 6 ලබාගන්න (+6 Bonus)" : "Email Admin & Claim +6 Free Questions")}
                    </button>
                  </form>

                  {extensionStatusMsg && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-lg font-sans">
                      {extensionStatusMsg}
                    </div>
                  )}
                </div>
              ) : (
                // CASE 2: Already received bonus (+6) or custom limit reached
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-bold font-display text-amber-300">
                      {lang === 'sinhala'
                        ? "AI ප්‍රශ්න සීමාව අවසන් - Admin වෙතින් දීර්ඝ කරගන්න"
                        : "AI Questions Limit Reached - Request Admin Extension"}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {lang === 'sinhala'
                        ? `ඔබට හිමි නොමිලේ AI ප්‍රශ්න (${userAllowedLimit}) සීමාව භාවිත කර ඇත. ඔබට තවත් අමතර ප්‍රශ්න ඇසීමට අවශ්‍ය නම්, ඔබගේ Email එක සහ WhatsApp අංකය සමඟ Admin (sampathub89@gmail.com) අමතන්න.`
                        : `You have reached your limit of ${userAllowedLimit} AI questions. For further consultations, please submit your Email and WhatsApp number to the Admin.`}
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left space-y-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400 font-sans block font-medium flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-amber-400" />
                        {lang === 'sinhala' ? "ඇඩ්මින් විද්‍යුත් තැපෑල (Admin Email Address):" : "Admin Email Address:"}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-300 select-all block bg-amber-500/10 py-2 px-3 rounded-lg border border-amber-500/20 tracking-wider">
                        sampathub89@gmail.com
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300 font-sans font-medium block">
                        {lang === 'sinhala' ? "ඔබගේ WhatsApp අංකය (WhatsApp Mobile Number):" : "Your WhatsApp Mobile Number:"}
                      </label>
                      <input
                        type="text"
                        value={userWhatsappForExtension}
                        onChange={(e) => setUserWhatsappForExtension(e.target.value)}
                        placeholder="e.g. 0771234567 or +94771234567"
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <a
                      href={`mailto:sampathub89@gmail.com?subject=Astrology%20AI%20Chat%20Limit%20Extension%20Request&body=Hello%20Admin%2C%0A%0AI%20have%20reached%20my%20limit%20of%20${userAllowedLimit}%20AI%20questions.%20Please%20grant%20me%20a%20custom%20extension.%0A%0AEmail%3A%20${encodeURIComponent(userEmail || '')}%0AWhatsApp%3A%20${encodeURIComponent(userWhatsappForExtension || '')}`}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-300 hover:from-amber-400 hover:to-amber-200 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/10 block text-center"
                    >
                      <Mail className="w-4 h-4" />
                      {lang === 'sinhala' ? "Email මගින් Admin අමතන්න (sampathub89@gmail.com)" : "Email Admin for Extension (sampathub89@gmail.com)"}
                    </a>
                    
                    <a
                      href={`https://wa.me/94716242455?text=${encodeURIComponent(`Hello Admin, I would like to request an extension for AI Chat questions. Email: ${userEmail || ''}, Phone: ${userWhatsappForExtension || ''}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 block text-center"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {lang === 'sinhala' ? "WhatsApp මගින් Admin අමතන්න (0716242455)" : "WhatsApp Admin (0716242455)"}
                    </a>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowChatLimitModal(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer mt-1"
              >
                {lang === 'sinhala' ? "වසන්න" : "Close"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
