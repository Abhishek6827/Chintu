"use client";

import { useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

export const TextReveal = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const scrollYProgress = useMotionValue(0);

  useEffect(() => {
    const scrollEl: HTMLElement | Window =
      document.getElementById('main-content') || window;

    const computeProgress = () => {
      const target = targetRef.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      // Map progress to natural section intersection with viewport:
      // Start (0): section's top at 80% of viewport (just entering)
      // End (1): section's bottom at 20% of viewport (almost left)
      const startAt = viewportHeight * 0.8;
      const endAt = viewportHeight * 0.2 - rect.height;
      const totalScroll = startAt - endAt;
      if (totalScroll <= 0) return;
      const scrolled = startAt - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / totalScroll));
      scrollYProgress.set(progress);
    };

    scrollEl.addEventListener('scroll', computeProgress, { passive: true });
    window.addEventListener('resize', computeProgress);
    computeProgress();

    return () => {
      scrollEl.removeEventListener('scroll', computeProgress);
      window.removeEventListener('resize', computeProgress);
    };
  }, [scrollYProgress]);

  const words = text.split(" ");

  return (
    <div
      ref={targetRef}
      className={cn(
        "relative z-0 py-32 px-6 flex items-center justify-center pointer-events-none",
        className,
      )}
    >
      <p className="max-w-5xl text-3xl font-black md:text-5xl lg:text-6xl xl:text-7xl uppercase tracking-tighter leading-[0.95] text-center flex flex-wrap justify-center">
        {words.map((word, i) => {
          const start = i / words.length;
          const end = start + 1 / words.length;
          return (
            <Word key={i} progress={scrollYProgress} range={[start, end]}>
              {word}
            </Word>
          );
        })}
      </p>
    </div>
  );
};

const Word = ({
  children,
  progress,
  range,
}: {
  children: React.ReactNode;
  progress: MotionValue<number>;
  range: [number, number];
}) => {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <motion.span
      style={{ opacity }}
      className="mx-1.5 lg:mx-3 text-[var(--text-main)]"
    >
      {children}
    </motion.span>
  );
};
