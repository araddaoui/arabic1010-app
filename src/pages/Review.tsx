import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, Button, Chip, EmptyState, Progress } from "@/components/ui";
import AudioPlayer from "@/components/AudioPlayer";
import { useApp, MODULE_META, type ModuleKey } from "@/lib/store";
import { COGNATES } from "@/data/cognates";
import { VOCAB } from "@/data/vocab";
import { NUMBERS } from "@/data/numbers";
import { countries as COUNTRIES } from "@/lib/data/countries";
import { vowelForm } from "@/data/letters";

const FOLDER: Record<ModuleKey, string> = {
  cognates: "cognates", letters: "letters", numbers: "numbers",
  vocab: "words", dialogue: "dialogue", map: "countries", typing: "typing",
};

function resolve(module: ModuleKey, key: string): { ar: string; en: string } {
  if (module === "cognates") { const c = COGNATES.find((x) => x.id === key); return { ar: c?.ar ?? key, en: c?.en ?? key }; }
  if (module === "vocab") { const v = VOCAB.find((x) => x.id === key); return { ar: v?.ar ?? key, en: v?.en ?? key }; }
  if (module === "numbers") { const n = NUMBERS[Number(key.replace(/\D/g, ""))]; return { ar: n?.ar ?? key, en: String(n?.n ?? key) }; }
  if (module === "map") { const c = COUNTRIES.find((x) => x.id === key); return { ar: c?.nameArabic ?? key, en: c?.nameEnglish ?? key }; }
  if (module === "letters") { const base = key.split("_")[0]; return { ar: vowelForm(base, "fatha"), en: base }; }
  if (module === "typing") {
    const [pfx, ...rest] = key.split("_");
    const id = rest.join("_");
    if (pfx === "c") { const c = COGNATES.find((x) => x.id === id); return { ar: c?.ar ?? key, en: c?.en ?? key }; }
    if (pfx === "v") { const v = VOCAB.find((x) => x.id === id); return { ar: v?.ar ?? key, en: v?.en ?? key }; }
  }
  return { ar: key, en: key };
}

export default function Review({ navigate }: { navigate: (p: string) => void }) {
  const { dueItems, recordAttempt, user } = useApp();
  const items = useMemo(() => dueItems(), [user]);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);

  if (!items.length) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState icon="🎉" title="Review queue is empty"
          body="Spaced repetition schedules items 1 → 3 → 7 → 14 → 30 days after you get them right. Learn something new and come back tomorrow."
          action={<Button onClick={() => navigate("/")}>Back to dashboard</Button>} />
      </div>
    );
  }

  const item = items[Math.min(i, items.length - 1)];
  const info = resolve(item.module, item.itemKey);

  const answer = (ok: boolean) => {
    recordAttempt(item.module, item.itemKey, ok);
    setShown(false);
    setI((x) => x + 1);
  };

  if (i >= items.length) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState icon="✅" title="Review session complete" body="All scheduled items reviewed. Intervals have been updated."
          action={<Button onClick={() => navigate("/")}>Back to dashboard</Button>} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">🔁 Spaced repetition review</h1>
        <span className="text-xs text-sand/50">{i + 1} / {items.length}</span>
      </div>
      <Progress pct={(i / items.length) * 100} />
      <motion.div key={item.itemKey} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="text-center">
          <Chip color={MODULE_META[item.module].color}>{MODULE_META[item.module].title}</Chip>
          <div className="ar-c mt-4 text-5xl">{info.ar}</div>
          {shown ? (
            <div className="mt-3 text-lg font-bold capitalize">{info.en}</div>
          ) : (
            <Button className="mt-4" variant="ghost" onClick={() => setShown(true)}>Show answer</Button>
          )}
          <div className="mt-4"><AudioPlayer folder={FOLDER[item.module]} fileKey={item.itemKey} text={info.ar} allowRecord={false} compact /></div>
          <div className="mt-3 text-xs text-sand/40">
            mastery {item.masteryPct}% · interval {item.interval}d · attempts {item.attempts}
          </div>
          {shown && (
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="danger" onClick={() => answer(false)}>Missed it</Button>
              <Button onClick={() => answer(true)}>I knew it</Button>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
