import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

export type ModuleKey = "cognates" | "letters" | "numbers" | "vocab" | "dialogue" | "map" | "typing";

export const MODULE_META: Record<
  ModuleKey,
  { title: string; arabic: string; color: string; icon: string; total: number; blurb: string; xp: number }
> = {
  cognates: { title: "Cognates", arabic: "كَلِمَات مُشْتَرَكَة", color: "#7B2020", icon: "🌉", total: 30, blurb: "30 English words that are secretly Arabic", xp: 10 },
  letters: { title: "Letters & Vowels", arabic: "الحُرُوف", color: "#1A3A6B", icon: "🔤", total: 28, blurb: "28 letters × 6 vowel forms + handwriting", xp: 15 },
  numbers: { title: "Numbers 0–20", arabic: "الأَرْقَام", color: "#1D6B3A", icon: "🔢", total: 21, blurb: "Western + Eastern numerals with visuals", xp: 10 },
  vocab: { title: "Vocabulary", arabic: "المُفْرَدَات", color: "#7A4A00", icon: "📚", total: 20, blurb: "20 core words with images and writing", xp: 12 },
  dialogue: { title: "Conversation", arabic: "المُحَادَثَة", color: "#3A1A6B", icon: "💬", total: 20, blurb: "Listen, repeat and role-play a real dialogue", xp: 25 },
  map: { title: "Arab World Map", arabic: "الخَرِيطَة", color: "#0F3460", icon: "🗺️", total: 22, blurb: "22 countries, audio and culture cards", xp: 10 },
  typing: { title: "Typing", arabic: "الطِّبَاعَة", color: "#2E6B7A", icon: "⌨️", total: 48, blurb: "Type words you've already learned, using a real Arabic keyboard.", xp: 8 },
};

export type ProgressItem = {
  module: ModuleKey;
  itemKey: string;
  masteryPct: number;
  attempts: number;
  correct: number;
  lastReviewed: string;
  interval: number; // days
  due: string;
};

export type Profile = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  xp: number;
  streak: number;
  lastActive: string;
  premium: boolean;
  createdAt: string;
  badges: string[];
  mastered: string[]; // "module:sub"
  progress: Record<string, ProgressItem>;
};

export type Feedback = {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  category: "bug" | "suggestion" | "content" | "UX";
  text: string;
  createdAt: string;
  status: "open" | "resolved";
  reply?: string;
};

export const BADGES: { id: string; icon: string; name: string; desc: string }[] = [
  { id: "bridge", icon: "🌉", name: "Bridge Builder", desc: "Learn 10 cognates" },
  { id: "traveler", icon: "🌐", name: "Word Traveler", desc: "Learn all 30 cognates" },
  { id: "script", icon: "🔤", name: "Script Starter", desc: "Master 7 letters" },
  { id: "calligrapher", icon: "✍️", name: "Calligrapher", desc: "Handwrite all 28 letters" },
  { id: "ninja", icon: "🔢", name: "Number Ninja", desc: "Master numbers 0–20" },
  { id: "scholar", icon: "📚", name: "Word Scholar", desc: "Learn all 20 vocabulary words" },
  { id: "convo", icon: "💬", name: "Conversationalist", desc: "Complete a role-play" },
  { id: "explorer", icon: "🗺️", name: "Arab World Explorer", desc: "Learn all 22 countries" },
  { id: "warrior", icon: "🔥", name: "Week Warrior", desc: "Reach a 7-day streak" },
  { id: "champion", icon: "⭐", name: "Arabic Champion", desc: "80%+ in all six modules" },
  { id: "scribe", icon: "🖊️", name: "Number Scribe", desc: "Handwrite all 21 numbers — glyph and word" },
  { id: "typist", icon: "⌨️", name: "Digital Native", desc: "Correctly type 20 words on the Arabic keyboard" },
];

const KEY = "arabic1010.v1";

/** Exercise-generated keys (quiz variants) should not count as "items learned". */
export function isCanonicalKey(k: string) {
  if (/_(write|speak|miss|ar|who|fatha|kasra|dhamma|long_alif|long_ya|long_waw)$/.test(k)) return false;
  if (/^(op|w|m|s|expr|match)\d*$/.test(k)) return false;
  return true;
}
const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

function seedProfile(p: Partial<Profile>): Profile {
  return {
    id: crypto.randomUUID(),
    email: "",
    name: "Learner",
    role: "user",
    xp: 0,
    streak: 1,
    lastActive: today(),
    premium: false,
    createdAt: today(),
    badges: [],
    mastered: [],
    progress: {},
    ...p,
  };
}

