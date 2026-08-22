import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button, Chip } from "@/components/ui";
import { cn } from "@/utils/cn";
import { vowelForm, type VowelKey } from "@/data/letters";
import { LETTER_SVGS, prepareSvg } from "@/data/letterAnimations";
import { play, audioPath } from "@/lib/audio";
import { LETTER_SVG_OVERRIDES } from "@/data/letterAnimationOverrides";

const G = 64; // analysis grid

/** Letter → filename mapping for animated SVG resources */
function getLetterFileName(letter: string): string {
  const map: Record<string, string> = {
    'ا': 'alif', 'ب': 'baa', 'ت': 'taa', 'ث': 'thaa',
    'ج': 'jiim', 'ح': 'haa', 'خ': 'khaa',
    'د': 'daal', 'ذ': 'dhaal', 'ر': 'raa', 'ز': 'zaay',
    'س': 'siin', 'ش': 'shiin',
    'ص': 'saad', 'ض': 'daad', 'ط': 'taa_emphatic', 'ظ': 'zaa_emphatic',
    'ع': 'ayn', 'غ': 'ghayn',
    'ف': 'faa', 'ق': 'qaaf', 'ك': 'kaaf', 'ل': 'laam',
    'م': 'miim', 'ن': 'nuun', 'ه': 'haa_soft',
    'و': 'waaw', 'ي': 'yaa'
  };
  return map[letter] || letter;
}

function maskFromCanvas(source: HTMLCanvasElement): boolean[] {
  const tmp = document.createElement("canvas");
  tmp.width = G; tmp.height = G;
  const ctx = tmp.getContext("2d")!;
  ctx.drawImage(source, 0, 0, G, G);
  const d = ctx.getImageData(0, 0, G, G).data;
  const out: boolean[] = new Array(G * G);
  for (let i = 0; i < G * G; i++) out[i] = d[i * 4 + 3] > 40;
  return out;
}

function renderModel(letter: string, size: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "rtl";
  ctx.font = `${Math.floor(size * 0.62)}px "Noto Naskh Arabic", serif`;
  ctx.fillText(letter, size / 2, size / 2);
  return c;
}

function components(mask: boolean[]) {
  const seen = new Uint8Array(G * G);
  const comps: { size: number; minX: number; maxX: number; minY: number; maxY: number }[] = [];
  for (let i = 0; i < G * G; i++) {
    if (!mask[i] || seen[i]) continue;
    const stack = [i];
    seen[i] = 1;
    let size = 0, minX = G, maxX = 0, minY = G, maxY = 0;
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % G, y = (p / G) | 0;
      size++;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= G || ny >= G) continue;
          const np = ny * G + nx;
          if (mask[np] && !seen[np]) { seen[np] = 1; stack.push(np); }
        }
    }
    comps.push({ size, minX, maxX, minY, maxY });
  }
  return comps.sort((a, b) => b.size - a.size);
}

function dilate(mask: boolean[], r = 2) {
  const out = new Array(G * G).fill(false);
  for (let y = 0; y < G; y++)
    for (let x = 0; x < G; x++) {
      if (!mask[y * G + x]) continue;
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < G && ny < G) out[ny * G + nx] = true;
        }
    }
  return out;
}

export type Mode = "trace" | "copy" | "recall";

