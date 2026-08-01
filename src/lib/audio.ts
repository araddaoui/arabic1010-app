/**
 * Audio layer.
 * Every item has a canonical file path (e.g. /audio/cognates/sugar.mp3).
 * If the recorded file is not yet uploaded to storage, we gracefully fall back
 * to the browser's Arabic speech synthesis voice so the app is always usable.
 */

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

type RecogResult = { transcript: string; score: number; error?: string };

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
    let done = false;
    const finish = (t: string) => {
      if (done) return;
      done = true;
      try { r.stop(); } catch { /* noop */ }
      resolve({ transcript: t, score: t ? similarity(t, target) : 0 });
    };
    r.onresult = (e: any) => {
      let best = "";
      let bestScore = -1;
      for (let i = 0; i < e.results[0].length; i++) {
        const alt = e.results[0][i].transcript as string;
        const s = similarity(alt, target);
        if (s > bestScore) { bestScore = s; best = alt; }
      }
      finish(best);
    };
    r.onerror = () => finish("");
    r.onend = () => finish("");
    try { r.start(); } catch { finish(""); }
    setTimeout(() => finish(""), ms);
  });
}

/* ---------- microphone waveform ---------- */

export async function createRecorder(onLevel: (v: number) => void) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      stream.getTracks().forEach((t) => t.stop());
      ctx.close();
    },
  };
}
