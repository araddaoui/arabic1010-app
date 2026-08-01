export type VocabWord = {
  id: string;      // english key = audio file name
  ar: string;
  bare: string;    // without harakat, for tile assembly
  en: string;
  translit: string;
  emoji: string;
  scene: boolean;  // appears in the academic scene
  writingFocus: boolean;
};

export const VOCAB: VocabWord[] = [
  { id: "door", ar: "بَاب", bare: "باب", en: "door", translit: "bāb", emoji: "🚪", scene: true, writingFocus: false },
  { id: "dog", ar: "كَلب", bare: "كلب", en: "dog", translit: "kalb", emoji: "🐕", scene: false, writingFocus: false },
  { id: "house", ar: "بَيت", bare: "بيت", en: "house", translit: "bayt", emoji: "🏠", scene: false, writingFocus: false },
  { id: "boy", ar: "وَلَد", bare: "ولد", en: "boy", translit: "walad", emoji: "👦", scene: true, writingFocus: false },
  { id: "mother", ar: "أُم", bare: "أم", en: "mother", translit: "umm", emoji: "👩", scene: false, writingFocus: false },
  { id: "father", ar: "أَب", bare: "أب", en: "father", translit: "ab", emoji: "👨", scene: false, writingFocus: false },
  { id: "brother", ar: "أَخ", bare: "أخ", en: "brother", translit: "akh", emoji: "🧑", scene: false, writingFocus: false },
  { id: "sister", ar: "أُخت", bare: "أخت", en: "sister", translit: "ukht", emoji: "👧", scene: false, writingFocus: false },
  { id: "fish", ar: "سَمَك", bare: "سمك", en: "fish", translit: "samak", emoji: "🐟", scene: false, writingFocus: false },
  { id: "pen", ar: "قَلَم", bare: "قلم", en: "pen", translit: "qalam", emoji: "🖊️", scene: true, writingFocus: true },
  { id: "sun", ar: "شَمس", bare: "شمس", en: "sun", translit: "shams", emoji: "☀️", scene: false, writingFocus: false },
  { id: "fire", ar: "نار", bare: "نار", en: "fire", translit: "nār", emoji: "🔥", scene: false, writingFocus: false },
  { id: "drink", ar: "شَراب", bare: "شراب", en: "drink / syrup", translit: "sharāb", emoji: "🥤", scene: true, writingFocus: false },
  { id: "travel", ar: "سَفَر", bare: "سفر", en: "travel", translit: "safar", emoji: "🧳", scene: false, writingFocus: false },
  { id: "went_out", ar: "خَرَج", bare: "خرج", en: "he went out", translit: "kharaja", emoji: "🚶", scene: false, writingFocus: true },
  { id: "entered", ar: "دَخَل", bare: "دخل", en: "he entered", translit: "dakhala", emoji: "🚪", scene: false, writingFocus: true },
  { id: "read", ar: "قَرَأ", bare: "قرأ", en: "he read", translit: "qaraʾa", emoji: "📖", scene: true, writingFocus: true },
  { id: "knowledge", ar: "عِلم", bare: "علم", en: "knowledge", translit: "ʿilm", emoji: "🎓", scene: true, writingFocus: false },
  { id: "wrote", ar: "كَتَب", bare: "كتب", en: "he wrote", translit: "kataba", emoji: "✍️", scene: true, writingFocus: true },
  { id: "peace", ar: "سِلم", bare: "سلم", en: "peace", translit: "silm", emoji: "🕊️", scene: false, writingFocus: true },
];

export const FREE_VOCAB = 5;
