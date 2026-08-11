export type KeyDef = { char: string; row: number; qwertyPos: string };

// Standard Arabic 101 keyboard layout, by physical row.
// qwertyPos is the equivalent Latin-keyboard key, shown as a small
// caption under each key so the layout is legible to English-typing
// beginners while they build Arabic muscle memory.
export const ARABIC_KEYBOARD_ROWS: KeyDef[][] = [
  [
    { char: "ذ", row: 1, qwertyPos: "`" },
    { char: "ض", row: 1, qwertyPos: "Q" },
    { char: "ص", row: 1, qwertyPos: "W" },
    { char: "ث", row: 1, qwertyPos: "E" },
    { char: "ق", row: 1, qwertyPos: "R" },
    { char: "ف", row: 1, qwertyPos: "T" },
    { char: "غ", row: 1, qwertyPos: "Y" },
    { char: "ع", row: 1, qwertyPos: "U" },
    { char: "ه", row: 1, qwertyPos: "I" },
    { char: "خ", row: 1, qwertyPos: "O" },
    { char: "ح", row: 1, qwertyPos: "P" },
    { char: "ج", row: 1, qwertyPos: "[" },
    { char: "د", row: 1, qwertyPos: "]" },
  ],
  [
    { char: "ش", row: 2, qwertyPos: "A" },
    { char: "س", row: 2, qwertyPos: "S" },
    { char: "ي", row: 2, qwertyPos: "D" },
    { char: "ب", row: 2, qwertyPos: "F" },
    { char: "ل", row: 2, qwertyPos: "G" },
    { char: "ا", row: 2, qwertyPos: "H" },
    { char: "ت", row: 2, qwertyPos: "J" },
    { char: "ن", row: 2, qwertyPos: "K" },
    { char: "م", row: 2, qwertyPos: "L" },
    { char: "ك", row: 2, qwertyPos: ";" },
    { char: "ط", row: 2, qwertyPos: "'" },
  ],
  [
    { char: "ئ", row: 3, qwertyPos: "Z" },
    { char: "ء", row: 3, qwertyPos: "X" },
    { char: "ؤ", row: 3, qwertyPos: "C" },
    { char: "ر", row: 3, qwertyPos: "V" },
    { char: "لا", row: 3, qwertyPos: "B" },
    { char: "ى", row: 3, qwertyPos: "N" },
    { char: "ة", row: 3, qwertyPos: "M" },
    { char: "و", row: 3, qwertyPos: "," },
    { char: "ز", row: 3, qwertyPos: "." },
    { char: "ظ", row: 3, qwertyPos: "/" },
  ],
];

// The characters this module ever asks a learner to type.
// 28 base letters + أ + إ + ة, which appear literally inside
// eligible word targets (see typingPool for why these three extra
// characters are needed on top of the 28 taught in Letters).
export const TYPING_ACTIVE_CHARS = new Set([
  "ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش",
  "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي",
  "أ", "إ", "ة",
]);
