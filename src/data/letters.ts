export type VowelKey =
  | "fatha"
  | "kasra"
  | "dhamma"
  | "long_alif"
  | "long_ya"
  | "long_waw";

export const VOWELS: { key: VowelKey; label: string; sign: string; kind: "short" | "long" }[] = [
  { key: "fatha", label: "fatḥa", sign: "َ", kind: "short" },
  { key: "kasra", label: "kasra", sign: "ِ", kind: "short" },
  { key: "dhamma", label: "ḍamma", sign: "ُ", kind: "short" },
  { key: "long_alif", label: "long ā", sign: "َا", kind: "long" },
  { key: "long_ya", label: "long ī", sign: "ِي", kind: "long" },
  { key: "long_waw", label: "long ū", sign: "ُو", kind: "long" },
];

export type Letter = {
  id: string;          // the letter glyph
  name: string;        // arabic name
  translit: string;    // base transliteration consonant
  latinName: string;
  group: string;
  color: string;
  dots: number;
  imageWord: { ar: string; en: string; emoji: string };
  sun: boolean;
};

// Okabe–Ito colour-blind-safe palette, darkened for AA contrast on light chips
const C = {
  blue: "#0072B2",
  orange: "#B25E00",
  green: "#009E73",
  yellow: "#8A6D00",
  sky: "#1D6F8A",
  vermillion: "#B2402A",
  purple: "#8A3D8A",
  slate: "#3D4A5C",
};

