/**
 * Audio layer.
 * Every item has a canonical file path (e.g. /audio/cognates/sugar.mp3).
 * If the recorded file is not yet uploaded to storage, we gracefully fall back
 * to the browser's Arabic speech synthesis voice so the app is always usable.
 */

import {
  toMono16k,
  trimSilence,
  mfccFrames,
  cepstralVarianceNormalize,
  recordingQuality,
  type RecordingQuality,
} from "@/lib/mfcc";
import { dtwProfile, type DtwProfile } from "@/lib/dtw";

const missing = new Set<string>();

export function audioPath(folder: string, key: string) {
  const BASE = import.meta.env.VITE_AUDIO_CDN || '';
  return `${BASE}/audio/${folder}/${encodeURIComponent(key)}.mp3`;
}

let currentEl: HTMLAudioElement | null = null;

export function stopAll() {
  if (currentEl) { currentEl.pause(); currentEl = null; }
  try { window.speechSynthesis.cancel(); } catch { /* noop */ }
}

function speak(text: string, rate = 1) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ar-SA";
    u.rate = rate * 0.9;
    const voices = window.speechSynthesis.getVoices();
    const ar = voices.find((v) => v.lang?.toLowerCase().startsWith("ar"));
    if (ar) u.voice = ar;
    window.speechSynthesis.speak(u);
    return u;
  } catch {
    return null;
  }
}

export async function play(src: string, fallbackText: string, rate = 1): Promise<void> {
  stopAll();
  if (missing.has(src)) { speak(fallbackText, rate); return; }
  return new Promise((resolve) => {
    const el = new Audio(src);
    el.playbackRate = rate;
    currentEl = el;
    el.onended = () => resolve();
    el.onerror = () => { missing.add(src); speak(fallbackText, rate); resolve(); };
    el.play().catch(() => { missing.add(src); speak(fallbackText, rate); resolve(); });
  });
}

/* ---------- pronunciation ---------- */

export function normalizeArabic(s: string) {
  return s
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\u0621-\u064A\s]/g, "")
    .trim();
}

function levenshtein(a: string, b: string) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

export function similarity(a: string, b: string) {
  const x = normalizeArabic(a), y = normalizeArabic(b);
  if (!x || !y) return 0;
  const dist = levenshtein(x, y);
  return Math.max(0, Math.round((1 - dist / Math.max(x.length, y.length)) * 100));
}

/**
 * Scoring for a single letter/syllable (e.g. بَ, بَا) as used by the letters
 * module. Arabic speech recognition cannot be relied upon to return an isolated
 * letter, so we reward a transcript that contains the target skeleton instead of
 * demanding an exact string match. This keeps the score tied to what was said
 * rather than collapsing to zero for every attempt.
 */
export function syllableSimilarity(target: string, transcript: string) {
  const t = normalizeArabic(target);
  const h = normalizeArabic(transcript);
  if (!t || !h) return 0;
  if (h === t) return 100;
  if (h.includes(t)) return 90;
  if (t.includes(h)) return 75;
  return similarity(target, transcript);
}

function isSingleShortWord(s: string) {
  return !s.includes(" ") && s.length > 0 && s.length <= 6;
}

/**
 * Stricter score for a short single word (e.g. سُكَّر, زَرَافَة). Recognition is
 * a reliable identity oracle, so when it reports a different consonant
 * (zarāfa heard as قرافه) that is a wrong word, not a near-miss. A single
 * substitution lands below the 70 pass mark; heavier diffs fall further. This
 * is intentionally steeper than the base similarity for short words only —
 * multi-word phrases keep the lenient partial-credit path in transcribeScore.
 */
function strictShortWordScore(t: string, h: string, baseSim: number) {
  if (t === h) return 100;
  const dist = levenshtein(t, h);
  // One wrong consonant in a short word: close, but it fails.
  if (dist === 1) return 62;
  const maxLen = Math.max(t.length, h.length);
  const strict = Math.max(0, Math.round((1 - dist / (maxLen * 0.5)) * 100));
  return Math.min(baseSim, strict);
}

/** Recognizer habitually confuses a word's final weak letter (ه/ى/ي ↔ ا). */
function foldFinalWeak(s: string) {
  if (!s) return s;
  return s.slice(0, -1) + s.slice(-1).replace(/[هيى]/g, "ا");
}

