import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Progress, Modal, Confetti } from "@/components/ui";
import { useApp, levelFromXp, MODULE_META, BADGES, DEV_UNLOCK_ALL, type ModuleKey } from "@/lib/store";
import { cn } from "@/utils/cn";

const NAV: { path: string; label: string; icon: string }[] = [
  { path: "/", label: "Dashboard", icon: "🏠" },
  { path: "/cognates", label: "Cognates", icon: "🌉" },
  { path: "/letters", label: "Letters", icon: "🔤" },
  { path: "/numbers", label: "Numbers", icon: "🔢" },
  { path: "/vocab", label: "Vocabulary", icon: "📚" },
  { path: "/typing", label: "Typing", icon: "⌨️" },
  { path: "/dialogue", label: "Conversation", icon: "💬" },
  { path: "/map", label: "Arab World", icon: "🗺️" },
  { path: "/review", label: "Review", icon: "🔁" },
  { path: "/badges", label: "Badges", icon: "🏅" },
  { path: "/settings", label: "Settings", icon: "⚙️" },
];

export function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { upgrade } = useApp();
  const [plan, setPlan] = useState<"monthly" | "yearly" | "lifetime">("monthly");
  const plans = {
    monthly: { price: "$5", per: "/month", note: "14-day free trial" },
    yearly: { price: "$39.99", per: "/year", note: "Save 33%" },
    lifetime: { price: "$29.99", per: " once", note: "Early access to new content" },
  } as const;
  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-center">
        <div className="text-4xl">✨</div>
        <h3 className="mt-2 text-xl font-extrabold">Unlock all of Arabic1010</h3>
        <p className="mt-1 text-sm text-sand/60">You reached a premium item. Free covers a taster of every module.</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {(Object.keys(plans) as (keyof typeof plans)[]).map((k) => (
          <button key={k} onClick={() => setPlan(k)}
            className={cn("rounded-xl border p-3 text-center transition", plan === k ? "border-gold bg-gold/15" : "border-white/12 hover:bg-white/5")}>
            <div className="text-xs uppercase tracking-wide text-sand/50">{k}</div>
            <div className="mt-1 font-bold">{plans[k].price}<span className="text-xs font-normal text-sand/50">{plans[k].per}</span></div>
          </button>
        ))}
      </div>
      <ul className="mt-4 space-y-1.5 text-sm text-sand/75">
        {["All 30 cognates, 28 letters, 20 words, 22 countries", "Handwriting canvas with dot-check feedback", "Pronunciation recording + waveform comparison", "Spaced-repetition review mode & analytics", "Offline mode, no ads, PDF certificate"].map((f) => (
          <li key={f} className="flex gap-2"><span className="text-ok">✓</span>{f}</li>
        ))}
      </ul>
      <div className="mt-3 text-center text-xs text-sand/40">{plans[plan].note} · Secure checkout by Stripe</div>
      <div className="mt-4 flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>Not now</Button>
        <Button className="flex-1" onClick={() => { upgrade(); onClose(); }}>Continue to Stripe →</Button>
      </div>
    </Modal>
  );
}

