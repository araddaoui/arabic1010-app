import { motion } from "framer-motion";
import { Card, Progress, Stat, Button, Chip } from "@/components/ui";
import { useApp, MODULE_META, BADGES, levelFromXp, type ModuleKey } from "@/lib/store";

const ORDER: ModuleKey[] = ["cognates", "letters", "numbers", "vocab", "dialogue", "map"];

export default function Dashboard({ navigate }: { navigate: (p: string) => void }) {
  const { user, learnedCount, dueItems } = useApp();
  if (!user) return null;
  const lv = levelFromXp(user.xp);
  const due = dueItems();
  const overall = Math.round(
    (ORDER.reduce((s, m) => s + learnedCount(m) / MODULE_META[m].total, 0) / ORDER.length) * 100
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="pattern relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-maroon/50 via-ink-2 to-ink p-6 sm:p-8">
        <div className="relative z-10 flex flex-wrap items-end gap-6">
          <div className="min-w-0 flex-1">
            <div className="ar text-2xl text-gold/90">أَهْلاً {user.name.split(" ")[0]}!</div>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Welcome back — {overall}% of the course complete</h1>
            <p className="mt-2 max-w-xl text-sm text-sand/60">
              {due.length > 0
                ? `${due.length} item${due.length > 1 ? "s are" : " is"} due for spaced-repetition review today.`
                : "Nothing due for review — perfect time to open a new module."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => navigate(due.length ? "/review" : "/cognates")}>
                {due.length ? `Review ${due.length} item${due.length > 1 ? "s" : ""}` : "Continue learning →"}
              </Button>
              <Button variant="ghost" onClick={() => navigate("/badges")}>🏅 {user.badges.length}/10 badges</Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-gold/25 bg-black/25 px-4 py-3">
              <div className="text-2xl font-extrabold text-gold">{user.xp}</div><div className="text-[10px] uppercase tracking-widest text-sand/50">XP</div>
            </div>
            <div className="rounded-2xl border border-gold/25 bg-black/25 px-4 py-3">
              <div className="text-2xl font-extrabold">🔥{user.streak}</div><div className="text-[10px] uppercase tracking-widest text-sand/50">streak</div>
            </div>
            <div className="rounded-2xl border border-gold/25 bg-black/25 px-4 py-3">
              <div className="text-2xl font-extrabold">{lv.level}</div><div className="text-[10px] uppercase tracking-widest text-sand/50">level</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ORDER.map((m, i) => {
          const meta = MODULE_META[m];
          const n = learnedCount(m);
          const pct = Math.round((n / meta.total) * 100);
          return (
            <motion.button key={m} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/${m}`)} className="group text-left">
              <Card className="h-full transition group-hover:border-gold/60 group-hover:bg-white/[.07]">
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl"
                    style={{ background: `${meta.color}55`, border: `1px solid ${meta.color}` }}>{meta.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold">{meta.title}</h3>
                      <span className="text-xs text-sand/45">{n}/{meta.total}</span>
                    </div>
                    <div className="ar text-sm text-gold/70">{meta.arabic}</div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-sand/55">{meta.blurb}</p>
                <div className="mt-3"><Progress pct={pct} color={meta.color === "#7B2020" ? "#C9A227" : meta.color} /></div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-sand/40">
                  <span>{pct}% complete</span>
                  {user.mastered.some((x) => x.startsWith(m)) && <Chip color="#1D9E75">mastered set</Chip>}
                </div>
              </Card>
            </motion.button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="font-bold">Recent badges</h3>
          <div className="mt-3 flex flex-wrap gap-3">
            {BADGES.map((b) => {
              const owned = user.badges.includes(b.id);
              return (
                <div key={b.id} title={b.desc}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${owned ? "border-gold/50 bg-gold/10" : "border-white/10 opacity-40"}`}>
                  <span className="text-xl">{b.icon}</span>
                  <span className="text-xs font-semibold">{b.name}</span>
                </div>
              );
            })}
          </div>
        </Card>
        <div className="grid gap-4">
          <Stat label="XP to next level" value={`${lv.next - lv.into}`} sub={`Level ${lv.level} → ${lv.level + 1}`} color="#C9A227" />
          <Stat label="Items in review queue" value={due.length} sub="Spaced repetition: 1 → 3 → 7 → 14 → 30 days" color="#1D9E75" />
        </div>
      </div>
    </div>
  );
}