function demoProgress(mod: ModuleKey, keys: string[], pct = 100): Record<string, ProgressItem> {
  const out: Record<string, ProgressItem> = {};
  keys.forEach((k) => {
    out[`${mod}:${k}`] = {
      module: mod, itemKey: k, masteryPct: pct, attempts: 3, correct: 3,
      lastReviewed: today(), interval: 3, due: today(),
    };
  });
  return out;
}

type DB = { users: Profile[]; feedback: Feedback[]; currentUserId: string | null };

function initialDB(): DB {
  const admin = seedProfile({
    id: "u-admin", email: "admin@arabic1010.app", name: "Dr. Nadia Haddad", role: "admin",
    xp: 4820, streak: 41, premium: true, createdAt: "2026-01-12",
    badges: ["bridge", "traveler", "script", "warrior"],
  });
  const demo = seedProfile({
    id: "u-demo", email: "learner@arabic1010.app", name: "Claudia Reyes", xp: 340, streak: 5,
    premium: false, createdAt: "2026-05-02", badges: ["bridge"],
    progress: {
      ...demoProgress("cognates", ["sugar", "giraffe", "cipher", "cotton", "sofa"]),
      ...demoProgress("letters", ["ا", "ب", "ت"]),
      ...demoProgress("numbers", ["0", "1", "2", "3", "4"]),
    },
    mastered: ["cognates:set1"],
  });
  const others: Profile[] = [
    seedProfile({ id: "u-1", email: "omar.k@example.com", name: "Omar Khalil", xp: 1980, streak: 22, premium: true, createdAt: "2026-02-18", badges: ["bridge", "script", "warrior"], progress: { ...demoProgress("cognates", ["sugar", "coffee", "algebra", "ghoul", "lemon", "cotton", "sofa", "amber", "jar", "henna"]), ...demoProgress("letters", ["ا", "ب", "ت", "ث", "ج", "ح", "خ"]) } }),
    seedProfile({ id: "u-2", email: "mei.chen@example.com", name: "Mei Chen", xp: 760, streak: 9, premium: true, createdAt: "2026-03-30", badges: ["bridge", "warrior"], progress: demoProgress("vocab", ["door", "dog", "house", "boy", "mother", "father"]) }),
    seedProfile({ id: "u-3", email: "j.dupont@example.com", name: "Julien Dupont", xp: 145, streak: 2, createdAt: "2026-06-11", progress: demoProgress("numbers", ["0", "1", "2"]) }),
    seedProfile({ id: "u-4", email: "aisha.b@example.com", name: "Aisha Bello", xp: 2410, streak: 31, premium: true, createdAt: "2026-01-25", badges: ["bridge", "traveler", "script", "ninja", "warrior"], progress: { ...demoProgress("map", ["egypt", "morocco", "lebanon", "saudi_arabia", "tunisia", "iraq", "oman"]), ...demoProgress("numbers", Array.from({ length: 21 }, (_, i) => String(i))) } }),
    seedProfile({ id: "u-5", email: "tom.ericsson@example.com", name: "Tom Ericsson", xp: 55, streak: 1, createdAt: "2026-07-02" }),
  ];
  const feedback: Feedback[] = [
    { id: "f1", userId: "u-2", userName: "Mei Chen", rating: 5, category: "content", text: "The etymology trail for 'assassin' blew my mind. More stories like this please!", createdAt: "2026-07-04", status: "open" },
    { id: "f2", userId: "u-3", userName: "Julien Dupont", rating: 3, category: "bug", text: "Audio for ص_long_waw does not play on Safari mobile.", createdAt: "2026-07-03", status: "open" },
    { id: "f3", userId: "u-1", userName: "Omar Khalil", rating: 4, category: "UX", text: "The handwriting canvas needs a bigger clear button on phones.", createdAt: "2026-06-29", status: "resolved", reply: "Fixed in 1.2 — the toolbar is now 48px touch targets." },
    { id: "f4", userId: "u-4", userName: "Aisha Bello", rating: 5, category: "suggestion", text: "Add a Maghrebi pronunciation toggle for the country names.", createdAt: "2026-06-21", status: "open" },
  ];
  return { users: [admin, demo, ...others], feedback, currentUserId: null };
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch { /* ignore */ }
  return initialDB();
}

type Settings = { harakat: boolean; sound: boolean; slow: boolean };

type Ctx = {
  db: DB;
  user: Profile | null;
  settings: Settings;
  setSettings: (s: Partial<Settings>) => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (name: string, email: string, password: string) => Promise<string | null>;
  signInGoogle: () => void;
  signOut: () => void;
  award: (module: ModuleKey, itemKey: string, xp?: number) => void;
  recordAttempt: (module: ModuleKey, itemKey: string, correct: boolean) => void;
  addXp: (n: number) => void;
  setMastered: (id: string) => void;
  isLocked: (module: ModuleKey, index: number, id?: string) => boolean;
  learnedCount: (module: ModuleKey) => number;
  isLearned: (module: ModuleKey, key: string) => boolean;
  dueItems: () => ProgressItem[];
  upgrade: () => void;
  addFeedback: (f: Omit<Feedback, "id" | "createdAt" | "status" | "userId" | "userName">) => void;
  replyFeedback: (id: string, reply: string) => void;
  newBadge: string | null;
  clearBadge: () => void;
  toast: string | null;
  showToast: (s: string) => void;
};

