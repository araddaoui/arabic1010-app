import { useState } from "react";
import { Card, Button, Chip } from "@/components/ui";
import { UpgradeModal } from "@/components/Layout";
import { useApp } from "@/lib/store";
import { cn } from "@/utils/cn";

export default function Settings() {
  const { user, settings, setSettings, addFeedback, signOut, db } = useApp();
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState<"bug" | "suggestion" | "content" | "UX">("suggestion");
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  if (!user) return null;
  const mine = db.feedback.filter((f) => f.userId === user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-extrabold">Settings</h1>

      <Card>
        <h3 className="font-bold">Account</h3>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-black/25 p-3"><div className="text-[11px] text-sand/40">Name</div>{user.name}</div>
          <div className="rounded-xl bg-black/25 p-3"><div className="text-[11px] text-sand/40">Email</div>{user.email}</div>
          <div className="rounded-xl bg-black/25 p-3"><div className="text-[11px] text-sand/40">Role</div>{user.role}</div>
          <div className="rounded-xl bg-black/25 p-3"><div className="text-[11px] text-sand/40">Plan</div>
            {user.premium ? <Chip color="#C9A227">Premium</Chip> : <button className="text-gold underline" onClick={() => setUpgradeOpen(true)}>Free — upgrade</button>}
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="ghost" onClick={signOut}>Sign out</Button>
          {user.premium && <Button variant="outline" onClick={() => window.print()}>Download certificate (PDF)</Button>}
        </div>
      </Card>

      <Card>
        <h3 className="font-bold">Learning preferences</h3>
        <div className="mt-3 space-y-2">
          {([["harakat", "Always show harakat (diacritics)"], ["sound", "Sound effects"], ["slow", "Default to 0.75× playback"]] as const).map(([k, label]) => (
            <label key={k} className="flex cursor-pointer items-center justify-between rounded-xl bg-black/25 p-3 text-sm">
              <span>{label}</span>
              <button onClick={() => setSettings({ [k]: !settings[k] } as never)}
                className={cn("h-6 w-11 rounded-full p-0.5 transition", settings[k] ? "bg-gold" : "bg-white/15")}>
                <span className={cn("block h-5 w-5 rounded-full bg-ink transition", settings[k] && "translate-x-5")} />
              </button>
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-sand/45">
          RTL is enforced app-wide for Arabic: direction rtl, right alignment, minimum 18px, and reversed navigation arrows in Arabic flows.
        </p>
      </Card>

      <Card>
        <h3 className="font-bold">Send feedback</h3>
        <p className="text-xs text-sand/50">Saved locally in this release and shown in the local admin dashboard.</p>
        <div className="mt-3 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)} className="text-2xl transition hover:scale-110">
              {s <= rating ? "★" : "☆"}
            </button>
          ))}
          <span className="ml-2 text-xs text-sand/50">{rating}/5</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["bug", "suggestion", "content", "UX"] as const).map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize",
                category === c ? "border-gold bg-gold/20 text-gold" : "border-white/12 text-sand/60")}>{c}</button>
          ))}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4}
          className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-sm outline-none focus:border-gold"
          placeholder="Tell us what worked, what broke, or what you would like to see next…" />
        <div className="mt-3 flex items-center gap-2">
          <Button disabled={!text.trim()} onClick={() => { addFeedback({ rating, category, text }); setText(""); setSent(true); }}>Submit feedback</Button>
          {sent && <span className="text-xs text-ok">Saved ✓</span>}
        </div>
      </Card>

      {mine.length > 0 && (
        <Card>
          <h3 className="font-bold">Your previous feedback</h3>
          <div className="mt-3 space-y-2">
            {mine.map((f) => (
              <div key={f.id} className="rounded-xl bg-black/25 p-3 text-sm">
                <div className="flex items-center gap-2 text-xs text-sand/50">
                  <span className="text-gold">{"★".repeat(f.rating)}</span>
                  <Chip>{f.category}</Chip><span>{f.createdAt}</span>
                  <Chip color={f.status === "resolved" ? "#1D9E75" : "#C9A227"}>{f.status}</Chip>
                </div>
                <p className="mt-1.5">{f.text}</p>
                {f.reply && <p className="mt-2 rounded-lg bg-gold/10 p-2 text-xs text-gold">Team reply: {f.reply}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
