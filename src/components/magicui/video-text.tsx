import React from "react";
import { cn } from "@/lib/utils";

interface VideoTextProps {
  src: string;
  children: string;
  className?: string;
  videoClassName?: string;
}

export function VideoText({
  src,
  children,
  className,
  videoClassName,
}: VideoTextProps) {
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden h-full w-full", className)}>
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className={cn("absolute inset-0 h-full w-full object-cover grayscale opacity-50", videoClassName)}
      />
      <span className="relative z-10 text-white font-black uppercase tracking-[0.2em] text-4xl sm:text-6xl drop-shadow-2xl">
        {children}
      </span>
    </div>
  );
}
