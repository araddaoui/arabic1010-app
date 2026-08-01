import { motion } from "framer-motion";
import { Card, Progress, Chip } from "@/components/ui";
import { useApp, BADGES, MODULE_META, type ModuleKey } from "@/lib/store";

const XP_TABLE: [string, string][] = [
  ["First time learning a cognate", "+10"],
  ["Learning a letter", "+15"],
  ["Mastering a number", "+10"],
  ["Learning a vocabulary word", "+12"],
  ["Completing a dialogue phase", "+25"],
  ["Passing a quiz (≥80%)", "+20"],
  ["Daily login", "+5"],
  ["7 / 30 / 100-day streak", "+50 bonus"],
];

export default function Badges() {
  const { user, learnedCount } = useApp();
  if (!user) return null;
  const mods = Object.keys(MODULE_META) as ModuleKey[];
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <h1 className="text-2xl font-extrabold">Badges & progress</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {BADGES.map((b, i) => {
          const owned = user.badges.includes(b.id);
          return (
            <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className={owned ? "border-gold/60 text-center" : "text-center opacity-45"}>
                <div className="text-4xl">{b.icon}</div>
                <div className="mt-2 text-sm font-bold">{b.name}</div>
                <div className="mt-1 text-[11px] text-sand/50">{b.desc}</div>
                {owned && <div className="mt-2"><Chip color="#1D9E75">unlocked</Chip></div>}
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-bold">Module progress</h3>
          <div className="mt-3 space-y-3">
            {mods.map((m) => {
              const meta = MODULE_META[m];
              const n = learnedCount(m);
              return (
                <div key={m}>
                  <div className="flex justify-between text-xs text-sand/60">
                    <span>{meta.icon} {meta.title}</span><span>{n}/{meta.total}</span>
                  </div>
                  <div className="mt-1"><Progress pct={(n / meta.total) * 100} color={meta.color === "#7B2020" ? "#C9A227" : meta.color} /></div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <h3 className="font-bold">XP economy</h3>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {XP_TABLE.map(([a, b]) => (
                <tr key={a} className="border-b border-white/5">
                  <td className="py-1.5 text-sand/70">{a}</td>
                  <td className="py-1.5 text-right font-bold text-gold">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 rounded-xl bg-black/25 p-3 text-xs text-sand/60">
            Mastery gate: score ≥80% on a 10-question quiz to lock a sub-module. Below that you retry with a fresh question set.
          </div>
        </Card>
      </div>
    </div>
  );
}