export const LETTERS: Letter[] = [
  { id: "ا", name: "أَلِف", translit: "ʾ/ā", latinName: "alif", group: "Alif & Hamza", color: C.slate, dots: 0, imageWord: { ar: "أَسَد", en: "lion", emoji: "🦁" }, sun: false },
  { id: "ب", name: "بَاء", translit: "b", latinName: "baa", group: "Baa family", color: C.blue, dots: 1, imageWord: { ar: "بَاب", en: "door", emoji: "🚪" }, sun: false },
  { id: "ت", name: "تَاء", translit: "t", latinName: "taa", group: "Baa family", color: C.blue, dots: 2, imageWord: { ar: "تُفَّاح", en: "apple", emoji: "🍎" }, sun: true },
  { id: "ث", name: "ثَاء", translit: "th", latinName: "thaa", group: "Baa family", color: C.blue, dots: 3, imageWord: { ar: "ثُعْبَان", en: "snake", emoji: "🐍" }, sun: true },
  { id: "ج", name: "جِيم", translit: "j", latinName: "jiim", group: "Jiim family", color: C.orange, dots: 1, imageWord: { ar: "جَبَل", en: "mountain", emoji: "⛰️" }, sun: false },
  { id: "ح", name: "حَاء", translit: "ḥ", latinName: "haa", group: "Jiim family", color: C.orange, dots: 0, imageWord: { ar: "حِصَان", en: "horse", emoji: "🐎" }, sun: false },
  { id: "خ", name: "خَاء", translit: "kh", latinName: "khaa", group: "Jiim family", color: C.orange, dots: 1, imageWord: { ar: "خُبْز", en: "bread", emoji: "🍞" }, sun: false },
  { id: "د", name: "دَال", translit: "d", latinName: "daal", group: "Daal family", color: C.green, dots: 0, imageWord: { ar: "دُبّ", en: "bear", emoji: "🐻" }, sun: true },
  { id: "ذ", name: "ذَال", translit: "dh", latinName: "dhaal", group: "Daal family", color: C.green, dots: 1, imageWord: { ar: "ذَهَب", en: "gold", emoji: "🪙" }, sun: true },
  { id: "ر", name: "رَاء", translit: "r", latinName: "raa", group: "Raa family", color: C.yellow, dots: 0, imageWord: { ar: "رَأْس", en: "head", emoji: "🧑" }, sun: true },
  { id: "ز", name: "زَاي", translit: "z", latinName: "zaay", group: "Raa family", color: C.yellow, dots: 1, imageWord: { ar: "زَهْرَة", en: "flower", emoji: "🌸" }, sun: true },
  { id: "س", name: "سِين", translit: "s", latinName: "siin", group: "Siin family", color: C.sky, dots: 0, imageWord: { ar: "سَمَك", en: "fish pond", emoji: "🐟" }, sun: true },
  { id: "ش", name: "شِين", translit: "sh", latinName: "shiin", group: "Siin family", color: C.sky, dots: 3, imageWord: { ar: "شَمْس", en: "sun", emoji: "☀️" }, sun: true },
  { id: "ص", name: "صَاد", translit: "ṣ", latinName: "saad", group: "Emphatics", color: C.vermillion, dots: 0, imageWord: { ar: "صَوْت", en: "sound", emoji: "🔊" }, sun: true },
  { id: "ض", name: "ضَاد", translit: "ḍ", latinName: "daad", group: "Emphatics", color: C.vermillion, dots: 1, imageWord: { ar: "ضَوْء", en: "light", emoji: "🏮" }, sun: true },
  { id: "ط", name: "طَاء", translit: "ṭ", latinName: "taa (emphatic)", group: "Emphatics", color: C.vermillion, dots: 0, imageWord: { ar: "طَيْر", en: "bird", emoji: "🦅" }, sun: true },
  { id: "ظ", name: "ظَاء", translit: "ẓ", latinName: "zaa (emphatic)", group: "Emphatics", color: C.vermillion, dots: 1, imageWord: { ar: "ظِلّ", en: "shade", emoji: "🌳" }, sun: true },
  { id: "ع", name: "عَيْن", translit: "ʿ", latinName: "ayn", group: "Ayn family", color: C.purple, dots: 0, imageWord: { ar: "عَيْن", en: "eye", emoji: "👁️" }, sun: false },
  { id: "غ", name: "غَيْن", translit: "gh", latinName: "ghayn", group: "Ayn family", color: C.purple, dots: 1, imageWord: { ar: "غَيْم", en: "fog / cloud", emoji: "🌫️" }, sun: false },
  { id: "ف", name: "فَاء", translit: "f", latinName: "faa", group: "Faa & Qaaf", color: C.blue, dots: 1, imageWord: { ar: "فَم", en: "mouth", emoji: "👄" }, sun: false },
  { id: "ق", name: "قَاف", translit: "q", latinName: "qaaf", group: "Faa & Qaaf", color: C.blue, dots: 2, imageWord: { ar: "قَلْب", en: "heart", emoji: "❤️" }, sun: false },
  { id: "ك", name: "كَاف", translit: "k", latinName: "kaaf", group: "Kaaf–Miim", color: C.green, dots: 0, imageWord: { ar: "كِتَاب", en: "book", emoji: "📖" }, sun: false },
  { id: "ل", name: "لَام", translit: "l", latinName: "laam", group: "Kaaf–Miim", color: C.green, dots: 0, imageWord: { ar: "لَيْل", en: "night", emoji: "🌙" }, sun: true },
  { id: "م", name: "مِيم", translit: "m", latinName: "miim", group: "Kaaf–Miim", color: C.green, dots: 0, imageWord: { ar: "مَاء", en: "water", emoji: "💧" }, sun: false },
  { id: "ن", name: "نُون", translit: "n", latinName: "nuun", group: "Baa family", color: C.blue, dots: 1, imageWord: { ar: "نَار", en: "fire", emoji: "🔥" }, sun: true },
  { id: "ه", name: "هَاء", translit: "h", latinName: "haa (soft)", group: "Alif & Hamza", color: C.slate, dots: 0, imageWord: { ar: "هِلَال", en: "crescent", emoji: "🌙" }, sun: false },
  { id: "و", name: "وَاو", translit: "w/ū", latinName: "waaw", group: "Alif & Hamza", color: C.slate, dots: 0, imageWord: { ar: "وَرْد", en: "rose", emoji: "🌹" }, sun: false },
  { id: "ي", name: "يَاء", translit: "y/ī", latinName: "yaa", group: "Baa family", color: C.blue, dots: 2, imageWord: { ar: "يَد", en: "hand", emoji: "✋" }, sun: false },
];

/** Renders the letter with the given vowel. Alif's long ā is the madda آ. */
export function vowelForm(letter: string, v: VowelKey): string {
  if (letter === "ا") {
    switch (v) {
      case "fatha": return "أَ";
      case "kasra": return "إِ";
      case "dhamma": return "أُ";
      case "long_alif": return "آ";
      case "long_ya": return "إِي";
      case "long_waw": return "أُو";
    }
  }
  switch (v) {
    case "fatha": return letter + "َ";
    case "kasra": return letter + "ِ";
    case "dhamma": return letter + "ُ";
    case "long_alif": return letter + "َا";
    case "long_ya": return letter + "ِي";
    case "long_waw": return letter + "ُو";
  }
}

export function vowelTranslit(l: Letter, v: VowelKey): string {
  const base = l.id === "ا" ? "ʾ" : l.translit.split("/")[0];
  switch (v) {
    case "fatha": return base + "a";
    case "kasra": return base + "i";
    case "dhamma": return base + "u";
    case "long_alif": return base + "ā";
    case "long_ya": return base + "ī";
    case "long_waw": return base + "ū";
  }
}

export const FREE_LETTERS = ["ا", "ب", "ت", "ث", "ج", "ح", "خ"];
