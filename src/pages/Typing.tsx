import { useState, useEffect, useCallback } from "react";
import { Card, Button, Stat, EmptyState, Progress } from "@/components/ui";
import { useApp, MODULE_META } from "@/lib/store";
import { useTypingPool, type TypingTarget } from "@/lib/typingPool";
import { ARABIC_KEYBOARD_ROWS, TYPING_ACTIVE_CHARS } from "@/data/arabicKeyboard";
import { cn } from "@/utils/cn";

type KeyboardMode = "smartphone" | "pc";

export default function Typing() {
  const { award, learnedCount } = useApp();
  const { eligible, totalPossible } = useTypingPool();
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState<"typing" | "correct" | "wrong">("typing");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [lastWpm, setLastWpm] = useState<number | null>(null);
  const [mode, setMode] = useState<KeyboardMode>(() => {
    if (typeof window === "undefined") return "smartphone";
    return (window.localStorage.getItem("arabic1010-typing-mode") as KeyboardMode) || "smartphone";
  });

  const target: TypingTarget | undefined = eligible[index];

  useEffect(() => {
    setTyped("");
    setStatus("typing");
    setStartTime(null);
  }, [target?.key]);

  useEffect(() => {
    window.localStorage.setItem("arabic1010-typing-mode", mode);
  }, [mode]);

  const handleKey = useCallback(
    (char: string) => {
      if (!target || status !== "typing") return;
      if (startTime === null) setStartTime(Date.now());
      const next = typed + char;
      setTyped(next);
      if (next === target.bare) {
        setStatus("correct");
        const elapsedMin = Math.max((Date.now() - (startTime ?? Date.now())) / 60000, 1 / 60000);
        const wpm = Math.round((next.length / 5) / elapsedMin);
        setLastWpm(wpm);
        award("typing", target.key, 8);
      } else if (!target.bare.startsWith(next)) {
        setStatus("wrong");
      }
    },
    [target, typed, status, startTime, award]
  );

  const backspace = () => {
    if (status !== "typing") return;
    setTyped((t) => t.slice(0, -1));
  };

  const next = () => setIndex((i) => (i + 1 < eligible.length ? i + 1 : 0));

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
            <Stat label="Digital fluency" value={`${learned}/${totalPossible}`} color={MODULE_META.typing.color} />
          </div>
        </div>
        <Progress pct={(learned / totalPossible) * 100} color={MODULE_META.typing.color} />
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between text-xs text-sand/50">
          <span>Word {index + 1} of {eligible.length}</span>
          {lastWpm !== null && <span>Last word: {lastWpm} WPM</span>}
        </div>

        <div className="mb-2 text-center text-3xl">{target?.emoji}</div>
        <div className="mb-1 text-center text-sm text-sand/60">{target?.en}</div>

        <div dir="rtl" className="ar-c my-6 flex justify-center gap-1 text-4xl">
          {target?.bare.split("").map((_ch, i) => (
            <span
              key={i}
              className={cn(
                "flex h-14 w-12 items-center justify-center rounded-lg border",
                i < typed.length
                  ? status === "wrong" && i === typed.length - 1
                    ? "border-red-500/60 bg-red-500/10"
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

        {status === "correct" && (
          <div className="mb-4 text-center">
            <div className="mb-2 font-semibold text-ok">✓ Correct!</div>
            <Button onClick={next}>Next word →</Button>
          </div>
        )}
        {status === "wrong" && (
          <div className="mb-4 text-center">
            <div className="mb-2 font-semibold text-red-400">Not quite — check the highlighted key</div>
            <Button variant="ghost" onClick={backspace}>⌫ Backspace</Button>
          </div>
        )}

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
            <Button variant="ghost" onClick={backspace} disabled={status !== "typing"}>⌫ Backspace</Button>
          </div>
        </div>
        <p className="mt-4 text-center text-[10px] text-sand/30 uppercase tracking-widest">
          {mode === "smartphone" ? "Smartphone Mode: Simplified for touch" : "PC Mode: Showing physical key mappings"}
        </p>
      </Card>
    </div>
  );
}
