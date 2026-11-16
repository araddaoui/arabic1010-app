import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button, Card, Chip } from "@/components/ui";
import AudioPlayer from "@/components/AudioPlayer";
import { COGNATES } from "@/data/cognates";
import { track } from "@/lib/analytics";
import { cn } from "@/utils/cn";

const WORD = COGNATES.find((c) => c.id === "sugar")!;
const OPTIONS = [
  { id: "sugar", label: "sugar" },
  { id: "coffee", label: "coffee" },
  { id: "algebra", label: "algebra" },
];

export default function Sample({ navigate }: { navigate: (p: string) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string[]>([]);
  const done = picked === "sugar";

  useEffect(() => {
    track("sample_start");
  }, []);

  const pick = (id: string) => {
    setPicked(id);
    if (id === "sugar") {
      track("sample_complete");
      return;
    }
    setWrong((w) => (w.includes(id) ? w : [...w, id]));
    setPicked(null);
  };

  return (
    <div className="pattern flex min-h-screen items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-4 flex items-center gap-2 px-1">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-gold to-maroon text-base font-black text-ink">ع</span>
          <span className="text-base font-extrabold">Arabic<span className="text-gold">1010</span></span>
          <span dir="rtl" className="ml-auto font-arabic text-base font-extrabold">اَلْعَرَبِيَّة</span>
        </div>

        <div className="mb-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold/80">Free sample · Module 1 · Cognates</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">You already know<br />an Arabic word.</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-sand/60">One word sailed from Baghdad to Lisbon to your kitchen table. Hear it, trace it, own it.</p>
        </div>

        <Card className="p-5 sm:p-6">
          <div className="flex flex-col items-center text-center">
            <div className="text-6xl">{WORD.emoji}</div>
            <div className="ar-c mt-3 text-7xl leading-tight">{WORD.ar}</div>
            <div className="mt-1 text-sm text-sand/50">{WORD.translit}</div>
            <div className="mt-1 text-2xl font-extrabold capitalize">{WORD.en}</div>
            <div className="mt-3"><Chip color="#7B2020">{WORD.category}</Chip></div>
          </div>

          <div className="mt-5">
            <AudioPlayer folder="cognates" fileKey={WORD.id} text={WORD.ar} strategy="recognition" label="/audio/cognates/sugar.mp3" />
          </div>

          <div className="mt-5 rounded-2xl border border-gold/25 bg-black/25 p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-gold">The sea voyage</div>
            <ol className="mt-3 space-y-2">
              {WORD.trail.map((step, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold/20 text-[11px] font-bold text-gold">{i + 1}</span>
                  <span className={cn("text-sm text-sand/85", i === 0 && "ar text-lg")}>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-relaxed text-sand/60">{WORD.note}</p>
          </div>
        </Card>

        <Card className="mt-4 p-5">
          {!done ? (
            <>
              <p className="text-center text-sm font-bold text-sand/80">Quick — which English word travelled from <span className="ar" dir="rtl">{WORD.ar}</span>?</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {OPTIONS.map((o) => (
                  <button key={o.id} onClick={() => pick(o.id)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-sm font-bold capitalize transition",
                      wrong.includes(o.id)
                        ? "border-err/60 bg-err/15 text-red-200"
                        : "border-white/12 hover:border-gold/60 hover:bg-gold/10 text-sand/90"
                    )}>
                    {o.label}
                  </button>
                ))}
              </div>
              {wrong.length > 0 && (
                <p className="mt-3 text-center text-xs text-sand/50">Not quite — hint: it sweetens your tea. Try again.</p>
              )}
            </>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="text-4xl">🍬</div>
              <h2 className="mt-2 text-2xl font-extrabold">That&apos;s your first Arabic word.</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-sand/65">
                Thirty cognates like this one are waiting inside Module&nbsp;1 — plus 28 letters with handwriting feedback, numbers, real dialogue and the whole Arab world map.
              </p>
              <Button size="lg" className="mt-4 w-full" onClick={() => navigate("/signup")}>
                Create my account →
              </Button>
              <button onClick={() => navigate("/signin")} className="mt-3 text-xs font-semibold text-sand/55 underline-offset-2 hover:text-sand hover:underline">
                Already have an account? Sign in
              </button>
              <p className="mt-2 text-[10px] text-sand/35">No payment required to start.</p>
            </motion.div>
          )}
        </Card>

        <p className="mt-4 text-center text-xs text-sand/40">
          No account needed until you want to keep your progress.{" "}
          <button onClick={() => navigate("/signin")} className="font-semibold text-sand/60 underline-offset-2 hover:underline">Already have an account? Sign in</button>
        </p>
      </div>
    </div>
  );
}
