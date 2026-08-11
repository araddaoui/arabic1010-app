import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, Button, Chip, Progress, Stat, EmptyState } from "@/components/ui";
import { useApp, MODULE_META, type ModuleKey } from "@/lib/store";
import { VOCAB, type VocabWord } from "@/data/vocab";
import { DIALOGUES } from "@/data/dialogue";
import { COGNATES } from "@/data/cognates";
import { LETTERS, VOWELS } from "@/data/letters";
import { countries as COUNTRIES } from "@/lib/data/countries";
import { NUMBERS } from "@/data/numbers";
import { cn } from "@/utils/cn";

type Tab = "users" | "feedback" | "audio" | "content" | "analytics";

const AUDIO_SETS = [
  { folder: "cognates", speaker: "Ola", files: COGNATES.map((c) => `${c.id}.mp3`) },
  { folder: "letters", speaker: "Ali", files: LETTERS.flatMap((l) => VOWELS.map((v) => `${l.id}_${v.key}.mp3`)) },
  { folder: "words", speaker: "Khouloud", files: VOCAB.map((w) => `${w.id}.mp3`) },
  { folder: "dialogue", speaker: "Ali & Emna", files: DIALOGUES.flatMap((d) => d.lines.map((l) => `${l.id}.mp3`)) },
  { folder: "numbers", speaker: "Amer", files: NUMBERS.map((n) => `${n.n}.mp3`) },
  { folder: "countries", speaker: "Houda", files: COUNTRIES.map((c) => `${c.id}.mp3`) },
];

