"use client";

import { useRef, useEffect, useCallback, useState } from "react";

interface AnswerEntry {
  id: string;
  question: string;
  answer: string;
  isStreaming: boolean;
}

interface PipWindowProps {
  answers: AnswerEntry[];
  status: "idle" | "recording" | "generating";
  liveTranscript: string;
  responseLength: "small" | "balanced" | "detailed" | "coding";
}

export default function PipWindow({
  answers,
  status,
  liveTranscript,
  responseLength,
}: PipWindowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animFrameRef = useRef<number>(0);
  const [isPip, setIsPip] = useState(false);

  // Keep data in refs for the render loop
  const dataRef = useRef({ answers, status, liveTranscript, responseLength });
  useEffect(() => {
    dataRef.current = { answers, status, liveTranscript, responseLength };
  }, [answers, status, liveTranscript, responseLength]);

  const drawToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const { answers: entries, status: st, liveTranscript: lt, responseLength: rl } = dataRef.current;

    // ---- Background ----
    ctx.fillStyle = "#0c0c0e";
    ctx.fillRect(0, 0, W, H);

    // ---- Top bar ----
    const topH = 80;
    ctx.fillStyle = "#141417";
    ctx.fillRect(0, 0, W, topH);

    // Title
    ctx.fillStyle = "#d4d4d8";
    ctx.font = "bold 28px Inter, system-ui, sans-serif";
    ctx.fillText("🎯 Chintu", 24, 48);

    // Status pill
    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
      idle: { label: "● Ready", color: "#71717a", bg: "#27272a" },
      recording: { label: "● REC", color: "#f87171", bg: "#7f1d1d" },
      generating: { label: "✨ Generating", color: "#34d399", bg: "#064e3b" },
    };
    const sc = statusConfig[st] || statusConfig.idle;
    const pillX = W - 220;
    ctx.fillStyle = sc.bg;
    roundRect(ctx, pillX, 20, 190, 36, 18);
    ctx.fill();
    ctx.fillStyle = sc.color;
    ctx.font = "bold 20px Inter, system-ui, sans-serif";
    ctx.fillText(sc.label, pillX + 16, 44);

    // Response length indicator
    const rlLabels: Record<string, string> = { small: "⚡ Small", balanced: "⚖️ Balanced", detailed: "📝 Detailed", coding: "💻 Coding" };
    ctx.fillStyle = "#3f3f46";
    ctx.font = "16px Inter, system-ui, sans-serif";
    ctx.fillText(rlLabels[rl] || "Balanced", 24, topH - 10);

    // Shortcut hints
    ctx.fillStyle = "#52525b";
    ctx.font = "14px Inter, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Space: Record  |  1/2/3: Length  |  H: Hide", W - 24, topH - 10);
    ctx.textAlign = "left";

    let y = topH + 20;

    // ---- Live transcript while recording ----
    if (st === "recording" && lt) {
      ctx.fillStyle = "#1c1c20";
      roundRect(ctx, 20, y, W - 40, Math.min(120, 60), 12);
      ctx.fill();
      ctx.strokeStyle = "#f87171";
      ctx.lineWidth = 1;
      roundRect(ctx, 20, y, W - 40, Math.min(120, 60), 12);
      ctx.stroke();

      ctx.fillStyle = "#fca5a5";
      ctx.font = "italic 20px Inter, system-ui, sans-serif";
      const ltLines = wrapText(ctx, `"${lt}"`, W - 80);
      let ly = y + 28;
      for (let i = 0; i < Math.min(ltLines.length, 2); i++) {
        ctx.fillText(ltLines[i], 40, ly);
        ly += 26;
      }
      y += 80;
    }

    // ---- Answers ----
    if (entries.length === 0) {
      ctx.fillStyle = "#3f3f46";
      ctx.font = "24px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Hold Space and ask a question...", W / 2, H / 2);
      ctx.textAlign = "left";
      animFrameRef.current = requestAnimationFrame(drawToCanvas);
      return;
    }

    const pad = 24;
    const answerFontSize = 26;
    const questionFontSize = 20;
    const ansLineH = 36;
    const qLineH = 28;
    const maxTextW = W - pad * 2 - 50;

    for (let i = 0; i < entries.length && y < H - 30; i++) {
      const entry = entries[i];

      // Card background for latest answer
      if (i === 0 && entry.isStreaming) {
        ctx.fillStyle = "#0d1f17";
        const cardH = Math.min(H - y - 20, 500);
        roundRect(ctx, 12, y - 8, W - 24, cardH, 16);
        ctx.fill();
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 1;
        roundRect(ctx, 12, y - 8, W - 24, cardH, 16);
        ctx.stroke();
      }

      // Q badge
      ctx.fillStyle = "#7c3aed";
      roundRect(ctx, pad, y, 36, 30, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = `bold 18px Inter, system-ui, sans-serif`;
      ctx.fillText("Q", pad + 11, y + 22);

      // Question text
      ctx.fillStyle = "#a1a1aa";
      ctx.font = `${questionFontSize}px Inter, system-ui, sans-serif`;
      const qLines = wrapText(ctx, entry.question, maxTextW);
      let qy = y + 22;
      for (const line of qLines) {
        if (qy > H - 30) break;
        ctx.fillText(line, pad + 48, qy);
        qy += qLineH;
      }
      y = qy + 8;

      // Divider
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad + 10, y);
      ctx.lineTo(W - pad - 10, y);
      ctx.stroke();
      y += 14;

      // A badge
      ctx.fillStyle = "#059669";
      roundRect(ctx, pad, y, 36, 30, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = `bold 18px Inter, system-ui, sans-serif`;
      ctx.fillText("A", pad + 11, y + 22);

      // Answer text — LARGE
      ctx.fillStyle = "#f4f4f5";
      ctx.font = `${answerFontSize}px Inter, system-ui, sans-serif`;
      const aLines = wrapText(ctx, entry.answer, maxTextW);
      let ay = y + 22;
      for (const line of aLines) {
        if (ay > H - 30) break;
        ctx.fillText(line, pad + 48, ay);
        ay += ansLineH;
      }

      // Streaming cursor
      if (entry.isStreaming && i === 0) {
        const blink = Date.now() % 1000 < 500;
        if (blink) {
          ctx.fillStyle = "#10b981";
          const lastLine = aLines[aLines.length - 1] || "";
          ctx.fillRect(pad + 48 + ctx.measureText(lastLine).width + 4, ay - ansLineH + 8, 3, 24);
        }
      }

      y = ay + 24;

      // Separator between entries
      if (i < entries.length - 1 && y < H - 30) {
        ctx.strokeStyle = "#3f3f46";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(pad + 30, y);
        ctx.lineTo(W - pad - 30, y);
        ctx.stroke();
        ctx.setLineDash([]);
        y += 20;
      }
    }

    animFrameRef.current = requestAnimationFrame(drawToCanvas);
  }, []);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(drawToCanvas);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [drawToCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const stream = canvas.captureStream(30);
    video.srcObject = stream;
    video.muted = true;
    video.play().catch(() => {});
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onLeave = () => setIsPip(false);
    video.addEventListener("leavepictureinpicture", onLeave);
    return () => video.removeEventListener("leavepictureinpicture", onLeave);
  }, []);

  const togglePip = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPip(false);
      } else {
        await video.requestPictureInPicture();
        setIsPip(true);
      }
    } catch (err) {
      console.error("PiP error:", err);
    }
  };

  return (
    <>
      <canvas ref={canvasRef} width={1080} height={1200} className="hidden" />
      <video ref={videoRef} width={1080} height={1200} className="hidden" playsInline muted />

      {/* Button to open PiP — must be clicked by user (browser requirement) */}
      {!isPip && (
        <button
          onClick={togglePip}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-lg font-bold shadow-2xl shadow-violet-500/40 hover:from-violet-500 hover:to-indigo-500 transition-all hover:scale-105 flex items-center gap-3"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Open Answer Window
        </button>
      )}

      {isPip && (
        <button
          onClick={togglePip}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-white/[0.06] text-zinc-400 text-sm border border-white/[0.1] hover:bg-white/[0.1] transition-all"
        >
          Close PiP Window
        </button>
      )}
    </>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text) return [""];
  const lines: string[] = [];
  const paragraphs = text.split("\n");
  for (const para of paragraphs) {
    if (para.trim() === "") { lines.push(""); continue; }
    const words = para.split(" ");
    let currentLine = "";
    for (const word of words) {
      const testLine = currentLine ? currentLine + " " + word : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
  }
  return lines;
}
