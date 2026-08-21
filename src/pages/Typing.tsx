import { useState, useEffect, useCallback } from "react";
import { Card, Button, Stat, EmptyState, Progress } from "@/components/ui";
import { useApp, MODULE_META } from "@/lib/store";
import { useTypingPool, type TypingTarget } from "@/lib/typingPool";
import { ARABIC_KEYBOARD_ROWS, TYPING_ACTIVE_CHARS } from "@/data/arabicKeyboard";
import { audioPath, play } from "@/lib/audio";
import { cn } from "@/utils/cn";

type KeyboardMode = "smartphone" | "pc";

// ── Fluency thresholds ────────────────────────────────────────────────
// A "fluent" attempt = the learner types the word correctly AND finishes
// in under SECONDS_PER_LETTER seconds per letter (e.g. a 3-letter word
// must be completed in under 4.5 s on a fluency attempt).
// Two consecutive fluent attempts on the same word earns the ⚡ badge.
const SECONDS_PER_LETTER = 1.5;

function isFluent(bare: string, elapsedMs: number): boolean {
  const threshold = bare.length * SECONDS_PER_LETTER * 1000;
  return elapsedMs <= threshold;
}

export default function Typing() {
  const { award, addXp, showToast, learnedCount } = useApp();
  const { eligible, totalPossible } = useTypingPool();

  const [index, setIndex]           = useState(0);
  const [typed, setTyped]           = useState("");
  const [status, setStatus]         = useState<"typing" | "correct" | "wrong">("typing");
  const [startTime, setStartTime]   = useState<number | null>(null);
  const [lastWpm, setLastWpm]       = useState<number | null>(null);
  const [isPlaying, setIsPlaying]   = useState(false);

  // Fluency tracking — resets when the word changes (index changes)
  const [fluencyStreak, setFluencyStreak] = useState(0);
  const [fluencyEarned, setFluencyEarned] = useState(false);

  const [mode, setMode] = useState<KeyboardMode>(() => {
    if (typeof window === "undefined") return "smartphone";
    return (window.localStorage.getItem("arabic1010-typing-mode") as KeyboardMode) || "smartphone";
  });

  const target: TypingTarget | undefined = eligible[index];

  // Reset all per-word state when the word changes
  useEffect(() => {
    setTyped("");
    setStatus("typing");
    setStartTime(null);
    setFluencyStreak(0);
    setFluencyEarned(false);
  }, [target?.key]);

  useEffect(() => {
    window.localStorage.setItem("arabic1010-typing-mode", mode);
  }, [mode]);

  const handleKey = useCallback(
    (char: string) => {
      if (!target || status !== "typing") return;
      const now = Date.now();
      if (startTime === null) setStartTime(now);
      
      // Pedagogical normalization: allow 'ا' to match 'أ' or 'إ' 
      // if the target requires it but the keyboard is simplified.
      let effectiveChar = char;
      const expectedChar = target.bare[typed.length];
      if (char === "ا" && (expectedChar === "أ" || expectedChar === "إ")) {
        effectiveChar = expectedChar;
      }

      const next = typed + effectiveChar;
      setTyped(next);

      if (next === target.bare) {
        const elapsed = now - (startTime ?? now);
        const elapsedMin = Math.max(elapsed / 60000, 1 / 60000);
        const wpm = Math.round((next.length / 5) / elapsedMin);
        setLastWpm(wpm);
        setStatus("correct");
        award("typing", target.key, 8);

        // ── Fluency gamification ────────────────────────────────────
        const fast = isFluent(target.bare, elapsed);
        const newStreak = fast ? fluencyStreak + 1 : 0;
        setFluencyStreak(newStreak);

        if (fast && newStreak === 1) {
          // First fast correct attempt — encourage the learner
          showToast("⚡ Fast! Type it again to earn Fluency");
        }

        if (fast && newStreak >= 2 && !fluencyEarned) {
          // Two consecutive fast correct attempts — fluency achieved
          setFluencyEarned(true);
          addXp(5);
          showToast("⚡ Fluent! +5 XP");
        }
        // ────────────────────────────────────────────────────────────
      } else if (!target.bare.startsWith(next)) {
        setStatus("wrong");
      }
    },
    [target, typed, status, startTime, fluencyStreak, fluencyEarned, award, addXp, showToast]
  );

  // FIX 1: Backspace works in both "typing" and "wrong" states.
  // In "wrong" state it removes the bad character and returns to "typing".
  const backspace = useCallback(() => {
    if (status === "wrong") {
      setTyped((t) => t.slice(0, -1));
      setStatus("typing");
      return;
    }
    if (status === "typing") {
      setTyped((t) => t.slice(0, -1));
    }
  }, [status]);

  // FIX 4: Try again — resets current word without advancing index.
  // Fluency streak is preserved so a second fluent attempt still counts.
  const tryAgain = useCallback(() => {
    setTyped("");
    setStatus("typing");
    setStartTime(null);
  }, []);

  // Advance to next word
  const next = () => setIndex((i) => (i + 1 < eligible.length ? i + 1 : 0));

  // FIX 3: Manual speaker — plays recorded mp3 or falls back to
  // Arabic speech synthesis. Folder matches the source module.
  const handleSpeak = useCallback(async () => {
    if (!target || isPlaying) return;
    setIsPlaying(true);
    const folder = target.source === "cognates" ? "cognates" : "words";
    const src = audioPath(folder, target.sourceId);
    await play(src, target.ar);
    setIsPlaying(false);
  }, [target, isPlaying]);

  if (eligible.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <h1 className="text-xl font-bold">{MODULE_META.typing.title}</h1>
          <p className="mt-1 text-sm text-sand/60">{MODULE_META.typing.blurb}</p>
        </Card>
        <EmptyState
          icon="⌨️"
          title="No words unlocked yet"
          body="A word unlocks here once you've mastered every letter it uses in Letters, and learned its meaning in Cognates or Vocabulary. Keep going — short, common words unlock first."
        />
      </div>
    );
  }

  const activeChar = target ? target.bare[typed.length] : undefined;
  const learned = learnedCount("typing");

  return (
    <div className="space-y-6">

      {/* ── Header card ── */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{MODULE_META.typing.title}</h1>
            <p className="mt-1 text-sm text-sand/60">{MODULE_META.typing.blurb}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-white/5 p-1">
              <button
                onClick={() => setMode("smartphone")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition",
                  mode === "smartphone" ? "bg-gold text-ink" : "text-sand/50 hover:text-sand"
                )}
              >
                <span>📱</span> Smartphone
              </button>
              <button
                onClick={() => setMode("pc")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition",
                  mode === "pc" ? "bg-gold text-ink" : "text-sand/50 hover:text-sand"
                )}
              >
                <span>💻</span> PC
              </button>
            </div>
            <Stat
              label="Digital fluency"
              value={`${learned}/${totalPossible}`}
              color={MODULE_META.typing.color}
            />
          </div>
        </div>
        <Progress pct={(learned / totalPossible) * 100} color={MODULE_META.typing.color} />
      </Card>

      {/* ── Word card ── */}
      <Card className="p-6">

        {/* Counter + WPM row */}
        <div className="mb-4 flex items-center justify-between text-xs text-sand/50">
          <span>Word {index + 1} of {eligible.length}</span>
          <div className="flex items-center gap-3">
            {lastWpm !== null && (
              <span className="flex items-center gap-1">
                <span className="text-sand/40">Last:</span>
                <span className={cn(
                  "font-semibold",
                  lastWpm >= 20 ? "text-ok" : "text-sand/60"
                )}>
                  {lastWpm} WPM
                </span>
              </span>
            )}
            {/* Speed tip — always visible so learner knows fluency is rewarded */}
            <span className="flex items-center gap-1 text-gold/60">
              <span>⚡</span>
              <span>Speed matters — type fast to earn Fluency XP</span>
            </span>
          </div>
        </div>

        {/* Emoji + English label */}
        <div className="mb-2 text-center text-3xl">{target?.emoji}</div>
        <div className="mb-1 text-center text-sm text-sand/60">{target?.en}</div>

        {/* FIX 2: Connected Arabic preview + speaker button.
            The full word renders as one connected string in a single
            DOM element so the browser's Arabic shaping engine produces
            correct joined letter forms. The speaker button sits to the
            left of the word (Arabic reads RTL so "left of the word"
            is the natural trailing position). */}
        <div className="my-4 flex items-center justify-center gap-3">
          <div
            dir="rtl"
            className={cn(
              "ar text-center text-4xl font-bold tracking-wide transition-colors",
              fluencyEarned ? "text-ok" : "text-gold/90"
            )}
            style={{ fontFamily: '"Noto Naskh Arabic", serif' }}
          >
            {target?.bare}
            {fluencyEarned && (
              <span className="ml-2 text-2xl" title="Fluency achieved">⚡</span>
            )}
          </div>
          {/* Manual speaker — learner taps when they want audio */}
          <button
            onClick={handleSpeak}
            disabled={isPlaying}
            aria-label="Hear this word in Arabic"
            className={cn(
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition",
              isPlaying
                ? "border-gold/50 bg-gold/10 text-gold/50"
                : "border-white/20 bg-white/5 text-sand/60 hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
            )}
          >
            <span className="text-lg">{isPlaying ? "⏸" : "🔊"}</span>
          </button>
        </div>

        {/* Fluency progress indicator — shown after first correct attempt */}
        {status === "correct" && !fluencyEarned && fluencyStreak === 1 && (
          <div className="mb-3 flex justify-center">
            <div className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold">
              <span>⚡</span>
              <span>1 / 2 fluent attempts — type it again quickly!</span>
            </div>
          </div>
        )}
        {fluencyEarned && (
          <div className="mb-3 flex justify-center">
            <div className="flex items-center gap-1.5 rounded-full border border-ok/30 bg-ok/10 px-3 py-1 text-xs text-ok">
              <span>⚡</span>
              <span>Fluency achieved — +5 XP earned</span>
            </div>
          </div>
        )}

        {/* Letter tiles — individual boxes for input tracking.
            The connected preview above shows the joined orthographic form;
            the tiles below handle the game mechanic. */}
        <div dir="rtl" className="ar-c my-4 flex justify-center gap-1 text-4xl">
          {target?.bare.split("").map((_ch, i) => (
            <span
              key={i}
              className={cn(
                "flex h-14 w-12 items-center justify-center rounded-lg border transition-colors",
                i < typed.length
                  ? status === "wrong" && i === typed.length - 1
                    ? "border-red-500/60 bg-red-500/10"
                    : fluencyEarned
                    ? "border-ok/50 bg-ok/10"
                    : "border-gold/50 bg-gold/10"
                  : i === typed.length
                  ? "border-gold bg-gold/5"
                  : "border-white/10"
              )}
            >
              {i < typed.length ? typed[i] : ""}
            </span>
          ))}
        </div>

        {/* Status feedback */}
        {status === "correct" && (
          <div className="mb-4 text-center">
            <div className={cn(
              "mb-3 font-semibold",
              fluencyEarned ? "text-ok" : "text-ok"
            )}>
              {fluencyEarned ? "⚡ Fluent!" : "✓ Correct!"}
            </div>
            {/* FIX 4: Two buttons — Try again to build fluency, Next to advance */}
            <div className="flex justify-center gap-3">
              <Button variant="ghost" onClick={tryAgain}>↺ Try again</Button>
              <Button onClick={next}>Next word →</Button>
            </div>
          </div>
        )}

        {status === "wrong" && (
          <div className="mb-4 text-center">
            <div className="mb-2 font-semibold text-red-400">
              Not quite — check the highlighted key
            </div>
            {/* FIX 1: Backspace now works in wrong state */}
            <Button variant="ghost" onClick={backspace}>⌫ Backspace</Button>
          </div>
        )}

        {/* Arabic keyboard */}
        <div dir="rtl" className="space-y-2">
          {ARABIC_KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-1.5">
              {row.map((k) => {
                const active = TYPING_ACTIVE_CHARS.has(k.char);
                const isNext = activeChar === k.char && status === "typing";
                return (
                  <button
                    key={k.char}
                    disabled={!active || status !== "typing"}
                    onClick={() => handleKey(k.char)}
                    className={cn(
                      "flex h-12 w-12 flex-col items-center justify-center rounded-lg border text-lg transition",
                      isNext
                        ? "border-gold bg-gold/25 text-gold"
                        : active
                        ? "border-white/15 bg-white/[.04] text-sand hover:bg-white/[.08]"
                        : "border-white/5 text-sand/20"
                    )}
                  >
                    <span className="ar">{k.char}</span>
                    {mode === "pc" && (
                      <span className="text-[8px] text-sand/30">{k.qwertyPos}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          <div className="flex justify-center pt-2">
            {/* Bottom backspace — disabled only when correct or nothing typed */}
            <Button
              variant="ghost"
              onClick={backspace}
              disabled={status === "correct" || (typed.length === 0 && status === "typing")}
            >
              ⌫ Backspace
            </Button>
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] text-sand/30 uppercase tracking-widest">
          {mode === "smartphone" ? "Smartphone Mode: Simplified for touch" : "PC Mode: Showing physical key mappings"}
        </p>
      </Card>
    </div>
  );
}