export default function HandwritingCanvas({
  letter, expectedDots, onResult, size = 300, showPlayground = false,
}: { letter: string; expectedDots: number; onResult?: (score: number, ok: boolean) => void; size?: number; showPlayground?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Hard guard: disable playground for digits or words (only for isolated letters)
  const isArabicLetter = /^[ \u0621-\u064A]+$/.test(letter) && letter.length === 1;
  const activePlayground = showPlayground && isArabicLetter;
  const [mode, setMode] = useState<Mode>("trace");
  const [zoom, setZoom] = useState(1);
  const [drawing, setDrawing] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const [result, setResult] = useState<{ score: number; dotsOk: boolean; missing: number } | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [activeVowel, setActiveVowel] = useState<VowelKey>("long_alif");

  // SVG animation state
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [svgLoaded, setSvgLoaded] = useState(false);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [animationKey, setAnimationKey] = useState(0);

  // Load the inline SVG for the current letter.
  // prepareSvg() recolours, rescales and namespaces mask ids at runtime, so the
  // stored strings can stay byte-identical to the original authoring files.
  useEffect(() => {
    const fileName = getLetterFileName(letter);
    const svg = LETTER_SVG_OVERRIDES[fileName] ?? LETTER_SVGS[fileName];
    if (svg) {
      setSvgContent(prepareSvg(svg, fileName));
      setSvgLoaded(true);
    } else {
      setSvgContent(null);
      setSvgLoaded(false);
    }
  }, [letter]);

  // Replay the SVG animation when requested
  const replayWatch = useCallback(() => {
    // Force full unmount/remount by toggling the key
    setSvgLoaded(false);
    setSvgContent(null);
    setTimeout(() => {
      const fileName = getLetterFileName(letter);
      const svg = LETTER_SVG_OVERRIDES[fileName] ?? LETTER_SVGS[fileName];
      if (svg) {
        setAnimationKey(k => k + 1);
        setSvgContent(prepareSvg(svg, fileName));
        setSvgLoaded(true);
      }
    }, 50);
  }, [letter]);

  const clear = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setHasInk(false); setResult(null); setShowOverlay(false);
  }, []);

  // Clear canvas and replay animation when letter or mode changes
  useEffect(() => {
    clear();
    replayWatch();
  }, [letter, mode, clear, replayWatch]);

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };

  const start = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    c.setPointerCapture(e.pointerId);
    const ctx = c.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineWidth = 12; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "#F5EDD6";
    setDrawing(true); setHasInk(true); setResult(null);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.lineTo(x, y); ctx.stroke();
  };

  const end = () => setDrawing(false);

  const check = () => {
    const c = canvasRef.current!;
    const user = maskFromCanvas(c);
    const model = maskFromCanvas(renderModel(letter, c.width));
    const userD = dilate(user, 2), modelD = dilate(model, 2);
    let inter = 0, uOnly = 0, mOnly = 0;
    for (let i = 0; i < G * G; i++) {
      const u = user[i], m = model[i];
      if (u && modelD[i]) inter++;
      else if (u) uOnly++;
      if (m && !userD[i]) mOnly++;
    }
    const uTotal = inter + uOnly || 1;
    const mTotal = model.filter(Boolean).length || 1;
    const precision = inter / uTotal;
    const recall = (mTotal - mOnly) / mTotal;
    const score = Math.round(Math.max(0, Math.min(1, (precision * 0.45 + recall * 0.55))) * 100);

    const comps = components(model);
    const dots = comps.filter((x, i) => i > 0 && x.size < comps[0].size * 0.25);
    let missing = 0;
    dots.forEach((d) => {
      let found = false;
      for (let y = d.minY - 3; y <= d.maxY + 3 && !found; y++)
        for (let x = d.minX - 3; x <= d.maxX + 3; x++) {
          if (x < 0 || y < 0 || x >= G || y >= G) continue;
          if (user[y * G + x]) { found = true; break; }
        }
      if (!found) missing++;
    });
    const dotsOk = expectedDots === 0 || missing === 0;
    const final = Math.max(0, score - missing * 12);
    setResult({ score: final, dotsOk, missing });
    setShowOverlay(true);
    onResult?.(final, final >= 80 && dotsOk);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(["trace", "copy", "recall"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition",
              mode === m ? "border-gold bg-gold/20 text-gold" : "border-white/12 text-sand/60 hover:bg-white/5"
            )}
          >
            {m === "trace" ? "a · Trace" : m === "copy" ? "b · Copy beside" : "c · Free recall"}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}>−</Button>
          <span className="w-10 text-center text-xs text-sand/50">{Math.round(zoom * 100)}%</span>
          <Button size="sm" variant="ghost" onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}>+</Button>
        </div>
      </div>

      <div className={cn("flex flex-wrap items-start gap-4", mode === "copy" ? "flex-row-reverse justify-end" : "")} dir="rtl">
        {/* writing surface */}
        <div
          className="relative shrink-0 overflow-hidden rounded-2xl border border-gold/25 bg-[#101024]"
          style={{ width: size * zoom, height: size * zoom, touchAction: "none" }}
        >
          {/* guide grid */}
          <svg viewBox="0 0 300 300" className="pointer-events-none absolute inset-0 h-full w-full">
            <line x1="0" y1="200" x2="300" y2="200" stroke="rgba(201,162,39,.25)" strokeDasharray="6 6" />
            <line x1="0" y1="100" x2="300" y2="100" stroke="rgba(201,162,39,.12)" strokeDasharray="6 6" />

            {/* Behavior Header at top */}
            {activePlayground && (
              <g opacity="0.4">
                <text x="150" y="45" textAnchor="middle" fontSize="10" fill="rgba(245,237,214,.5)" fontFamily="Inter" letterSpacing="0.1em">CONNECTION BEHAVIOR</text>
                <text
                  x="150" y="90"
                  textAnchor="middle"
                  style={{ fontFamily: '"Noto Naskh Arabic", serif', fontSize: 68 }}
                  fill="#4c7fd0"
                >
                  {`ـ${letter}ـ`}
                </text>
                <text x="150" y="105" textAnchor="middle" fontSize="9" fill="rgba(245,237,214,.3)" fontFamily="Inter">reaching out (ـ) before and after</text>
              </g>
            )}

            {/* Isolation Label */}
            {activePlayground && (
              <text x="20" y="180" fontSize="9" fill="rgba(245,237,214,.3)" fontFamily="Inter" transform="rotate(-90 20 180)">ISOLATION FORM</text>
            )}

            {/* Fallback: simple letter display when no SVG animation available */}
            {!svgLoaded && (
              <text
                x="150" y="220"
                textAnchor="middle"
                style={{ fontFamily: '"Noto Naskh Arabic", serif', fontSize: 190 }}
                fill="#FFD54A"
                stroke="#D4AF37"
                strokeWidth="0.6"
              >
                {letter}
              </text>
            )}

            {mode === "recall" && (
              <text x="150" y="285" textAnchor="middle" fill="rgba(245,237,214,.3)" fontSize="12" fontFamily="Inter">
                from memory — no model shown
              </text>
            )}
          </svg>

          {/* SVG Animation Layer — rendered as its own absolutely-positioned
              element so the inner SVG's viewBox scales naturally without
              fighting the parent SVG's coordinate system */}
          {svgLoaded && svgContent && mode !== "recall" && (
            <div
              ref={svgContainerRef}
              key={animationKey}
              className="pointer-events-none absolute inset-0 flex items-center justify-center p-4"
              dangerouslySetInnerHTML={{ __html: svgContent }}
              style={{ opacity: 1 }}
            />
          )}

          {showOverlay && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="ar-c select-none" style={{ fontSize: 190 * zoom, color: "rgba(29,158,117,.28)", lineHeight: 1 }}>{letter}</span>
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className="absolute inset-0 h-full w-full cursor-crosshair"
            onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end}
          />
        </div>

        {mode === "copy" && (
          <div className="grid shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.03]"
            style={{ width: size * zoom * 0.7, height: size * zoom }}>
            <span className="ar-c" style={{ fontSize: 160 * zoom, lineHeight: 1 }}>{letter}</span>
            <span className="text-[11px] text-sand/40">model</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2" dir="ltr">
        <Button onClick={check} disabled={!hasInk}>Check my writing</Button>
        <Button variant="ghost" onClick={clear}>Clear</Button>
        {svgLoaded && (
          <Button variant="ghost" onClick={replayWatch}>
            ▶ Watch it write
          </Button>
        )}
        <Button variant="ghost" onClick={() => setShowOverlay((s) => !s)} disabled={!hasInk}>
          {showOverlay ? "Hide model overlay" : "Overlay model"}
        </Button>
        {expectedDots > 0 && <Chip color="#1A3A6B">{expectedDots} dot{expectedDots > 1 ? "s" : ""} required</Chip>}
      </div>

      {/* Syllable Playground */}
      {activePlayground && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
          <div className="flex items-center justify-between text-xs text-sand/60">
            <span className="font-bold uppercase tracking-wider">Syllable Playground</span>
            <span className="italic text-[11px]">See how {letter} joins long vowels</span>
          </div>

          <div className="flex justify-center gap-2">
            {(["long_alif", "long_waw", "long_ya"] as VowelKey[]).map((v) => (
              <button
                key={v}
                onClick={() => setActiveVowel(v)}
                className={cn(
                  "h-10 w-12 rounded-lg border text-xl ar transition-all",
                  activeVowel === v
                    ? "border-gold bg-gold/20 text-gold scale-110 shadow-lg shadow-gold/10"
                    : "border-white/10 bg-white/5 text-sand/40 hover:bg-white/10"
                )}
              >
                {v === "long_alif" ? "ـا" : v === "long_waw" ? "ـو" : "ـي"}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 py-2" dir="rtl">
            <div className="flex items-center gap-3 text-4xl">
              <div className="flex flex-col items-center gap-1">
                <span className="ar px-4 py-2 rounded-xl bg-white/5 border border-white/10 shadow-inner">{letter}</span>
                <span className="text-[10px] text-sand/30 uppercase font-bold">letter</span>
              </div>
              <span className="text-sand/20 text-xl">+</span>
              <div className="flex flex-col items-center gap-1">
                <span className="ar px-4 py-2 rounded-xl bg-white/5 border border-white/10 shadow-inner">
                  {activeVowel === "long_alif" ? "ا" : activeVowel === "long_waw" ? "و" : "ي"}
                </span>
                <span className="text-[10px] text-sand/30 uppercase font-bold">vowel</span>
              </div>
              <span className="text-sand/20 text-xl">←</span>
              <div className="flex flex-col items-center gap-1">
                <div className="relative group">
                  <span className="ar px-6 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold font-bold shadow-lg shadow-gold/5 block">
                    {vowelForm(letter, activeVowel)}
                  </span>
                  <button
                    onClick={() => play(audioPath("letters", `${letter}_${activeVowel}`), vowelForm(letter, activeVowel))}
                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gold text-black shadow-lg transition-transform hover:scale-110 active:scale-95"
                    title="Listen to syllable"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M10 3.75a.75.75 0 00-1.264-.546L5.203 6.5H3.5a1.5 1.5 0 00-1.5 1.5v4a1.5 1.5 0 001.5 1.5h1.703l3.533 3.296A.75.75 0 0010 16.25V3.75zM14.25 10a3.25 3.25 0 01-1.013 2.344.75.75 0 001.026 1.102A4.75 4.75 0 0015.75 10a4.75 4.75 0 00-1.487-3.446.75.75 0 00-1.026 1.102A3.25 3.25 0 0114.25 10z" />
                    </svg>
                  </button>
                </div>
                <span className="text-[10px] text-gold/40 uppercase font-bold">syllable</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className={cn("rounded-xl border p-3 text-sm", result.score >= 80 && result.dotsOk ? "border-ok/50 bg-ok/10" : "border-gold/40 bg-gold/10")}>
          <div className="font-semibold">
            {result.score >= 80 && result.dotsOk ? `✓ Legible — ${result.score}%` : `Keep practising — ${result.score}%`}
          </div>
          <div className="mt-1 text-xs text-sand/60">
            {result.missing > 0
              ? `Dot check: ${result.missing} dot(s) missing on ${letter}. Arabic dots change the letter entirely.`
              : "Dot check passed. Compare the green overlay with your stroke to refine the curve."}
          </div>
        </motion.div>
      )}
    </div>
  );
}
