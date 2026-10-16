import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";
import {
  audioPath,
  play,
  stopAll,
  listen,
  speechSupported,
  openMic,
  createAnalyzer,
  recordClip,
  loadReference,
  assessAgainstReference,
  assessLetter,
  assessDebugEnabled,
  normalizeArabic,
  PASS_SCORE,
  scoreBand,
  bandMessage,
  type ScoreBand,
  type AssessmentMetrics,
  type Assessment,
} from "@/lib/audio";
import { contrastKeys, letterScoringKeys } from "@/lib/contrast";
import { cn } from "@/utils/cn";

function hashBars(seed: string, n = 44) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return Array.from({ length: n }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0;
    const v = ((h >> 8) % 100) / 100;
    const env = Math.sin((Math.PI * (i + 1)) / (n + 1));
    return 0.18 + v * 0.82 * env;
  });
}

export function Waveform({ bars, color, active = -1, height = 44 }: { bars: number[]; color: string; active?: number; height?: number }) {
  return (
    <div className="flex items-center gap-[2px]" style={{ height }} dir="ltr">
      {bars.map((b, i) => (
        <div
          key={i}
          className="flex-1 rounded-full transition-all"
          style={{
            height: `${Math.max(6, b * height)}px`,
            background: active >= 0 && i > active ? "rgba(255,255,255,.14)" : color,
            opacity: active >= 0 && i > active ? 0.5 : 1,
          }}
        />
      ))}
    </div>
  );
}

const BAND_STYLE: Record<ScoreBand, { ring: string; label: string }> = {
  excellent: { ring: "#1D9E75", label: "text-ok" },
  "very-good": { ring: "#1D9E75", label: "text-ok" },
  good: { ring: "#1D9E75", label: "text-ok" },
  close: { ring: "#C9A227", label: "text-gold" },
  retry: { ring: "#B22222", label: "text-err" },
};

type Props = {
  folder: string;
  fileKey: string;
  text: string;
  label?: string;
  allowRecord?: boolean;
  compact?: boolean;
  /**
   * Which engine scores the learner. Words use speech recognition ("recognition")
   * — it understands what was said and is stable; letters use the acoustic
   * reference comparison ("acoustic") because recognition is vowel-blind. "auto"
   * picks by folder. Each mode captures the mic a single way; running both at
   * once made the recording unreliable.
   */
  strategy?: "auto" | "recognition" | "acoustic" | "hybrid";
  onScore?: (score: number) => void;
  onSkip?: () => void;
};

