import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { COGNATES } from "@/data/cognates";
import { VOCAB } from "@/data/vocab";

export type TypingTarget = {
  key: string;       // unique progress key, e.g. "c_sugar" or "v_door"
  source: "cognates" | "vocab";
  sourceId: string;  // original id in COGNATES or VOCAB
  ar: string;        // full form with harakat, for display only
  bare: string;      // no harakat — this is what the learner types
  en: string;
  emoji: string;
};

// Strips Arabic diacritics (harakat, sukun, shadda, tanwin) from a string.
const HARAKAT = /[\u064B-\u065F\u0610-\u061A\u06D6-\u06ED\u0670]/g;
function stripHarakat(s: string): string {
  return s.replace(HARAKAT, "");
}

// Maps a literal character to the base letter whose mastery is
// required to unlock it. Deliberate pedagogical simplification:
// hamza-bearing alif forms (أ إ) count as alif; taa marbuta (ة)
// counts as haa, since it is visually a haa with two dots and
// Letters does not teach these as separate characters.
function requiredLetterFor(ch: string): string {
  if (ch === "أ" || ch === "إ") return "ا";
  if (ch === "ة") return "ه";
  return ch;
}

function buildAllTargets(): TypingTarget[] {
  const out: TypingTarget[] = [];
  for (const c of COGNATES) {
    const bare = stripHarakat(c.ar);
    if (bare.includes(" ")) continue; // skip multi-word phrases — no spacebar in this module
    out.push({ key: `c_${c.id}`, source: "cognates", sourceId: c.id, ar: c.ar, bare, en: c.en, emoji: c.emoji });
  }
  for (const v of VOCAB) {
    if (v.bare.includes(" ")) continue;
    out.push({ key: `v_${v.id}`, source: "vocab", sourceId: v.id, ar: v.ar, bare: v.bare, en: v.en, emoji: v.emoji });
  }
  return out;
}

const ALL_TARGETS = buildAllTargets();

/**
 * Returns the eligible typing pool for the current user:
 * - the word's meaning must already be learned in its source module
 * - every unique letter in the word (after normalization) must be
 *   a mastered letter in Letters
 * Sorted shortest-first, so short common words unlock and appear first.
 */
export function useTypingPool() {
  const { isLearned } = useApp();

  const eligible = useMemo(() => {
    return ALL_TARGETS.filter((t) => {
      if (!isLearned(t.source, t.sourceId)) return false;
      const letters = new Set(t.bare.split("").map(requiredLetterFor));
      for (const l of letters) {
        if (!isLearned("letters", l)) return false;
      }
      return true;
    }).sort((a, b) => a.bare.length - b.bare.length);
  }, [isLearned]);

  return { eligible, totalPossible: ALL_TARGETS.length };
}
