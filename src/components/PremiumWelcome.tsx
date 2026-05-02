"use client";

import { Meteors } from "./magicui/meteors";

export function PremiumWelcome({ plan }: { plan: string }) {
  return (
    <div className="relative flex h-[150px] w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-indigo-500/20 bg-black/5 shadow-xl animate-in zoom-in-95 duration-500">
      <Meteors number={20} />
      <div className="relative z-10 flex flex-col items-center">
        <span className="pointer-events-none bg-gradient-to-b from-indigo-400 to-indigo-900 bg-clip-text text-center text-4xl leading-none font-black whitespace-pre-wrap text-transparent uppercase tracking-tighter">
          {plan} Access
        </span>
        <p className="text-[10px] font-black text-indigo-500/50 uppercase tracking-[0.3em] mt-2">Protocol Active</p>
      </div>
    </div>
  )
}
