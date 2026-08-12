import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";
import { useApp } from "@/lib/store";

export default function Auth() {
  const { signIn } = useApp();
  const [mode, setMode] = useState<"in" | "soon">("in");
  const [email, setEmail] = useState("learner@arabic1010.com");
  const [password, setPassword] = useState("arabic1010");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const msg = await signIn(email, password);
    setErr(msg); setBusy(false);
  };

  const launchPreview = async () => {
    setMode("in");
    setBusy(true); setErr(null);
    const msg = await signIn("learner@arabic1010.com", "arabic1010");
    setErr(msg); setBusy(false);
  };

  const input = "w-full rounded-xl border border-white/12 bg-black/25 px-4 py-3 text-sm outline-none focus:border-gold/70";

  return (
    <div className="pattern flex min-h-screen flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-gold/25 glass md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-maroon/70 via-ink to-ink p-8 md:flex">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-gold to-maroon text-xl font-black text-ink">ع</span>
              <span className="text-lg font-extrabold">Arabic<span className="text-gold">1010</span></span>
              <span className="ar majestic-arabic ml-auto text-2xl" aria-label="Arabic language">العَرَبِيَّة</span>
            </div>
            <h1 className="mt-8 text-3xl font-extrabold leading-tight">
              Modern Standard Arabic<br />for every learner.
            </h1>
            <p className="mt-3 text-sm text-sand/60">
              Cognates that prove you already know Arabic · letters with handwriting and typing practice · native pronunciation, numbers, vocabulary, real dialogue and the whole Arab world map.
            </p>
          </div>
          <div className="mt-8 flex flex-col items-center text-center">
            <div className="majestic-arabic majestic-arabic-center text-4xl sm:text-5xl" aria-label="Welcome to Arabic">أَهْلاً وَسَهْلاً بِكُم</div>
            <img
              className="mt-2 h-auto w-36 object-contain drop-shadow-[0_0_22px_rgba(239,191,66,0.28)] sm:w-44"
              src="/arabic1010-four-hands.png"
              alt="Four welcoming hands with different skin tones meeting in unity"
            />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-sand/50">
            <div><div className="text-lg font-bold text-gold">7</div>modules</div>
            <div><div className="text-lg font-bold text-gold">281</div>audio files</div>
            <div><div className="text-lg font-bold text-gold">12</div>badges</div>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-6 flex rounded-xl bg-black/25 p-1">
            <button onClick={() => { setMode("in"); setErr(null); }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${mode === "in" ? "bg-gold text-ink" : "text-sand/60"}`}>
              Sign in
            </button>
            <button onClick={() => { setMode("soon"); setErr(null); }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${mode === "soon" ? "bg-gold text-ink" : "text-sand/60"}`}>
              Create account — coming soon
            </button>
          </div>

          {mode === "in" ? (
            <form onSubmit={submit} className="space-y-3">
              <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input className={input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              {err && <div className="rounded-lg border border-err/50 bg-err/15 p-3 text-xs text-red-200">{err}</div>}
              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {busy ? "Please wait…" : "Sign in"}
              </Button>
            </form>
          ) : (
            <div className="space-y-3 rounded-xl border border-gold/25 bg-gold/5 p-4 text-center">
              <div className="majestic-arabic text-3xl" aria-label="Coming soon">قريباً</div>
              <h2 className="text-base font-bold text-sand">Secure learner accounts are coming soon.</h2>
              <p className="text-xs leading-relaxed text-sand/55">We are preparing a simple email-and-password account system with secure progress storage. Until then, the Preview account is the complete way to explore the learning experience.</p>
              <Button type="button" className="w-full" onClick={launchPreview} disabled={busy}>
                {busy ? "Opening Preview…" : "Try the Preview"}
              </Button>
            </div>
          )}

          <div className="my-4 flex items-center gap-3 text-xs text-sand/30">
            <span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" />
          </div>

          {/* Preview opens the maintained learner account; other demo accounts remain available below. */}
          <Button
            variant="ghost"
            className="w-full border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20"
            onClick={launchPreview}
            disabled={busy}
          >
            {busy ? "Opening Preview…" : "🎓 Try the Preview"}
          </Button>
          <button
            type="button"
            className="mt-3 w-full text-[11px] text-sand/40 underline decoration-white/15 underline-offset-4 transition hover:text-gold"
            onClick={() => setShowDemo((s) => !s)}
          >
            {showDemo ? "Hide demo accounts" : "Browse other demo accounts"}
          </button>

          {showDemo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 space-y-2 rounded-xl border border-gold/20 bg-black/20 p-3 text-[11px] text-sand/60"
            >
              <div className="font-semibold text-sand/80">Preview account — pre-loaded with representative progress</div>
              <p className="text-sand/45">
                This preview is maintained as a permanent tour of the course. Progress is stored locally in your browser and resets if browser storage is cleared. No real account is created.
              </p>
              <button
                className="mt-2 w-full rounded-lg border border-gold/30 bg-gold/10 py-2 text-xs font-semibold text-gold hover:bg-gold/20 transition"
                onClick={() => {
                  setEmail("learner@arabic1010.com");
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
                  setEmail("admin@arabic1010.com");
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

          <p className="mt-4 text-center text-[10px] leading-relaxed text-sand/30">
            By continuing, you acknowledge the <a href="#/terms" className="text-sand/55 underline decoration-gold/40 underline-offset-2 hover:text-gold">Terms of Service</a> and <a href="#/privacy" className="text-sand/55 underline decoration-gold/40 underline-offset-2 hover:text-gold">Privacy Policy</a>. Preview progress is saved locally; secure learner accounts are not yet available.
          </p>
        </div>
      </motion.div>
      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] text-sand/45">
        <a href="#/terms" className="transition hover:text-gold">Terms of Service</a>
        <a href="#/privacy" className="transition hover:text-gold">Privacy Policy</a>
        <a href="#/contact" className="transition hover:text-gold">Contact</a>
      </div>
    </div>
  );
}
