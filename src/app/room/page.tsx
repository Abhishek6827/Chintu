"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AnswerDisplay from "@/components/AnswerDisplay";
import ProfileModal, { getProfileContext, getStoredProfile } from "@/components/ProfileModal";

interface AnswerEntry {
  id: string;
  question: string;
  answer: string;
  isStreaming: boolean;
  mode?: string;
  model?: string;
  startTime?: number;
  timeTaken?: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

type ResponseLength = "small" | "balanced" | "detailed" | "coding";

// ─── Available models ─────────────────────────────────────────
const MODELS = [
  { key: "gpt-oss-120b", name: "GPT-OSS 120B" },
  { key: "qwen3-coder-480b", name: "Qwen3 Coder 480B" },
  { key: "deepseek-r1", name: "DeepSeek R1" },
  { key: "nemotron-3-120b", name: "Nemotron 3 (120B)" },
  { key: "llama-3.3-nemotron-49b", name: "Qwen3.6 Plus" },
] as const;

type ModelKey = typeof MODELS[number]["key"];

// ─── Vision models (for screenshot processing) ─────────────
const VISION_MODELS = [
  { key: "llama-4-scout", name: "Llama 4 Scout" },
  { key: "qwen3.6-plus", name: "Qwen3.6 Plus" },
] as const;

type VisionModelKey = typeof VISION_MODELS[number]["key"];

// ─── Conversation history message type ────────────────────
interface HistoryMessage {
  role: "user" | "assistant";
  content: any; // string for assistant, array for user (with images)
}

// ─── Custom Select Component ─────────────────────────────
function CustomSelect({ 
  options, 
  value, 
  onChange, 
  className = "" 
}: { 
  options: { key: string, name: string }[], 
  value: string, 
  onChange: (val: string) => void,
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.key === value);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 flex items-center justify-between outline-none focus:ring-2 focus:ring-indigo-300"
      >
        <span className="truncate">{selectedOption?.name || value}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-full min-w-[120px] bg-white border border-gray-200 rounded-lg shadow-xl z-[70] py-1 overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  onChange(opt.key);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 transition-colors ${value === opt.key ? "text-indigo-600 font-semibold bg-indigo-50/50" : "text-gray-700"}`}
              >
                {opt.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Check if running in Electron
const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;

export default function RoomPage() {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState("");
  const [profileContext, setProfileContext] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [status, setStatus] = useState<"idle" | "recording" | "generating">("idle");
  const [answers, setAnswers] = useState<AnswerEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [micReady, setMicReady] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [responseLength, setResponseLength] = useState<ResponseLength>("balanced");
  const [showSettings, setShowSettings] = useState(false);
  const [isWindowHidden, setIsWindowHidden] = useState(true);
  const [showUnhidePrompt, setShowUnhidePrompt] = useState(false);
  const [inputText, setInputText] = useState("");
  const [mounted, setMounted] = useState(false);
  const [windowOpacity, setWindowOpacity] = useState(1);
  const [fontSize, setFontSize] = useState(14);
  const [spaceMode, setSpaceMode] = useState<"hold" | "toggle">("hold");
  const [selectedModel, setSelectedModel] = useState<ModelKey>("gpt-oss-120b");
  const selectedModelRef = useRef<ModelKey>("gpt-oss-120b");
  const [selectedVisionModel, setSelectedVisionModel] = useState<VisionModelKey>("llama-4-scout");
  const selectedVisionModelRef = useRef<VisionModelKey>("llama-4-scout");

  // ─── Vision conversation history ──────────────────────────
  // Keeps track of previous screenshot exchanges so the model
  // has context when multiple screenshots are sent in sequence.
  const [visionConversationHistory, setVisionConversationHistory] = useState<HistoryMessage[]>([]);

  // ─── Chat conversation history ────────────────────────────
  // Keeps track of previous Q&A exchanges for regular chat so
  // the model has context across all response modes.
  const [chatConversationHistory, setChatConversationHistory] = useState<HistoryMessage[]>([]);

  // ─── Auto-update status ───────────────────────────────────
  const [updateStatus, setUpdateStatus] = useState<{ status: string; version?: string; percent?: number } | null>(null);
  const [appVersion, setAppVersion] = useState("");

  useEffect(() => {
    setMounted(true);
    if (isElectron && (window as any).electronAPI?.getOpacity) {
      (window as any).electronAPI.getOpacity().then((o: number) => setWindowOpacity(o));
    }
    if (isElectron && (window as any).electronAPI?.getVersion) {
      (window as any).electronAPI.getVersion().then((v: string) => setAppVersion(v));
    }
  }, []);

  useEffect(() => {
    if (isElectron && (window as any).electronAPI?.onHiddenChange) {
      return (window as any).electronAPI.onHiddenChange((hidden: boolean) => {
        setIsWindowHidden(hidden);
      });
    }
  }, []);

  // ─── Listen for auto-update events ────────────────────────
  useEffect(() => {
    if (isElectron && (window as any).electronAPI?.onUpdateStatus) {
      return (window as any).electronAPI.onUpdateStatus((data: any) => {
        setUpdateStatus(data);
      });
    }
  }, []);

  // ─── Screen + Audio Recording State ─────────────────────
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const screenRecorderRef = useRef<MediaRecorder | null>(null);
  const screenChunksRef = useRef<Blob[]>([]);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const micStreamForRecordingRef = useRef<MediaStream | null>(null);
  const recordingAudioCtxRef = useRef<AudioContext | null>(null);

  // ─── Screenshot Capture State ──────────────────────────
  const [capturedScreenshots, setCapturedScreenshots] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  // ─── AI Speech tracking ─────────────────────────────────
  const [aiSpeechBubbles, setAiSpeechBubbles] = useState<string[]>([]);

  // ─── Speech Recognition refs ────────────────────────────
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");
  const isRecordingRef = useRef(false);
  const responseLengthRef = useRef<ResponseLength>("balanced");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ─── Whisper-based recording refs (for Electron) ────────
  const whisperMicStreamRef = useRef<MediaStream | null>(null);
  const whisperRecorderRef = useRef<MediaRecorder | null>(null);
  const whisperChunksRef = useRef<Blob[]>([]);
  const liveTranscriptRef = useRef("");

  // ─── Fullscreen UI persistence ref ──────────────────────
  const controlsRef = useRef<HTMLDivElement>(null);
  const originalParentRef = useRef<HTMLElement | null>(null);

  useEffect(() => { responseLengthRef.current = responseLength; }, [responseLength]);

  // Auto-switch model when coding mode is selected
  useEffect(() => {
    if (responseLength === "coding") {
      setSelectedModel("qwen3-coder-480b");
      selectedModelRef.current = "qwen3-coder-480b";
    } else {
      setSelectedModel("gpt-oss-120b");
      selectedModelRef.current = "gpt-oss-120b";
    }
  }, [responseLength]);

  useEffect(() => { selectedModelRef.current = selectedModel; }, [selectedModel]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [answers]);

  useEffect(() => {
    const jd = sessionStorage.getItem("jobDescription");
    if (!jd) { router.push("/"); return; }
    setJobDescription(jd);
    // Load profile context
    setProfileContext(getProfileContext());
    setHasProfile(!!getStoredProfile());
  }, [router]);

  const refreshProfile = () => {
    setProfileContext(getProfileContext());
    setHasProfile(!!getStoredProfile());
  };

  // ─── Fullscreen change listener ─────────────────────────
  useEffect(() => {
    const handleFullscreenChange = () => {
      const controls = controlsRef.current;
      if (!controls) return;

      if (document.fullscreenElement) {
        if (!originalParentRef.current) {
          originalParentRef.current = controls.parentElement;
        }
        document.fullscreenElement.appendChild(controls);
        controls.style.position = "fixed";
        controls.style.zIndex = "2147483647";
        controls.style.bottom = "20px";
        controls.style.right = "20px";
        controls.style.left = "auto";
        controls.style.top = "auto";
      } else {
        if (originalParentRef.current && controls.parentElement !== originalParentRef.current) {
          originalParentRef.current.appendChild(controls);
        }
        controls.style.position = "";
        controls.style.zIndex = "";
        controls.style.bottom = "";
        controls.style.right = "";
        controls.style.left = "";
        controls.style.top = "";
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const stopScreenRecording = useCallback(() => {
    const recorder = screenRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    screenRecorderRef.current = null;

    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((t) => t.stop());
      displayStreamRef.current = null;
    }

    if (micStreamForRecordingRef.current) {
      micStreamForRecordingRef.current.getTracks().forEach((t) => t.stop());
      micStreamForRecordingRef.current = null;
    }

    if (recordingAudioCtxRef.current) {
      recordingAudioCtxRef.current.close().catch(() => {});
      recordingAudioCtxRef.current = null;
    }

    setIsScreenRecording(false);
  }, []);

  const startScreenRecording = useCallback(async () => {
    try {
      setError(null);

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      displayStreamRef.current = displayStream;

      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamForRecordingRef.current = micStream;
      } catch (micErr) {
        console.warn("[Recording] Could not get mic audio:", micErr);
      }

      const videoTrack = displayStream.getVideoTracks()[0];
      const systemAudioTracks = displayStream.getAudioTracks();

      const audioCtx = new AudioContext();
      recordingAudioCtxRef.current = audioCtx;
      const destination = audioCtx.createMediaStreamDestination();

      if (systemAudioTracks.length > 0) {
        const systemAudioStream = new MediaStream(systemAudioTracks);
        const systemSource = audioCtx.createMediaStreamSource(systemAudioStream);
        const systemGain = audioCtx.createGain();
        systemGain.gain.value = 1.0;
        systemSource.connect(systemGain);
        systemGain.connect(destination);
      }

      if (micStream && micStream.getAudioTracks().length > 0) {
        const micSource = audioCtx.createMediaStreamSource(micStream);
        const micGain = audioCtx.createGain();
        micGain.gain.value = 1.0;
        micSource.connect(micGain);
        micGain.connect(destination);
      }

      const mergedAudioTrack = destination.stream.getAudioTracks()[0];
      const finalStream = new MediaStream();
      if (videoTrack) finalStream.addTrack(videoTrack);
      if (mergedAudioTrack) finalStream.addTrack(mergedAudioTrack);

      const mimeType = "video/webm; codecs=vp8,opus";
      let recorder: MediaRecorder;
      if (MediaRecorder.isTypeSupported(mimeType)) {
        recorder = new MediaRecorder(finalStream, { mimeType });
      } else {
        recorder = new MediaRecorder(finalStream);
      }

      screenChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) screenChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(screenChunksRef.current, { type: "video/webm" });
        screenChunksRef.current = [];
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `interview-recording-${new Date().toISOString().replace(/[:.]/g, "-")}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      };

