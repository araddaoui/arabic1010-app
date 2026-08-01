import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Progress, Confetti, Chip } from "@/components/ui";
import AudioPlayer from "@/components/AudioPlayer";
import HandwritingCanvas from "@/components/HandwritingCanvas";
import { useApp, type ModuleKey, BADGES } from "@/lib/store";
import { cn } from "@/utils/cn";

export type Question =
  | { kind: "mcq"; id: string; prompt: string; arabic?: string; audio?: { folder: string; key: string; text: string }; options: string[]; answer: number; optionsAr?: boolean }
  | { kind: "match"; id: string; prompt: string; pairs: { left: string; right: string }[] }
  | { kind: "missing"; id: string; prompt: string; word: string; hide: number; options: string[]; answer: number }
  | { kind: "write"; id: string; prompt: string; letter: string; dots: number }
  | { kind: "speak"; id: string; prompt: string; text: string; folder: string; fileKey: string };

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Quiz({
  module, subId, title, generate, onClose,
}: {
  module: ModuleKey;
  subId: string;
  title: string;
  generate: () => Question[];
  onClose: () => void;
}) {
  const { recordAttempt, addXp, setMastered } = useApp();
  const [seed, setSeed] = useState(0);
  const questions = useMemo(() => generate().slice(0, 10), [seed]); // eslint-disable-line
  const [idx, setIdx] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<"asking" | "right" | "wrong" | "reveal">("asking");
  const [correctCount, setCorrectCount] = useState(0);
  const [weak, setWeak] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [pick, setPick] = useState<string | null>(null);

  const q = questions[idx];
  const pctDone = (idx / Math.max(1, questions.length)) * 100;

  const advance = (ok: boolean) => {
    if (ok) setCorrectCount((c) => c + 1);
    else setWeak((w) => (w.includes(q.prompt) ? w : [...w, q.prompt]));
    recordAttempt(module, q.id, ok);
    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        const score = Math.round(((ok ? correctCount + 1 : correctCount) / questions.length) * 100);
        if (score >= 80) { addXp(20); setMastered(`${module}:${subId}`); }
        setDone(true);
      } else {
        setIdx((i) => i + 1);
        setState("asking"); setSelected(null); setAttempt(0); setPairs({}); setPick(null);
      }
    }, ok ? 750 : 1500);
  };

  const answerMcq = (i: number) => {
    if (state !== "asking") return;
    setSelected(i);
    const ok = q.kind === "mcq" ? i === q.answer : q.kind === "missing" ? i === q.answer : false;
    if (ok) { setState("right"); advance(true); }
    else if (attempt === 0) {
      setState("wrong");
      setTimeout(() => { setState("asking"); setSelected(null); setAttempt(1); }, 1200);
    } else { setState("reveal"); advance(false); }
  };

  const score = Math.round((correctCount / Math.max(1, questions.length)) * 100);
  const passed = score >= 80;

  if (done) {
    const badge = BADGES.find((b) => b.id === (module === "cognates" ? "bridge" : module === "letters" ? "script" : module === "numbers" ? "ninja" : module === "vocab" ? "scholar" : module === "dialogue" ? "convo" : "explorer"))!;
    return (
      <div className="text-center">
        <Confetti fire={passed} />
        <div className="text-6xl">{passed ? badge.icon : "💪"}</div>
        <h3 className="mt-3 text-2xl font-extrabold">{passed ? "Mastered!" : "Almost there"}</h3>
        <p className="mt-1 text-sand/60">You scored {correctCount}/{questions.length} — {score}%</p>
        <div className="mx-auto mt-4 max-w-xs"><Progress pct={score} color={passed ? "#1D9E75" : "#C9A227"} /></div>
        {passed ? (
          <div className="mt-4 rounded-xl border border-ok/40 bg-ok/10 p-4 text-sm">
            <div className="font-bold text-ok">+20 XP · sub-module locked as mastered</div>
            <div className="mt-1 text-sand/70">Badge progress: {badge.name} {badge.icon}</div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-4 text-left text-sm">
            <div className="font-bold text-gold">You need 80% to lock this sub-module.</div>
            <div className="mt-2 text-xs uppercase tracking-widest text-sand/40">Weak areas</div>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sand/70">
              {weak.slice(0, 4).map((w) => <li key={w}>{w}</li>)}
            </ul>
          </div>
        )}
        <div className="mt-5 flex justify-center gap-2">
          <Button variant="ghost" onClick={onClose}>Back to module</Button>
          <Button onClick={() => { setSeed((s) => s + 1); setIdx(0); setCorrectCount(0); setWeak([]); setDone(false); setState("asking"); setSelected(null); setAttempt(0); }}>
            {passed ? "Practise again" : "Retry with different questions"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-sand/50">
            <span>{title}</span><span>Question {idx + 1} / {questions.length}</span>
          </div>
          <div className="mt-1"><Progress pct={pctDone} /></div>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}>✕</Button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
          <div className="mb-3 text-sm font-semibold text-gold">{q.prompt}</div>

          {q.kind === "mcq" && (
            <>
              {q.audio && <div className="mb-3"><AudioPlayer folder={q.audio.folder} fileKey={q.audio.key} text={q.audio.text} allowRecord={false} compact /></div>}
              {q.arabic && <div className="mb-4 rounded-xl bg-white/5 py-6 text-center"><span className="ar-c text-5xl">{q.arabic}</span></div>}
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((o, i) => (
                  <button
                    key={i} onClick={() => answerMcq(i)} disabled={state !== "asking"}
                    className={cn(
                      "rounded-xl border p-3 text-left transition",
                      q.optionsAr && "ar text-2xl",
                      selected === i && state === "right" && "border-ok bg-ok/20",
                      selected === i && (state === "wrong" || state === "reveal") && "border-err bg-err/20",
                      state === "reveal" && i === q.answer && "border-ok bg-ok/20",
                      selected !== i && "border-white/12 hover:border-gold/60 hover:bg-white/5"
                    )}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </>
          )}

          {q.kind === "missing" && (
            <>
              <div className="mb-4 rounded-xl bg-white/5 py-8 text-center">
                <span className="ar-c text-5xl tracking-widest">
                  {q.word.split("").map((ch, i) => (
                    <span key={i} className={i === q.hide ? "rounded-md bg-gold/25 px-2 text-gold" : ""}>
                      {i === q.hide ? "؟" : ch}
                    </span>
                  ))}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {q.options.map((o, i) => (
                  <button key={i} onClick={() => answerMcq(i)} disabled={state !== "asking"}
                    className={cn("ar-c rounded-xl border p-4 text-3xl transition",
                      selected === i && state === "right" && "border-ok bg-ok/20",
                      selected === i && (state === "wrong" || state === "reveal") && "border-err bg-err/20",
                      state === "reveal" && i === q.answer && "border-ok bg-ok/20",
                      selected !== i && "border-white/12 hover:border-gold/60")}>{o}</button>
                ))}
              </div>
            </>
          )}

          {q.kind === "match" && (
            <MatchGrid q={q} pairs={pairs} pick={pick} setPick={setPick}
              onPair={(l, r) => {
                const next = { ...pairs, [l]: r };
                setPairs(next); setPick(null);
                if (Object.keys(next).length === q.pairs.length) {
                  const ok = q.pairs.every((p) => next[p.left] === p.right);
                  setState(ok ? "right" : "reveal");
                  advance(ok);
                }
              }} />
          )}

          {q.kind === "write" && (
            <div>
              <HandwritingCanvas letter={q.letter} expectedDots={q.dots} size={260}
                onResult={(s, ok) => { setState(ok ? "right" : "reveal"); advance(ok || s >= 80); }} />
            </div>
          )}

          {q.kind === "speak" && (
            <div>
              <div className="mb-3 rounded-xl bg-white/5 py-6 text-center"><span className="ar-c text-5xl">{q.text}</span></div>
              <AudioPlayer folder={q.folder} fileKey={q.fileKey} text={q.text}
                onScore={(s) => { setState(s >= 80 ? "right" : "reveal"); advance(s >= 80); }} />
            </div>
          )}

          {state === "wrong" && <div className="mt-3 rounded-lg bg-err/15 p-3 text-sm text-red-200">Not quite — listen again and try once more.</div>}
          {state === "reveal" && <div className="mt-3 rounded-lg bg-white/10 p-3 text-sm text-sand/80">Here is the correct answer — take a moment before the next question.</div>}
          {state === "right" && <div className="mt-3 rounded-lg bg-ok/15 p-3 text-sm text-emerald-200">✓ Correct!</div>}

          <div className="mt-4 flex items-center gap-2">
            <Chip>{q.kind === "mcq" ? "Recognition" : q.kind === "missing" ? "Missing letter" : q.kind === "match" ? "Image matching" : q.kind === "write" ? "Dictation writing" : "Pronunciation"}</Chip>
            <span className="text-xs text-sand/40">Attempt {attempt + 1} of 2</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function MatchGrid({ q, pairs, pick, setPick, onPair }: {
  q: Extract<Question, { kind: "match" }>;
  pairs: Record<string, string>;
  pick: string | null;
  setPick: (s: string | null) => void;
  onPair: (l: string, r: string) => void;
}) {
  const rights = useMemo(() => shuffle(q.pairs.map((p) => p.right)), [q]);
  const used = new Set(Object.values(pairs));
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        {q.pairs.map((p) => (
          <button key={p.left} onClick={() => setPick(p.left)} disabled={!!pairs[p.left]}
            className={cn("flex w-full items-center gap-2 rounded-xl border p-3 text-3xl transition",
              pairs[p.left] ? "border-ok/60 bg-ok/10 opacity-60" : pick === p.left ? "border-gold bg-gold/15" : "border-white/12 hover:border-gold/50")}>
            <span>{p.left}</span>
            {pairs[p.left] && <span className="ar mr-auto text-base">{pairs[p.left]}</span>}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {rights.map((r) => (
          <button key={r} onClick={() => pick && onPair(pick, r)} disabled={used.has(r) || !pick}
            className={cn("ar w-full rounded-xl border p-3 text-xl transition",
              used.has(r) ? "border-ok/50 bg-ok/10 opacity-40" : "border-white/12 hover:border-gold/50 disabled:opacity-50")}>
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
