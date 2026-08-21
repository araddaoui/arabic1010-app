import { useState } from "react";
import { motion } from "framer-motion";
import { Card, Button, Chip, Modal, LockIcon, Progress } from "@/components/ui";
import AudioPlayer from "@/components/AudioPlayer";
import HandwritingCanvas from "@/components/HandwritingCanvas";
import Quiz, { shuffle, type Question } from "@/components/Quiz";
import { UpgradeModal } from "@/components/Layout";
import { LETTERS, VOWELS, vowelForm, vowelTranslit, type Letter, type VowelKey } from "@/data/letters";
import { useApp } from "@/lib/store";
import { cn } from "@/utils/cn";

export default function Letters() {
  const { isLocked, award, isLearned, learnedCount } = useApp();
  const [idx, setIdx] = useState(0);
  const [tab, setTab] = useState<"vowels" | "write">("vowels");
  const [lockOpen, setLockOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [vowel, setVowel] = useState<VowelKey>("fatha");

  const letter = LETTERS[idx];
  const locked = isLocked("letters", idx);
  const learned = learnedCount("letters");

  const select = (i: number) => {
    if (isLocked("letters", i)) { setLockOpen(true); return; }
    setIdx(i);
    award("letters", LETTERS[i].id);
  };

  const generate = (): Question[] => {
    const pool = LETTERS.filter((_, i) => !isLocked("letters", i));
    const qs: Question[] = [];
    shuffle(pool).slice(0, 6).forEach((l) => {
      const opts = shuffle([l.id, ...shuffle(LETTERS.filter((x) => x.id !== l.id)).slice(0, 3).map((x) => x.id)]);
      qs.push({
        kind: "mcq", id: l.id, prompt: "Listen and tap the letter you hear",
        audio: { folder: "letters", key: `${l.id}_fatha`, text: vowelForm(l.id, "fatha") },
        options: opts, answer: opts.indexOf(l.id), optionsAr: true,
      });
    });
    shuffle(pool).slice(0, 2).forEach((l) => {
      const v = shuffle(VOWELS)[0];
      const opts = shuffle([v.label, ...shuffle(VOWELS.filter((x) => x.key !== v.key)).slice(0, 2).map((x) => x.label)]);
      qs.push({
        kind: "mcq", id: `${l.id}_${v.key}`, prompt: "Which vowel is written on this letter?",
        arabic: vowelForm(l.id, v.key), options: opts, answer: opts.indexOf(v.label),
      });
    });
    const w = shuffle(pool)[0];
    qs.push({ kind: "write", id: `${w.id}_write`, prompt: `Write the letter ${w.name} from dictation`, letter: w.id, dots: w.dots });
    const s = shuffle(pool)[0];
    qs.push({ kind: "speak", id: `${s.id}_speak`, prompt: "Pronounce this syllable", text: vowelForm(s.id, "long_alif"), folder: "letters", fileKey: `${s.id}_long_alif` });
    return shuffle(qs);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="rounded-2xl border border-mod-letters bg-gradient-to-r from-[#1A3A6B]/60 to-transparent p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl">🔤</span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold">Module 2 · Letters & Vowels</h1>
            <p className="text-sm text-sand/60">28 letters × 6 vowel forms = 168 audio files, plus handwriting.</p>
          </div>
          <Button onClick={() => setQuizOpen(true)}>Take the 10-question test</Button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Progress pct={(learned / 28) * 100} color="#4c7fd0" />
          <span className="shrink-0 text-xs text-sand/50">{learned}/28</span>
        </div>
      </header>

      {/* alphabet grid */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 lg:grid-cols-14">
        {LETTERS.map((l, i) => {
          const lock = isLocked("letters", i);
          return (
            <button key={l.id} onClick={() => select(i)}
              className={cn("relative aspect-square rounded-xl border transition",
                i === idx ? "border-gold bg-gold/20" : "border-white/10 hover:bg-white/5", lock && "opacity-45")}
              style={i === idx ? {} : { background: `${l.color}22` }}>
              <span className="ar-c text-2xl">{l.id}</span>
              {isLearned("letters", l.id) && <span className="absolute right-1 top-1 text-[9px] text-ok">✓</span>}
              {lock && <LockIcon className="absolute bottom-1 left-1 h-3 w-3 text-gold/70" />}
            </button>
          );
        })}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-2xl text-3xl"
            style={{ background: `${letter.color}44`, border: `1px solid ${letter.color}` }}>
            <span className="ar-c">{letter.id}</span>
          </span>
          <div>
            <div className="ar text-xl">{letter.name}</div>
            <div className="text-xs text-sand/50">{letter.latinName} · sound /{letter.translit}/ · {letter.dots} dot{letter.dots === 1 ? "" : "s"}</div>
          </div>
          <Chip color={letter.color}>{letter.group}</Chip>
          <Chip color={letter.sun ? "#C9A227" : "#1A3A6B"}>{letter.sun ? "☀ sun letter" : "🌙 moon letter"}</Chip>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => select(Math.max(0, idx - 1))} disabled={idx === 0}>→ Prev</Button>
            <Button size="sm" variant="ghost" onClick={() => select(Math.min(27, idx + 1))} disabled={idx === 27}>Next ←</Button>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {(["vowels", "write"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold",
                tab === t ? "border-gold bg-gold/20 text-gold" : "border-white/12 text-sand/60")}>
              {t === "vowels" ? "Vowel forms" : "Handwriting"}
            </button>
          ))}
        </div>

        {locked ? (
          <div className="mt-6 text-center">
            <LockIcon className="mx-auto h-8 w-8 text-gold" />
            <p className="mt-2 text-sm text-sand/60">This letter is part of Premium.</p>
            <Button className="mt-3" onClick={() => setLockOpen(true)}>Unlock all 28 letters</Button>
          </div>
        ) : tab === "vowels" ? (
          <div className="mt-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {VOWELS.filter((v) => v.kind === "short").map((v) => (
                <VowelCard key={v.key} letter={letter} vkey={v.key} label={v.label} active={vowel === v.key} onClick={() => setVowel(v.key)} />
              ))}
            </div>
            <motion.div layout className="my-4 grid place-items-center rounded-2xl border py-8"
              style={{ background: `${letter.color}22`, borderColor: `${letter.color}88` }}>
              <span className="ar-c" style={{ fontSize: 96, lineHeight: 1 }}>{letter.id}</span>
              <span className="mt-2 text-xs uppercase tracking-[0.3em] text-sand/50">base letter</span>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-3xl">{letter.imageWord.emoji}</span>
                <span className="ar text-xl">{letter.imageWord.ar}</span>
                <span className="text-sand/50">— {letter.imageWord.en}</span>
              </div>
            </motion.div>
            <div className="grid gap-3 sm:grid-cols-3">
              {VOWELS.filter((v) => v.kind === "long").map((v) => (
                <VowelCard key={v.key} letter={letter} vkey={v.key} label={v.label} active={vowel === v.key} onClick={() => setVowel(v.key)} />
              ))}
            </div>
            <div className="mt-4">
              <AudioPlayer folder="letters" fileKey={`${letter.id}_${vowel}`} text={vowelForm(letter.id, vowel)}
                label={`/audio/letters/${letter.id}_${vowel}.mp3`} />
            </div>
            {letter.id === "ا" && (
              <p className="mt-3 rounded-xl border border-gold/30 bg-gold/10 p-3 text-xs text-sand/70">
                Note: alif's long vowel is written with a madda — <span className="ar text-lg">آ</span> — never as اا.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-5">
            <HandwritingCanvas 
              letter={letter.id} 
              expectedDots={letter.dots}
              showPlayground={true}
              onResult={(_, ok) => ok && award("letters", `${letter.id}_write`, 15)} 
            />
          </div>
        )}
      </Card>

      <Modal open={quizOpen} onClose={() => setQuizOpen(false)} wide>
        <Quiz module="letters" subId="alphabet1" title="Letters test" generate={generate} onClose={() => setQuizOpen(false)} />
      </Modal>
      <UpgradeModal open={lockOpen} onClose={() => setLockOpen(false)} />
    </div>
  );
}

function VowelCard({ letter, vkey, label, active, onClick }: { letter: Letter; vkey: VowelKey; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn("rounded-2xl border p-4 text-center transition", active ? "border-gold bg-gold/15" : "border-white/12 hover:bg-white/5")}>
      <div className="ar-c text-4xl">{vowelForm(letter.id, vkey)}</div>
      <div className="mt-1 text-sm font-semibold text-gold">{vowelTranslit(letter, vkey)}</div>
      <div className="text-[11px] text-sand/45">{label}</div>
    </button>
  );
}
