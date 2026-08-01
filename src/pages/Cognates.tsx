import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Chip, Modal, LockIcon, Progress } from "@/components/ui";
import AudioPlayer from "@/components/AudioPlayer";
import Quiz, { shuffle, type Question } from "@/components/Quiz";
import { UpgradeModal } from "@/components/Layout";
import { COGNATES, CATEGORIES, type Cognate } from "@/data/cognates";
import { useApp, DEV_UNLOCK_ALL } from "@/lib/store";
import { cn } from "@/utils/cn";

type QuizMode = "ar2en" | "en2ar" | "cat";

export default function Cognates() {
  const { isLocked, award, isLearned, user, learnedCount } = useApp();
  const [cat, setCat] = useState<string>("All");
  const [active, setActive] = useState<Cognate | null>(null);
  const [locked, setLocked] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [mode, setMode] = useState<QuizMode>("ar2en");

  const list = useMemo(
    () => COGNATES.filter((c) => cat === "All" || c.category === cat),
    [cat]
  );
  const indexOf = (c: Cognate) => COGNATES.findIndex((x) => x.id === c.id);

  const open = (c: Cognate) => {
    if (isLocked("cognates", indexOf(c))) { setLocked(true); return; }
    setActive(c);
    award("cognates", c.id);
  };

  const generate = (): Question[] => {
    const pool = COGNATES.filter((_, i) => !isLocked("cognates", i));
    return shuffle(pool).slice(0, 10).map((c) => {
      const distract = shuffle(COGNATES.filter((x) => x.id !== c.id));
      if (mode === "en2ar") {
        const opts = shuffle([c.ar, ...distract.slice(0, 3).map((d) => d.ar)]);
        return { kind: "mcq", id: c.id, prompt: `Which Arabic word gave us “${c.en}”?`, options: opts, answer: opts.indexOf(c.ar), optionsAr: true };
      }
      if (mode === "cat") {
        const opts = shuffle([c.category, ...shuffle(CATEGORIES.filter((x) => x !== c.category)).slice(0, 3)]);
        return { kind: "mcq", id: c.id, prompt: "Which category does this word belong to?", arabic: c.ar, options: opts as string[], answer: opts.indexOf(c.category) };
      }
      const opts = shuffle([c.en, ...distract.slice(0, 3).map((d) => d.en)]);
      return {
        kind: "mcq", id: c.id, prompt: "Listen and choose the English equivalent",
        arabic: c.ar, audio: { folder: "cognates", key: c.id, text: c.ar },
        options: opts, answer: opts.indexOf(c.en),
      };
    });
  };

  const learned = learnedCount("cognates");

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="rounded-2xl border border-[#7B2020] bg-gradient-to-r from-[#7B2020]/50 to-transparent p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl">🌉</span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold">Module 1 · Cognates</h1>
            <p className="text-sm text-sand/60">30 English words borrowed from Arabic — you already know them.</p>
          </div>
          <Button onClick={() => setQuizOpen(true)}>Take the 10-question test</Button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Progress pct={(learned / 30) * 100} />
          <span className="shrink-0 text-xs text-sand/50">{learned}/30 learned</span>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-widest text-sand/40">Filter</span>
        {["All", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={cn("rounded-full border px-3 py-1 text-xs font-semibold transition",
              cat === c ? "border-gold bg-gold/20 text-gold" : "border-white/12 text-sand/60 hover:bg-white/5")}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {list.map((c) => {
            const i = indexOf(c);
            const lock = isLocked("cognates", i);
            const done = isLearned("cognates", c.id);
            return (
              <motion.button layout key={c.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                onClick={() => open(c)} className="text-left">
                <Card className={cn("h-full transition hover:border-gold/60", lock && "opacity-60")}>
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{c.emoji}</span>
                    <div className="flex items-center gap-1">
                      {done && <span className="text-xs text-ok">✓</span>}
                      {lock && <LockIcon className="text-gold/70" />}
                    </div>
                  </div>
                  <div className="ar-c mt-2 text-4xl leading-tight">{c.ar}</div>
                  <div className="mt-1 text-center text-xs text-sand/45">{c.translit}</div>
                  <div className="mt-2 text-center font-bold capitalize">{c.en}</div>
                  <div className="mt-3 flex justify-center"><Chip color="#7B2020">{c.category}</Chip></div>
                </Card>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      <Modal open={!!active} onClose={() => setActive(null)}>
        {active && (
          <div>
            <div className="text-center">
              <div className="text-4xl">{active.emoji}</div>
              <div className="ar-c mt-2 text-5xl">{active.ar}</div>
              <div className="mt-1 text-sm text-sand/50">{active.translit}</div>
              <div className="mt-2 text-xl font-bold capitalize">{active.en}</div>
              <div className="mt-2 flex justify-center"><Chip color="#7B2020">{active.category}</Chip></div>
            </div>
            <div className="mt-4">
              <AudioPlayer folder="cognates" fileKey={active.id} text={active.ar} label={`/audio/cognates/${active.id}.mp3`} />
            </div>
            <div className="mt-4 rounded-2xl border border-gold/25 bg-black/25 p-4">
              <div className="text-[10px] uppercase tracking-[0.25em] text-gold">Etymology trail</div>
              <div className="mt-3 space-y-2">
                {active.trail.map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold/20 text-[11px] font-bold text-gold">{i + 1}</span>
                    <span className={cn("text-sm", i === 0 && "ar text-lg")}>{t}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 border-t border-white/10 pt-3 text-xs text-sand/60">{active.note}</p>
            </div>
            <Button className="mt-4 w-full" onClick={() => setActive(null)}>Got it</Button>
          </div>
        )}
      </Modal>

      <Modal open={quizOpen} onClose={() => setQuizOpen(false)} wide>
        <div className="mb-4 flex flex-wrap gap-2">
          {([["ar2en", "Arabic → English"], ["en2ar", "English → Arabic"], ["cat", "Category ID"]] as [QuizMode, string][]).map(([m, l]) => (
            <button key={m} onClick={() => setMode(m)}
              className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold",
                mode === m ? "border-gold bg-gold/20 text-gold" : "border-white/12 text-sand/60")}>{l}</button>
          ))}
          <span className="ml-auto text-[11px] text-sand/40">switchable mid-session</span>
        </div>
        <Quiz key={mode} module="cognates" subId="set1" title="Cognates test" generate={generate} onClose={() => setQuizOpen(false)} />
      </Modal>

      <UpgradeModal open={locked} onClose={() => setLocked(false)} />
      {!DEV_UNLOCK_ALL && !user?.premium && (
        <p className="text-center text-xs text-sand/40">Free tier: 8 cognates, one per major category. Premium unlocks all 30.</p>
      )}
    </div>
  );
}