function wordsEqual(a: string, b: string) {
  return a === b || foldFinalWeak(a) === foldFinalWeak(b);
}

/**
 * Per-word strictness for multi-word phrases: an exact word passes, but any
 * consonant error fails that word. This keeps a mispronounced word worth the
 * same in a long name as in a short one.
 */
function strictWordScore(t: string, h: string) {
  if (wordsEqual(t, h)) return 100;
  const dist = levenshtein(t, h);
  if (dist === 1) return 62;
  const maxLen = Math.max(t.length, h.length);
  return Math.max(0, Math.round((1 - dist / (maxLen * 0.5)) * 100));
}

export function transcribeScore(target: string, transcript: string) {
  const t = normalizeArabic(target);
  const h = normalizeArabic(transcript);
  if (!t || !h) return 0;
  if (t.length <= 2) return syllableSimilarity(target, transcript);
  const sim = similarity(target, transcript);
  // Longer targets (words/phrases): recognition often catches only part of a
  // multi-word phrase. Reward a transcript that appears inside the target,
  // scaled by how much of the target it covers, so hearing "البحر" for
  // "أمير البحر" is a fair partial rather than a bare 50.
  if (h.length >= 3 && t.includes(h)) {
    const coverage = Math.min(1, h.length / t.length);
    return Math.max(sim, Math.round(60 + 40 * coverage));
  }
  // Short single word: a wrong consonant must fail, not pass as "very good".
  if (isSingleShortWord(t) && isSingleShortWord(h)) {
    return strictShortWordScore(t, h, sim);
  }
  // Multi-word phrase: score word-by-word so a mispronounced word counts the
  // same in a long name as in a short one. Only when both sides segment into
  // the same number of words — otherwise the recognizer may have merged/split
  // words, and failing that would be a false negative, so use whole-string
  // similarity.
  const tWords = t.split(/\s+/).filter(Boolean);
  const hWords = h.split(/\s+/).filter(Boolean);
  if (tWords.length > 1 && tWords.length === hWords.length) {
    const total = tWords.reduce((acc, tw, i) => acc + strictWordScore(tw, hWords[i]), 0);
    return Math.round(total / tWords.length);
  }
  return sim;
}

type RecogResult = {
  transcript: string;
  score: number;
  error?: string;
  /** Every alternative the recognizer returned, scored — for diagnostics only. */
  alternatives?: { transcript: string; score: number }[];
};

const RECOG_ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone access was blocked. Allow microphone access and try again.",
  "service-not-allowed": "Speech recognition is blocked by the browser or network. Please use Chrome on desktop or Android.",
  "audio-capture": "No microphone was found. Connect a microphone and try again.",
  "network": "Speech recognition could not reach the recognition service. Check your connection and try again.",
  "language-not-supported": "Arabic (ar-SA) is not available for speech recognition in this browser.",
};

export const SPEECH_UNSUPPORTED_MESSAGE =
  "Speech recognition is not available in this browser. Please use Chrome on desktop or Android for the best experience.";

