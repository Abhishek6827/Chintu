"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Plus, Check, X } from "lucide-react";

/* ─── Scroll Progress Bar ─────────────────────────────────────
 * Reads scroll from `#main-content` (set in src/app/layout.tsx),
 * because the page scrolls inside that container, not on window.
 */
export const ScrollProgressBar: React.FC = () => {
  const progress = useMotionValue(0);
  const smooth = useSpring(progress, { stiffness: 110, damping: 24, mass: 0.4 });
  const width = useTransform(smooth, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const el = document.getElementById("main-content");
    const target: HTMLElement | Window = el || window;

    const update = () => {
      if (el) {
        const { scrollTop, scrollHeight, clientHeight } = el;
        const max = scrollHeight - clientHeight;
        progress.set(max > 0 ? scrollTop / max : 0);
      } else {
        const max =
          (document.documentElement.scrollHeight || 0) - window.innerHeight;
        progress.set(max > 0 ? window.scrollY / max : 0);
      }
    };

    update();
    target.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      target.removeEventListener("scroll", update as EventListener);
      window.removeEventListener("resize", update);
    };
  }, [progress]);

  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 h-[3px] z-[110] pointer-events-none origin-left"
      style={{
        width,
        background:
          "linear-gradient(90deg, #14b8a6 0%, #2dd4bf 50%, #06b6d4 100%)",
        boxShadow: "0 0 12px rgba(20,184,166,0.6)",
      }}
    />
  );
};

/* ─── Animated Counter ─────────────────────────────────────────
 * Counts up from 0 → `to` once it scrolls into view.
 */
export const AnimatedCounter: React.FC<{
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}> = ({
  to,
  duration = 1.6,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}) => {
    const ref = useRef<HTMLSpanElement>(null);
    const [display, setDisplay] = useState(0);
    const [hasRun, setHasRun] = useState(false);

    useEffect(() => {
      if (!ref.current) return;
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasRun) {
            setHasRun(true);
            const start = performance.now();
            const animate = (now: number) => {
              const elapsed = (now - start) / (duration * 1000);
              const t = Math.min(1, elapsed);
              const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
              setDisplay(to * eased);
              if (t < 1) requestAnimationFrame(animate);
              else setDisplay(to);
            };
            requestAnimationFrame(animate);
          }
        },
        { threshold: 0.35 }
      );
      io.observe(ref.current);
      return () => io.disconnect();
    }, [to, duration, hasRun]);

    return (
      <span ref={ref} className={className}>
        {prefix}
        {display.toFixed(decimals)}
        {suffix}
      </span>
    );
  };

/* ─── FAQ Accordion ────────────────────────────────────────── */
export type FaqItem = { q: string; a: string };

export const FaqAccordion: React.FC<{ items: FaqItem[] }> = ({ items }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const open = openIdx === i;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="border border-[var(--glass-border)] rounded-2xl overflow-hidden bg-[var(--panel-bg)] backdrop-blur-xl hover:border-teal-500/40 transition-colors"
          >
            <button
              onClick={() => setOpenIdx(open ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-5 sm:px-7 py-4 sm:py-5 text-left no-drag"
              style={{ WebkitAppRegion: "no-drag" } as any}
              aria-expanded={open}
            >
              <span className="text-[11px] sm:text-sm font-black uppercase tracking-[0.15em] text-[var(--text-main)]">
                {item.q}
              </span>
              <motion.span
                animate={{ rotate: open ? 45 : 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400"
              >
                <Plus className="w-3.5 h-3.5" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 sm:px-7 pb-5 pt-0">
                    <p className="text-[10px] sm:text-xs text-[var(--text-dim)] font-medium leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};

/* ─── Comparison Table ────────────────────────────────────────
 * 3-column comparison grid (Chintu vs competitor A vs competitor B).
 * Cells render either ✓ / ✗ / a short label.
 */
export type CompareCell = boolean | string;
export type CompareRow = {
  feature: string;
  chintu: CompareCell;
  compA: CompareCell;
  compB: CompareCell;
};

const Cell: React.FC<{ value: CompareCell; highlight?: boolean }> = ({
  value,
  highlight,
}) => {
  if (typeof value === "boolean") {
    return value ? (
      <div
        className={`w-7 h-7 sm:w-9 sm:h-9 mx-auto rounded-full flex items-center justify-center ${highlight
            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
            : "bg-emerald-500/15 text-emerald-500"
          }`}
      >
        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
    ) : (
      <div className="w-7 h-7 sm:w-9 sm:h-9 mx-auto rounded-full flex items-center justify-center bg-rose-500/10 text-rose-500">
        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
    );
  }
  return (
    <span
      className={`block text-center text-[10px] sm:text-[11px] font-black uppercase tracking-widest ${highlight ? "text-teal-500" : "text-[var(--text-dim)]"
        }`}
    >
      {value}
    </span>
  );
};

export const ComparisonTable: React.FC<{
  rows: CompareRow[];
  competitorAName?: string;
  competitorBName?: string;
}> = ({ rows, competitorAName = "Competitor A", competitorBName = "Competitor B" }) => {
  return (
    <div className="rounded-[2rem] border border-[var(--glass-border)] bg-[var(--panel-bg)] overflow-hidden backdrop-blur-xl shadow-[0_30px_80px_-30px_rgba(13,148,136,0.25)]">
      {/* Header row */}
      <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] sm:grid-cols-[1.6fr_1fr_1fr_1fr] gap-2 sm:gap-4 px-4 sm:px-8 py-4 sm:py-5 border-b border-[var(--glass-border)] bg-[var(--bg-app)]/60">
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-dim)]">
          Feature
        </span>
        <span className="text-center text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-teal-500 to-cyan-400">
          Chintu Ji
        </span>
        <span className="text-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)]">
          {competitorAName}
        </span>
        <span className="text-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)]">
          {competitorBName}
        </span>
      </div>

      {/* Body rows */}
      <div>
        {rows.map((row, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
            className={`grid grid-cols-[1.4fr_1fr_1fr_1fr] sm:grid-cols-[1.6fr_1fr_1fr_1fr] gap-2 sm:gap-4 px-4 sm:px-8 py-3 sm:py-4 items-center ${i !== rows.length - 1 ? "border-b border-[var(--glass-border)]" : ""
              } hover:bg-teal-500/5 transition-colors`}
          >
            <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-tight text-[var(--text-main)]">
              {row.feature}
            </span>
            <div className="bg-teal-500/5 rounded-xl py-1.5 sm:py-2">
              <Cell value={row.chintu} highlight />
            </div>
            <Cell value={row.compA} />
            <Cell value={row.compB} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