      if (videoTrack) {
        videoTrack.onended = () => stopScreenRecording();
      }

      recorder.start(1000);
      screenRecorderRef.current = recorder;
      setIsScreenRecording(true);
    } catch (err: any) {
      console.error("[Recording] Error:", err);
      if (err.name === "NotAllowedError") {
        setError("Screen sharing permission denied.");
      } else {
        setError("Failed to start recording: " + (err.message || err));
      }
    }
  }, [stopScreenRecording]);

  useEffect(() => {
    return () => { stopScreenRecording(); };
  }, [stopScreenRecording]);

  const useWhisperFallback = useRef(false);

  const setupPlainRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isElectron || !SR) {
      console.log("[STT] Electron detected or no SpeechRecognition — using Whisper fallback");
      useWhisperFallback.current = true;
      setMicReady(true);
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "", final = "";
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) final += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      finalTranscriptRef.current = final;
      setLiveTranscript(final + interim);
    };

    recognition.onerror = (event: any) => {
      console.warn("[STT] SpeechRecognition error:", event.error);
      if (event.error === "not-allowed") {
        setError("Mic access denied.");
      } else if (event.error === "network" || event.error === "service-not-allowed") {
        console.log("[STT] Switching to Whisper fallback due to:", event.error);
        useWhisperFallback.current = true;
      }
    };

    recognition.onstart = () => setMicReady(true);
    recognitionRef.current = recognition;
    setMicReady(true);
  }, []);

  useEffect(() => {
    setupPlainRecognition();
    return () => { try { recognitionRef.current?.stop(); } catch {} };
  }, [setupPlainRecognition]);

  const startWhisperRecording = useCallback(async () => {
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      whisperMicStreamRef.current = micStream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(micStream, { mimeType });
      whisperChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        console.log("[Whisper STT] Got chunk:", e.data.size, "bytes");
        if (e.data.size > 0) whisperChunksRef.current.push(e.data);
      };

      recorder.start();
      whisperRecorderRef.current = recorder;
      setLiveTranscript("🎤 Listening...");
      console.log("[Whisper STT] Recording started, state:", recorder.state);
    } catch (err: any) {
      console.error("[Whisper STT] Mic error:", err);
      setError("Mic access denied. Check permissions.");
    }
  }, []);

  const stopWhisperRecordingAndTranscribe = useCallback(async (): Promise<string> => {
    const recorder = whisperRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      console.warn("[Whisper STT] No active recorder to stop");
      return "";
    }

    console.log("[Whisper STT] Stopping recorder, state:", recorder.state);

    const blob = await new Promise<Blob>((resolve) => {
      recorder.ondataavailable = (e) => {
        console.log("[Whisper STT] Final chunk:", e.data.size, "bytes");
        if (e.data.size > 0) whisperChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        console.log("[Whisper STT] Recorder stopped, total chunks:", whisperChunksRef.current.length);

        if (whisperMicStreamRef.current) {
          whisperMicStreamRef.current.getTracks().forEach((t) => t.stop());
          whisperMicStreamRef.current = null;
        }

        const chunks = [...whisperChunksRef.current];
        whisperChunksRef.current = [];

        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        console.log("[Whisper STT] Total blob size:", audioBlob.size, "bytes");
        resolve(audioBlob);
      };

      recorder.stop();
    });

    whisperRecorderRef.current = null;

    if (blob.size < 100) {
      console.warn("[Whisper STT] Audio too small:", blob.size, "bytes");
      return "";
    }

    setLiveTranscript("⏳ Transcribing...");

    try {
      const formData = new FormData();
      formData.append("file", blob, "mic_recording.webm");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const text = (data.text || "").trim();
        console.log("[Whisper STT] Transcript:", JSON.stringify(text));
        return text;
      } else {
        const errData = await res.text();
        console.error("[Whisper STT] API error:", res.status, errData);
        setError("Transcription failed: " + res.status);
        return "";
      }
    } catch (err) {
      console.error("[Whisper STT] Fetch error:", err);
      setError("Transcription request failed. Check connection.");
      return "";
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;
    isRecordingRef.current = true;
    setError(null);
    setStatus("recording");
    setLiveTranscript("");
    finalTranscriptRef.current = "";
    liveTranscriptRef.current = "";

    if (useWhisperFallback.current) {
      await startWhisperRecording();
    } else {
      const recognition = recognitionRef.current;
      if (!recognition) return;
      try { recognition.start(); }
      catch {
        try { recognition.stop(); setTimeout(() => recognition.start(), 100); } catch {}
      }
    }
  }, [startWhisperRecording]);

  const stopRecordingAndGenerate = useCallback(async () => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;
    setError(null);

    let transcript = "";

    if (useWhisperFallback.current) {
      transcript = await stopWhisperRecordingAndTranscribe();
    } else {
      try { recognitionRef.current?.stop(); } catch {}
      await new Promise((r) => setTimeout(r, 300));
      transcript = (finalTranscriptRef.current || liveTranscript).trim();
    }

    setLiveTranscript("");

    if (!transcript || transcript.length < 3) {
      setError((prev) => prev || "No speech detected. Try again.");
      setStatus("idle");
      return;
    }

    setStatus("generating");
    const entryId = Date.now().toString();

    const aiContext = aiSpeechBubbles.length > 0
      ? "\n\n[AI Interviewer said]: " + aiSpeechBubbles.join(" ")
      : "";

    const fullTranscript = transcript + aiContext;

    const startTime = Date.now();
    const modelName = MODELS.find(m => m.key === selectedModelRef.current)?.name || selectedModelRef.current;
    setAnswers((prev) => [...prev, { id: entryId, question: transcript, answer: "", isStreaming: true, mode: responseLengthRef.current, model: modelName, startTime }]);
    setAiSpeechBubbles([]);

    const historyToSend = [...chatConversationHistory];

    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: fullTranscript,
          jobDescription,
          aboutYou: profileContext,
          responseLength: responseLengthRef.current,
          conversationHistory: historyToSend,
          selectedModel: selectedModelRef.current,
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Failed"); }
      if (!res.body) throw new Error("No response body");

      const actualModelUsed = res.headers.get("X-Model-Used") || modelName;
      setAnswers((prev) => prev.map((a) => a.id === entryId ? { ...a, model: actualModelUsed } : a));

      let fullResponse = "";
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        setAnswers((prev) => prev.map((a) => a.id === entryId ? { ...a, answer: a.answer + chunk } : a));
      }
      setAnswers((prev) => prev.map((a) => a.id === entryId ? { ...a, isStreaming: false, timeTaken: (Date.now() - startTime) / 1000 } : a));

      // ─── Save this exchange to chat history ──────────────
      setChatConversationHistory((prev) => {
        const userMsg: HistoryMessage = { role: "user", content: fullTranscript };
        const assistantMsg: HistoryMessage = { role: "assistant", content: fullResponse };
        const updated = [...prev, userMsg, assistantMsg];
        return updated.slice(-10); // keep last 10 messages = 5 exchanges
      });

      setStatus("idle");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
      setAnswers((prev) => prev.map((a) => a.id === entryId ? { ...a, answer: "⚠️ " + msg, isStreaming: false } : a));
      setStatus("idle");
    }
  }, [jobDescription, profileContext, liveTranscript, aiSpeechBubbles, stopWhisperRecordingAndTranscribe, chatConversationHistory]);

  const handleSendText = useCallback(async () => {
    if (!inputText.trim()) return;
    const textToUse = inputText.trim();
    setInputText("");

    if (status !== "idle") return;
    setStatus("generating");
    setError(null);

    const entryId = Date.now().toString();

    const aiContext = aiSpeechBubbles.length > 0
      ? "\n\n[AI Interviewer said]: " + aiSpeechBubbles.join(" ")
      : "";

    const fullTranscript = textToUse + aiContext;

    const startTime = Date.now();
    const modelName = MODELS.find(m => m.key === selectedModelRef.current)?.name || selectedModelRef.current;
    setAnswers((prev) => [...prev, { id: entryId, question: textToUse, answer: "", isStreaming: true, mode: responseLengthRef.current, model: modelName, startTime }]);
    setAiSpeechBubbles([]);

    const historyToSend = [...chatConversationHistory];

    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: fullTranscript,
          jobDescription,
          aboutYou: profileContext,
          responseLength: responseLengthRef.current,
          conversationHistory: historyToSend,
          selectedModel: selectedModelRef.current,
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Failed"); }
      if (!res.body) throw new Error("No response body");

      const actualModelUsed = res.headers.get("X-Model-Used") || modelName;
      setAnswers((prev) => prev.map((a) => a.id === entryId ? { ...a, model: actualModelUsed } : a));

      let fullResponse = "";
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        setAnswers((prev) => prev.map((a) => a.id === entryId ? { ...a, answer: a.answer + chunk } : a));
      }
      setAnswers((prev) => prev.map((a) => a.id === entryId ? { ...a, isStreaming: false, timeTaken: (Date.now() - startTime) / 1000 } : a));

      // ─── Save this exchange to chat history ──────────────
      setChatConversationHistory((prev) => {
        const userMsg: HistoryMessage = { role: "user", content: fullTranscript };
        const assistantMsg: HistoryMessage = { role: "assistant", content: fullResponse };
        const updated = [...prev, userMsg, assistantMsg];
        return updated.slice(-10); // keep last 10 messages = 5 exchanges
      });

      setStatus("idle");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
      setAnswers((prev) => prev.map((a) => a.id === entryId ? { ...a, answer: "⚠️ " + msg, isStreaming: false } : a));
      setStatus("idle");
    }
  }, [inputText, status, jobDescription, profileContext, aiSpeechBubbles, chatConversationHistory]);

  const startRecordingRef = useRef(startRecording);
  const stopRecordingRef = useRef(stopRecordingAndGenerate);
  const spaceModeRef = useRef<"hold" | "toggle">(spaceMode);

  useEffect(() => { startRecordingRef.current = startRecording; }, [startRecording]);
  useEffect(() => { stopRecordingRef.current = stopRecordingAndGenerate; }, [stopRecordingAndGenerate]);
  useEffect(() => { spaceModeRef.current = spaceMode; }, [spaceMode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

        if (!e.repeat) {
          e.preventDefault();
          if (spaceModeRef.current === "toggle") {
            if (isRecordingRef.current) {
              stopRecordingRef.current();
            } else {
              startRecordingRef.current();
            }
          } else {
            if (!isRecordingRef.current) {
              startRecordingRef.current();
            }
          }
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        if (spaceModeRef.current === "hold" && isRecordingRef.current) {
          stopRecordingRef.current();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
    };
  }, []);

  useEffect(() => {
    if (isElectron && (window as any).electronAPI?.setFocusable) {
      (window as any).electronAPI.setFocusable(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (isElectron && (window as any).electronAPI?.setFocusable) {
        (window as any).electronAPI.setFocusable(true);
      }
    };
  }, []);

  const handleMicButton = () => {
    if (isRecordingRef.current) stopRecordingAndGenerate();
    else startRecording();
  };

  // ─── Screenshot functions ─────────────────────────────────
  const captureScreenshot = useCallback(async () => {
    if (!isElectron || !(window as any).electronAPI?.captureScreenshot) {
      setError("Screenshot only works in the desktop app");
      return;
    }
    setIsCapturing(true);
    try {
      const dataUrl = await (window as any).electronAPI.captureScreenshot();
      if (dataUrl) {
        setCapturedScreenshots((prev) => {
          const updated = [...prev, dataUrl];
          if (updated.length > 20) {
            return updated.slice(updated.length - 20);
          }
          return updated;
        });
      } else {
        setError("Failed to capture screenshot");
      }
    } catch {
      setError("Screenshot capture failed");
    }
    setIsCapturing(false);
  }, []);

  const removeScreenshot = (index: number) => {
    setCapturedScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const sendScreenshots = useCallback(async () => {
    if (capturedScreenshots.length === 0) return;
    if (status !== "idle") return;

    setStatus("generating");
    setError(null);

    const entryId = Date.now().toString();
    const questionText = `📸 Screenshot${capturedScreenshots.length > 1 ? "s" : ""} (${capturedScreenshots.length})`;
    const contextText = inputText.trim();

    const startTime = Date.now();
    const modelName = MODELS.find(m => m.key === selectedModelRef.current)?.name || selectedModelRef.current;
    setAnswers((prev) => [...prev, { id: entryId, question: questionText, answer: "", isStreaming: true, mode: responseLengthRef.current, model: `Scout + ${modelName}`, startTime }]);

    // ─── Snapshot current screenshots & context before clearing ─
    const screenshotsToSend = [...capturedScreenshots];
    const historyToSend = [...visionConversationHistory];

    try {
      const res = await fetch("/api/answer-vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: screenshotsToSend,
          jobDescription,
          aboutYou: profileContext,
          responseLength: responseLengthRef.current,
          additionalContext: contextText,
          conversationHistory: historyToSend,
          selectedModel: selectedModelRef.current,
          selectedVisionModel: selectedVisionModelRef.current,
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Vision failed"); }
      if (!res.body) throw new Error("No response body");

      const actualModelUsed = res.headers.get("X-Model-Used") || selectedModelRef.current;
      const displayModelName = `Scout + ${MODELS.find(m => m.key === actualModelUsed)?.name || actualModelUsed}`;
      setAnswers((prev) => prev.map((a) => a.id === entryId ? { ...a, model: displayModelName } : a));

      // ─── Accumulate full response for history ──────────────
      let fullResponse = "";
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        setAnswers((prev) => prev.map((a) => a.id === entryId ? { ...a, answer: a.answer + chunk } : a));
      }

      setAnswers((prev) => prev.map((a) => a.id === entryId ? { ...a, isStreaming: false, timeTaken: (Date.now() - startTime) / 1000 } : a));

      // ─── Save this exchange to vision history ──────────────
      // Keep last 6 messages (3 exchanges) to avoid token overflow
      setVisionConversationHistory((prev) => {
        const userMsg: HistoryMessage = {
          role: "user",
          content: [
            ...screenshotsToSend.map((img) => ({
              type: "image_url",
              image_url: {
                url: img.startsWith("data:") ? img : `data:image/png;base64,${img}`,
              },
            })),
            {
              type: "text",
              text: contextText
                ? `Look at the screenshot(s) carefully. The user says: "${contextText}". Based on what you see, provide the answer.`
                : "Look at the screenshot(s) carefully. Read ALL visible text, code, and questions. Then provide a complete answer.",
            },
          ],
        };
        const assistantMsg: HistoryMessage = {
          role: "assistant",
          content: fullResponse,
        };
        const updated = [...prev, userMsg, assistantMsg];
        return updated.slice(-20); // keep last 20 messages = 10 exchanges
      });

      setCapturedScreenshots([]);
      setInputText("");
      setStatus("idle");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
      setAnswers((prev) => prev.map((a) => a.id === entryId ? { ...a, answer: "⚠️ " + msg, isStreaming: false } : a));
      setStatus("idle");
    }
  }, [capturedScreenshots, status, jobDescription, profileContext, inputText, visionConversationHistory]);

  const handleOpacityChange = (value: number) => {
    setWindowOpacity(value);
    // NOTE: We intentionally do NOT call electronAPI.setOpacity here.
    // Window-level opacity would make the floating controls transparent too,
    // causing the sliders to visually "thin out". Instead we only change
    // --app-opacity on the container, which only affects the background gradient.
  };

  const handleHide = async () => {
    if (isElectron) {
      if (isWindowHidden) {
        setShowUnhidePrompt(true);
      } else {
        const hidden = await (window as any).electronAPI.hideToggle();
        setIsWindowHidden(hidden);
      }
    }
  };

  const confirmUnhide = async () => {
    setShowUnhidePrompt(false);
    if (isElectron) {
      const hidden = await (window as any).electronAPI.hideToggle();
      setIsWindowHidden(hidden);
    }
  };

  if (!mounted) {
    return <div className="app-container" />;
  }

  return (
    <div className="app-container" style={{ '--app-opacity': windowOpacity } as React.CSSProperties}>
      {/* Draggable title bar */}
      <div className="drag-region flex items-center justify-between px-2 sm:px-4 h-10 sm:h-12 shrink-0">
        <div className="flex items-center gap-2 no-drag">
          <span className="text-white/90 text-sm font-bold">✦ Chintu</span>
        </div>
        <div className="flex items-center gap-1 no-drag">
          {isScreenRecording && (
            <div className="system-audio-badge mr-2">
              <span className="system-audio-dot" style={{ background: "#f87171" }} />
              <span className="text-[0.625rem] text-red-300 font-medium">REC</span>
            </div>
          )}
          {isElectron && (
            <button 
              onClick={() => (window as any).electronAPI.minimize()} 
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 text-xs"
            >
              ─
            </button>
          )}
          {/* Profile / Account button */}
          <button
            onClick={() => setShowProfile(true)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors ${
              hasProfile ? "text-indigo-300 bg-indigo-500/20" : "text-white/60 hover:text-white/80"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Status bar */}
      {status !== "idle" && (
        <div className="px-4 pb-2">
          <div className={`
            text-center py-1.5 rounded-full text-xs font-semibold
            ${status === "recording" ? "bg-red-500/20 text-red-100" : "bg-white/10 text-white/80"}
          `}>
            {status === "recording" ? "🔴 Recording..." : "✨ Generating answer..."}
          </div>
        </div>
      )}

      {/* Live transcript */}
      {status === "recording" && liveTranscript && (
        <div className="px-4 pb-2">
          <div className="bg-white/10 rounded-xl px-4 py-2 text-white/70 text-sm italic">
            &quot;{liveTranscript}&quot;
          </div>
        </div>
      )}

      {/* AI Speech bubbles */}
      {aiSpeechBubbles.length > 0 && (
        <div className="px-4 pb-2">
          <div className="ai-speech-container rounded-xl px-4 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <svg className="w-3.5 h-3.5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
              <span className="text-[0.625rem] text-cyan-400 font-semibold uppercase tracking-wider">AI Interviewer</span>
            </div>
            <p className="text-[0.8125rem] text-cyan-100/90 leading-relaxed">
              {aiSpeechBubbles[aiSpeechBubbles.length - 1]}
            </p>
          </div>
        </div>
      )}

      {/* Vision history indicator */}
      {visionConversationHistory.length > 0 && (
        <div className="px-4 pb-1">
          <div className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-3 py-1.5">
            <span className="text-[0.625rem] text-cyan-400 font-medium">
              📸 {visionConversationHistory.length / 2} previous screenshot exchange{visionConversationHistory.length / 2 > 1 ? "s" : ""} in memory
            </span>
            <button
              onClick={() => setVisionConversationHistory([])}
              className="text-[0.625rem] text-cyan-400/60 hover:text-cyan-400 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Auto-update notification */}
      {updateStatus && (
        <div className="px-4 pb-2">
          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-4 py-2 text-emerald-200 text-xs flex items-center justify-between">
            {updateStatus.status === "downloading" ? (
              <span>⬇️ Downloading v{updateStatus.version}... {updateStatus.percent ? `${updateStatus.percent}%` : ""}</span>
            ) : updateStatus.status === "ready" ? (
              <>
                <span>✅ v{updateStatus.version} ready!</span>
                <button
                  onClick={() => (window as any).electronAPI?.restartForUpdate()}
                  className="ml-2 px-3 py-1 bg-emerald-500/40 rounded-lg text-emerald-100 font-medium hover:bg-emerald-500/60 transition-colors"
                >
                  Restart & Update
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 pb-2">
          <div className="bg-red-500/20 rounded-xl px-4 py-2 text-red-200 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-300 ml-2">✕</button>
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto py-3" style={{ scrollbarGutter: "stable" }}>
        <AnswerDisplay answers={answers} fontSize={fontSize} />
        <div ref={chatEndRef} />
      </div>

      {/* Screenshot preview strip */}
      {capturedScreenshots.length > 0 && (
        <div className="px-2 sm:px-4 pb-2 shrink-0">
          <div className="bg-white/5 border border-cyan-500/20 rounded-2xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-cyan-300 text-xs font-medium">📸 {capturedScreenshots.length}/20 screenshot{capturedScreenshots.length > 1 ? "s" : ""}</span>
              <div className="flex-1" />
              <button
                onClick={sendScreenshots}
                disabled={status !== "idle"}
                className="text-white text-xs px-3 py-1 rounded-lg bg-cyan-600/80 font-medium disabled:opacity-50"
              >
                Analyze
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {capturedScreenshots.map((img, i) => (
                <div key={i} className="relative shrink-0 w-24 h-16 rounded-lg overflow-hidden border border-white/10">
                  <Image src={img} alt={`Screenshot ${i + 1}`} fill unoptimized className="object-cover" />
                  <button
                    onClick={() => removeScreenshot(i)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full text-white text-[0.5rem] flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Model Selectors Row */}
      <div className="px-2 sm:px-4 pb-1.5 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Response Model Selector */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2 py-1">
            <span className="text-[0.5625rem] text-white/40 font-medium uppercase tracking-wider">💬</span>
            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value as ModelKey);
                selectedModelRef.current = e.target.value as ModelKey;
              }}
              className="bg-transparent text-[0.6875rem] text-white/80 font-medium outline-none cursor-pointer appearance-none pr-3"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath fill='%23999' d='M0 2l4 4 4-4z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center' }}
            >
              {MODELS.map(m => (
                <option key={m.key} value={m.key} className="bg-gray-900 text-white">{m.name}</option>
              ))}
            </select>
          </div>

          {/* Vision Model Selector */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2 py-1">
            <span className="text-[0.5625rem] text-white/40 font-medium uppercase tracking-wider">📸</span>
            <select
              value={selectedVisionModel}
              onChange={(e) => {
                setSelectedVisionModel(e.target.value as VisionModelKey);
                selectedVisionModelRef.current = e.target.value as VisionModelKey;
              }}
              className="bg-transparent text-[0.6875rem] text-white/80 font-medium outline-none cursor-pointer appearance-none pr-3"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath fill='%23999' d='M0 2l4 4 4-4z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center' }}
            >
              {VISION_MODELS.map(m => (
                <option key={m.key} value={m.key} className="bg-gray-900 text-white">{m.name}</option>
              ))}
            </select>
          </div>

          {/* Response Length Selector */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2 py-1">
            <span className="text-[0.5625rem] text-white/40 font-medium uppercase tracking-wider">📝</span>
            <select
              value={responseLength}
              onChange={(e) => setResponseLength(e.target.value as ResponseLength)}
              className="bg-transparent text-[0.6875rem] text-white/80 font-medium outline-none cursor-pointer appearance-none pr-3"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath fill='%23999' d='M0 2l4 4 4-4z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center' }}
            >
              <option value="small" className="bg-gray-900 text-white">Small</option>
              <option value="balanced" className="bg-gray-900 text-white">Balanced</option>
              <option value="detailed" className="bg-gray-900 text-white">Detailed</option>
              <option value="coding" className="bg-gray-900 text-white">Coding</option>
            </select>
          </div>
        </div>
      </div>

      {/* Text Input Row */}
      <div className="px-2 sm:px-4 pb-2 shrink-0">
        <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl focus-within:border-indigo-400/50 focus-within:bg-white/10 transition-all">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (capturedScreenshots.length > 0) {
                  sendScreenshots();
                } else {
                  handleSendText();
                }
              }
            }}
            placeholder={capturedScreenshots.length > 0 ? "Add context (optional) then press Enter or Analyze..." : "Ask a coding question or type..."}
            className="w-full bg-transparent px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white/90 placeholder-white/30 focus:outline-none pr-10 sm:pr-12 resize-none"
            rows={inputText.split('\n').length > 1 ? Math.min(inputText.split('\n').length, 5) : 1}
            disabled={status !== "idle"}
          />
          <button
            onClick={capturedScreenshots.length > 0 ? sendScreenshots : handleSendText}
            disabled={(capturedScreenshots.length === 0 && !inputText.trim()) || status !== "idle"}
            className="absolute right-1.5 sm:right-2 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg sm:rounded-xl bg-indigo-500/80 text-white disabled:opacity-50"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom toolbar */}
      <div ref={controlsRef} className="toolbar px-2 sm:px-4 py-3 flex flex-wrap items-center justify-center gap-4 sm:gap-6 shrink-0">
        <button
          onClick={() => setShowSettings(true)}
          className="no-drag w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white/70"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3 flex-wrap">
          {/* Screen Record toggle */}
          <button
            onClick={isScreenRecording ? stopScreenRecording : startScreenRecording}
            className={`
              no-drag w-10 h-10 rounded-full flex items-center justify-center
              ${isScreenRecording
                ? "bg-red-500/30 text-red-300 ring-2 ring-red-400/50 shadow-lg shadow-red-500/20 mic-recording"
                : "bg-white/10 text-white/50"
              }
            `}
          >
            {isScreenRecording ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" />
              </svg>
            )}
          </button>

          {/* Screenshot capture */}
          {isElectron && (
            <button
              onClick={captureScreenshot}
              disabled={isCapturing || status === "generating"}
              className={`
                no-drag w-10 h-10 rounded-full flex items-center justify-center relative
                ${capturedScreenshots.length > 0
                  ? "bg-cyan-500/30 text-cyan-300 ring-1 ring-cyan-500/50"
                  : "bg-white/10 text-white/50"
                }
              `}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              {capturedScreenshots.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 text-white text-[0.625rem] font-bold rounded-full flex items-center justify-center">
                  {capturedScreenshots.length}
                </span>
              )}
            </button>
          )}

          {/* Mic button */}
          <button
            onClick={handleMicButton}
            disabled={!micReady || status === "generating"}
            className={`
              no-drag w-14 h-14 rounded-full flex items-center justify-center
              ${status === "recording"
                ? "bg-red-500 text-white shadow-lg shadow-red-500/40 scale-110 mic-recording"
                : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
              }
            `}
          >
            {status === "recording" ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* Clear answers — also clears vision history */}
          <button
            onClick={() => {
              setAnswers([]);
              setAiSpeechBubbles([]);
              setVisionConversationHistory([]);
              setChatConversationHistory([]); // ← clear all history
            }}
            className="no-drag w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white/70"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          </button>

          {/* Hide/Show toggle - Re-centered */}
          <button
            onClick={handleHide}
            className={`
              no-drag w-10 h-10 rounded-full flex items-center justify-center
              ${isWindowHidden
                ? "bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500/50"
                : "bg-white/10 text-white/70"
              }
              transition-all hover:scale-110 active:scale-95
            `}
          >
            {isWindowHidden ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            )}
          </button>
        </div>
      </div>



      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 settings-overlay z-50 flex items-center justify-center p-2 sm:p-6" onClick={() => setShowSettings(false)}>
          <div className="settings-panel w-full max-w-sm p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Settings</h2>
                <p className="text-xs text-gray-400">AI preferences</p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Response Detail</p>
                  <p className="text-xs text-gray-400">How detailed answers should be</p>
                </div>
                <CustomSelect
                  value={responseLength}
                  onChange={(val) => setResponseLength(val as ResponseLength)}
                  options={[
                    { key: "small", name: "Small" },
                    { key: "balanced", name: "Balanced" },
                    { key: "detailed", name: "Detailed" },
                    { key: "coding", name: "Coding" },
                  ]}
                  className="w-32"
                />
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <div>
              <p className="text-sm font-semibold text-gray-700">AI Model</p>
                  <p className="text-xs text-gray-400">Select models from the input area</p>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Speech Engine</p>
                  <p className="text-xs text-gray-400">How your voice is transcribed</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${useWhisperFallback.current ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                  {useWhisperFallback.current ? "Whisper API" : "Web Speech"}
                </span>
              </div>
              <p className="text-[0.6875rem] text-gray-400 leading-relaxed">
                {useWhisperFallback.current
                  ? "Using Groq Whisper API for transcription. Hold Space → speak → release to transcribe."
                  : "Using browser's built-in speech recognition for real-time transcription."
                }
              </p>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Space Key Mode</p>
                  <p className="text-xs text-gray-400">How Space triggers recording</p>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setSpaceMode("hold")}
                    className={`text-xs px-3 py-1.5 rounded-md font-medium ${
                      spaceMode === "hold"
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "text-gray-500"
                    }`}
                  >
                    Hold
                  </button>
                  <button
                    onClick={() => setSpaceMode("toggle")}
                    className={`text-xs px-3 py-1.5 rounded-md font-medium ${
                      spaceMode === "toggle"
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "text-gray-500"
                    }`}
                  >
                    Toggle
                  </button>
                </div>
              </div>
              <p className="text-[0.6875rem] text-gray-400 leading-relaxed">
                {spaceMode === "hold"
                  ? "Hold Space to record, release to stop and generate answer."
                  : "Press Space once to start recording, press again to stop."
                }
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Shortcuts</p>
              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Record</span>
                  <kbd className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">
                    {spaceMode === "hold" ? "Space (hold)" : "Space (toggle)"}
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span>Hide window</span>
                  <kbd className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">Tray icon</kbd>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-[0.625rem] text-gray-300">
                🔒 Window is invisible to screen sharing
              </p>
              {appVersion && (
                <p className="text-[0.5625rem] text-gray-300/60 mt-1">v{appVersion}</p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal onClose={() => { setShowProfile(false); refreshProfile(); }} />
      )}
      {/* Unhide Prompt (Shocking/Animated) */}
      {showUnhidePrompt && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
          <div className="unhide-prompt-card w-full max-w-xs bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 p-[2px] rounded-3xl shadow-[0_0_50px_rgba(249,115,22,0.4)] animate-in zoom-in-95 duration-300">
            <div className="bg-gray-900 rounded-[22px] p-6 text-center">
              <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                <svg className="w-10 h-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-white mb-2 tracking-tight uppercase">Exit Ghost Mode?</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                App will become <span className="text-orange-400 font-bold uppercase underline">visible</span> to screen recording tools. Proceed with caution!
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmUnhide}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20"
                >
                  YES, UNHIDE IT
                </button>
                <button
                  onClick={() => setShowUnhidePrompt(false)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/60 font-medium rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    {/* Floating side controls */}
    {isElectron && (
      <div className="floating-side-controls no-drag">
        <div className="side-control-group">
          <span className="side-control-label">🔍</span>
          <input
            type="range"
            min="10"
            max="100"
            value={Math.round(windowOpacity * 100)}
            onChange={(e) => handleOpacityChange(parseInt(e.target.value) / 100)}
            className="side-slider"
          />
          <span className="side-control-value">{Math.round(windowOpacity * 100)}</span>
        </div>
        <div className="side-control-group">
          <span className="side-control-label">Aa</span>
          <input
            type="range"
            min="6"
            max="22"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="side-slider"
          />
          <span className="side-control-value">{fontSize}</span>
        </div>
      </div>
    )}
    </div>
  );
}