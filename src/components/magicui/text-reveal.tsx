"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export const TextReveal = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const main = document.getElementById('main-content');
    if (main) setContainer(main);
  }, []);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    container: container ? { current: container } : undefined,
    offset: ["start 0.7", "end 0.3"],
  });

  const words = text.split(" ");

  return (
    <div ref={targetRef} className={cn("relative z-0 h-[120vh]", className)}>
      <div className="sticky inset-0 h-screen w-full flex flex-col items-center justify-center bg-transparent px-6 overflow-hidden pointer-events-none">
        <p className="max-w-5xl text-3xl font-black text-[var(--text-main)] md:text-5xl lg:text-6xl xl:text-7xl uppercase tracking-tighter leading-[0.85] text-center flex flex-wrap justify-center">
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
    </div>
  );
};

const Word = ({
  children,
  progress,
  range,
}: {
  children: React.ReactNode;
  progress: any;
  range: [number, number];
}) => {
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <span className="relative mx-1.5 lg:mx-3">
      <span className="absolute text-[var(--text-main)] opacity-[0.15]">{children}</span>
      <motion.span style={{ opacity: opacity }} className="text-[var(--text-main)]">
        {children}
      </motion.span>
    </span>
  );
};
