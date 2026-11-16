import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";
import { useApp } from "@/lib/store";
import { isSupabaseAuthEnabled } from "@/lib/config";

export default function Auth() {
  const { signIn, signUp } = useApp();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const msg = mode === "in" ? await signIn(email, password) : await signUp(name, email, password);
    setErr(msg); setBusy(false);
  };

  const input = "w-full rounded-xl border border-white/12 bg-black/25 px-4 py-3 text-sm outline-none focus:border-gold/70";
  const label = "mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-sand/55";

  return (
    <div className="pattern flex min-h-screen items-center justify-center p-3 sm:p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-gold/25 glass md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-maroon/70 via-ink to-ink p-8 md:flex">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-gold to-maroon text-xl font-black text-ink">ع</span>
              <span className="text-lg font-extrabold">Arabic<span className="text-gold">1010</span></span>
            </div>
            <h1 className="mt-8 text-3xl font-extrabold leading-tight">
              Modern Standard Arabic,<br />built the way adults learn.
            </h1>
            <p className="mt-3 text-sm text-sand/60">
              Cognates that prove you already know Arabic · 28 letters with handwriting feedback · numbers, vocabulary, real dialogue and the whole Arab world map.
            </p>
          </div>
          <div className="ar mt-8 text-2xl text-gold/80">أَهْلاً وَسَهْلاً بِكُم</div>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-sand/50">
            <div><div className="text-lg font-bold text-gold">7</div>modules</div>
            <div><div className="text-lg font-bold text-gold">329</div>audio files</div>
            <div><div className="text-lg font-bold text-gold">12</div>badges</div>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <div className="mb-4 md:hidden">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-gold to-maroon text-base font-black text-ink">ع</span>
              <span className="text-base font-extrabold">Arabic<span className="text-gold">1010</span></span>
              <span dir="rtl" className="ml-auto font-arabic text-base font-extrabold">اَلْعَرَبِيَّة</span>
            </div>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold/80">Beginner-friendly · Modern Standard Arabic</p>
            <h1 className="mt-1 text-xl font-extrabold leading-snug">Start reading and practicing Modern Standard Arabic.</h1>
            <p className="mt-1 text-xs leading-relaxed text-sand/60">Explore familiar words, letters, and everyday language — one short practice at a time.</p>
            <p className="mt-2 text-[10px] text-sand/40">7 modules · 329 audio files · 12 badges</p>
          </div>

          <div className="mb-4 flex rounded-xl bg-black/25 p-1 sm:mb-6">
            {(["in", "up"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setErr(null); }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${mode === m ? "bg-gold text-ink" : "text-sand/60"}`}>
                {m === "in" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "up" && (
              <div>
                <label htmlFor="auth-name" className={label}>Full name</label>
                <input id="auth-name" autoComplete="name" className={input} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div>
              <label htmlFor="auth-email" className={label}>Email address</label>
              <input id="auth-email" autoComplete="email" className={input} type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="auth-password" className={label}>{mode === "up" ? "Create a password" : "Password"}</label>
              <input id="auth-password" autoComplete={mode === "up" ? "new-password" : "current-password"} className={input} type="password" placeholder={mode === "up" ? "Create a password" : "Password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {mode === "up" && <p className="text-[11px] text-sand/40">Passwords are checked against known breach lists (leaked-password protection enabled).</p>}
            {err && <div className="rounded-lg border border-err/50 bg-err/15 p-3 text-xs text-red-200">{err}</div>}
            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create my account"}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-sand/30">
            <span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" />
          </div>

          {!isSupabaseAuthEnabled && <>
            {/* Demo mode — clearly labelled, no pretence of real Google OAuth */}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowDemo((s) => !s)}
            >
              🎓 Try a demo account
            </Button>

            {showDemo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 space-y-2 rounded-xl border border-gold/20 bg-black/20 p-3 text-[11px] text-sand/60"
            >
              <div className="font-semibold text-sand/80">Demo accounts — pre-loaded with sample progress</div>
              <p className="text-sand/45">
                These are local accounts stored in your browser. Data resets if you clear
                browser storage. No real Google login is available in this release.
              </p>
              <button
                className="mt-2 w-full rounded-lg border border-gold/30 bg-gold/10 py-2 text-xs font-semibold text-gold hover:bg-gold/20 transition"
                onClick={() => {
                  setEmail("learner@arabic1010.app");
                  setPassword("arabic1010");
                  setMode("in");
                  setShowDemo(false);
                }}
              >
                Learner demo — Claudia Reyes (5/30 cognates, 3/28 letters)
              </button>
              <button
                className="w-full rounded-lg border border-white/15 bg-white/5 py-2 text-xs font-semibold text-sand/70 hover:bg-white/10 transition"
                onClick={() => {
                  setEmail("admin@arabic1010.app");
                  setPassword("arabic1010");
                  setMode("in");
                  setShowDemo(false);
                }}
              >
                Admin demo — Dr. Nadia Haddad (dashboard access)
              </button>
              <p className="text-sand/35 text-[10px]">
                Password for both demo accounts: <span className="font-mono">arabic1010</span>
              </p>
            </motion.div>
            )}
          </>}

          <p className="mt-4 text-center text-[10px] text-sand/30">
            {isSupabaseAuthEnabled ? "Arabic1010 · secure account authentication enabled" : "Arabic1010 · progress saved locally · no data sent to any server in this release"}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
