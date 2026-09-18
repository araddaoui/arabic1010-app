export type VowelKey = 'fatha' | 'kasra' | 'dhamma' | 'long_alif' | 'long_ya' | 'long_waw';

export interface VowelInfo {
  key: VowelKey;
  label: string;
  kind: 'short' | 'long';
  symbol: string;
  name: string;
}

export const VOWELS: VowelInfo[] = [
  { key: 'fatha', label: 'Fatha (a)', kind: 'short', symbol: '\u064E', name: 'Fatha' },
  { key: 'kasra', label: 'Kasra (i)', kind: 'short', symbol: '\u0650', name: 'Kasra' },
  { key: 'dhamma', label: 'Dhamma (u)', kind: 'short', symbol: '\u064F', name: 'Dhamma' },
  { key: 'long_alif', label: 'Long Alif (\u0101)', kind: 'long', symbol: '\u064E\u0627', name: 'Long Alif' },
  { key: 'long_ya', label: 'Long Yaa (\u012B)', kind: 'long', symbol: '\u0650\u064A', name: 'Long Yaa' },
  { key: 'long_waw', label: 'Long Waw (\u016B)', kind: 'long', symbol: '\u064F\u0648', name: 'Long Waw' }
];

export interface Letter {
  id: string;
  name: string;
  latinName: string;
  translit: string;
  isolated: string;
  initial: string;
  medial: string;
  final: string;
  dots: number;
  color: string;
  group: string;
  sun: boolean;

  imageWord: {
    ar: string;
    en: string;
    emoji: string;
  };
}