export function speechSupported() {
  return typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

/**
 * The single in-flight recognition session, if any. Web Speech is effectively a
 * shared browser resource: leaving a previous session alive (an earlier attempt,
 * or another player mounted on the same page) lets a stale result cross into the
 * next attempt — two different words can even come back with the same transcript.
 */
let activeRecognition: { abort: () => void } | null = null;

export function listen(target: string, ms = 4000): Promise<RecogResult> {
  return new Promise((resolve) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      // Be transparent rather than inventing a score the learner can't trust.
      resolve({ transcript: "", score: 0, error: SPEECH_UNSUPPORTED_MESSAGE });
      return;
    }
    // Abort any earlier session so only one is ever listening.
    if (activeRecognition) { try { activeRecognition.abort(); } catch { /* noop */ } }
    const r = new SR();
    activeRecognition = r;
    r.lang = "ar-SA";
    r.interimResults = false;
    r.maxAlternatives = 3;
    r.continuous = false;
    let done = false;
    let sawResult = false;
    const finish = (t: string, error?: string, alternatives?: { transcript: string; score: number }[]) => {
      if (done) return;
      done = true;
      if (activeRecognition === r) activeRecognition = null;
      try { r.stop(); } catch { /* noop */ }
      if (error) { resolve({ transcript: "", score: 0, error }); return; }
      resolve({ transcript: t, score: t ? transcribeScore(target, t) : 0, alternatives });
    };
    r.onresult = (e: any) => {
      sawResult = true;
      let best = "";
      let bestScore = -1;
      const alternatives: { transcript: string; score: number }[] = [];
      for (let i = 0; i < e.results[0].length; i++) {
        const alt = e.results[0][i].transcript as string;
        const s = transcribeScore(target, alt);
        alternatives.push({ transcript: alt, score: s });
        if (s > bestScore) { bestScore = s; best = alt; }
      }
      alternatives.sort((a, b) => b.score - a.score);
      finish(best, undefined, alternatives);
    };
    // Only genuine silence ("no-speech"/"aborted") is treated as an empty
    // result. Every other failure (blocked mic, no device, network, unsupported
    // language) is surfaced as an error so the UI never mislabels a broken
    // recognizer as "no speech detected".
    r.onerror = (e: any) => {
      const code: string = e?.error || "";
      if (code === "no-speech" || code === "aborted") { finish(""); return; }
      finish("", RECOG_ERROR_MESSAGES[code] || SPEECH_UNSUPPORTED_MESSAGE);
    };
    r.onend = () => { if (!sawResult) finish(""); };
    try { r.start(); } catch { finish("", SPEECH_UNSUPPORTED_MESSAGE); }
    setTimeout(() => finish(""), ms);
  });
}

/* ---------- native-speaker reference assessment ---------- */

let sharedCtx: AudioContext | null = null;

function audioCtx(): AudioContext {
  if (!sharedCtx) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    sharedCtx = new Ctx();
  }
  return sharedCtx;
}

const refCache = new Map<string, AudioBuffer>();

