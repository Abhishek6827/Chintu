"use client";

interface StatusIndicatorProps {
  status: "idle" | "recording" | "transcribing" | "generating";
}

export default function StatusIndicator({ status }: StatusIndicatorProps) {
  const config = {
    idle: {
      label: "Hold Space to Record",
      color: "bg-white/10",
      textColor: "text-zinc-400",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
          />
        </svg>
      ),
      pulse: false,
    },
    recording: {
      label: "Recording...",
      color: "bg-red-500/20 border border-red-500/50",
      textColor: "text-red-400",
      icon: (
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
      ),
      pulse: true,
    },
    transcribing: {
      label: "Transcribing...",
      color: "bg-amber-500/20 border border-amber-500/50",
      textColor: "text-amber-400",
      icon: (
        <svg
          className="w-5 h-5 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ),
      pulse: false,
    },
    generating: {
      label: "Generating Answer...",
      color: "bg-emerald-500/20 border border-emerald-500/50",
      textColor: "text-emerald-400",
      icon: (
        <svg
          className="w-5 h-5 animate-pulse"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
          />
        </svg>
      ),
      pulse: false,
    },
  };

  const { label, color, textColor, icon, pulse } = config[status];

  return (
    <div
      className={`
        inline-flex items-center gap-3 px-5 py-3 rounded-full
        ${color} ${textColor}
        transition-all duration-300 ease-out
        ${pulse ? "animate-pulse" : ""}
        backdrop-blur-sm
      `}
    >
      {icon}
      <span className="text-sm font-medium tracking-wide">{label}</span>
    </div>
  );
}
