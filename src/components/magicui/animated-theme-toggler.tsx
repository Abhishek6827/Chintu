"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";

interface AnimatedThemeTogglerProps {
  theme: "light" | "dark";
  onToggle: () => void;
  className?: string;
}

export function AnimatedThemeToggler({
  theme,
  onToggle,
  className = "",
}: AnimatedThemeTogglerProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className={`relative h-8 w-8 rounded-xl bg-[var(--input-bg)] text-[var(--text-dim)] border border-[var(--glass-border)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-main)] transition-all active:scale-90 flex items-center justify-center overflow-hidden ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "light" ? (
          <motion.div
            key="sun"
            initial={{ y: 20, rotate: 90, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: -20, rotate: -90, opacity: 0 }}
            transition={{ duration: 0.3, ease: "circOut" }}
          >
            <Sun className="h-4 w-4" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ y: 20, rotate: 90, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: -20, rotate: -90, opacity: 0 }}
            transition={{ duration: 0.3, ease: "circOut" }}
          >
            <Moon className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
