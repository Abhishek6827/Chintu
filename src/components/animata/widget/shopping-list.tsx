import React from "react";
import { cn } from "@/lib/utils";


interface ShoppingListProps {
  title?: string;
  data?: { title: string; checked?: boolean }[];
}

export default function ShoppingList({ title = "Checklist", data = [] }: ShoppingListProps) {
  const displayData = data.length > 0 ? data : [
    { title: "System Check", checked: true },
    { title: "Network Stability", checked: true },
    { title: "Mic Permission", checked: false },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-[2rem] bg-[#dbeafe] p-6 shadow-xl border border-blue-200/50 w-52 h-64 overflow-hidden">
      <h4 className="font-black text-blue-900 uppercase tracking-widest text-[10px] border-b border-blue-900/10 pb-2">{title}</h4>
      <ul className="space-y-3 mt-2">
        {displayData.map((item, i) => (
          <li key={i} className={cn("flex items-center gap-3 text-[11px] font-bold uppercase tracking-tight", {
            "text-blue-800": !item.checked,
            "text-blue-900/50 line-through": item.checked,
          })}>
            <div className={cn("w-4 h-4 rounded border-2 border-blue-900/20 flex items-center justify-center transition-colors", {
              "bg-blue-600 border-blue-600": item.checked,
              "bg-white/50": !item.checked,
            })}>
              {item.checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span>{item.title}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-4 flex justify-between items-center">
         <span className="text-[8px] font-black text-blue-900/30 uppercase tracking-widest">Pre-Flight</span>
         <div className="w-8 h-8 rounded-full bg-blue-900/5 flex items-center justify-center text-blue-900/20 text-xs font-black">✓</div>
      </div>
    </div>
  );
}
