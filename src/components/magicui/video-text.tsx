import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface VideoTextProps {
  src: string;
  children: React.ReactNode;
  className?: string;
  videoClassName?: string;
}

export function VideoText({
  src,
  children,
  className,
  videoClassName,
}: VideoTextProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && videoRef.current) {
          videoRef.current.play().catch(e => console.log("Video auto-play prevented:", e));
        } else if (!entry.isIntersecting && videoRef.current) {
          videoRef.current.pause();
        }
      });
    }, { threshold: 0.1 });
    
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden h-full w-full", className)}>
      <video
        ref={videoRef}
        src={src}
        preload="none"
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
