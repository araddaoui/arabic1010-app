export type NumberItem = {
  n: number;
  eastern: string;
  ar: string;
  translit: string;
};

const WORDS: [string, string][] = [
  ["صِفْر", "ṣifr"],
  ["وَاحِد", "wāḥid"],
  ["اِثْنَان", "ithnān"],
  ["ثَلَاثَة", "thalātha"],
  ["أَرْبَعَة", "arbaʿa"],
  ["خَمْسَة", "khamsa"],
  ["سِتَّة", "sitta"],
  ["سَبْعَة", "sabʿa"],
  ["ثَمَانِيَة", "thamāniya"],
  ["تِسْعَة", "tisʿa"],
  ["عَشَرَة", "ʿashara"],
  ["أَحَدَ عَشَر", "aḥada ʿashar"],
  ["اِثْنَا عَشَر", "ithnā ʿashar"],
  ["ثَلَاثَةَ عَشَر", "thalāthata ʿashar"],
  ["أَرْبَعَةَ عَشَر", "arbaʿata ʿashar"],
  ["خَمْسَةَ عَشَر", "khamsata ʿashar"],
  ["سِتَّةَ عَشَر", "sittata ʿashar"],
  ["سَبْعَةَ عَشَر", "sabʿata ʿashar"],
  ["ثَمَانِيَةَ عَشَر", "thamāniyata ʿashar"],
  ["تِسْعَةَ عَشَر", "tisʿata ʿashar"],
  ["عِشْرُون", "ʿishrūn"],
];

export function toEastern(n: number | string): string {
  const map = "٠١٢٣٤٥٦٧٨٩";
  return String(n)
    .split("")
    .map((c) => (/[0-9]/.test(c) ? map[Number(c)] : c))
    .join("");
}

export const NUMBERS: NumberItem[] = WORDS.map(([ar, translit], n) => ({
  n,
  eastern: toEastern(n),
  ar,
  translit,
}));

export const VISUAL_MODES = [
  "shapes",
  "objects",
  "fingers",
  "clock",
  "math",
  "dots",
  "tally",
] as const;
export type VisualMode = (typeof VISUAL_MODES)[number];

export const FREE_NUMBERS = 10; // 0–10