export default function Admin() {
  const { db, replyFeedback, user } = useApp();
  const [tab, setTab] = useState<Tab>("users");
  const [filter, setFilter] = useState<string>("all");
  const [reply, setReply] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [words, setWords] = useState<VocabWord[]>(VOCAB);
  const [lines, setLines] = useState(DIALOGUES[0].lines);
  const [uploaded, setUploaded] = useState<Record<string, number>>({ cognates: 30, numbers: 21, countries: 22, words: 20, dialogue: 20, letters: 168 });
  const [openFolder, setOpenFolder] = useState<string | null>("cognates");

  const feedback = db.feedback.filter((f) => filter === "all" || f.category === filter || f.status === filter);
  const totalFiles = AUDIO_SETS.reduce((s, a) => s + a.files.length, 0);
  const totalUploaded = Object.values(uploaded).reduce((a, b) => a + b, 0);

  const analytics = useMemo(() => {
    const mods = Object.keys(MODULE_META) as ModuleKey[];
    return mods.map((m) => {
      const learners = db.users.filter((u) => Object.values(u.progress).some((p) => p.module === m));
      const totalPct = db.users.reduce((s, u) => {
        const n = Object.values(u.progress).filter((p) => p.module === m && p.masteryPct >= 60).length;
        return s + n / MODULE_META[m].total;
      }, 0);
      const attempts = db.users.flatMap((u) => Object.values(u.progress).filter((p) => p.module === m));
      const pass = attempts.filter((a) => a.masteryPct >= 80).length;
      return {
        module: m,
        completion: Math.round((totalPct / db.users.length) * 100),
        learners: learners.length,
        passRate: attempts.length ? Math.round((pass / attempts.length) * 100) : 0,
      };
    });
  }, [db]);

  if (user?.role !== "admin") {
    return <EmptyState icon="⛔" title="Admin only" body="Sign in with admin@arabic1010.app to view the admin dashboard." />;
  }

  const TABS: [Tab, string][] = [["users", "👥 Users"], ["feedback", "💌 Feedback"], ["audio", "🎧 Audio assets"], ["content", "📝 Content"], ["analytics", "📊 Analytics"]];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="rounded-2xl border border-maroon bg-gradient-to-r from-maroon/50 to-transparent p-5">
        <h1 className="text-xl font-extrabold">🛠️ Admin dashboard</h1>
        <p className="text-sm text-sand/60">Users, feedback, audio pipeline, content CRUD and analytics.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Users" value={db.users.length} sub={`${db.users.filter((u) => u.premium).length} premium`} />
        <Stat label="Open feedback" value={db.feedback.filter((f) => f.status === "open").length} sub={`${db.feedback.length} total`} color="#C9A227" />
        <Stat label="Audio uploaded" value={`${totalUploaded}/${totalFiles}`} sub="Bundled public/audio" color="#1D9E75" />
        <Stat label="Avg. streak" value={Math.round(db.users.reduce((s, u) => s + u.streak, 0) / db.users.length)} sub="days" />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold",
              tab === t ? "border-gold bg-gold/20 text-gold" : "border-white/12 text-sand/60")}>{l}</button>
        ))}
      </div>

      {tab === "users" && (
        <Card className="overflow-x-auto p-0">
          <div className="flex items-center gap-2 border-b border-white/10 p-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…"
              className="w-full max-w-xs rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm outline-none focus:border-gold" />
            <span className="text-xs text-sand/40">{db.users.length} rows</span>
          </div>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-[11px] uppercase tracking-widest text-sand/40">
              <tr>{["User", "Role", "XP", "Streak", "Plan", "Progress", "Joined"].map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr>
            </thead>
            <tbody>
              {db.users.filter((u) => (u.name + u.email).toLowerCase().includes(q.toLowerCase())).map((u) => {
                const learned = Object.values(u.progress).filter((p) => p.masteryPct >= 60).length;
                return (
                  <tr key={u.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-4 py-2">
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-[11px] text-sand/40">{u.email}</div>
                    </td>
                    <td className="px-4 py-2">{u.role === "admin" ? <Chip color="#6B1A1A">admin</Chip> : "user"}</td>
                    <td className="px-4 py-2 font-bold text-gold">{u.xp}</td>
                    <td className="px-4 py-2">🔥 {u.streak}</td>
                    <td className="px-4 py-2">{u.premium ? <Chip color="#C9A227">premium</Chip> : <span className="text-sand/40">free</span>}</td>
                    <td className="px-4 py-2 w-40"><Progress pct={(learned / 141) * 100} /><span className="text-[10px] text-sand/40">{learned} items</span></td>
                    <td className="px-4 py-2 text-xs text-sand/40">{u.createdAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "feedback" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {["all", "bug", "suggestion", "content", "UX", "open", "resolved"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("rounded-full border px-3 py-1 text-[11px] capitalize",
                  filter === f ? "border-gold bg-gold/20 text-gold" : "border-white/12 text-sand/55")}>{f}</button>
            ))}
          </div>
          {feedback.length === 0 && <EmptyState icon="📭" title="No feedback matches" body="Try a different filter." />}
          {feedback.map((f) => (
            <motion.div key={f.id} layout>
              <Card>
                <div className="flex flex-wrap items-center gap-2 text-xs text-sand/50">
                  <span className="font-semibold text-sand">{f.userName}</span>
                  <span className="text-gold">{"★".repeat(f.rating)}<span className="text-sand/20">{"★".repeat(5 - f.rating)}</span></span>
                  <Chip>{f.category}</Chip>
                  <Chip color={f.status === "resolved" ? "#1D9E75" : "#C9A227"}>{f.status}</Chip>
                  <span className="ml-auto">{f.createdAt}</span>
                </div>
                <p className="mt-2 text-sm">{f.text}</p>
                {f.reply ? (
                  <div className="mt-2 rounded-lg bg-ok/10 p-2 text-xs text-emerald-200">Reply: {f.reply}</div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <input value={reply[f.id] ?? ""} onChange={(e) => setReply({ ...reply, [f.id]: e.target.value })}
                      placeholder="Write a reply…" className="flex-1 rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm outline-none focus:border-gold" />
                    <Button size="sm" disabled={!reply[f.id]?.trim()} onClick={() => replyFeedback(f.id, reply[f.id])}>Send & resolve</Button>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {tab === "audio" && (
        <div className="space-y-3">
          <Card>
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold">Upload pipeline — {totalUploaded}/{totalFiles} files verified</span>
              <span className="text-xs text-sand/40">Vercel static assets</span>
            </div>
            <div className="mt-2"><Progress pct={(totalUploaded / totalFiles) * 100} color="#1D9E75" /></div>
          </Card>
          {AUDIO_SETS.map((s) => {
            const up = uploaded[s.folder] ?? 0;
            return (
              <Card key={s.folder}>
                <button className="flex w-full items-center gap-3 text-left" onClick={() => setOpenFolder(openFolder === s.folder ? null : s.folder)}>
                  <span className="text-lg">🎧</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">/audio/{s.folder}/</div>
                    <div className="text-[11px] text-sand/45">Speaker: {s.speaker} · {up}/{s.files.length} uploaded</div>
                  </div>
                  <div className="w-32"><Progress pct={(up / s.files.length) * 100} color={up === s.files.length ? "#1D9E75" : "#C9A227"} /></div>
                  <span className="text-sand/40">{openFolder === s.folder ? "▾" : "▸"}</span>
                </button>
                {openFolder === s.folder && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {s.files.slice(0, 60).map((f, i) => (
                        <span key={f} className={cn("rounded-md px-2 py-1 text-[11px]", i < up ? "bg-ok/15 text-emerald-200" : "bg-white/5 text-sand/40")}>
                          {i < up ? "✓" : "○"} {f}
                        </span>
                      ))}
                      {s.files.length > 60 && <span className="px-2 py-1 text-[11px] text-sand/30">+{s.files.length - 60} more…</span>}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <label className="cursor-pointer rounded-xl border border-dashed border-gold/40 px-4 py-2 text-xs text-gold hover:bg-gold/10">
                        ⬆ Upload .mp3 files
                        <input type="file" accept="audio/*" multiple className="hidden"
                          onChange={(e) => {
                            const n = e.target.files?.length ?? 0;
                            setUploaded((u) => ({ ...u, [s.folder]: Math.min(s.files.length, (u[s.folder] ?? 0) + n) }));
                          }} />
                      </label>
                      <Button size="sm" variant="ghost" onClick={() => setUploaded((u) => ({ ...u, [s.folder]: s.files.length }))}>Mark folder verified</Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tab === "content" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="font-bold">Vocabulary ({words.length})</h3>
            <div className="mt-3 max-h-96 space-y-2 overflow-auto pr-1">
              {words.map((w, i) => (
                <div key={w.id} className="flex items-center gap-2 rounded-xl bg-black/25 p-2">
                  <span className="text-xl">{w.emoji}</span>
                  <input value={w.ar} dir="rtl"
                    onChange={(e) => setWords((ws) => ws.map((x, j) => (j === i ? { ...x, ar: e.target.value } : x)))}
                    className="ar w-28 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-lg outline-none focus:border-gold" />
                  <input value={w.en}
                    onChange={(e) => setWords((ws) => ws.map((x, j) => (j === i ? { ...x, en: e.target.value } : x)))}
                    className="flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm outline-none focus:border-gold" />
                  <button onClick={() => setWords((ws) => ws.filter((_, j) => j !== i))} className="rounded-lg px-2 text-err hover:bg-err/15">✕</button>
                </div>
              ))}
            </div>
            <Button size="sm" className="mt-3" onClick={() => setWords((ws) => [...ws, { id: `new${ws.length}`, ar: "جَديد", bare: "جديد", en: "new word", translit: "jadīd", emoji: "🆕", scene: false, writingFocus: false }])}>+ Add word</Button>
          </Card>

          <Card>
            <h3 className="font-bold">Dialogue — {DIALOGUES[0].title}</h3>
            <div className="mt-3 max-h-96 space-y-2 overflow-auto pr-1">
              {lines.map((l, i) => (
                <div key={l.id} className="rounded-xl bg-black/25 p-2">
                  <div className="flex items-center gap-2 text-[11px] text-sand/45">
                    <Chip color={l.speaker === "A" ? "#3A1A6B" : "#6B1A1A"}>{l.name}</Chip>{l.id}.mp3
                    <button onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} className="ml-auto text-err">✕</button>
                  </div>
                  <input value={l.ar} dir="rtl"
                    onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, ar: e.target.value } : x)))}
                    className="ar mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-lg outline-none focus:border-gold" />
                  <input value={l.en}
                    onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, en: e.target.value } : x)))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm outline-none focus:border-gold" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "analytics" && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-bold">Module completion rates</h3>
            <div className="mt-4 space-y-3">
              {analytics.map((a) => (
                <div key={a.module}>
                  <div className="flex justify-between text-xs text-sand/60">
                    <span>{MODULE_META[a.module].icon} {MODULE_META[a.module].title}</span>
                    <span>{a.completion}% avg · {a.learners} learners · {a.passRate}% pass</span>
                  </div>
                  <div className="mt-1"><Progress pct={a.completion} color={MODULE_META[a.module].color === "#7B2020" ? "#C9A227" : MODULE_META[a.module].color} /></div>
                </div>
              ))}
            </div>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="font-bold">Most common error patterns</h3>
              <ul className="mt-3 space-y-2 text-sm text-sand/70">
                {[["ع vs ح confusion in listening MCQ", 34], ["Missing dots on ث and ن in handwriting", 28], ["Eastern numerals ٦ / ٧ mixed up", 21], ["Long vowel ū vs short u", 17], ["شو / ما register confusion", 11]].map(([e, n]) => (
                  <li key={e as string} className="flex items-center gap-3">
                    <span className="flex-1">{e}</span>
                    <div className="w-28"><Progress pct={n as number} color="#B22222" height={6} /></div>
                    <span className="w-8 text-right text-xs text-sand/40">{n}%</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h3 className="font-bold">Quiz pass rate by module</h3>
              <div className="mt-4 flex h-48 items-end gap-3">
                {analytics.map((a) => (
                  <div key={a.module} className="flex flex-1 flex-col items-center gap-2">
                    <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(6, a.passRate)}%` }}
                      className="w-full rounded-t-lg" style={{ background: MODULE_META[a.module].color }} />
                    <span className="text-[10px] text-sand/40">{MODULE_META[a.module].icon}</span>
                    <span className="text-[10px] text-sand/50">{a.passRate}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
