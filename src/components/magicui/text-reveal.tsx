"use client";

import { useRef } from "react";
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

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });

  const words = text.split(" ");

  return (
    <div ref={targetRef} className={cn("relative z-0 min-h-[50vh]", className)}>
      <div className="sticky top-0 mx-auto flex h-[100%] max-w-4xl items-center bg-transparent px-[1rem] py-[5rem]">
        <p className="flex flex-wrap p-5 text-2xl font-black text-black/10 dark:text-white/10 md:p-8 md:text-3xl lg:p-10 lg:text-4xl xl:text-5xl uppercase tracking-tighter leading-none">
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
    <span className="relative mx-1 lg:mx-2.5">
      <span className="absolute opacity-30">{children}</span>
      <motion.span style={{ opacity: opacity }} className="text-black dark:text-white">
        {children}
      </motion.span>
    </span>
  );
};
