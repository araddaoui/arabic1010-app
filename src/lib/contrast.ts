/**
 * Discriminative contrast sets for pronunciation scoring.
 *
 * Comparing a learner's take only against the target reference rewards a
 * "close enough" attempt even when it actually sounds like a *different* item.
 * By also scoring it against a small set of plausibly confusable references we
 * can require the target to be the *closest* match, which is what lets a single
 * wrong letter (or wrong word) fail instead of sneaking through on average.
 */

import { LETTERS, VOWELS, type VowelKey } from "@/data/letters";
import { NUMBERS } from "@/data/numbers";
import { VOCAB } from "@/data/vocab";
import { COGNATES } from "@/data/cognates";
import { DIALOGUES } from "@/data/dialogue";
import { countries } from "@/lib/data/countries";

/**
 * Letters that are easily confused because they differ only by dots, or share
 * a place of articulation. Keys are the base Arabic letter (LETTERS[].id).
 */
const CONFUSABLE: Record<string, string[]> = {
  "\u0627": ["\u0623", "\u0625", "\u0622"], // alif / hamza forms
  "\u0628": ["\u062A", "\u062B", "\u0646", "\u064A"], // b/t/th/n/y
  "\u062A": ["\u0628", "\u062B", "\u0646", "\u064A"],
  "\u062B": ["\u0628", "\u062A", "\u0646"],
  "\u0646": ["\u0628", "\u062A", "\u062B", "\u064A"],
  "\u064A": ["\u0628", "\u062A", "\u062B", "\u0646"],
  "\u062C": ["\u062D", "\u062E"],
  "\u062D": ["\u062C", "\u062E"],
  "\u062E": ["\u062C", "\u062D"],
  "\u062F": ["\u0630"],
  "\u0630": ["\u062F"],
  "\u0631": ["\u0632"],
  "\u0632": ["\u0631"],
  "\u0633": ["\u0634", "\u0635"],
  "\u0634": ["\u0633"],
  "\u0635": ["\u0636", "\u0633"],
  "\u0636": ["\u0635"],
  "\u0637": ["\u0638", "\u062A"],
  "\u0638": ["\u0637"],
  "\u0639": ["\u063A"],
  "\u063A": ["\u0639"],
  "\u0641": ["\u0642"],
  "\u0642": ["\u0641"],
  "\u0643": ["\u0644"],
  "\u0644": ["\u0643"],
  "\u0647": ["\u062D"],
  "\u0648": ["\u064A"],
};

const LETTER_TOTAL_CAP = 6;
const PEER_CAP = 4;

function letterContrasts(key: string): string[] {
  const sep = key.indexOf("_");
  if (sep <= 0) return [];
  const glyph = key.slice(0, sep);
  const vowel = key.slice(sep + 1) as VowelKey;
  const out: string[] = [];

  // 1) The same letter with the other vowels — catches short/long and
  //    fatha/kasra/dhamma confusions.
  for (const v of VOWELS) {
    if (v.key !== vowel) out.push(`${glyph}_${v.key}`);
  }

  // 2) Phonetically close letters (same vowel) — catches consonant confusions.
  for (const near of CONFUSABLE[glyph] ?? []) {
    if (out.length >= LETTER_TOTAL_CAP) break;
    out.push(`${near}_${vowel}`);
  }

  return out.slice(0, LETTER_TOTAL_CAP);
}

function firstArabicLetter(ar: string): string {
  const cleaned = ar.replace(/[\u064B-\u0652\u0670\u0640\s]/g, "");
  return cleaned.charAt(0);
}

/**
 * Pick a few same-folder peers to contrast against. Peers that share the first
 * Arabic letter (for words) are preferred so that the difference between a
 * correct and a wrong take is concentrated in the parts that matter.
 */
function peerContrasts(key: string, items: { key: string; ar: string }[]): string[] {
  const target = items.find((it) => it.key === key);
  if (!target) return items.filter((it) => it.key !== key).slice(0, PEER_CAP).map((it) => it.key);
  const first = firstArabicLetter(target.ar);
  const same = items.filter((it) => it.key !== key && firstArabicLetter(it.ar) === first);
  const rest = items.filter((it) => it.key !== key && !same.includes(it));
  return [...same, ...rest].slice(0, PEER_CAP).map((it) => it.key);
}

/**
 * Return the reference keys (within the same audio folder) to use as contrasts
 * for a given target. Missing files are skipped by the caller.
 */
export function contrastKeys(folder: string, key: string): string[] {
  switch (folder) {
    case "letters":
      return letterContrasts(key);
    case "numbers":
      return peerContrasts(key, NUMBERS.map((n) => ({ key: String(n.n), ar: n.ar })));
    case "words":
    case "vocabulary":
      return peerContrasts(key, VOCAB.map((v) => ({ key: v.id, ar: v.ar })));
    case "cognates":
      return peerContrasts(key, COGNATES.map((c) => ({ key: c.id, ar: c.ar })));
    case "countries":
      return peerContrasts(key, countries.map((c) => ({ key: c.id, ar: c.nameArabic })));
    case "dialogue":
      return DIALOGUES.flatMap((d) => d.lines).map((l) => l.id).filter((id) => id !== key).slice(0, PEER_CAP);
    default:
      return [];
  }
}

/** Every contrast key that could exist, for cache warm-up if ever needed. */
export const ALL_LETTER_IDS = LETTERS.map((l) => l.id);
