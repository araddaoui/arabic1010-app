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

export function transcribeScore(target: string, transcript: string) {
  const t = normalizeArabic(target);
  return t.length <= 2 ? syllableSimilarity(target, transcript) : similarity(target, transcript);
}

type RecogResult = { transcript: string; score: number; error?: string };

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

export function listen(target: string, ms = 4000): Promise<RecogResult> {
  return new Promise((resolve) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      // Be transparent rather than inventing a score the learner can't trust.
      resolve({ transcript: "", score: 0, error: SPEECH_UNSUPPORTED_MESSAGE });
      return;
    }
    const r = new SR();
    r.lang = "ar-SA";
    r.interimResults = false;
    r.maxAlternatives = 3;
    r.continuous = false;
    let done = false;
    let sawResult = false;
    const finish = (t: string, error?: string) => {
      if (done) return;
      done = true;
      try { r.stop(); } catch { /* noop */ }
      if (error) { resolve({ transcript: "", score: 0, error }); return; }
      resolve({ transcript: t, score: t ? transcribeScore(target, t) : 0 });
    };
    r.onresult = (e: any) => {
      sawResult = true;
      let best = "";
      let bestScore = -1;
      for (let i = 0; i < e.results[0].length; i++) {
        const alt = e.results[0][i].transcript as string;
        const s = transcribeScore(target, alt);
        if (s > bestScore) { bestScore = s; best = alt; }
      }
      finish(best);
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