export default function Layout({ path, navigate, children }: { path: string; navigate: (p: string) => void; children: React.ReactNode }) {
  const { user, signOut, newBadge, clearBadge, toast, learnedCount } = useApp();
  const [open, setOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const lv = levelFromXp(user?.xp ?? 0);
  const badge = BADGES.find((b) => b.id === newBadge);

  const nav = (p: string) => { navigate(p); setOpen(false); };

  return (
    <div className="flex min-h-screen">
      {/* sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-gold/15 glass p-4 transition-transform lg:static lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <button onClick={() => nav("/")} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-gold via-coral to-maroon text-lg font-black text-ink shadow-lg shadow-gold/20">ع</span>
          <span>
            <span className="block text-sm font-extrabold tracking-wide">Arabic<span className="text-gold">1010</span></span>
            <span className="ar majestic-arabic block text-[15px]">العَرَبِيَّة</span>
          </span>
        </button>

        <nav className="mt-4 space-y-1">
          {NAV.map((n) => {
            const modKey = n.path.slice(1) as ModuleKey;
            const meta = MODULE_META[modKey];
            const active = path === n.path;
            return (
              <button key={n.path} onClick={() => nav(n.path)}
                className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  active ? "bg-gradient-to-r from-gold/18 via-azure/10 to-transparent font-semibold text-gold shadow-inner shadow-gold/10" : "text-sand/70 hover:bg-azure/10 hover:text-sand")}>
                <span>{n.icon}</span>
                <span className="flex-1 text-left">{n.label}</span>
                {meta && <span className="text-[10px] text-sand/40">{learnedCount(modKey)}/{meta.total}</span>}
              </button>
            );
          })}
          {user?.role === "admin" && (
            <button onClick={() => nav("/admin")}
              className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                path === "/admin" ? "bg-maroon/40 font-semibold text-gold" : "text-sand/70 hover:bg-white/5")}>
              <span>🛠️</span><span className="flex-1 text-left">Admin</span>
            </button>
          )}
        </nav>

        {DEV_UNLOCK_ALL ? (
          <div className="mt-5 rounded-2xl border border-ok/30 bg-ok/10 p-3">
            <div className="text-xs font-bold text-ok">🔓 Dev build</div>
            <p className="mt-1 text-[11px] text-sand/55">
              Freemium gating is off. All modules and items are unlocked.
            </p>
          </div>
        ) : !user?.premium ? (
          <div className="mt-5 rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/15 to-transparent p-4">
            <div className="text-sm font-bold text-gold">Go Premium</div>
            <p className="mt-1 text-xs text-sand/60">Unlock all 6 modules, handwriting AI and offline mode.</p>
            <Button size="sm" className="mt-3 w-full" onClick={() => setUpgradeOpen(true)}>Upgrade — $5/mo</Button>
          </div>
        ) : null}
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-gold/15 glass px-4 py-3">
          <button className="rounded-lg p-2 hover:bg-white/10 lg:hidden" onClick={() => setOpen(true)} aria-label="Menu">☰</button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-sand/60">
              <span className="font-bold text-gold">Level {lv.level}</span>
              <span className="hidden sm:inline">· {user?.xp ?? 0} XP</span>
              <span className="ml-auto hidden sm:inline">{lv.into}/{lv.next} to level {lv.level + 1}</span>
            </div>
            <div className="mt-1.5 max-w-md"><Progress pct={lv.pct} /></div>
          </div>
          <motion.div whileHover={{ y: -1 }} className="flex items-center gap-2 rounded-xl border border-gold/25 bg-gradient-to-r from-gold/12 to-coral/10 px-3 py-1.5 text-sm shadow-lg shadow-gold/5">
            <span>🔥</span><span className="font-bold">{user?.streak ?? 0}</span>
            <span className="hidden text-xs text-sand/50 sm:inline">day streak</span>
          </motion.div>
          {DEV_UNLOCK_ALL ? (
            <span className="hidden rounded-lg bg-ok/20 px-2 py-1 text-[11px] font-bold text-ok sm:inline">ALL UNLOCKED</span>
          ) : user?.premium ? (
            <span className="hidden rounded-lg bg-gold/20 px-2 py-1 text-[11px] font-bold text-gold sm:inline">PREMIUM</span>
          ) : (
            <Button size="sm" variant="outline" className="hidden sm:inline-flex" onClick={() => setUpgradeOpen(true)}>Upgrade</Button>
          )}
          <button onClick={signOut} className="grid h-9 w-9 place-items-center rounded-full bg-maroon text-sm font-bold" title={`${user?.name} — sign out`}>
            {user?.name?.[0] ?? "?"}
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
        <footer className="border-t border-white/5 px-6 py-4 text-center text-xs text-sand/30">
          <div>Arabic1010 · Modern Standard Arabic for beginners · 281 native-speaker audio assets · v2.0</div>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-sand/45">
            <a href="#/terms" className="transition hover:text-gold">Terms of Service</a>
            <a href="#/privacy" className="transition hover:text-gold">Privacy Policy</a>
            <a href="#/contact" className="transition hover:text-gold">Contact</a>
          </div>
        </footer>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      <Modal open={!!badge} onClose={clearBadge}>
        <Confetti fire={!!badge} />
        <div className="text-center">
          <motion.div initial={{ scale: 0.7, rotate: -14, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 180, damping: 12 }} className="mx-auto grid h-28 w-28 place-items-center rounded-full border border-gold/40 bg-gradient-to-br from-gold/20 via-azure/15 to-violet/20 text-7xl shadow-2xl shadow-gold/20">
            {badge?.icon}
          </motion.div>
          <div className="mt-2 text-xs uppercase tracking-[0.3em] text-gold">Badge unlocked</div>
          <h3 className="mt-1 text-2xl font-extrabold">{badge?.name}</h3>
          <p className="mt-1 text-sand/60">{badge?.desc}</p>
          <Button className="mt-5 w-full" onClick={clearBadge}>Continue learning</Button>
        </div>
      </Modal>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-full border border-emerald/45 bg-gradient-to-r from-ink via-ink-2 to-ink px-5 py-2.5 text-sm font-semibold text-gold shadow-xl shadow-emerald/10">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
