import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, Button, Chip, Modal, LockIcon, Progress } from "@/components/ui";
import AudioPlayer from "@/components/AudioPlayer";
import Quiz, { shuffle, type Question } from "@/components/Quiz";
import { UpgradeModal } from "@/components/Layout";
import { NUMBERS, VISUAL_MODES, toEastern, type VisualMode } from "@/data/numbers";
import { useApp } from "@/lib/store";
import { cn } from "@/utils/cn";
import HandwritingCanvas from "@/components/HandwritingCanvas";

function Visual({ n, mode }: { n: number; mode: VisualMode }) {
  const items = Array.from({ length: Math.min(n, 20) });
  if (mode === "clock") {
    const angle = (n % 12) * 30;
    return (
      <div className="grid place-items-center">
        <svg viewBox="0 0 120 120" className="h-40 w-40">
          <circle cx="60" cy="60" r="54" fill="rgba(255,255,255,.05)" stroke="#C9A227" strokeWidth="2" />
          {Array.from({ length: 12 }).map((_, i) => (
            <text key={i} x={60 + 42 * Math.sin((i + 1) * 0.5236)} y={64 - 42 * Math.cos((i + 1) * 0.5236)}
              textAnchor="middle" fill="#F5EDD6" fontSize="10">{toEastern(i + 1)}</text>
          ))}
          <line x1="60" y1="60" x2={60 + 32 * Math.sin((angle * Math.PI) / 180)} y2={60 - 32 * Math.cos((angle * Math.PI) / 180)}
            stroke="#C9A227" strokeWidth="4" strokeLinecap="round" />
          <circle cx="60" cy="60" r="4" fill="#C9A227" />
        </svg>
        <span className="text-xs text-sand/50">the hour {n % 12 || 12}</span>
      </div>
    );
  }
  if (mode === "math") {
    const a = Math.max(1, Math.floor(n / 2)), b = n - a;
    return (
      <div className="grid place-items-center gap-2">
        <div className="text-4xl font-extrabold text-gold">{a} + {b} = ?</div>
        <div className="ar text-2xl">{toEastern(a)} + {toEastern(b)} = {toEastern(n)}</div>
      </div>
    );
  }
  if (mode === "tally") {
    const groups = Math.floor(n / 5), rest = n % 5;
    return (
      <div className="flex flex-wrap items-end justify-center gap-4">
        {Array.from({ length: groups }).map((_, g) => (
          <svg key={g} viewBox="0 0 40 40" className="h-14 w-14">
            {[0, 1, 2, 3].map((i) => <line key={i} x1={6 + i * 8} y1="6" x2={6 + i * 8} y2="34" stroke="#C9A227" strokeWidth="3" />)}
            <line x1="2" y1="32" x2="38" y2="8" stroke="#C9A227" strokeWidth="3" />
          </svg>
        ))}
        {rest > 0 && (
          <svg viewBox="0 0 40 40" className="h-14 w-14">
            {Array.from({ length: rest }).map((_, i) => <line key={i} x1={6 + i * 8} y1="6" x2={6 + i * 8} y2="34" stroke="#C9A227" strokeWidth="3" />)}
          </svg>
        )}
        {n === 0 && <span className="text-sand/40">nothing at all</span>}
      </div>
    );
  }
  const glyph = mode === "shapes" ? "🔷" : mode === "objects" ? "🍎" : mode === "fingers" ? "☝️" : "⚫";
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {items.length === 0 && <span className="text-sand/40 text-sm">zero — an empty set</span>}
      {items.map((_, i) => (
        <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.03 }} className="text-3xl">
          {glyph}
        </motion.span>
      ))}
    </div>
  );
}

