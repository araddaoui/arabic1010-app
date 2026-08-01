import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";
import { useApp } from "@/lib/store";

export default function Auth() {
  const { signIn, signUp, signInGoogle } = useApp();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("learner@arabic1010.app");
  const [password, setPassword] = useState("arabic1010");
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

  return (
    <div className="pattern flex min-h-screen items-center justify-center p-4">
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

        <div className="p-8">
          <div className="mb-6 flex rounded-xl bg-black/25 p-1">
            {(["in", "up"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setErr(null); }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${mode === m ? "bg-gold text-ink" : "text-sand/60"}`}>
                {m === "in" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "up" && (
              <input className={input} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            )}
            <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className={input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {mode === "up" && <p className="text-[11px] text-sand/40">Passwords are checked against known breach lists (leaked-password protection enabled).</p>}
            {err && <div className="rounded-lg border border-err/50 bg-err/15 p-3 text-xs text-red-200">{err}</div>}
            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create my account"}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-sand/30">
            <span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" />
          </div>

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

          <p className="mt-4 text-center text-[10px] text-sand/30">
            Arabic1010 · progress saved locally · no data sent to any server in this release
          </p>
        </div>
      </motion.div>
    </div>
  );
}
