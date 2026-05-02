"use client";

import { useState } from "react";
import Notes, { NotesCard } from "@/components/animata/widget/notes";
import ShoppingList from "@/components/animata/widget/shopping-list";
import { cn } from "@/lib/utils";

function Reminders() {
  return (
    <ShoppingList
      title="Live Reminders"
      data={[
        { title: "Smile more", checked: false },
        { title: "Watch your pace", checked: true },
        { title: "Check JD keywords", checked: false },
      ]}
    />
  );
}

function RemodelNotes() {
  return (
    <NotesCard title="Strategic Logic">
      <div>Maintain a confident posture.</div>
      <div>Pause before complex answers.</div>
      <div>Clarify the question if unsure.</div>
      <div>Show enthusiasm for the role.</div>
    </NotesCard>
  );
}

const cards = [
  {
    component: Notes,
    rotationClass: "",
    revealClass: "-rotate-[2deg]",
  },
  {
    component: ShoppingList,
    rotationClass: "group-hover/spread:rotate-[15deg]",
    revealClass: "rotate-[3deg] translate-y-2",
  },
  {
    component: RemodelNotes,
    rotationClass: "group-hover/spread:rotate-[30deg]",
    revealClass: "-rotate-[2deg] translate-x-1",
  },
  {
    component: Reminders,
    rotationClass: "group-hover/spread:rotate-[45deg]",
    revealClass: "rotate-[2deg]",
  },
];

export default function CardSpread() {
  const [isExpanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "group/spread relative flex min-h-[400px] min-w-[300px] items-center justify-center transition duration-500 ease-in-out cursor-pointer",
        {
          "origin-bottom transition duration-500 ease-in-out hover:-rotate-[10deg]": !isExpanded,
          "gap-6": isExpanded,
        },
      )}
      onClick={() => setExpanded(!isExpanded)}
    >
      {cards.map((item, index) => {
        return (
          <div
            key={index}
            className={cn(
              "transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
              {
                "absolute z-10": !isExpanded,
                "relative z-20": isExpanded,
              },
              !isExpanded && item.rotationClass,
              isExpanded && item.revealClass,
            )}
            style={{
               transitionDelay: isExpanded ? `${index * 50}ms` : '0ms'
            }}
          >
            <item.component />
          </div>
        );
      })}
      
      {!isExpanded && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 text-[9px] font-black uppercase tracking-[0.2em] text-white/60 animate-bounce pointer-events-none">
          Click to spread tips
        </div>
      )}
    </div>
  );
}