/** Fetch and decode a native-speaker model file. Cached per URL. */
export async function loadReference(src: string): Promise<AudioBuffer> {
  const cached = refCache.get(src);
  if (cached) return cached;
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Reference audio ${res.status}`);
  const bytes = await res.arrayBuffer();
  const decoded = await audioCtx().decodeAudioData(bytes);
  refCache.set(src, decoded);
  return decoded;
}

export async function decodeBlob(blob: Blob): Promise<AudioBuffer> {
  const bytes = await blob.arrayBuffer();
  return audioCtx().decodeAudioData(bytes);
}

export type AssessmentMethod = "reference" | "recognition" | "estimate";

/** Raw numbers behind a score — surfaced by the `?assess=debug` HUD. */
export type AssessmentMetrics = {
  dMean: number;
  dWorst: number;
  dEff: number;
  contrast: number | null;
  margin: number | null;
  targetZ: number | null;
  durationRatio: number;
  score: number;
  snrDb: number;
  clipping: number;
  /** Two-gate (letters) diagnostics. */
  qualityHeard?: string;
  qualityTarget?: string;
  userMs?: number;
  shortMs?: number;
  lengthOk?: boolean;
  consonantOk?: boolean;
};

export type Assessment = {
  score: number;
  method: AssessmentMethod;
  qualityOk: boolean;
  distance?: number;
  durationRatio?: number;
  snrDb?: number;
  qualityLabel?: string;
  metrics?: AssessmentMetrics;
};

// --- scoring calibration ---------------------------------------------------
// Frames are mean/variance normalized and compared with a scale-free cosine
// distance (0 = identical spectral direction). Rather than chase an absolute
// threshold — which depends on the speaker, mic and codec, and produced false
// negatives on short isolated items — the score is driven by how the target
// model compares to its confusable references (e.g. the same letter with other
// vowels). A correct attempt is *closest* to its own model; how far it beats
// the spread of the whole candidate set is the target's z-score, which is
// self-calibrating and needs no per-browser tuning.
const Z_BIAS = -0.8; // z that maps to 50; negative so an average target still passes
const Z_SLOPE = 0.8; // larger = gentler

// Absolute logistic, used only when there are no contrasts to compare against.
const SCORE_MID = 0.42; // effective distance that maps to ~50
const SCORE_SLOPE = 0.11; // gentler than before

// Worst-frame influence: keep a *little* emphasis on the weakest part of the
// alignment without letting a single noisy frame dominate a short clip.
const WORST_WEIGHT = 0.35;
const WORST_PERCENTILE = 0.8;

/** Percentile of a distance profile (0..1). */
function percentile(values: Float32Array, p: number): number {
  if (!values.length) return 0;
  const arr = Array.from(values).sort((a, b) => a - b);
  const idx = Math.min(arr.length - 1, Math.max(0, Math.round((arr.length - 1) * p)));
  return arr[idx];
}

/** Mean / worst-frame / effective distance from an alignment profile. */
function effectiveDistance(profile: DtwProfile): { dMean: number; dWorst: number; dEff: number } {
  const dMean = profile.distance;
  if (!isFinite(dMean)) return { dMean: Infinity, dWorst: Infinity, dEff: Infinity };
  const worst = Math.max(dMean, percentile(profile.frameDistances, WORST_PERCENTILE));
  return { dMean, dWorst: worst, dEff: (1 - WORST_WEIGHT) * dMean + WORST_WEIGHT * worst };
}

/** How much to trust the score given capture cleanliness (1.0 = pristine). */
function qualityFactor(q: RecordingQuality): number {
  const snr = Math.max(0, Math.min(1, (q.snrDb - 8) / 12));
  const clip = Math.max(0, Math.min(1, 1 - q.clipping * 20));
  return 0.9 + 0.1 * snr * clip;
}

function recordingQualityLabel(q: RecordingQuality): string {
  if (q.clipping > 0.02) return "Too loud — clipping; lower the input level";
  if (q.snrDb < 12) return "Noisy recording — a quieter spot helps";
  if (q.level < 0.015) return "Very quiet — move closer to the mic";
  return "Clear recording";
}

/**
 * Score at or above which a graded speaking item counts as passed. Kept as a
 * single source of truth so the feedback bands and every gate stay in sync.
 */
export const PASS_SCORE = 70;

export type ScoreBand = "excellent" | "very-good" | "good" | "close" | "retry";

export function scoreBand(score: number): ScoreBand {
  if (score >= 90) return "excellent";
  if (score >= 80) return "very-good";
  if (score >= PASS_SCORE) return "good";
  if (score >= 50) return "close";
  return "retry";
}

const BAND_MESSAGES: Record<ScoreBand, string> = {
  excellent: "Excellent pronunciation ✓",
  "very-good": "Very good ✓",
  good: "Good ✓",
  close: "Close — try again",
  retry: "Try again",
};

export function bandMessage(score: number): string {
  return BAND_MESSAGES[scoreBand(score)];
}

/** Calibration HUD is available in any build via `?assess=debug`. */
export function assessDebugEnabled(): boolean {
  try {
    return typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("assess") === "debug";
  } catch {
    return false;
  }
}

/** Whether a capture is clean enough to score, or should prompt a re-record. */
function qualityAcceptable(q: RecordingQuality): boolean {
  // Level is judged *relative to the recording's own noise floor* via SNR, so a
  // quiet-but-clean mic is not rejected as "too quiet". Only genuine silence
  // (near-zero SNR / voiced length) fails.
  return q.clipping <= 0.06 && q.snrDb >= 5 && q.voicedMs >= 120;
}

/**
 * Compare a learner's recording to the native-speaker model and return a
 * 0-100 similarity score. Runs entirely in the browser (MFCC + DTW).
 *
 * `contrastSrcs` are optional reference files from the same folder that the
 * learner might plausibly have said instead (e.g. the same letter with another
 * vowel). The target must be the *closest* match, which is what lets a single
 * wrong letter fail rather than being averaged away.
 *
 * When either clip is too short to align, the result is reported as method
 * "estimate" with `qualityOk: false`. That is an explicit *unscored* signal:
 * callers must not turn it into a pass — loudness alone is not pronunciation.
 */
export async function assessAgainstReference(
  refSrc: string,
  userBlob: Blob,
  contrastSrcs: string[] = [],
): Promise<Assessment> {
  const [ref, user] = await Promise.all([loadReference(refSrc), decodeBlob(userBlob)]);
  const rawUser = toMono16k(user);
  const refPcm = trimSilence(toMono16k(ref));
  const userPcm = trimSilence(rawUser);
  const quality = recordingQuality(rawUser);
  const qualityOk = qualityAcceptable(quality);
  const qualityLabel = recordingQualityLabel(quality);

  if (refPcm.length < 1600 || userPcm.length < 1600) {
    // Too short to compare phonetically — never fabricate a score from level.
    return { score: 0, method: "estimate", qualityOk: false, snrDb: quality.snrDb, qualityLabel };
  }

  const refFrames = cepstralVarianceNormalize(mfccFrames(refPcm));
  const userFrames = cepstralVarianceNormalize(mfccFrames(userPcm));
  const { dMean, dWorst, dEff } = effectiveDistance(dtwProfile(refFrames, userFrames, 0.25, "cosine"));

  // Confusable references (e.g. the same letter with another vowel). Collect
  // every contrast distance and score *relatively*: the target must sit closest
  // to its own model, and by how much it beats the spread of the candidate set
  // determines the score. This is self-calibrating and directly encodes
  // "sounds like the right item".
  const contrastDists: number[] = [];
  let contrast: number | null = null;
  for (const cs of contrastSrcs) {
    try {
      const cRef = await loadReference(cs);
      const cPcm = trimSilence(toMono16k(cRef));
      if (cPcm.length < 1600) continue;
      const cFrames = cepstralVarianceNormalize(mfccFrames(cPcm));
      const ce = effectiveDistance(dtwProfile(cFrames, userFrames, 0.25, "cosine")).dEff;
      if (isFinite(ce)) {
        contrastDists.push(ce);
        if (contrast === null || ce < contrast) contrast = ce;
      }
    } catch { /* missing/unreadable contrast file — skip it */ }
  }
  const margin = contrast === null ? null : contrast - dEff;

  // Relative score from the target's z-position among the candidates.
  let targetZ: number | null = null;
  let score: number;
  if (contrastDists.length) {
    const cands = [dEff, ...contrastDists];
    const mean = cands.reduce((a, b) => a + b, 0) / cands.length;
    const variance = cands.reduce((a, b) => a + (b - mean) ** 2, 0) / cands.length;
    const std = Math.max(Math.sqrt(variance), 0.02);
    targetZ = (mean - dEff) / std;
    score = 100 / (1 + Math.exp((Z_BIAS - targetZ) / Z_SLOPE));
  } else {
    // No contrasts available — fall back to the gentle absolute logistic.
    score = 100 / (1 + Math.exp((dEff - SCORE_MID) / SCORE_SLOPE));
  }

  const durationRatio =
    Math.min(refPcm.length, userPcm.length) / Math.max(refPcm.length, userPcm.length);
  const qf = qualityFactor(quality);
  // Only penalise a genuinely mismatched length; a little slack is normal.
  const dur = durationRatio >= 0.5 ? 1 : 0.6 + 0.8 * durationRatio;
  // Soft guard: a correct match should never be far from its own model, so only
  // damp the score when the target distance is implausibly large (garbage, or a
  // different sound that happens not to be in the contrast set).
  const guard = dEff <= 0.55 ? 1 : Math.max(0.4, 1 - (dEff - 0.55) * 2);
  score = Math.max(0, Math.min(100, Math.round(score * guard * dur * qf)));

  const metrics: AssessmentMetrics = {
    dMean, dWorst, dEff, contrast, margin, targetZ, durationRatio, score,
    snrDb: quality.snrDb, clipping: quality.clipping,
  };

  // Calibration aid: run with `?assess=debug` (any build) to read the raw
  // numbers and tune Z_BIAS / Z_SLOPE / WORST_WEIGHT.
  if (import.meta.env.DEV || assessDebugEnabled()) {
    console.debug(
      `[assess] ref=${Math.round(refPcm.length / 16)}ms user=${Math.round(userPcm.length / 16)}ms ` +
      `dMean=${dMean.toFixed(3)} dWorst=${dWorst.toFixed(3)} dEff=${dEff.toFixed(3)} ` +
      `contrast=${contrast === null ? "—" : contrast.toFixed(3)} margin=${margin === null ? "—" : margin.toFixed(3)} ` +
      `z=${targetZ === null ? "—" : targetZ.toFixed(2)} ` +
      `ratio=${durationRatio.toFixed(2)} snr=${quality.snrDb.toFixed(1)}dB ` +
      `clip=${(quality.clipping * 100).toFixed(1)}% qf=${qf.toFixed(2)} score=${score}`,
    );
  }

  return {
    score,
    method: "reference",
    qualityOk,
    distance: dEff,
    durationRatio,
    snrDb: quality.snrDb,
    qualityLabel,
    metrics,
  };
}

/* ---------- letters: explicit two-gate scoring ---------- */

// Short/long vowel forms are phonemic: a wrong vowel (quality *or* length) and a
// wrong consonant must both fail. The acoustic model is duration-blind (DTW
// warps it away, and mean/variance normalisation flattens an isolated vowel), so
// instead of one blended distance we make two explicit decisions:
//   1) vowel gate  — quality (a/i/u) via the steady-vowel spectrum, and length
//      (short/long) via duration relative to the letter's own short form;
//   2) consonant gate — the onset must sit closest to the target consonant.
// Only when both agree with the target do we let the attempt pass.

type LetterVowel = "fatha" | "kasra" | "dhamma" | "long_alif" | "long_ya" | "long_waw";
type VowelQuality = "a" | "i" | "u";

const LETTER_VOWELS: Record<LetterVowel, { quality: VowelQuality; length: "short" | "long"; shortOf: LetterVowel }> = {
  fatha: { quality: "a", length: "short", shortOf: "fatha" },
  kasra: { quality: "i", length: "short", shortOf: "kasra" },
  dhamma: { quality: "u", length: "short", shortOf: "dhamma" },
  long_alif: { quality: "a", length: "long", shortOf: "fatha" },
  long_ya: { quality: "i", length: "long", shortOf: "kasra" },
  long_waw: { quality: "u", length: "long", shortOf: "dhamma" },
};

/** A long vowel passes once it is this much longer than the letter's short form. */
const LETTER_LEN_K = 1.5;
/** Required margin before another consonant counts as a better match. */
const LETTER_CONSONANT_MARGIN = 0.01;
// Gate outcomes map onto the shared bands: pass comfortably clears PASS_SCORE,
// a wrong vowel/consonant lands in the "close — try again" band.
const LETTER_PASS_FLOOR = 82;
const LETTER_FAIL_CAP = 62;

function parseLetterKey(key: string): { glyph: string; vowel: LetterVowel } | null {
  const i = key.lastIndexOf("_");
  if (i <= 0) return null;
  const glyph = key.slice(0, i);
  const vowel = key.slice(i + 1) as LetterVowel;
  if (!(vowel in LETTER_VOWELS)) return null;
  return { glyph, vowel };
}

type LetterFeat = {
  glyph: string;
  vowel: LetterVowel;
  quality: VowelQuality;
  length: "short" | "long";
  /** L2-normalised mean of C1..C12 over the steady vowel (spectral shape). */
  color: Float32Array;
  /** Voiced duration of the trimmed syllable, in ms. */
  durMs: number;
  /** Variance-normalised frames, for the onset/consonant DTW comparison. */
  frames: Float32Array[];
};

function letterFeature(pcm: Float32Array, glyph: string, vowel: LetterVowel): LetterFeat | null {
  if (pcm.length < 1600) return null;
  const raw = mfccFrames(pcm);
  if (!raw.length) return null;
  const frames = cepstralVarianceNormalize(raw);
  // Steady vowel: the middle of the syllable, where the vowel colour dominates.
  const dim = 12;
  const from = Math.floor(raw.length * 0.2);
  const to = Math.max(from + 1, Math.ceil(raw.length * 0.8));
  const color = new Float32Array(dim);
  let n = 0;
  for (let f = from; f < to && f < raw.length; f++) {
    for (let d = 0; d < dim; d++) color[d] += raw[f][d + 1]; // skip C0 (level/channel)
    n++;
  }
  if (n) for (let d = 0; d < dim; d++) color[d] /= n;
  let norm = 0;
  for (let d = 0; d < dim; d++) norm += color[d] * color[d];
  norm = Math.sqrt(norm) || 1;
  for (let d = 0; d < dim; d++) color[d] /= norm;
  const info = LETTER_VOWELS[vowel];
  return { glyph, vowel, quality: info.quality, length: info.length, color, durMs: pcm.length / 16, frames };
}

function colorDistance(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let d = 0; d < a.length; d++) dot += a[d] * b[d];
  return 1 - Math.max(-1, Math.min(1, dot));
}

/**
 * Score a letter/vowel form with explicit vowel (quality + length) and consonant
 * gates. `refs` are the same-letter vowel forms and same-vowel confusable
 * consonants (see `letterScoringKeys`).
 */
export async function assessLetter(
  refSrc: string,
  targetKey: string,
  userBlob: Blob,
  refs: { key: string; src: string }[],
): Promise<Assessment> {
  const parsed = parseLetterKey(targetKey);
  const [ref, user] = await Promise.all([loadReference(refSrc), decodeBlob(userBlob)]);
  const rawUser = toMono16k(user);
  const quality = recordingQuality(rawUser);
  const qualityOk = qualityAcceptable(quality);
  const qualityLabel = recordingQualityLabel(quality);

  if (!parsed) {
    return { score: 0, method: "estimate", qualityOk: false, snrDb: quality.snrDb, qualityLabel };
  }
  const target = letterFeature(trimSilence(toMono16k(ref)), parsed.glyph, parsed.vowel);
  const userFeat = letterFeature(trimSilence(rawUser), parsed.glyph, parsed.vowel);
  if (!target || !userFeat) {
    return { score: 0, method: "estimate", qualityOk: false, snrDb: quality.snrDb, qualityLabel };
  }

  const refFeats: LetterFeat[] = [];
  for (const r of refs) {
    const p = parseLetterKey(r.key);
    if (!p) continue;
    try {
      const buf = await loadReference(r.src);
      const f = letterFeature(trimSilence(toMono16k(buf)), p.glyph, p.vowel);
      if (f) refFeats.push(f);
    } catch { /* missing reference — skip */ }
  }

  const eff = (f: LetterFeat) => effectiveDistance(dtwProfile(f.frames, userFeat.frames, 0.25, "cosine")).dEff;
  const targetEff = eff(target);

  // Base score: the target's z-position among the candidate distances (kept for
  // gradation between "good" and "excellent"; the gates decide pass/fail).
  const contrastEffs: number[] = [];
  for (const f of refFeats) {
    const de = eff(f);
    if (isFinite(de)) contrastEffs.push(de);
  }
  let base: number;
  if (contrastEffs.length && isFinite(targetEff)) {
    const cands = [targetEff, ...contrastEffs];
    const mean = cands.reduce((a, b) => a + b, 0) / cands.length;
    const std = Math.max(Math.sqrt(cands.reduce((a, b) => a + (b - mean) ** 2, 0) / cands.length), 0.02);
    const z = (mean - targetEff) / std;
    base = 100 / (1 + Math.exp((Z_BIAS - z) / Z_SLOPE));
  } else {
    base = isFinite(targetEff) ? 100 / (1 + Math.exp((targetEff - SCORE_MID) / SCORE_SLOPE)) : 0;
  }

  // Gate 1a — vowel quality: the user's vowel colour must sit closest to the
  // target quality among the same letter's other vowel forms.
  let qualityHeard: VowelQuality = target.quality;
  let bestColor = Infinity;
  for (const f of [target, ...refFeats.filter((f) => f.glyph === target.glyph)]) {
    const cd = colorDistance(f.color, userFeat.color);
    if (cd < bestColor) { bestColor = cd; qualityHeard = f.quality; }
  }
  const qualityMatch = qualityHeard === target.quality;

  // Gate 1b — vowel length: a long vowel must be clearly longer than the short
  // form of the same quality; a short vowel must not drift into long territory.
  const shortForm = target.length === "short"
    ? target
    : refFeats.find((f) => f.glyph === target.glyph && f.vowel === LETTER_VOWELS[target.vowel].shortOf);
  const shortMs = shortForm?.durMs ?? target.durMs;
  const lengthThreshold = shortMs * LETTER_LEN_K;
  const lengthOk = target.length === "long" ? userFeat.durMs >= lengthThreshold : userFeat.durMs < lengthThreshold;

  // Gate 2 — consonant: the onset must match the target consonant better than any
  // confusable consonant carrying the same vowel.
  let consonantOk = true;
  for (const f of refFeats) {
    if (f.vowel !== target.vowel || f.glyph === target.glyph) continue;
    const de = eff(f);
    if (isFinite(de) && de < targetEff - LETTER_CONSONANT_MARGIN) { consonantOk = false; break; }
  }

  const gatesPass = qualityMatch && lengthOk && consonantOk;
  const qf = qualityFactor(quality);
  let score = gatesPass ? Math.max(base, LETTER_PASS_FLOOR) : Math.min(base, LETTER_FAIL_CAP);
  score = Math.max(0, Math.min(100, Math.round(score * qf)));

  const metrics: AssessmentMetrics = {
    dMean: targetEff, dWorst: targetEff, dEff: targetEff, contrast: contrastEffs.length ? Math.min(...contrastEffs) : null,
    margin: contrastEffs.length ? Math.min(...contrastEffs) - targetEff : null, targetZ: null,
    durationRatio: target.durMs ? userFeat.durMs / target.durMs : 0, score, snrDb: quality.snrDb, clipping: quality.clipping,
    qualityHeard, qualityTarget: target.quality, userMs: userFeat.durMs, shortMs, lengthOk, consonantOk,
  };

  if (import.meta.env.DEV || assessDebugEnabled()) {
    console.debug(
      `[letter] target=${targetKey} heardQuality=${qualityHeard} targetQuality=${target.quality} ` +
      `user=${Math.round(userFeat.durMs)}ms short=${Math.round(shortMs)}ms threshold=${Math.round(lengthThreshold)}ms ` +
      `lengthOk=${lengthOk} consonantOk=${consonantOk} qualityMatch=${qualityMatch} ` +
      `targetEff=${targetEff.toFixed(3)} base=${Math.round(base)} gates=${gatesPass} score=${score}`,
    );
  }

  return { score, method: "reference", qualityOk, distance: targetEff, durationRatio: metrics.durationRatio, snrDb: quality.snrDb, qualityLabel, metrics };
}

/* ---------- microphone capture ---------- */

export async function openMic(): Promise<MediaStream> {
  // Keep automatic gain control on so a quiet mic still produces a usable
  // level — the MFCC comparison cancels overall level via mean/variance
  // normalization anyway, so AGC does not distort the phonetic content. We do
  // disable noise suppression and echo cancellation, whose spectral sculpting
  // would fight the comparison.
  return navigator.mediaDevices.getUserMedia({
    audio: {
      autoGainControl: true,
      noiseSuppression: false,
      echoCancellation: false,
    },
  });
}

/** Level meter for the waveform UI. Does not open or close the mic stream. */
export function createAnalyzer(stream: MediaStream, onLevel: (v: number) => void) {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const src = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  src.connect(analyser);
  const data = new Uint8Array(analyser.frequencyBinCount);
  let raf = 0;
  const loop = () => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += (data[i] - 128) ** 2;
    onLevel(Math.min(1, Math.sqrt(sum / data.length) / 40));
    raf = requestAnimationFrame(loop);
  };
  loop();
  return {
    stop() {
      cancelAnimationFrame(raf);
      try { ctx.close(); } catch { /* noop */ }
    },
  };
}

/** Pick the best MediaRecorder mime type this browser supports. */
export function recorderMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4", "audio/mpeg"];
  return candidates.find((c) => {
    try { return MediaRecorder.isTypeSupported(c); } catch { return false; }
  });
}

/** Record from an open mic stream for `ms` ms; resolve with the captured blob. */
export function recordClip(stream: MediaStream, ms: number): { stop: () => void; done: Promise<Blob | null> } {
  if (typeof MediaRecorder === "undefined") return { stop: () => { /* noop */ }, done: Promise.resolve(null) };
  const mime = recorderMime();
  // A higher bitrate keeps more spectral detail through Opus, which matters for
  // the MFCC comparison (low bitrates smear high-frequency content).
  const opts: MediaRecorderOptions = { audioBitsPerSecond: 128000 };
  if (mime) opts.mimeType = mime;
  const recorder = new MediaRecorder(stream, opts);
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  const done = new Promise<Blob | null>((resolve) => {
    recorder.onstop = () => resolve(chunks.length ? new Blob(chunks, { type: mime || "audio/webm" }) : null);
  });
  recorder.start();
  const timer = setTimeout(() => { try { recorder.stop(); } catch { /* noop */ } }, ms);
  return {
    stop() {
      clearTimeout(timer);
      try { recorder.stop(); } catch { /* noop */ }
    },
    done,
  };
}