export default function AudioPlayer({ folder, fileKey, text, label, allowRecord = true, compact, strategy = "auto", onScore, onSkip }: Props) {
  const src = audioPath(folder, fileKey);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [recording, setRecording] = useState(false);
  const [listening, setListening] = useState(false);
  const [levels, setLevels] = useState<number[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [heard, setHeard] = useState<string>("");
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(null);
  const [quality, setQuality] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AssessmentMetrics | null>(null);
  const [recogInfo, setRecogInfo] = useState<{
    mode: string;
    target: string;
    targetNorm: string;
    transcript: string;
    score: number;
    error?: string;
    alternatives: { transcript: string; score: number }[];
  } | null>(null);
  const [progressIdx, setProgressIdx] = useState(-1);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const model = hashBars(fileKey + text);
  const band = score === null ? null : scoreBand(score);
  const bandStyle = band ? BAND_STYLE[band] : null;

  useEffect(() => () => { stopAll(); recRef.current?.stop(); }, []);
  useEffect(() => { setScore(null); setLevels([]); setHeard(""); setNotice(null); setQuality(null); setMetrics(null); setRecogInfo(null); setListening(false); }, [fileKey]);

  const doPlay = async (r = rate) => {
    setPlaying(true);
    setProgressIdx(0);
    const started = Date.now();
    const timer = setInterval(() => {
      const el = Math.min(model.length - 1, Math.floor((Date.now() - started) / (1400 / model.length / r)));
      setProgressIdx(el);
    }, 40);
    await play(src, text, r);
    setTimeout(() => { clearInterval(timer); setProgressIdx(-1); setPlaying(false); }, 400);
  };

  const stop = () => { stopAll(); setPlaying(false); setProgressIdx(-1); };

  const record = async () => {
    if (recording) return;
    setRecording(true); setLevels([]); setScore(null); setHeard(""); setNotice(null); setQuality(null); setMetrics(null);
    const captured: number[] = [];
    let stream: MediaStream | null = null;
    let analyzer: { stop: () => void } | null = null;
    let animTimer: number | null = null;
    let blob: Blob | null = null;
    let recogResult: Awaited<ReturnType<typeof listen>> | null = null;
    let targetMs = 4000;

    // One capture per mode, so SpeechRecognition and a mic stream never fight
    // over the microphone. "auto" resolves per folder: letters are acoustic-only;
    // words, dialogue and Cognates (which opts in explicitly) are recognition-only
    // — whole utterances understood as a phrase; everything else keeps the legacy
    // hybrid behaviour until it is migrated.
    const mode = strategy === "auto" ? (folder === "letters" ? "acoustic" : folder === "words" || folder === "dialogue" ? "recognition" : "hybrid") : strategy;

    try {
      // Size the capture window to the native-speaker model (no mic involved).
      try {
        const ref = await loadReference(src);
        targetMs = Math.min(6000, Math.max(2500, Math.round(ref.duration * 1000 * 1.6)));
      } catch { /* model unavailable — use the default window */ }

      if (mode === "recognition") {
        // Do NOT open our own mic: SpeechRecognition must be the sole consumer,
        // otherwise Chrome starves it and correct speech yields "no speech".
        // Animate the meter locally instead.
        setListening(true);
        const t0 = Date.now();
        animTimer = window.setInterval(() => {
          const t = (Date.now() - t0) / 1000;
          setLevels(
            Array.from({ length: 44 }, (_, i) => {
              const a = Math.sin(t * 6 + i * 0.5) * 0.5 + 0.5;
              const b = Math.sin(t * 11 + i * 0.9) * 0.5 + 0.5;
              return 0.15 + 0.85 * (0.5 * a + 0.5 * b);
            }),
          );
        }, 80);
        recogResult = await listen(text, targetMs);
      } else {
        stream = await openMic();
        analyzer = createAnalyzer(stream, (v) => {
          captured.push(v);
          setLevels(captured.slice(-44));
        });
        recRef.current = analyzer;

        if (mode === "acoustic") {
          const clip = recordClip(stream, targetMs);
          blob = await clip.done;
        } else {
          // Legacy hybrid: recognize and record the same utterance concurrently.
          const recogPromise = speechSupported() ? listen(text, targetMs) : null;
          const clip = recordClip(stream, targetMs);
          blob = await clip.done;
          recogResult = recogPromise ? await recogPromise : null;
        }
      }
    } catch {
      /* mic denied — handled below */
    } finally {
      if (animTimer !== null) clearInterval(animTimer);
      setListening(false);
      analyzer?.stop();
      recRef.current = null;
      stream?.getTracks().forEach((t) => t.stop());
    }
    setRecording(false);

    setRecogInfo(
      recogResult
        ? {
            mode,
            target: text,
            targetNorm: normalizeArabic(text),
            transcript: recogResult.transcript,
            score: recogResult.score,
            error: recogResult.error,
            alternatives: recogResult.alternatives ?? [],
          }
        : null,
    );

    const finalLevels = captured.length
      ? captured.filter((_, i) => i % Math.max(1, Math.floor(captured.length / 44)) === 0).slice(0, 44)
      : hashBars(text + "user");
    setLevels(finalLevels.length ? finalLevels : hashBars(text + "u"));

    // A denied mic in recognition mode surfaces through SpeechRecognition's own
    // error (shown below); only mic-opening modes can fail here with no stream.
    if (mode !== "recognition" && !stream) {
      setNotice({
        title: "Microphone access blocked",
        body: "Allow microphone access and try again.",
      });
      setScore(null);
      return;
    }

    // 1) Recognition understands *what* was said and is stable for whole words,
    //    so migrated word modules use it exclusively — no acoustic fallback,
    //    which was unreliable for full words and fought recognition for the mic.
    if ((mode === "recognition" || mode === "hybrid") && recogResult) {
      const res = recogResult;
      if (!res.error && res.transcript) {
        setHeard(res.transcript);
        setScore(res.score);
        onScore?.(res.score);
        return;
      }
      if (mode === "recognition") {
        setScore(null);
        setNotice({
          title: "Let's try that again",
          body: res.error || "We didn't catch that. Hold the device steady, speak clearly, and say it once more.",
        });
        return;
      }
    }

    // 2) Acoustic comparison against the native-speaker model, with confusable
    //    references as contrasts, so a wrong vowel can actually fail. Used by
    //    letters always, and by not-yet-migrated word modules as a fallback.
    if ((mode === "acoustic" || mode === "hybrid") && blob && blob.size) {
      try {
        let a: Assessment;
        if (folder === "letters") {
          // Explicit two-gate scorer: vowel (quality + length) and consonant.
          const refs = letterScoringKeys(fileKey).map((k) => ({ key: k, src: audioPath("letters", k) }));
          a = await assessLetter(src, fileKey, blob, refs);
        } else {
          const contrastSrcs = contrastKeys(folder, fileKey).map((k) => audioPath(folder, k));
          a = await assessAgainstReference(src, blob, contrastSrcs);
        }
        setMetrics(a.metrics ?? null);
        setQuality(a.qualityLabel ?? null);
        if (a.method !== "reference" || !a.qualityOk) {
          // Unscorable (too short / no model) or too noisy to trust — ask for a
          // re-record rather than inventing a score from loudness.
          setScore(null);
          setNotice({
            title: "Let's try that again",
            body:
              `${a.qualityLabel ?? "We couldn't hear that clearly"}. Move to a quieter spot, hold the device closer to your mouth, and record again.` +
              (a.unscorableReason ? ` [${a.unscorableReason}]` : ""),
          });
          return;
        }
        setScore(a.score);
        onScore?.(a.score);
        return;
      } catch { /* couldn't decode the clip/reference — fall through */ }
    }

    // 3) No trustworthy signal. Stay honest: no score, no loudness guess.
    setHeard("");
    setScore(null);
    setQuality(null);
    setNotice({
      title: "We couldn't score that",
      body: "Automatic pronunciation scoring isn't available for this recording. Check your microphone, then try again.",
    });
  };

  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/[.04] p-3", compact && "p-2")}>
      <div className="flex flex-wrap items-center gap-2">
        <Button size={compact ? "sm" : "md"} onClick={() => (playing ? stop() : doPlay(1))} aria-label="Play audio">
          {playing ? "⏸ Pause" : "▶ Play"}
        </Button>
        <Button size={compact ? "sm" : "md"} variant="ghost" onClick={() => doPlay(1)} aria-label="Replay">↻ Replay</Button>
        <Button
          size={compact ? "sm" : "md"}
          variant={rate === 0.75 ? "outline" : "ghost"}
          onClick={() => { setRate(0.75); doPlay(0.75); }}
        >
          🐢 0.75×
        </Button>
        {allowRecord && (
          <Button size={compact ? "sm" : "md"} variant={recording ? "danger" : "ghost"} onClick={record} disabled={recording}>
            {listening ? "● Listening…" : recording ? "● Recording…" : "🎙 Record"}
          </Button>
        )}
        {label && <span className="ml-auto text-xs text-sand/45">{label}</span>}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-widest text-sand/40">Model — native speaker</div>
          <Waveform bars={model} color="#C9A227" active={playing ? progressIdx : -1} height={compact ? 30 : 44} />
        </div>
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-widest text-sand/40">
            {listening ? "Listening…" : recording ? "Recording…" : "Your recording"}
          </div>
          {levels.length ? (
            <Waveform bars={levels} color={score !== null && score >= PASS_SCORE ? "#1D9E75" : "#8f7fd8"} height={compact ? 30 : 44} />
          ) : (
            <div className="flex items-center text-xs text-sand/30" style={{ height: compact ? 30 : 44 }}>
              {folder === "dialogue" ? "Tap record and say the line aloud" : "Tap record and say the word aloud"}
            </div>
          )}
        </div>
      </div>

      {notice && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
          className="mt-3 flex flex-wrap items-start gap-3 rounded-xl border p-3"
          style={{ borderColor: "rgba(201,162,39,.45)", background: "rgba(201,162,39,.10)" }}
        >
          <span className="text-lg leading-none" aria-hidden="true">⚠️</span>
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-semibold" style={{ color: "#E6B93D" }}>
              {notice.title}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-sand/70">{notice.body}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-sand/50">
              You can still practise: play the model audio, record yourself, and compare the two
              waveforms above by ear.
            </p>
          </div>
          <div className="ml-auto flex shrink-0 flex-col gap-2">
            <Button size="sm" variant="outline" onClick={record}>
              Retry
            </Button>
            {/* Graded contexts (quiz, dialogue practice) advance only via onScore.
                `onSkip` lets an unsupported browser move on without soft-locking,
                but it does NOT award: the caller advances without credit. */}
            {onSkip && (
              <Button size="sm" variant="ghost" onClick={onSkip}>
                I said it — continue
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {score !== null && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-black/25 p-3">
          <div className="relative h-11 w-11 shrink-0">
            <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="4" />
              <circle cx="18" cy="18" r="15" fill="none" stroke={bandStyle?.ring ?? "#C9A227"} strokeWidth="4"
                strokeDasharray={`${(score / 100) * 94} 94`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 grid place-items-center text-[11px] font-bold">{score}</span>
          </div>
          <div className="text-sm">
            <div className={cn("font-semibold", bandStyle?.label ?? "text-gold")}>
              {bandMessage(score)}
            </div>
            <div className="text-xs text-sand/50">
              {heard
                ? <>Heard: <span className="ar" dir="rtl">{heard}</span></>
                : "Compared with the native-speaker model."}
            </div>
            {quality && (
              <div className={cn("text-[11px]", quality === "Clear recording" ? "text-sand/40" : "text-gold/80")}>
                🎚 {quality}
              </div>
            )}
          </div>
          {score < PASS_SCORE && <Button size="sm" variant="outline" className="ml-auto" onClick={record}>Retry</Button>}
        </motion.div>
      )}

      {metrics?.qualityTarget && (
        <pre
          dir="ltr"
          className="mt-2 overflow-x-auto rounded-lg border border-gold/40 bg-black/40 p-2 text-[11px] leading-snug text-gold/90"
        >
{`gates: quality=${metrics.qualityHeard} (want ${metrics.qualityTarget})${metrics.qualityHeard === metrics.qualityTarget ? " ✓" : " ✗"}  length=${metrics.lengthOk ? "✓" : "✗"}  consonant=${metrics.consonantOk ? "✓" : "✗"}  conMargin=${metrics.conMargin === undefined || !isFinite(metrics.conMargin) ? "—" : metrics.conMargin.toFixed(3)}
dur: user=${Math.round(metrics.userMs ?? 0)}ms  short=${Math.round(metrics.shortMs ?? 0)}ms  long=${Math.round(metrics.longMs ?? 0)}ms`}
        </pre>
      )}

      {assessDebugEnabled() && metrics && (
        <pre
          dir="ltr"
          className="mt-2 overflow-x-auto rounded-lg border border-gold/25 bg-black/40 p-2 text-[10px] leading-snug text-gold/80"
        >
{`dMean=${metrics.dMean.toFixed(3)}  dWorst=${metrics.dWorst.toFixed(3)}  dEff=${metrics.dEff.toFixed(3)}
contrast=${metrics.contrast === null ? "—" : metrics.contrast.toFixed(3)}  margin=${metrics.margin === null ? "—" : metrics.margin.toFixed(3)}  z=${metrics.targetZ === null ? "—" : metrics.targetZ.toFixed(2)}  score=${metrics.score}
ratio=${metrics.durationRatio.toFixed(2)}  snr=${metrics.snrDb.toFixed(1)}dB  clip=${(metrics.clipping * 100).toFixed(1)}%`}
        </pre>
      )}

      {assessDebugEnabled() && recogInfo && (
        <pre
          dir="ltr"
          className="mt-2 overflow-x-auto rounded-lg border border-gold/25 bg-black/40 p-2 text-[10px] leading-snug text-gold/80"
        >
{`mode=${recogInfo.mode}
target="${recogInfo.target}" norm="${recogInfo.targetNorm}"
chosen="${recogInfo.transcript}" (norm="${normalizeArabic(recogInfo.transcript)}") score=${recogInfo.score}${recogInfo.error ? ` error=${recogInfo.error}` : ""}
alts=${recogInfo.alternatives.length}
${recogInfo.alternatives.map((a, i) => `  [${i}] "${a.transcript}" norm="${normalizeArabic(a.transcript)}" → ${a.score}`).join("\n")}`}
        </pre>
      )}
    </div>
  );
}