const AppCtx = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(AppCtx);

const FREE_LIMITS: Record<ModuleKey, number> = {
  cognates: 8, letters: 7, numbers: 11, vocab: 5, dialogue: 4, map: 5, typing: 999,
};

/**
 * DEV BUILD FLAG — freemium gating disabled.
 *
 * While the app is in development every module, letter, number, word,
 * dialogue line and country is fully reachable so the whole surface can
 * be built and QA'd. The FREE_LIMITS table above is left intact and is
 * still the single source of truth for the paid tiers.
 *
 * Set this to `false` to restore freemium gating before deploying.
 */
// Unlocked by DEFAULT. Gating only switches on when the env var is the exact
// string 'false'. The previous `=== 'true'` test failed closed: with no .env
// file present the value is `undefined`, which silently re-locked every
// premium item during development.
export const DEV_UNLOCK_ALL = import.meta.env.VITE_DEV_UNLOCK_ALL !== 'false';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(load);
  const [settings, setSettingsState] = useState<Settings>({ harakat: true, sound: true, slow: false });
  const [newBadge, setNewBadge] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(db)); }, [db]);

  const user = useMemo(
    () => db.users.find((u) => u.id === db.currentUserId) ?? null,
    [db]
  );

  const showToast = useCallback((s: string) => {
    setToast(s);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const patchUser = useCallback((fn: (u: Profile) => Profile) => {
    setDb((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === d.currentUserId ? fn(u) : u)),
    }));
  }, []);

  const checkBadges = useCallback((u: Profile): Profile => {
    const count = (m: ModuleKey) =>
      Object.values(u.progress).filter((p) => p.module === m && p.masteryPct >= 60 && isCanonicalKey(p.itemKey)).length;
    const earned: string[] = [];
    if (count("cognates") >= 10) earned.push("bridge");
    if (count("cognates") >= 30) earned.push("traveler");
    if (count("letters") >= 7) earned.push("script");
    if (Object.values(u.progress).filter((p) => p.module === "letters" && p.itemKey.includes("write")).length >= 28) earned.push("calligrapher");
    if (count("numbers") >= 21) earned.push("ninja");
    if (Object.values(u.progress).filter((p) => p.module === "numbers" && (p.itemKey.endsWith("_glyph") || p.itemKey.endsWith("_khat")) && p.masteryPct >= 60).length >= 42) earned.push("scribe");
    if (count("vocab") >= 20) earned.push("scholar");
    if (u.mastered.includes("dialogue:roleplay")) earned.push("convo");
    if (count("map") >= 22) earned.push("explorer");
    if (count("typing") >= 20) earned.push("typist");
    if (u.streak >= 7) earned.push("warrior");
    const allMods: ModuleKey[] = ["cognates", "letters", "numbers", "vocab", "dialogue", "map"];
    if (allMods.every((m) => count(m) / MODULE_META[m].total >= 0.8)) earned.push("champion");
    const fresh = earned.filter((b) => !u.badges.includes(b));
    if (fresh.length) {
      setTimeout(() => setNewBadge(fresh[0]), 350);
      return { ...u, badges: [...u.badges, ...fresh] };
    }
    return u;
  }, []);

  // daily login streak
  const touchStreak = useCallback((u: Profile): Profile => {
    const d = daysBetween(u.lastActive, today());
    if (d === 0) return u;
    let streak = d === 1 ? u.streak + 1 : 1;
    let xp = u.xp + 5;
    if (streak === 7 || streak === 30 || streak === 100) xp += 50;
    return { ...u, streak, xp, lastActive: today() };
  }, []);

  const signIn: Ctx["signIn"] = async (email, password) => {
    await new Promise((r) => setTimeout(r, 450));
    const found = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) return "No account found with that email.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    setDb((d) => ({
      ...d,
      currentUserId: found.id,
      users: d.users.map((u) => (u.id === found.id ? checkBadges(touchStreak(u)) : u)),
    }));
    return null;
  };

  const signUp: Ctx["signUp"] = async (name, email, password) => {
    await new Promise((r) => setTimeout(r, 550));
    if (db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase()))
      return "An account with that email already exists.";
    if (password.length < 8) return "Use at least 8 characters.";
    if (/^(password|12345678|qwerty)/i.test(password))
      return "This password appears in known breach lists (leaked-password protection).";
    const u = seedProfile({ name: name || "Learner", email: email.trim(), xp: 5 });
    setDb((d) => ({ ...d, users: [...d.users, u], currentUserId: u.id }));
    return null;
  };

  const signInGoogle = () => {
    const g = db.users.find((u) => u.id === "u-demo")!;
    setDb((d) => ({ ...d, currentUserId: g.id, users: d.users.map((u) => (u.id === g.id ? checkBadges(touchStreak(u)) : u)) }));
  };

  const signOut = () => setDb((d) => ({ ...d, currentUserId: null }));

  const award: Ctx["award"] = (module, itemKey, xp) => {
    patchUser((u) => {
      const k = `${module}:${itemKey}`;
      const existing = u.progress[k];
      const gain = existing ? 0 : xp ?? MODULE_META[module].xp;
      const next: Profile = {
        ...u,
        xp: u.xp + gain,
        progress: {
          ...u.progress,
          [k]: existing
            ? { ...existing, masteryPct: Math.min(100, existing.masteryPct + 10), lastReviewed: today() }
            : { module, itemKey, masteryPct: 60, attempts: 1, correct: 1, lastReviewed: today(), interval: 1, due: today() },
        },
      };
      if (gain) setTimeout(() => showToast(`+${gain} XP`), 10);
      return checkBadges(next);
    });
  };

  const recordAttempt: Ctx["recordAttempt"] = (module, itemKey, correct) => {
    patchUser((u) => {
      const k = `${module}:${itemKey}`;
      const p = u.progress[k] ?? { module, itemKey, masteryPct: 0, attempts: 0, correct: 0, lastReviewed: today(), interval: 1, due: today() };
      const steps = [1, 3, 7, 14, 30];
      const interval = correct ? steps[Math.min(steps.indexOf(p.interval) + 1, steps.length - 1)] || 1 : 1;
      const attempts = p.attempts + 1;
      const corr = p.correct + (correct ? 1 : 0);
      const due = new Date(Date.now() + interval * 86400000).toISOString().slice(0, 10);
      return checkBadges({
        ...u,
        progress: {
          ...u.progress,
          [k]: { ...p, attempts, correct: corr, masteryPct: Math.round((corr / attempts) * 100), interval, due, lastReviewed: today() },
        },
      });
    });
  };

  const addXp = (n: number) => patchUser((u) => checkBadges({ ...u, xp: u.xp + n }));
  const setMastered = (id: string) =>
    patchUser((u) => checkBadges({ ...u, mastered: u.mastered.includes(id) ? u.mastered : [...u.mastered, id] }));

  const isLocked: Ctx["isLocked"] = (module, index) => {
    if (DEV_UNLOCK_ALL) return false;   // dev build — nothing is gated
    if (user?.premium) return false;
    return index >= FREE_LIMITS[module];
  };

  const learnedCount = (module: ModuleKey) =>
    user
      ? Object.values(user.progress).filter(
          (p) => p.module === module && p.masteryPct >= 60 && isCanonicalKey(p.itemKey)
        ).length
      : 0;

  const isLearned = (module: ModuleKey, key: string) =>
    !!user?.progress[`${module}:${key}`] && user.progress[`${module}:${key}`].masteryPct >= 60;

  const dueItems = () =>
    user ? Object.values(user.progress).filter((p) => p.due <= today() && p.masteryPct < 100) : [];

  const upgrade = () => {
    patchUser((u) => ({ ...u, premium: true }));
    showToast("Premium unlocked — all 6 modules are open 🎉");
  };

  const addFeedback: Ctx["addFeedback"] = (f) => {
    if (!user) return;
    setDb((d) => ({
      ...d,
      feedback: [
        { ...f, id: crypto.randomUUID(), userId: user.id, userName: user.name, createdAt: today(), status: "open" },
        ...d.feedback,
      ],
    }));
    showToast("Thank you — your feedback was saved.");
  };

  const replyFeedback = (id: string, reply: string) =>
    setDb((d) => ({
      ...d,
      feedback: d.feedback.map((f) => (f.id === id ? { ...f, reply, status: "resolved" } : f)),
    }));

  const setSettings = (s: Partial<Settings>) => setSettingsState((x) => ({ ...x, ...s }));

  const value: Ctx = {
    db, user, settings, setSettings, signIn, signUp, signInGoogle, signOut,
    award, recordAttempt, addXp, setMastered, isLocked, learnedCount, isLearned,
    dueItems, upgrade, addFeedback, replyFeedback,
    newBadge, clearBadge: () => setNewBadge(null), toast, showToast,
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function levelFromXp(xp: number) {
  const level = Math.floor(xp / 250) + 1;
  const into = xp % 250;
  return { level, into, next: 250, pct: (into / 250) * 100 };
}
