import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";

export function Button({
  children, variant = "primary", size = "md", className, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger" | "gold";
  size?: "sm" | "md" | "lg";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 active:scale-[.97] disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" };
  const variants = {
    primary: "bg-gradient-to-r from-gold via-gold-soft to-gold text-ink hover:brightness-110 shadow-lg shadow-gold/20",
    gold: "bg-gradient-to-br from-gold via-[#e6cf7a] to-[#a8811b] text-ink hover:brightness-110 shadow-lg shadow-gold/20",
    ghost: "bg-white/6 text-sand hover:bg-azure/12 border border-white/12 hover:border-azure/35",
    outline: "border border-gold/55 text-gold hover:bg-gold/10 hover:border-azure/55",
    danger: "bg-err/90 text-white hover:bg-err",
  };
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...rest}>
      {children}
    </button>
  );
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card p-5", className)} {...rest}>{children}</div>;
}

export function Progress({ pct, color = "#C9A227", height = 8 }: { pct: number; color?: string; height?: number }) {
  return (
    <div className="w-full rounded-full bg-white/10 overflow-hidden" style={{ height }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}cc 58%, #e6cf7a)` }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        transition={{ type: "spring", stiffness: 90, damping: 20 }}
      />
    </div>
  );
}

export function Chip({ children, color, className }: { children: React.ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide", className)}
      style={color ? { background: `${color}22`, color: "#f0e8d0", border: `1px solid ${color}88` } : { background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.14)" }}
    >
      {children}
    </span>
  );
}

export function Modal({ open, onClose, children, wide }: { open: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        >
          <motion.div
            className={cn("glass w-full rounded-2xl border border-gold/30 p-6 max-h-[88vh] overflow-auto", wide ? "max-w-3xl" : "max-w-md")}
            initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Confetti({ fire }: { fire: boolean }) {
  const [pieces, setPieces] = useState<{ id: number; x: number; c: string; d: number; r: number }[]>([]);
  useEffect(() => {
    if (!fire) return;
    const colors = ["#C9A227", "#20B486", "#3E8ED0", "#8B6BFF", "#F07F5F", "#E6CF7A"];
    setPieces(Array.from({ length: 70 }, (_, i) => ({
      id: i, x: Math.random() * 100, c: colors[i % colors.length],
      d: 0.4 + Math.random() * 0.8, r: Math.random() * 360,
    })));
    const t = setTimeout(() => setPieces([]), 2600);
    return () => clearTimeout(t);
  }, [fire]);
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-[-5%] block h-3 w-2 rounded-[2px]"
          style={{ left: `${p.x}%`, background: p.c }}
          initial={{ y: -40, rotate: p.r, opacity: 1 }}
          animate={{ y: "110vh", rotate: p.r + 540, opacity: [1, 1, 0.2] }}
          transition={{ duration: 1.8 + p.d, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

export function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" />
    </svg>
  );
}

export function Ar({ children, className, size = "text-3xl", radiant = true }: { children: React.ReactNode; className?: string; size?: string; radiant?: boolean }) {
  return <span className={cn("ar-c inline-block", size, radiant && "radiant-gold", className)} dir="rtl">{children}</span>;
}

export function Stat({ label, value, sub, color }: { label: string; value: React.ReactNode; sub?: string; color?: string }) {
  return (
    <Card className="p-4">
      <div className="text-[11px] uppercase tracking-widest text-sand/50">{label}</div>
      <div className="mt-1 text-2xl font-extrabold" style={{ color: color ?? "#F5EDD6" }}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-sand/45">{sub}</div>}
    </Card>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: string; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 p-10 text-center">
      <div className="text-4xl">{icon}</div>
      <div className="mt-3 font-bold text-sand">{title}</div>
      <p className="mt-1 max-w-sm text-sm text-sand/50">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sand/60">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