export default function Numbers() {
  const { isLocked, award, isLearned, learnedCount } = useApp();
  const [n, setN] = useState(0);
  const [visual, setVisual] = useState<VisualMode>("shapes");
  const [lockOpen, setLockOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [hwTab, setHwTab] = useState<"glyph" | "word" | "both">("glyph");
  const [answer, setAnswer] = useState("");
  const [opFeedback, setOpFeedback] = useState<string | null>(null);

  const item = NUMBERS[n];
  const locked = isLocked("numbers", n);
  const learned = learnedCount("numbers");

  const op = useMemo(() => {
    const a = 3 + ((n * 7) % 9), b = 2 + ((n * 5) % 8);
    return { a, b, sum: a + b };
  }, [n]);

  const go = (i: number) => {
    const c = Math.max(0, Math.min(20, i));
    if (isLocked("numbers", c)) { setLockOpen(true); return; }
    setN(c); setAnswer(""); setOpFeedback(null);
    setVisual(VISUAL_MODES[c % VISUAL_MODES.length]);
  };

  const generate = (): Question[] => {
    const pool = NUMBERS.filter((_, i) => !isLocked("numbers", i));
    const qs: Question[] = [];
    shuffle(pool).slice(0, 6).forEach((x) => {
      const opts = shuffle([x.eastern, ...shuffle(pool.filter((y) => y.n !== x.n)).slice(0, 3).map((y) => y.eastern)]);
      qs.push({
        kind: "mcq", id: String(x.n), prompt: "Listen and tap the number you hear",
        audio: { folder: "numbers", key: String(x.n), text: x.ar },
        options: opts, answer: opts.indexOf(x.eastern), optionsAr: true,
      });
    });
    shuffle(pool).slice(0, 2).forEach((x) => {
      const opts = shuffle([x.ar, ...shuffle(pool.filter((y) => y.n !== x.n)).slice(0, 3).map((y) => y.ar)]);
      qs.push({ kind: "mcq", id: `w${x.n}`, prompt: `Which Arabic word means ${x.n} (${x.eastern})?`, options: opts, answer: opts.indexOf(x.ar), optionsAr: true });
    });
    const s = shuffle(pool)[0];
    qs.push({ kind: "speak", id: `s${s.n}`, prompt: "Say this number in Arabic", text: s.ar, folder: "numbers", fileKey: String(s.n) });
    const m = shuffle(pool.filter((x) => x.n > 4))[0];
    const a = Math.floor(m.n / 2), b = m.n - a;
    const opts = shuffle([m.eastern, ...shuffle(pool.filter((y) => y.n !== m.n)).slice(0, 3).map((y) => y.eastern)]);
    qs.push({ kind: "mcq", id: `m${m.n}`, prompt: `Solve and choose the Eastern numeral: ${a} + ${b} = ?`, options: opts, answer: opts.indexOf(m.eastern), optionsAr: true });
    return shuffle(qs);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="rounded-2xl border border-mod-numbers bg-gradient-to-r from-[#1D6B3A]/50 to-transparent p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl">🔢</span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold">Module 3 · Numbers 0–20</h1>
            <p className="text-sm text-sand/60">Western numeral, Eastern numeral and the Arabic word, always together.</p>
          </div>
          <Button onClick={() => setQuizOpen(true)}>Take the 10-question test</Button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Progress pct={(learned / 21) * 100} color="#1D9E75" />
          <span className="shrink-0 text-xs text-sand/50">{learned}/21</span>
        </div>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {NUMBERS.map((x) => (
          <button key={x.n} onClick={() => go(x.n)}
            className={cn("relative h-10 w-10 rounded-lg border text-sm transition",
              x.n === n ? "border-gold bg-gold/20 text-gold" : "border-white/12 hover:bg-white/5",
              isLocked("numbers", x.n) && "opacity-40")}>
            <span className="ar-c">{x.eastern}</span>
            {isLearned("numbers", String(x.n)) && <span className="absolute -right-0.5 -top-0.5 text-[9px] text-ok">✓</span>}
          </button>
        ))}
      </div>

      {locked ? (
        <Card className="text-center">
          <LockIcon className="mx-auto h-8 w-8 text-gold" />
          <p className="mt-2 text-sm text-sand/60">Numbers 11–20 are part of Premium.</p>
          <Button className="mt-3" onClick={() => setLockOpen(true)}>Unlock 11–20</Button>
        </Card>
      ) : (
        <Card>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="text-center">
              <div className="flex items-end justify-center gap-6">
                <div>
                  <div className="text-6xl font-extrabold text-gold">{item.n}</div>
                  <div className="text-[10px] uppercase tracking-widest text-sand/40">Western</div>
                </div>
                <div>
                  <div className="ar-c text-6xl">{item.eastern}</div>
                  <div className="text-[10px] uppercase tracking-widest text-sand/40">Eastern</div>
                </div>
              </div>
              <div className="ar-c mt-4 text-4xl">{item.ar}</div>
              <div className="text-sm text-sand/50">{item.translit}</div>
              <div className="mt-4">
                <AudioPlayer folder="numbers" fileKey={String(item.n)} text={item.ar} label={`/audio/numbers/${item.n}.mp3`} />
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button variant="ghost" onClick={() => go(n - 1)} disabled={n === 0}>→ Previous</Button>
                <Button variant="ghost" onClick={() => go(n + 1)} disabled={n === 20}>Next ←</Button>
                <Button onClick={() => award("numbers", String(item.n))}>
                  {isLearned("numbers", String(item.n)) ? "✓ Mastered" : "Mark mastered"}
                </Button>
              </div>
            </div>

            <div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {VISUAL_MODES.map((v) => (
                  <button key={v} onClick={() => setVisual(v)}
                    className={cn("rounded-full border px-2.5 py-1 text-[11px] capitalize",
                      visual === v ? "border-gold bg-gold/20 text-gold" : "border-white/12 text-sand/55")}>{v}</button>
                ))}
              </div>
              <div className="grid min-h-44 place-items-center rounded-2xl border border-white/10 bg-black/20 p-4">
                <Visual n={item.n} mode={visual} />
              </div>

              <div className="mt-4 rounded-2xl border border-gold/25 bg-black/20 p-4">
                <div className="text-[10px] uppercase tracking-[0.25em] text-gold">Exercise · write the answer in Eastern numerals</div>
                <div className="mt-2 text-2xl font-bold">{op.a} + {op.b} = ?</div>
                <div className="mt-3 flex gap-2">
                  <input value={answer} onChange={(e) => setAnswer(e.target.value)} dir="rtl"
                    className="ar w-32 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xl outline-none focus:border-gold"
                    placeholder="٠٠" />
                  <Button onClick={() => {
                    const ok = answer.trim() === toEastern(op.sum) || answer.trim() === String(op.sum);
                    setOpFeedback(ok ? `✓ Correct — ${toEastern(op.sum)}` : `Not yet. Hint: it is ${op.sum} → try the Eastern digits.`);
                    if (ok) award("numbers", `op${n}`, 10);
                  }}>Check</Button>
                </div>
                {opFeedback && <div className="mt-2 text-sm text-sand/70">{opFeedback}</div>}
                <div className="mt-2 flex flex-wrap gap-1">
                  {"٠١٢٣٤٥٦٧٨٩".split("").map((d) => (
                    <button key={d} onClick={() => setAnswer((a) => a + d)}
                      className="ar h-9 w-9 rounded-lg border border-white/12 text-lg hover:bg-white/10">{d}</button>
                  ))}
                  <button onClick={() => setAnswer("")} className="h-9 rounded-lg border border-white/12 px-3 text-xs hover:bg-white/10">clear</button>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip color="#1D6B3A">Eastern numerals read left-to-right: {toEastern(2026)}</Chip>
            <Chip>Scope: 0–20 only (beginner-appropriate)</Chip>
          </div>
        {/* ── Handwriting section ── */}
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {(["glyph", "word", "both"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setHwTab(t)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-semibold",
                  hwTab === t
                    ? "border-gold bg-gold/20 text-gold"
                    : "border-white/12 text-sand/60"
                )}
              >
                {t === "glyph"
                  ? "✏️ Write numeral"
                  : t === "word"
                  ? "✏️ Write word"
                  : "📋 Write both"}
              </button>
            ))}
          </div>

          {hwTab === "glyph" && (
            <div>
              <p className="mb-3 text-xs text-sand/50">
                Practise writing the Eastern numeral{" "}
                <span className="ar text-gold">{item.eastern}</span>.
                Use Trace → Copy → Recall inside the canvas.
              </p>
              <HandwritingCanvas
                letter={item.eastern}
                expectedDots={0}
                showPlayground={false}
                onResult={(_, ok) =>
                  ok && award("numbers", `n${item.n}_glyph`, 10)
                }
              />
            </div>
          )}

          {hwTab === "word" && (
            <div>
              <p className="mb-3 text-xs text-sand/50">
                Practise writing the Arabic word{" "}
                <span className="ar text-gold">{item.ar}</span>.
                Use Trace → Copy → Recall inside the canvas.
              </p>
              <HandwritingCanvas
                letter={item.ar}
                expectedDots={0}
                showPlayground={false}
                onResult={(_, ok) =>
                  ok && award("numbers", `n${item.n}_khat`, 15)
                }
              />
            </div>
          )}

          {hwTab === "both" && (
            <div className="space-y-6">
              <div>
                <div className="mb-2 text-[10px] uppercase tracking-widest text-gold">
                  Eastern numeral — {item.eastern}
                </div>
                <HandwritingCanvas
                  letter={item.eastern}
                  expectedDots={0}
                  showPlayground={false}
                  onResult={(_, ok) =>
                    ok && award("numbers", `n${item.n}_glyph`, 10)
                  }
                />
              </div>
              <div>
                <div className="mb-2 text-[10px] uppercase tracking-widest text-gold">
                  Arabic word — {item.ar}
                </div>
                <HandwritingCanvas
                  letter={item.ar}
                  expectedDots={0}
                  showPlayground={false}
                  onResult={(_, ok) =>
                    ok && award("numbers", `n${item.n}_khat`, 15)
                  }
                />
              </div>
            </div>
          )}
        </div>
        </Card>
      )}

      <Modal open={quizOpen} onClose={() => setQuizOpen(false)} wide>
        <Quiz module="numbers" subId="0-20" title="Numbers test" generate={generate} onClose={() => setQuizOpen(false)} />
      </Modal>
      <UpgradeModal open={lockOpen} onClose={() => setLockOpen(false)} />
    </div>
  );
}