export const LETTERS: Letter[] = [
  { id: '\u0627', name: 'Alif', latinName: 'Alif', translit: 'a', isolated: '\u0627', initial: '\u0627\u0640', medial: '\u0640\u0627\u0640', final: '\u0640\u0627', dots: 0, color: '#3B82F6', group: 'Group 1', sun: false, imageWord: { ar: "أَسَد", en: "lion", emoji: "🦁" } },
  { id: '\u0628', name: 'Baa', latinName: 'Baa', translit: 'b', isolated: '\u0628', initial: '\u0628\u0640', medial: '\u0640\u0628\u0640', final: '\u0640\u0628', dots: 1, color: '#10B981', group: 'Group 1', sun: false, imageWord: { ar: "بَاب", en: "door", emoji: "🚪" } },
  { id: '\u062A', name: 'Taa', latinName: 'Taa', translit: 't', isolated: '\u062A', initial: '\u062A\u0640', medial: '\u0640\u062A\u0640', final: '\u0640\u062A', dots: 2, color: '#F59E0B', group: 'Group 1', sun: true, imageWord: { ar: "تُفَّاح", en: "apple", emoji: "🍎" } },
  { id: '\u062B', name: 'Thaa', latinName: 'Thaa', translit: 'th', isolated: '\u062B', initial: '\u062B\u0640', medial: '\u0640\u062B\u0640', final: '\u0640\u062B', dots: 3, color: '#EF4444', group: 'Group 1', sun: true, imageWord: { ar: "ثُعْبَان", en: "snake", emoji: "🐍" } },
  { id: '\u062C', name: 'Jeem', latinName: 'Jeem', translit: 'j', isolated: '\u062C', initial: '\u062C\u0640', medial: '\u0640\u062C\u0640', final: '\u0640\u062C', dots: 1, color: '#8B5CF6', group: 'Group 2', sun: false, imageWord: { ar: "جَبَل", en: "mountain", emoji: "⛰️" } },
  { id: '\u062D', name: 'Haa', latinName: 'Haa', translit: '\u1E25', isolated: '\u062D', initial: '\u062D\u0640', medial: '\u0640\u062D\u0640', final: '\u0640\u062D', dots: 0, color: '#EC4899', group: 'Group 2', sun: false, imageWord: { ar: "حِصَان", en: "horse", emoji: "🐎" } },
  { id: '\u062E', name: 'Khaa', latinName: 'Khaa', translit: 'kh', isolated: '\u062E', initial: '\u062E\u0640', medial: '\u0640\u062E\u0640', final: '\u0640\u062E', dots: 1, color: '#6366F1', group: 'Group 2', sun: false, imageWord: { ar: "خُبْز", en: "bread", emoji: "🍞" } },
  { id: '\u062F', name: 'Dal', latinName: 'Dal', translit: 'd', isolated: '\u062F', initial: '\u062F\u0640', medial: '\u0640\u062F\u0640', final: '\u0640\u062F', dots: 0, color: '#14B8A6', group: 'Group 3', sun: true, imageWord: { ar: "دُبّ", en: "bear", emoji: "🐻" } },
  { id: '\u0630', name: 'Dhal', latinName: 'Dhal', translit: 'dh', isolated: '\u0630', initial: '\u0630\u0640', medial: '\u0640\u0630\u0640', final: '\u0640\u0630', dots: 1, color: '#84CC16', group: 'Group 3', sun: true, imageWord: { ar: "ذَهَب", en: "gold", emoji: "🪙" } },
  { id: '\u0631', name: 'Raa', latinName: 'Raa', translit: 'r', isolated: '\u0631', initial: '\u0631\u0640', medial: '\u0640\u0631\u0640', final: '\u0640\u0631', dots: 0, color: '#F97316', group: 'Group 3', sun: true, imageWord: { ar: "رَأْس", en: "head", emoji: "🧑" } },
  { id: '\u0632', name: 'Zay', latinName: 'Zay', translit: 'z', isolated: '\u0632', initial: '\u0632\u0640', medial: '\u0640\u0632\u0640', final: '\u0640\u0632', dots: 1, color: '#06B6D4', group: 'Group 3', sun: true, imageWord: { ar: "زَهْرَة", en: "flower", emoji: "🌸" } },
  { id: '\u0633', name: 'Seen', latinName: 'Seen', translit: 's', isolated: '\u0633', initial: '\u0633\u0640', medial: '\u0640\u0633\u0640', final: '\u0640\u0633', dots: 0, color: '#3B82F6', group: 'Group 4', sun: true, imageWord: { ar: "سَمَك", en: "fish pond", emoji: "🐟" } },
  { id: '\u0634', name: 'Sheen', latinName: 'Sheen', translit: 'sh', isolated: '\u0634', initial: '\u0634\u0640', medial: '\u0640\u0634\u0640', final: '\u0640\u0634', dots: 3, color: '#10B981', group: 'Group 4', sun: true, imageWord: { ar: "شَمْس", en: "sun", emoji: "☀️" } },
  { id: '\u0635', name: 'Saad', latinName: 'Saad', translit: '\u1E63', isolated: '\u0635', initial: '\u0635\u0640', medial: '\u0640\u0635\u0640', final: '\u0640\u0635', dots: 0, color: '#F59E0B', group: 'Group 4', sun: true, imageWord: { ar: "صَوْت", en: "sound", emoji: "🔊" } },
  { id: '\u0636', name: 'Daad', latinName: 'Daad', translit: '\u1E0D', isolated: '\u0636', initial: '\u0636\u0640', medial: '\u0640\u0636\u0640', final: '\u0640\u0636', dots: 1, color: '#EF4444', group: 'Group 4', sun: true, imageWord: { ar: "ضَوْء", en: "light", emoji: "🏮" } },
  { id: '\u0637', name: 'Taa (emphatic)', latinName: 'Taa (emphatic)', translit: '\u1E6D', isolated: '\u0637', initial: '\u0637\u0640', medial: '\u0640\u0637\u0640', final: '\u0640\u0637', dots: 0, color: '#8B5CF6', group: 'Group 5', sun: true, imageWord: { ar: "طَيْر", en: "bird", emoji: "🦅" } },
  { id: '\u0638', name: 'Zaa (emphatic)', latinName: 'Zaa (emphatic)', translit: '\u1E93', isolated: '\u0638', initial: '\u0638\u0640', medial: '\u0640\u0638\u0640', final: '\u0640\u0638', dots: 1, color: '#EC4899', group: 'Group 5', sun: true, imageWord: { ar: "ظِلّ", en: "shade", emoji: "🌳" } },
  { id: '\u0639', name: 'Ayn', latinName: 'Ayn', translit: '\u02BF', isolated: '\u0639', initial: '\u0639\u0640', medial: '\u0640\u0639\u0640', final: '\u0640\u0639', dots: 0, color: '#6366F1', group: 'Group 5', sun: false, imageWord: { ar: "عَيْن", en: "eye", emoji: "👁️" } },
  { id: '\u063A', name: 'Ghayn', latinName: 'Ghayn', translit: 'gh', isolated: '\u063A', initial: '\u063A\u0640', medial: '\u0640\u063A\u0640', final: '\u0640\u063A', dots: 1, color: '#14B8A6', group: 'Group 5', sun: false, imageWord: { ar: "غَيْم", en: "fog / cloud", emoji: "🌫️" } },
  { id: '\u0641', name: 'Faa', latinName: 'Faa', translit: 'f', isolated: '\u0641', initial: '\u0641\u0640', medial: '\u0640\u0641\u0640', final: '\u0640\u0641', dots: 1, color: '#84CC16', group: 'Group 6', sun: false, imageWord: { ar: "فَم", en: "mouth", emoji: "👄" } },
  { id: '\u0642', name: 'Qaaf', latinName: 'Qaaf', translit: 'q', isolated: '\u0642', initial: '\u0642\u0640', medial: '\u0640\u0642\u0640', final: '\u0640\u0642', dots: 2, color: '#F97316', group: 'Group 6', sun: false, imageWord: { ar: "قَلْب", en: "heart", emoji: "❤️" } },
  { id: '\u0643', name: 'Kaaf', latinName: 'Kaaf', translit: 'k', isolated: '\u0643', initial: '\u0643\u0640', medial: '\u0640\u0643\u0640', final: '\u0640\u0643', dots: 0, color: '#06B6D4', group: 'Group 6', sun: false, imageWord: { ar: "كِتَاب", en: "book", emoji: "📖" } },
  { id: '\u0644', name: 'Laam', latinName: 'Laam', translit: 'l', isolated: '\u0644', initial: '\u0644\u0640', medial: '\u0640\u0644\u0640', final: '\u0640\u0644', dots: 0, color: '#3B82F6', group: 'Group 7', sun: true, imageWord: { ar: "لَيْل", en: "night", emoji: "🌙" } },
  { id: '\u0645', name: 'Meem', latinName: 'Meem', translit: 'm', isolated: '\u0645', initial: '\u0645\u0640', medial: '\u0640\u0645\u0640', final: '\u0640\u0645', dots: 0, color: '#10B981', group: 'Group 7', sun: false, imageWord: { ar: "مَاء", en: "water", emoji: "💧" } },
  { id: '\u0646', name: 'Noon', latinName: 'Noon', translit: 'n', isolated: '\u0646', initial: '\u0646\u0640', medial: '\u0640\u0646\u0640', final: '\u0640\u0646', dots: 1, color: '#F59E0B', group: 'Group 7', sun: true, imageWord: { ar: "نَار", en: "fire", emoji: "🔥" } },
  { id: '\u0647', name: 'Haa', latinName: 'Haa', translit: 'h', isolated: '\u0647', initial: '\u0647\u0640', medial: '\u0640\u0647\u0640', final: '\u0640\u0647', dots: 0, color: '#EF4444', group: 'Group 8', sun: false, imageWord: { ar: "هِلَال", en: "crescent", emoji: "🌙" } },
  { id: '\u0648', name: 'Waw', latinName: 'Waw', translit: 'w', isolated: '\u0648', initial: '\u0648\u0640', medial: '\u0640\u0648\u0640', final: '\u0640\u0648', dots: 0, color: '#8B5CF6', group: 'Group 8', sun: false, imageWord: { ar: "وَرْد", en: "rose", emoji: "🌹" } },
  { id: '\u064A', name: 'Yaa', latinName: 'Yaa', translit: 'y', isolated: '\u064A', initial: '\u064A\u0640', medial: '\u0640\u064A\u0640', final: '\u0640\u064A', dots: 2, color: '#EC4899', group: 'Group 8', sun: false, imageWord: { ar: "يَد", en: "hand", emoji: "✋" } },
];

export function vowelForm(letter: string, v: VowelKey): string {
  const base = (letter === '\u0627' || letter === '\u0623') ? '\u0623' : letter;
  switch (v) {
    case 'fatha':     return base + '\u064E';
    case 'kasra':     return base + '\u0650';
    case 'dhamma':    return base + '\u064F';
    case 'long_alif': return base + '\u064E\u0627';
    case 'long_ya':   return base + '\u0650\u064A';
    case 'long_waw':  return base + '\u064F\u0648';
    default:          return base;
  }
}

export function vowelTranslit(l: Letter, v: VowelKey): string {
  const base = l.id === '\u0627' ? '\'' : l.translit.split('/')[0];
  switch (v) {
    case 'fatha':     return base + 'a';
    case 'kasra':     return base + 'i';
    case 'dhamma':    return base + 'u';
    case 'long_alif': return base + '\u0101';
    case 'long_ya':   return base + '\u012B';
    case 'long_waw':  return base + '\u016B';
    default:          return base;
  }
}
