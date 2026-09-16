import { useState } from "react";
import { LETTERS, VOWELS } from "@/data/letters";
import { Card, Button, Chip, Modal, LockIcon } from "@/components/ui";
import AudioPlayer from "@/components/AudioPlayer";
import Quiz from "@/components/Quiz";
import { UpgradeModal } from "@/components/Layout";
import { useApp } from "@/lib/store";
import { cn } from "@/utils/cn";

export default function Letters() {
  const [idx, setIdx] = useState(0);
  const [quizOpen, setQuizOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const { isLearned, isLocked } = useApp();

  const letter = LETTERS[idx];
  const locked = isLocked("letters", idx);

  const generate = () => {
    return LETTERS.map(l => {
      const options = [l.id, ...LETTERS.filter(x => x.id !== l.id).slice(0, 3).map(x => x.id)].sort(() => Math.random() - 0.5);
      return {
        kind: "mcq" as const,
        id: l.id,
        prompt: `What is the letter for ${l.latinName}?`,
        options,
        answer: options.indexOf(l.id)
      };
    });
  };

  const select = (i: number) => {
    if (isLocked("letters", i)) {
      setLockOpen(true);
    } else {
      setIdx(i);
    }
  };

  const learnedCount = LETTERS.filter(l => isLearned("letters", l.id)).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Arabic Alphabet</h1>
          <p className="text-sand/60 text-sm mt-1">Master the 28 letters of the Arabic alphabet with audio and visual cues. ({learnedCount}/28 learned)</p>
        </div>
        <Button onClick={() => setQuizOpen(true)} variant="outline">Test Knowledge</Button>
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
        {/* Navigation & Category Chips Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Chip color={letter.color}>{letter.group}</Chip>
            <Chip color={letter.sun ? "#C9A227" : "#1A3A6B"}>{letter.sun ? "☀ sun letter" : "🌙 moon letter"}</Chip>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => select(Math.max(0, idx - 1))} disabled={idx === 0}>→ Prev</Button>
            <Button size="sm" variant="ghost" onClick={() => select(Math.min(27, idx + 1))} disabled={idx === 27}>Next ←</Button>
          </div>
        </div>

        {locked ? (
          <div className="py-12 text-center">
            <LockIcon className="mx-auto h-12 w-12 text-gold mb-3" />
            <h3 className="text-xl font-bold">Locked Letter</h3>
            <p className="mt-2 text-sm text-sand/60">This letter is part of Premium.</p>
            <Button className="mt-3" onClick={() => setLockOpen(true)}>Unlock all 28 letters</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Single Box Layout: Letter Character & Metadata (No Image Box) */}
            <div className="flex items-center justify-between rounded-2xl border p-6" style={{ background: `${letter.color}15`, borderColor: `${letter.color}55` }}>
              <div className="flex items-center gap-4">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-4xl shadow-md"
                  style={{ background: `${letter.color}44`, border: `2px solid ${letter.color}` }}>
                  <span className="ar-c">{letter.id}</span>
                </span>
                <div>
                  <div className="ar text-3xl font-bold">{letter.name}</div>
                  <div className="text-xs text-sand/60 mt-1">{letter.latinName} · sound /${letter.translit}/</div>
                  <div className="text-xs text-sand/50 mt-0.5">{letter.dots} dot{letter.dots === 1 ? "" : "s"}</div>
                </div>
              </div>
              <AudioPlayer folder="letters" fileKey={letter.latinName.toLowerCase()} text={letter.id} label={`Listen to ${letter.name}`} />
            </div>

            {/* Positional Forms Section */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-sand/50 mb-3">Positional Forms</h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: "Isolated", form: letter.isolated },
                  { label: "Initial", form: letter.initial },
                  { label: "Medial", form: letter.medial },
                  { label: "Final", form: letter.final }
                ].map((pos, pIdx) => (
                  <div key={pIdx} className="rounded-lg bg-black/20 p-2 border border-white/5">
                    <div className="text-[10px] text-sand/50 mb-1">{pos.label}</div>
                    <div className="ar text-xl">{pos.form}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pronunciation & Vowel Variants (Short & Long) */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold tracking-wide text-sand/80">Pronunciation & Vowel Variants</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {VOWELS.map(v => {
                  let combined = letter.id + v.symbol;
                  if (v.key === 'long_alif') combined = letter.id + 'َا';
                  if (v.key === 'long_ya') combined = letter.id + 'ِي';
                  if (v.key === 'long_waw') combined = letter.id + 'ُو';

                  return (
                    <div key={v.key} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                      <div>
                        <div className="text-xs text-sand/50">{v.label} ({v.kind})</div>
                        <div className="ar text-2xl mt-1 text-gold">{combined}</div>
                      </div>
                      <AudioPlayer folder="letters" fileKey={`${letter.latinName.toLowerCase()}_${v.key}`} text={combined} />
                    </div>
                  );
                })}
              </div>
            </div>
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
