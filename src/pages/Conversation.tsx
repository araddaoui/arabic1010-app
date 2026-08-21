import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Chip, Modal, LockIcon, Progress } from "@/components/ui";
import AudioPlayer from "@/components/AudioPlayer";
import Quiz, { shuffle, type Question } from "@/components/Quiz";
import { UpgradeModal } from "@/components/Layout";
import { DIALOGUES, EXPRESSIONS } from "@/data/dialogue";
import { play, audioPath } from "@/lib/audio";
import { useApp, DEV_UNLOCK_ALL } from "@/lib/store";
import { cn } from "@/utils/cn";

type Phase = 1 | 2 | 3;

export default function Conversation() {
  const { isLocked, award, isLearned, learnedCount, setMastered, addXp, user } = useApp();
  const [stage, setStage] = useState(0);
  const [phase, setPhase] = useState<Phase>(1);
  const [lineIdx, setLineIdx] = useState(0);
  const [role, setRole] = useState<"A" | "B">("B");
  const [lockOpen, setLockOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [rpIdx, setRpIdx] = useState(0);
  const [rpLog, setRpLog] = useState<{ who: string; text: string; score?: number }[]>([]);
  const [introOpen, setIntroOpen] = useState(false);

  const dlg = DIALOGUES[stage];
  const all = DIALOGUES.flatMap((d) => d.lines);
  const globalIndex = (id: string) => all.findIndex((l) => l.id === id);
  const learned = learnedCount("dialogue");

  const line = dlg.lines[Math.min(lineIdx, dlg.lines.length - 1)];
  const lineLocked = isLocked("dialogue", globalIndex(line.id));

  const generate = (): Question[] => {
    const pool = all.filter((l) => !isLocked("dialogue", globalIndex(l.id)));
    const exprs = EXPRESSIONS.flatMap((g) => g.items);
    const qs: Question[] = [];
    shuffle(pool).slice(0, 5).forEach((l) => {
      const opts = shuffle([l.en, ...shuffle(all.filter((x) => x.id !== l.id)).slice(0, 2).map((x) => x.en)]);
      qs.push({ kind: "mcq", id: l.id, prompt: "Hear the line — choose the correct meaning", audio: { folder: "dialogue", key: l.id, text: l.ar }, arabic: l.ar, options: opts, answer: opts.indexOf(l.en) });
    });
    shuffle(exprs).slice(0, 3).forEach((e, i) => {
      const opts = shuffle([e.ar, ...shuffle(exprs.filter((x) => x.ar !== e.ar)).slice(0, 2).map((x) => x.ar)]);
      qs.push({ kind: "mcq", id: `expr${i}`, prompt: `Which expression means “${e.en}”?`, options: opts, answer: opts.indexOf(e.ar), optionsAr: true });
    });
    const s = shuffle(pool)[0];
    qs.push({ kind: "speak", id: `${s.id}_speak`, prompt: "Record this line", text: s.ar, folder: "dialogue", fileKey: s.id });
    const t = shuffle(pool)[0];
    qs.push({ kind: "mcq", id: `${t.id}_who`, prompt: "Who says this line?", arabic: t.ar, options: [dlg.cast.A, dlg.cast.B, "The narrator"], answer: t.speaker === "A" ? 0 : 1 });
    return shuffle(qs).slice(0, 10);
  };

  const roleplayLines = dlg.lines.filter((l) => !isLocked("dialogue", globalIndex(l.id)));
  const rpLine = roleplayLines[rpIdx];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="rounded-2xl border border-mod-convo bg-gradient-to-r from-[#3A1A6B]/60 to-transparent p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl">💬</span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold">Module 5 · Conversation</h1>
            <p className="text-sm text-sand/60">{dlg.subtitle}</p>
          </div>
          <Button onClick={() => setQuizOpen(true)}>Take the 10-question test</Button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Progress pct={(learned / 20) * 100} color="#8f6fd8" />
          <span className="shrink-0 text-xs text-sand/50">{learned}/20 lines</span>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {DIALOGUES.map((d, i) => (
          <button key={d.id} onClick={() => { setStage(i); setLineIdx(0); setRpIdx(0); setRpLog([]); }}
            className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold",
              stage === i ? "border-gold bg-gold/20 text-gold" : "border-white/12 text-sand/60")}>{d.title}</button>
        ))}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setIntroOpen(true)} className="border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20">
            🌉 Linguistic Bridge Note
          </Button>
          {([1, 2, 3] as Phase[]).map((p) => (
            <button key={p} onClick={() => setPhase(p)}
              className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold",
                phase === p ? "border-gold bg-gold/20 text-gold" : "border-white/12 text-sand/60")}>
              Phase {p} · {p === 1 ? "Listen" : p === 2 ? "Practise" : "Role-play"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gold/25 bg-gold/10 p-3 text-xs text-sand/70">
        <div>
          📝 This dialogue bridges formal <b>MSA</b> with <b>Educated Spoken Arabic (ESA)</b> — the natural register used by native speakers.
        </div>
        <button onClick={() => setIntroOpen(true)} className="ml-2 shrink-0 font-semibold text-gold underline underline-offset-2">
          Learn about register →
        </button>
      </div>

      {phase === 1 && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">Listen with subtitles</h3>
            <Button size="sm" variant="ghost" onClick={async () => {
              for (const l of dlg.lines) {
                if (isLocked("dialogue", globalIndex(l.id))) break;
                setLineIdx(dlg.lines.indexOf(l));
                await play(audioPath("dialogue", l.id), l.ar, 1);
                await new Promise((r) => setTimeout(r, 250));
              }
            }}>▶ Play whole dialogue</Button>
          </div>
          <div className="space-y-2">
            {dlg.lines.map((l, i) => {
              const lock = isLocked("dialogue", globalIndex(l.id));
              return (
                <motion.div key={l.id} layout
                  className={cn("rounded-2xl border p-3 transition",
                    i === lineIdx ? "border-gold bg-gold/10" : "border-white/10",
                    l.speaker === "A" ? "sm:mr-16" : "sm:ml-16", lock && "opacity-50")}>
                  <div className="flex items-start gap-3">
                    <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold",
                      l.speaker === "A" ? "bg-[#3A1A6B]" : "bg-maroon")}>{l.name[0]}</span>
                      <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[11px] text-sand/50">
                        <span>{l.name}</span>
                        <span>·</span>
                        <span>{l.id}.mp3</span>
                        {l.note ? (
                          <span className="rounded bg-purple/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-300 border border-purple/30" title="Educated Spoken Arabic (ESA) register">
                            🟣 ESA (Spoken)
                          </span>
                        ) : (
                          <span className="rounded bg-azure/20 px-1.5 py-0.5 text-[10px] font-bold text-azure-300 border border-azure/30" title="Modern Standard Arabic (MSA) register">
                            🔵 MSA (Formal)
                          </span>
                        )}
                        {l.note && <Chip color="#8A3D8A">register note</Chip>}
                      </div>
                      <div className="ar mt-1 text-2xl">{l.ar}</div>
                      <div className="text-sm text-sand/60">{l.en}</div>
                      <div className="text-[11px] text-sand/35">{l.translit}</div>
                      {l.note && (
                        <div className="mt-2 rounded-xl border border-purple/30 bg-purple/10 p-2.5 text-[11px] text-purple-200">
                          <span className="font-bold text-gold">Register Bridge:</span> {l.note}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <Button size="sm" variant="ghost" disabled={lock}
                        onClick={() => { setLineIdx(i); play(audioPath("dialogue", l.id), l.ar, 1); award("dialogue", l.id, 25); }}>▶</Button>
                      <Button size="sm" variant="ghost" disabled={lock}
                        onClick={() => { setLineIdx(i); play(audioPath("dialogue", l.id), l.ar, 0.75); }}>0.75×</Button>
                    </div>
                  </div>
                  {lock && <div className="mt-2 flex items-center gap-2 text-xs text-gold"><LockIcon /> Premium line — <button className="underline" onClick={() => setLockOpen(true)}>unlock</button></div>}
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}

      {phase === 2 && (
        <Card>
          <h3 className="font-bold">Line-by-line practice</h3>
          <p className="text-xs text-sand/50">Record each line — 80% similarity advances you.</p>
          {lineLocked ? (
            <div className="mt-4 text-center">
              <LockIcon className="mx-auto h-7 w-7 text-gold" />
              <Button className="mt-3" onClick={() => setLockOpen(true)}>Unlock all 20 lines</Button>
            </div>
          ) : (
            <>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
                <div className="text-xs text-sand/50">{line.name}</div>
                <div className="ar-c mt-2 text-3xl">{line.ar}</div>
                <div className="mt-1 text-sm text-sand/60">{line.en}</div>
              </div>
              <div className="mt-3">
                <AudioPlayer folder="dialogue" fileKey={line.id} text={line.ar}
                  onScore={(s) => { if (s >= 80) { award("dialogue", line.id, 25); setLineIdx((i) => Math.min(dlg.lines.length - 1, i + 1)); } }} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setLineIdx((i) => Math.max(0, i - 1))} disabled={lineIdx === 0}>→ Previous line</Button>
                <span className="text-xs text-sand/40">{lineIdx + 1} / {dlg.lines.length}</span>
                <Button variant="ghost" onClick={() => setLineIdx((i) => Math.min(dlg.lines.length - 1, i + 1))} disabled={lineIdx >= dlg.lines.length - 1}>Next line ←</Button>
              </div>
              <div className="mt-3 rounded-xl bg-black/25 p-3 text-xs text-sand/60">
                💡 Hint system: for ع, press the back of the throat (pharyngeal constriction); for ح, use a warm voiceless breath.
              </div>
            </>
          )}
        </Card>
      )}

      {phase === 3 && (
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-bold">Role-play</h3>
            <div className="flex gap-2">
              {(["A", "B"] as const).map((r) => (
                <button key={r} onClick={() => { setRole(r); setRpIdx(0); setRpLog([]); }}
                  className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold",
                    role === r ? "border-gold bg-gold/20 text-gold" : "border-white/12 text-sand/60")}>
                  I am {dlg.cast[r]}
                </button>
              ))}
            </div>
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { setRpIdx(0); setRpLog([]); }}>Restart</Button>
          </div>

          <div className="mt-4 max-h-72 space-y-2 overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3">
            <AnimatePresence>
              {rpLog.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={cn("max-w-[85%] rounded-2xl p-3", m.who === "you" ? "ml-auto bg-gold/15" : "bg-white/8")}>
                  <div className="ar text-xl">{m.text}</div>
                  {m.score !== undefined && <div className="text-[11px] text-sand/50">similarity {m.score}%</div>}
                </motion.div>
              ))}
            </AnimatePresence>
            {!rpLog.length && <div className="py-6 text-center text-sm text-sand/40">Press start — the app plays {dlg.cast[role === "A" ? "B" : "A"]}, you speak {dlg.cast[role]}.</div>}
          </div>

          {rpLine ? (
            rpLine.speaker === role ? (
              <div className="mt-3">
                <div className="mb-2 text-sm text-gold">Your turn — say: <span className="ar text-xl">{rpLine.ar}</span></div>
                <AudioPlayer folder="dialogue" fileKey={rpLine.id} text={rpLine.ar}
                  onScore={(s) => {
                    setRpLog((l) => [...l, { who: "you", text: rpLine.ar, score: s }]);
                    if (s >= 60) { setRpIdx((i) => i + 1); award("dialogue", rpLine.id, 25); }
                  }} />
              </div>
            ) : (
              <Button className="mt-3" onClick={async () => {
                setRpLog((l) => [...l, { who: "app", text: rpLine.ar }]);
                await play(audioPath("dialogue", rpLine.id), rpLine.ar, 1);
                setRpIdx((i) => i + 1);
              }}>▶ Play {rpLine.name}'s line</Button>
            )
          ) : (
            <div className="mt-4 rounded-xl border border-ok/40 bg-ok/10 p-4 text-center">
              <div className="font-bold text-ok">Role-play complete! +25 XP</div>
              <Button className="mt-2" size="sm" onClick={() => { setMastered("dialogue:roleplay"); addXp(25); }}>Claim & unlock badge</Button>
            </div>
          )}
        </Card>
      )}

      <Card>
        <h3 className="font-bold">Expression bank</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXPRESSIONS.map((g) => (
            <div key={g.group} className="rounded-2xl border border-white/10 p-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-gold">{g.group}</div>
              <div className="mt-2 space-y-1.5">
                {g.items.map((it) => (
                  <button key={it.ar} onClick={() => play(audioPath("dialogue", it.en.toLowerCase()), it.ar)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1 text-left hover:bg-white/5">
                    <span className="ar text-lg">{it.ar}</span>
                    <span className="text-xs text-sand/50">{it.en}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={introOpen} onClose={() => setIntroOpen(false)}>
        <div className="space-y-4 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-purple/20 text-3xl shadow-lg shadow-purple/10">
            🌉
          </div>
          <h2 className="text-xl font-extrabold text-gold">The Linguistic Bridge: MSA & ESA</h2>
          <p className="text-xs leading-relaxed text-sand/75 text-right sm:text-center" dir="ltr">
            Arabic is a living continuum. In real-world conversations, educated Arabs do not speak rigid dictionary MSA in casual settings. Instead, they use a natural bridge known as <b>Educated Spoken Arabic (ESA)</b>.
          </p>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left space-y-3">
            <div className="flex items-start gap-2.5 text-xs">
              <span className="rounded bg-azure/20 px-1.5 py-0.5 font-bold text-azure-300 border border-azure/30 shrink-0">🔵 MSA</span>
              <span className="text-sand/70">Modern Standard Arabic — formal, written, and used across the Arab world in official contexts, news, and literature.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs">
              <span className="rounded bg-purple/20 px-1.5 py-0.5 font-bold text-purple-300 border border-purple/30 shrink-0">🟣 ESA</span>
              <span className="text-sand/70">Educated Spoken Arabic — the elevated spoken register that blends MSA grammar with common conversational expressions (like <span className="ar text-sm">شو</span> instead of <span className="ar text-sm">ماذا</span>).</span>
            </div>
          </div>
          <p className="text-[11px] text-sand/45">
            By labeling these registers, Arabic1010 ensures you learn formal grammar while gaining the practical fluency needed to actually talk to people!
          </p>
          <Button className="w-full" onClick={() => setIntroOpen(false)}>
            Got it, let's practice! →
          </Button>
        </div>
      </Modal>

      <Modal open={quizOpen} onClose={() => setQuizOpen(false)} wide>
        <Quiz module="dialogue" subId={dlg.id} title="Conversation test" generate={generate} onClose={() => setQuizOpen(false)} />
      </Modal>
      <UpgradeModal open={lockOpen} onClose={() => setLockOpen(false)} />
      {!DEV_UNLOCK_ALL && !user?.premium && <p className="text-center text-xs text-sand/40">Free tier: dialogue lines 1–4 (greetings).</p>}
      <span className="hidden">{isLearned("dialogue", line.id) ? "" : ""}</span>
    </div>
  );
}
