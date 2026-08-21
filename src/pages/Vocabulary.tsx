import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, Button, Chip, Modal, LockIcon, Progress } from "@/components/ui";
import AudioPlayer from "@/components/AudioPlayer";
import HandwritingCanvas from "@/components/HandwritingCanvas";
import Quiz, { shuffle, type Question } from "@/components/Quiz";
import { UpgradeModal } from "@/components/Layout";
import { VOCAB } from "@/data/vocab";
import { useApp } from "@/lib/store";
import { cn } from "@/utils/cn";

type Tab = "learn" | "assemble" | "write" | "dictation" | "scene";

export default function Vocabulary() {
  const { isLocked, award, isLearned, learnedCount } = useApp();
  const [idx, setIdx] = useState(0);
  const [tab, setTab] = useState<Tab>("learn");
  const [lockOpen, setLockOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [tiles, setTiles] = useState<string[]>([]);
  const [built, setBuilt] = useState<string[]>([]);
  const [dict, setDict] = useState("");
  const [dictMsg, setDictMsg] = useState<string | null>(null);

  const word = VOCAB[idx];
  const locked = isLocked("vocab", idx);
  const learned = learnedCount("vocab");

  useEffect(() => {
    setTiles(shuffle(word.bare.split("")));
    setBuilt([]); setDict(""); setDictMsg(null);
  }, [idx, word.bare]);

  const select = (i: number) => {
    if (isLocked("vocab", i)) { setLockOpen(true); return; }
    setIdx(i);
    award("vocab", VOCAB[i].id);
  };

  const generate = (): Question[] => {
    const pool = VOCAB.filter((_, i) => !isLocked("vocab", i));
    const qs: Question[] = [];
    shuffle(pool).slice(0, 5).forEach((w) => {
      const opts = shuffle([w.en, ...shuffle(VOCAB.filter((x) => x.id !== w.id)).slice(0, 3).map((x) => x.en)]);
      qs.push({
        kind: "mcq", id: w.id, prompt: "Listen and choose the meaning",
        arabic: w.ar, audio: { folder: "words", key: w.id, text: w.ar },
        options: opts, answer: opts.indexOf(w.en),
      });
    });
    const four = shuffle(pool).slice(0, Math.min(4, pool.length));
    if (four.length === 4) {
      qs.push({ kind: "match", id: "match1", prompt: "Match each image to its Arabic word", pairs: four.map((w) => ({ left: w.emoji, right: w.ar })) });
    }
    shuffle(pool).slice(0, 2).forEach((w) => {
      const hide = Math.floor(Math.random() * w.bare.length);
      const opts = shuffle([w.bare[hide], ...shuffle("بتثجحخدرسشعفقكلمن".split("").filter((c) => c !== w.bare[hide])).slice(0, 3)]);
      qs.push({ kind: "missing", id: `${w.id}_miss`, prompt: "Which letter is missing?", word: w.bare, hide, options: opts, answer: opts.indexOf(w.bare[hide]) });
    });
    const d = shuffle(pool)[0];
    qs.push({ kind: "write", id: `${d.id}_write`, prompt: `Dictation — write the first letter of “${d.en}”`, letter: d.bare[0], dots: 0 });
    const s = shuffle(pool)[0];
    qs.push({ kind: "speak", id: `${s.id}_speak`, prompt: "Say the word aloud", text: s.ar, folder: "words", fileKey: s.id });
    return shuffle(qs);
  };

  const sceneWords = VOCAB.filter((w) => w.scene);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="rounded-2xl border border-mod-vocab bg-gradient-to-r from-[#7A4A00]/50 to-transparent p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl">📚</span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold">Module 4 · Core Vocabulary</h1>
            <p className="text-sm text-sand/60">20 words with images, harakat, romanization and writing practice.</p>
          </div>
          <Button onClick={() => setQuizOpen(true)}>Take the 10-question test</Button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Progress pct={(learned / 20) * 100} color="#C98A22" />
          <span className="shrink-0 text-xs text-sand/50">{learned}/20</span>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-10">
        {VOCAB.map((w, i) => (
          <button key={w.id} onClick={() => select(i)}
            className={cn("relative rounded-xl border p-2 text-center transition",
              i === idx ? "border-gold bg-gold/15" : "border-white/10 hover:bg-white/5", isLocked("vocab", i) && "opacity-45")}>
            <div className="text-xl">{w.emoji}</div>
            <div className="ar-c text-lg leading-tight">{w.ar}</div>
            {isLearned("vocab", w.id) && <span className="absolute right-1 top-1 text-[9px] text-ok">✓</span>}
            {isLocked("vocab", i) && <LockIcon className="absolute bottom-1 left-1 h-3 w-3 text-gold/70" />}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {([["learn", "Word card"], ["assemble", "Hear → assemble"], ["write", "Image → write"], ["dictation", "Dictation"], ["scene", "Academic scene"]] as [Tab, string][]).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold",
              tab === t ? "border-gold bg-gold/20 text-gold" : "border-white/12 text-sand/60")}>{l}</button>
        ))}
      </div>

      {locked ? (
        <Card className="text-center">
          <LockIcon className="mx-auto h-8 w-8 text-gold" />
          <p className="mt-2 text-sm text-sand/60">Free tier includes the first 5 words.</p>
          <Button className="mt-3" onClick={() => setLockOpen(true)}>Unlock all 20 words</Button>
        </Card>
      ) : tab === "scene" ? (
        <Card>
          <h3 className="font-bold">Academic scene — tap an object to hear it</h3>
          <p className="text-xs text-sand/50">Classroom scenes drawn from Morocco, Egypt, the UAE and diaspora settings.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {sceneWords.map((w) => (
              <button key={w.id} onClick={() => award("vocab", w.id)}
                className="rounded-2xl border border-white/12 bg-gradient-to-br from-white/5 to-transparent p-4 text-center hover:border-gold/60">
                <div className="text-4xl">{w.emoji}</div>
                <div className="ar-c mt-2 text-2xl">{w.ar}</div>
                <div className="text-[11px] text-sand/45">{w.en}</div>
              </button>
            ))}
          </div>
          <div className="mt-4"><AudioPlayer folder="words" fileKey={word.id} text={word.ar} allowRecord={false} compact /></div>
        </Card>
      ) : (
        <Card>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="text-center">
              <motion.div key={word.id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-7xl">{word.emoji}</motion.div>
              <div className="ar-c mt-3 text-5xl">{word.ar}</div>
              <div className="mt-1 text-sm text-sand/50">{word.translit}</div>
              <div className="mt-1 text-lg font-bold">{word.en}</div>
              <div className="mt-2 flex justify-center gap-2">
                {word.writingFocus && <Chip color="#7A4A00">3-letter writing focus</Chip>}
                <Chip>/audio/words/{word.id}.mp3</Chip>
              </div>
              <div className="mt-4"><AudioPlayer folder="words" fileKey={word.id} text={word.ar} /></div>
              <div className="mt-3 flex justify-center gap-2">
                <Button variant="ghost" onClick={() => select(Math.max(0, idx - 1))} disabled={idx === 0}>→ Prev</Button>
                <Button variant="ghost" onClick={() => select(Math.min(VOCAB.length - 1, idx + 1))} disabled={idx === VOCAB.length - 1}>Next ←</Button>
              </div>
            </div>

            <div>
              {tab === "learn" && (
                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-sand/70">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-gold">Study notes</div>
                  <p>Every letter is shown with its full harakat. Read right to left: {word.bare.split("").reverse().join(" ← ")}</p>
                  <p>Romanization: <b>{word.translit}</b>. Try saying it three times, then record yourself above.</p>
                  <ul className="list-disc space-y-1 pl-5 text-xs">
                    <li>Letters used: <span className="ar text-base">{[...new Set(word.bare.split(""))].join(" ")}</span></li>
                    <li>Meaning: {word.en}</li>
                  </ul>
                </div>
              )}

              {tab === "assemble" && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-gold">Hear the word, then assemble it right-to-left</div>
                  <div className="ar mt-3 flex min-h-16 items-center justify-end gap-1 rounded-xl border border-dashed border-white/20 p-3 text-3xl" dir="rtl">
                    {built.length ? built.map((c, i) => <span key={i}>{c}</span>) : <span className="text-sm text-sand/30">tap the tiles →</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap justify-end gap-2" dir="rtl">
                    {tiles.map((t, i) => (
                      <button key={i} onClick={() => { setBuilt((b) => [...b, t]); setTiles((x) => x.filter((_, j) => j !== i)); }}
                        className="ar h-12 w-12 rounded-xl border border-gold/40 bg-gold/10 text-2xl hover:bg-gold/20">{t}</button>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { setTiles(shuffle(word.bare.split(""))); setBuilt([]); }}>Reset</Button>
                    <Button size="sm" onClick={() => {
                      const ok = built.join("") === word.bare;
                      setDictMsg(ok ? "✓ Perfect spelling!" : `Not yet — the answer is ${word.bare}`);
                      if (ok) award("vocab", word.id);
                    }}>Check</Button>
                  </div>
                  {dictMsg && <div className="mt-2 text-sm text-sand/70">{dictMsg}</div>}
                </div>
              )}

              {tab === "write" && (
                <HandwritingCanvas 
                  letter={word.bare[0]} 
                  expectedDots={0} 
                  size={240} 
                  onResult={(_, ok) => ok && award("vocab", word.id)} 
                />
              )}

              {tab === "dictation" && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-gold">Dictation — listen, then type from memory</div>
                  <p className="mt-2 text-xs text-sand/50">Play the audio on the left, hide the word with your hand, and type what you hear.</p>
                  <input value={dict} onChange={(e) => setDict(e.target.value)} dir="rtl"
                    className="ar mt-3 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-2xl outline-none focus:border-gold" placeholder="اُكتُب هُنا" />
                  <Button className="mt-3" onClick={() => {
                    const ok = dict.replace(/[\u064B-\u0652]/g, "").trim() === word.bare;
                    setDictMsg(ok ? "✓ Correct!" : `Close — correct spelling: ${word.bare}`);
                    if (ok) award("vocab", word.id);
                  }}>Check dictation</Button>
                  {dictMsg && <div className="mt-2 text-sm text-sand/70">{dictMsg}</div>}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      <Modal open={quizOpen} onClose={() => setQuizOpen(false)} wide>
        <Quiz module="vocab" subId="core20" title="Vocabulary test" generate={generate} onClose={() => setQuizOpen(false)} />
      </Modal>
      <UpgradeModal open={lockOpen} onClose={() => setLockOpen(false)} />
    </div>
  );
}
