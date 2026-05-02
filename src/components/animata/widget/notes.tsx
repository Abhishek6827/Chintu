import React from "react";
import { cn } from "@/lib/utils";

export const NotesCard = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("flex flex-col gap-3 rounded-[2rem] bg-[#fef9c3] p-6 shadow-xl border border-yellow-200/50 w-52 h-64 overflow-hidden", className)}>
    <h4 className="font-black text-yellow-900 uppercase tracking-widest text-[10px] border-b border-yellow-900/10 pb-2">{title}</h4>
    <div className="text-[11px] text-yellow-800 font-bold leading-relaxed space-y-2 mt-2 italic">
      {children}
    </div>
    <div className="mt-auto pt-4 flex justify-end">
       <div className="w-8 h-8 rounded-full bg-yellow-900/5 flex items-center justify-center text-yellow-900/20 text-xs font-black">AI</div>
    </div>
  </div>
);

export default function Notes() {
  return (
    <NotesCard title="Interview Protocol">
      <div>• Maintain steady eye contact with the camera.</div>
      <div>• Keep answers concise and results-oriented.</div>
      <div>• Use the STAR method for behavioral questions.</div>
    </NotesCard>
  );
}
