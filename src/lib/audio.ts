/**
 * Audio layer.
 * Every item has a canonical file path (e.g. /audio/cognates/sugar.mp3).
 * If the recorded file is not yet uploaded to storage, we gracefully fall back
 * to the browser's Arabic speech synthesis voice so the app is always usable.
 */

import { toMono16k, trimSilence, mfccFrames, cepstralMeanNormalize, rmsLevel } from "@/lib/mfcc";
import { dtwDistance } from "@/lib/dtw";

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

export type AssessmentMethod = "reference" | "estimate";
export type Assessment = { score: number; method: AssessmentMethod };

// Calibrated against the native-speaker reference set: identical clips score 0,
// distinct words/numbers/countries land at ~5-10, and near-homophones (e.g.
// short-vowel letter forms) at ~2.5. exp(-dist/10) spreads those into 0-100.
const DTW_SCALE = 10;

function scoreFromDistance(dist: number, durationRatio: number): number {
  if (!isFinite(dist)) return 0;
  const base = 100 * Math.exp(-dist / DTW_SCALE);
  const dur = 0.6 + 0.4 * durationRatio;
  return Math.max(0, Math.min(100, Math.round(base * dur)));
}

function estimateFromAudio(samples: Float32Array): number {
  const level = Math.min(1, rmsLevel(samples) / 0.12);
  return Math.round(35 + level * 55);
}

/**
 * Compare a learner's recording to the native-speaker model and return a
 * 0-100 similarity score. Runs entirely in the browser (MFCC + DTW); if the
 * clips are too short to compare, falls back to an energy estimate.
 */
export async function assessAgainstReference(refSrc: string, userBlob: Blob): Promise<Assessment> {
  const [ref, user] = await Promise.all([loadReference(refSrc), decodeBlob(userBlob)]);
  const refPcm = trimSilence(toMono16k(ref));
  const userPcm = trimSilence(toMono16k(user));
  if (refPcm.length < 1600 || userPcm.length < 1600) {
    return { score: estimateFromAudio(userPcm), method: "estimate" };
  }
  const refFrames = cepstralMeanNormalize(mfccFrames(refPcm));
  const userFrames = cepstralMeanNormalize(mfccFrames(userPcm));
  const dist = dtwDistance(refFrames, userFrames);
  const durationRatio = Math.min(refPcm.length, userPcm.length) / Math.max(refPcm.length, userPcm.length);
  return { score: scoreFromDistance(dist, durationRatio), method: "reference" };
}

/* ---------- microphone capture ---------- */

export async function openMic(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ audio: true });
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
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  return candidates.find((c) => {
    try { return MediaRecorder.isTypeSupported(c); } catch { return false; }
  });
}

/** Record from an open mic stream for `ms` ms; resolve with the captured blob. */
export function recordClip(stream: MediaStream, ms: number): { stop: () => void; done: Promise<Blob | null> } {
  if (typeof MediaRecorder === "undefined") return { stop: () => { /* noop */ }, done: Promise.resolve(null) };
  const mime = recorderMime();
  const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
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
