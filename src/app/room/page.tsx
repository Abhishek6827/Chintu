"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Mic, Sun, Moon } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";


import AnswerDisplay from "@/components/AnswerDisplay";
import ProfileModal, { getProfileContext, getStoredProfile } from "@/components/ProfileModal";
import CustomDropdown from "@/components/CustomDropdown";

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

interface HistorySession {
  id: string;
  timestamp: number;
  title: string;
  answers: AnswerEntry[];
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

type ResponseLength = "small" | "balanced" | "detailed" | "coding";

// ─── Available models ─────────────────────────────────────────
const MODELS = [
  { key: "llama-3.3-70b", name: "Llama 3.3 70B" },
  { key: "gpt-oss-120b", name: "GPT-OSS 120B" },
  { key: "qwen3-Coder", name: "Qwen3 Coder 480B" },
  { key: "nemotron-3-120b", name: "Nemotron 3 (120B)" },
  { key: "qwen3.6", name: "Qwen3.6 Plus" }
] as const;

type ModelKey = typeof MODELS[number]["key"];

// ─── Vision models (for screenshot processing) ─────────────
// (Removed: Scout is default for everything except Qwen3.6 Plus which is Native)

// ─── Conversation history message type ────────────────────
interface HistoryMessage {
  role: "user" | "assistant";
  content: any; // string for assistant, array for user (with images)
}



// Check if running in Electron
const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;

import { createClient } from "@/utils/supabase/client";

export default function RoomPage() {
  const { user, isLoaded, isSignedIn } = useUser();
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
  const [isWindowHidden, setIsWindowHidden] = useState(false);
  const [showUnhidePrompt, setShowUnhidePrompt] = useState(false);
  const [inputText, setInputText] = useState("");
  const [mounted, setMounted] = useState(false);
  const [windowOpacity, setWindowOpacity] = useState(1);
  const [fontSize, setFontSize] = useState(10);
  const [spaceMode, setSpaceMode] = useState<"hold" | "toggle">("hold");
  const [selectedModel, setSelectedModel] = useState<ModelKey>("gpt-oss-120b");
  const selectedModelRef = useRef<ModelKey>("gpt-oss-120b");

  // ─── Vision conversation history ──────────────────────────
  // Keeps track of previous screenshot exchanges so the model
  // has context when multiple screenshots are sent in sequence.
  const [visionConversationHistory, setVisionConversationHistory] = useState<HistoryMessage[]>([]);

  // ─── Chat conversation history ────────────────────────────
  // Keeps track of previous Q&A exchanges for regular chat so
  // the model has context across all response modes.
  const [chatConversationHistory, setChatConversationHistory] = useState<HistoryMessage[]>([]);

  // ─── Auto-update status ───────────────────────────────────
  const [updateStatus, setUpdateStatus] = useState<{ 
    status: string; 
    version?: string; 
    percent?: number; 
    message?: string;
    transferred?: number;
    total?: number;
    speed?: number;
  } | null>(null);
  const [appVersion, setAppVersion] = useState("");
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [showReadingGuide, setShowReadingGuide] = useState(false);

  const supabase = createClient();


  useEffect(() => {
    const initRoom = async () => {
      if (!isLoaded || !isSignedIn || !user?.id) return;
      
      // 1. Fetch History from Supabase
      const { data } = await supabase
        .from('profiles')
        .select('history')
        .eq('id', user.id)
        .single();
      
      if (data?.history && Array.isArray(data.history)) {
        setHistory(data.history);
      }
    };
    
    initRoom();
  }, [isLoaded, isSignedIn, user?.id, supabase]);

  const saveToHistory = useCallback(async () => {
    if (answers.length === 0 || !user?.id) return;
    
    const newSession: HistorySession = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      title: answers[0].question.slice(0, 40) + (answers[0].question.length > 40 ? "..." : ""),
      answers: [...answers]
    };

    const updatedHistory = [newSession, ...history].slice(0, 5); // Keep only last 5 sessions
    setHistory(updatedHistory);
    
    // Save to Supabase
    await supabase
      .from('profiles')
      .update({ history: updatedHistory })
      .eq('id', user.id);
  }, [answers, history, user?.id, supabase]);

  const clearHistory = async () => {
    if (!user?.id) return;
    setHistory([]);
    await supabase.from('profiles').update({ history: [] }).eq('id', user.id);
    setShowClearHistoryConfirm(false);
  };

  const deleteSession = async (id: string) => {
    if (!user?.id) return;
    const updatedHistory = history.filter(s => s.id !== id);
    setHistory(updatedHistory);
    await supabase.from('profiles').update({ history: updatedHistory }).eq('id', user.id);
  };

  const exportHistory = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `chintu_history_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  useEffect(() => {
    setMounted(true);
    if (isElectron && (window as any).electronAPI?.getOpacity) {
      (window as any).electronAPI.getOpacity().then((o: number) => setWindowOpacity(o));
    }
    if (isElectron && (window as any).electronAPI?.getVersion) {
      (window as any).electronAPI.getVersion().then((v: string) => setAppVersion(v));
    }
    if (isElectron && (window as any).electronAPI?.getHidden) {
      (window as any).electronAPI.getHidden().then((hidden: boolean) => {
        setIsWindowHidden(hidden);
      });
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
  const updateCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isElectron && (window as any).electronAPI?.onUpdateStatus) {
      return (window as any).electronAPI.onUpdateStatus((data: any) => {
        if (updateCheckTimeoutRef.current) {
          clearTimeout(updateCheckTimeoutRef.current);
          updateCheckTimeoutRef.current = null;
        }
        setUpdateStatus(data);
        if (isElectron) {
          (window as any).electronAPI.log(`Update status: ${data.status} ${data.version || ""} ${data.message || ""}`);
        }
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
  const [isLightMode, setIsLightMode] = useState(true);

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  }, [isLightMode]);
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
      setSelectedModel("qwen3-Coder");
      selectedModelRef.current = "qwen3-Coder";
    } else {
      setSelectedModel("gpt-oss-120b");
      selectedModelRef.current = "gpt-oss-120b";
    }
  }, [responseLength]);

  useEffect(() => { selectedModelRef.current = selectedModel; }, [selectedModel]);

  useEffect(() => {
    document.documentElement.style.setProperty('--app-opacity', windowOpacity.toString());
    if (isElectron && (window as any).electronAPI?.setOpacity) {
      (window as any).electronAPI.setOpacity(windowOpacity);
    }
  }, [windowOpacity]);

  useEffect(() => {
    // Only auto-scroll when a new message starts, so the user sees the top of the new answer
    if (answers.length > 0 && status === "generating") {
      const lastAnswer = answers[answers.length - 1];
      // Only scroll at the very beginning of a stream
      if (lastAnswer.isStreaming && lastAnswer.answer.length < 50) {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [answers, status]);

  useEffect(() => {
    if (!isLoaded) return;
    
    // Read JD from URL param (primary) or sessionStorage (fallback)
    const params = new URLSearchParams(window.location.search);
    const jdFromUrl = params.get("jd");
    const jdFromSession = sessionStorage.getItem("jobDescription");
    const jd = jdFromUrl || jdFromSession || "";
    
    if (!jd) { 
      router.push("/"); 
      return; 
    }
    
    // Persist to sessionStorage so it survives within the session
    sessionStorage.setItem("jobDescription", jd);
    setJobDescription(jd);

    const initProfile = async () => {
      // 1. Try cloud
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('profile_data')
          .eq('id', user.id)
          .single();
        
        if (data?.profile_data && typeof data.profile_data === 'object' && Object.keys(data.profile_data).length > 0) {
          setProfileContext(JSON.stringify(data.profile_data));
          setHasProfile(true);
          return;
        }
      }
      
      // 2. Check for pending raw profile (fallback from failed refinement)
      const pendingRaw = sessionStorage.getItem("chintu_pending_raw_profile");
      if (pendingRaw) {
        // Use raw text as basic context until refinement succeeds
        setProfileContext(pendingRaw);
        setHasProfile(true);
        return;
      }
      
      // 3. No profile anywhere — don't block, just proceed without profile
      setHasProfile(false);
    };
    initProfile();

    // Check if there's a pending raw profile that needs re-refining
    const pendingRaw = sessionStorage.getItem("chintu_pending_raw_profile");
    if (pendingRaw) {
      (async () => {
        try {
          const res = await fetch("/api/refine-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rawText: pendingRaw }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.profile && typeof data.profile === "object") {
              setProfileContext(JSON.stringify(data.profile));
              setHasProfile(true);
              sessionStorage.removeItem("chintu_pending_raw_profile");
              
              // Sync to Supabase
              if (user?.id) {
                await supabase.from('profiles').upsert({
                  id: user.id,
                  profile_data: data.profile,
                  updated_at: new Date().toISOString()
                });
              }
            }
          }
        } catch {}
      })();
    }
  }, [router, isLoaded, user?.id, supabase]);

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
    if (isElectron) (window as any).electronAPI.log("Recording started");

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

    // Add profile reminder for longer conversations so model doesn't forget
    const profileReminder = profileContext && chatConversationHistory.length >= 6
      ? "\n\n[REMINDER — Answer as this candidate, using their real background]\n"
      : "";

    const fullTranscript = transcript + aiContext + profileReminder;

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
        return updated.slice(-20); // keep last 20 messages = 10 exchanges
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

    // Add profile reminder for longer conversations so model doesn't forget
    const profileReminder = profileContext && chatConversationHistory.length >= 6
      ? "\n\n[REMINDER — Answer as this candidate, using their real background]\n"
      : "";

    const fullTranscript = textToUse + aiContext + profileReminder;

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
        return updated.slice(-20); // keep last 20 messages = 10 exchanges
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

  const handleUndo = useCallback((id: string, question: string) => {
    setAnswers((prev) => {
      const idx = prev.findIndex((a) => a.id === id);
      if (idx === -1) return prev;
      // Remove everything from this index onwards
      const newAnswers = prev.slice(0, idx);
      
      // Restore question to input field (unless it's a screenshot indicator)
      if (!question.includes("📸 Screenshot")) {
        setInputText(question);
      }
      
      // Sync histories: Each answer corresponds to 2 messages (user + assistant)
      setChatConversationHistory((h) => h.slice(0, newAnswers.length * 2));
      setVisionConversationHistory((h) => h.slice(0, newAnswers.length * 2));
      setAiSpeechBubbles((s) => s.slice(0, newAnswers.length));
      
      return newAnswers;
    });
  }, []);

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
      {/* Neural Mesh Background */}
      <div className="neural-mesh">
        <div className="mesh-orb w-[400px] h-[400px] bg-indigo-600/30 -top-20 -left-20 animate-pulse" />
        <div className="mesh-orb w-[300px] h-[300px] bg-purple-600/20 bottom-10 right-10 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="mesh-orb w-[250px] h-[250px] bg-blue-600/20 top-1/2 left-1/3" style={{ animationDelay: '5s' }} />
      </div>

      {/* Draggable title bar */}
      <div className="drag-region flex items-center justify-between px-2 sm:px-4 h-10 sm:h-12 shrink-0 relative z-10">
        <div className="flex items-center gap-2 no-drag">
          <div className="flex items-center gap-2">
            <img src="/icon.png" alt="" className="w-5 h-5 object-contain" />
            <span className="text-[var(--text-main)] text-sm font-bold tracking-tight">Chintu</span>
          </div>
          {appVersion && (
            <span className="bg-[var(--input-bg)] text-[var(--text-dim)] border border-[var(--glass-border)] px-1.5 py-0.5 rounded text-[0.625rem] font-mono shadow-sm">
              v{appVersion}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 no-drag">
          {isScreenRecording && (
            <div className="system-audio-badge mr-2">
              <span className="system-audio-dot" style={{ background: "#f87171" }} />
              <span className="text-[0.625rem] text-red-300 font-medium">REC</span>
            </div>
          )}
          <button
            onClick={() => setIsLightMode(!isLightMode)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text-main)] transition-all"
          >
            {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          {isElectron && (
            <button 
              onClick={() => (window as any).electronAPI.minimize()} 
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-dim)] text-xs"
            >
              ─
            </button>
          )}
          {/* Profile / Account button */}
          <button
            onClick={() => setShowProfile(true)}
            className={`w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center transition-all ${
              hasProfile ? "ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/10" : "bg-[var(--input-bg)] hover:bg-[var(--glass-bg)]"
            }`}
          >
            {user?.imageUrl && typeof user.imageUrl === 'string' && user.imageUrl.startsWith('http') ? (
               <Image src={user.imageUrl} alt="Profile" width={28} height={28} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-4 h-4 text-[var(--text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Status bar */}
      {status === "recording" && (
        <div className="px-4 pb-2">
          <div className="text-center py-1.5 rounded-full text-xs font-semibold border bg-red-500/10 border-red-500/20 text-red-500 animate-pulse">
            🔴 Recording...
          </div>
        </div>
      )}



      {/* Live transcript */}
      {status === "recording" && liveTranscript && (
        <div className="px-4 pb-2">
          <div className="bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2 text-[var(--text-dim)] text-sm italic">
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
            <p className="text-[0.8125rem] text-[var(--text-main)] opacity-90 leading-relaxed">
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
        <div className="px-4 pb-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className={`rounded-xl px-4 py-3 text-xs flex items-center justify-between border ${
            updateStatus.status === "error" 
              ? "bg-red-500/10 border-red-500/20 text-red-600" 
              : updateStatus.status === "checking"
              ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-600"
              : updateStatus.status === "up-to-date"
              ? "bg-green-500/10 border-green-500/20 text-green-600"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
          }`}>
            {updateStatus.status === "checking" ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking for updates...
              </span>
            ) : updateStatus.status === "downloading" ? (
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-600 font-bold tracking-tight">Downloading Update...</span>
                  </span>
                  <span className="text-emerald-600 font-mono text-[0.625rem] bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                    {updateStatus.percent || 0}%
                  </span>
                </div>
                
                <div className="relative w-full bg-[var(--input-bg)] rounded-full h-2.5 overflow-hidden border border-[var(--glass-border)]">
                  {/* Progress Bar with Glow */}
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(52,211,153,0.5)]" 
                    style={{ width: `${updateStatus.percent || 0}%` }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-shimmer" />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 text-[0.5625rem] text-emerald-600 font-medium">
                  <div className="flex items-center gap-3">
                    <span>
                      {updateStatus.transferred ? formatBytes(updateStatus.transferred) : "0 MB"} 
                      <span className="mx-1 opacity-30">/</span> 
                      {updateStatus.total ? formatBytes(updateStatus.total) : "0 MB"}
                    </span>
                    {updateStatus.speed && (
                      <span className="flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        {formatBytes(updateStatus.speed)}/s
                      </span>
                    )}
                  </div>
                  <span className="italic opacity-40">Crunching bits...</span>
                </div>
              </div>
            ) : updateStatus.status === "ready" ? (
              <>
                <span className="flex items-center gap-2">
                  <span className="text-lg">✅</span>
                  <span>v{updateStatus.version} ready!</span>
                </span>
                <button
                  onClick={() => (window as any).electronAPI?.restartForUpdate()}
                  className="ml-2 px-3 py-1 bg-emerald-600 rounded-lg text-white font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  Restart & Update
                </button>
              </>
            ) : updateStatus.status === "up-to-date" ? (
              <span className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <span>You&apos;re up to date! (v{updateStatus.version})</span>
              </span>
            ) : updateStatus.status === "error" ? (
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-2 max-w-[70%] overflow-hidden">
                  <span>⚠️</span>
                  <span className="truncate" title={updateStatus.message}>
                    {updateStatus.message || "Update check failed"}
                  </span>
                </span>
                <button
                  onClick={() => {
                    setUpdateStatus({ status: "checking" });
                    (window as any).electronAPI?.checkForUpdates();
                  }}
                  className="px-2 py-0.5 bg-red-500/30 hover:bg-red-500/50 rounded text-[0.625rem] font-bold transition-colors"
                >
                  RETRY
                </button>
              </div>
            ) : null}
            
            {(updateStatus.status === "error" || updateStatus.status === "up-to-date" || updateStatus.status === "ready") && (
               <button onClick={() => setUpdateStatus(null)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">✕</button>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 pb-2">
          <div className={`
            rounded-xl px-4 py-2 text-xs flex items-center justify-between border
            ${isLightMode 
              ? "bg-red-50 text-red-600 border-red-200" 
              : "bg-red-500/20 text-red-200 border-red-500/30"}
          `}>
            <span>{error}</span>
            <button onClick={() => {
              setError(null);
              if (isElectron) (window as any).electronAPI.log(`User cleared error: ${error}`);
            }} className={`${isLightMode ? "text-red-400" : "text-red-300"} ml-2 hover:scale-110 transition-transform`}>✕</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-3 chat-area-container flex flex-col" style={{ scrollbarGutter: "stable" }}>
        <AnswerDisplay 
          answers={answers} 
          fontSize={fontSize} 
          isLightMode={isLightMode} 
          onUndo={handleUndo} 
          showReadingGuide={showReadingGuide}
        />
        <div ref={chatEndRef} />
      </div>

      {/* Screenshot preview strip */}
      {capturedScreenshots.length > 0 && (
        <div className="px-2 sm:px-4 pb-2 shrink-0">
          <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-3">
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

      {/* Text Input Row */}
      <div className="px-2 sm:px-4 pb-2 shrink-0">
        <div className="bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-2xl focus-within:border-indigo-400/50 focus-within:bg-[var(--glass-bg)] transition-all">
          {/* Inline selectors row */}
          <div className="flex items-center gap-2 px-2 pt-2 flex-wrap">
            <CustomDropdown
              options={MODELS}
              value={selectedModel}
              onChange={(val) => {
                setSelectedModel(val as ModelKey);
                selectedModelRef.current = val as ModelKey;
              }}
            />

            <CustomDropdown
              options={[
                { key: "small", name: "Small" },
                { key: "balanced", name: "Balanced" },
                { key: "detailed", name: "Detailed" },
                { key: "coding", name: "Coding" },
              ]}
              value={responseLength}
              onChange={(val) => setResponseLength(val as ResponseLength)}
            />
          </div>
          {/* Textarea */}
          <div className="relative flex items-center">
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
            placeholder={capturedScreenshots.length > 0 ? "Add context (optional) then press Enter..." : "Ask a question or type..."}
            className="w-full bg-transparent px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none pr-10 sm:pr-12 resize-none"
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
      </div>

      {/* Bottom toolbar */}
      <div ref={controlsRef} className="toolbar px-1 sm:px-6 py-2 sm:py-3 flex flex-nowrap items-center justify-center gap-1 sm:gap-4 shrink-0 relative z-10">
        
        {/* Button 1: Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="no-drag w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center bg-[var(--input-bg)] border border-[var(--glass-border)] text-[var(--text-dim)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-main)] transition-all active:scale-90"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
        
        {/* Button 2: New Conversation / Clear */}
        <button
          onClick={() => {
            if (answers.length > 0) {
              saveToHistory();
            }
            setAnswers([]);
            setAiSpeechBubbles([]);
            setVisionConversationHistory([]);
            setChatConversationHistory([]);
            setCapturedScreenshots([]);
            setInputText("");
            setLiveTranscript("");
          }}
          className="no-drag w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center bg-[var(--input-bg)] border border-[var(--glass-border)] text-[var(--text-dim)] hover:bg-red-500/20 hover:text-red-400 transition-all active:scale-90"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>

        {/* Button 3: Mic (The Core) */}
        <button
          onClick={handleMicButton}
          disabled={!micReady || status === "generating"}
          className={`
            no-drag flex-initial w-auto min-w-[40px] sm:min-w-[120px] h-10 sm:h-14 px-3 sm:px-6 rounded-xl sm:rounded-3xl flex items-center justify-center gap-2 sm:gap-3 relative transition-all duration-500 active:scale-95 overflow-hidden group
            ${status === "recording"
              ? "bg-red-500 text-white shadow-[0_0_50px_rgba(239,68,68,0.4)]"
              : "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient text-white shadow-[0_20px_40px_rgba(99,102,241,0.3)] hover:shadow-[0_25px_50px_rgba(99,102,241,0.5)]"
            }
          `}
        >
          <div className="relative z-10 flex items-center gap-2">
            {status === "recording" ? (
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-sm animate-pulse" />
            ) : (
              <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            )}
            <span className="hidden sm:inline text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-white">
              {status === "recording" ? "REC" : "Analysis"}
            </span>
          </div>
          {status === "recording" && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0%,transparent_70%)] animate-pulse" />
          )}
        </button>

        {/* Button 4: Screen Recording */}
        <button
          onClick={isScreenRecording ? stopScreenRecording : startScreenRecording}
          className={`
            no-drag w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-90
            ${isScreenRecording
              ? "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]"
              : "bg-[var(--input-bg)] border border-[var(--glass-border)] text-[var(--text-dim)] hover:bg-[var(--glass-bg)]"
            }
          `}
        >
          {isScreenRecording ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm animate-pulse" />
            </div>
          ) : (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
            </svg>
          )}
        </button>

        {/* Button 5: Screenshot */}
        {isElectron && (
          <button
            onClick={captureScreenshot}
            disabled={isCapturing || status === "generating"}
            className={`
              no-drag w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center relative transition-all active:scale-90
              ${capturedScreenshots.length > 0
                ? "bg-indigo-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.4)]"
                : "bg-[var(--input-bg)] border border-[var(--glass-border)] text-[var(--text-dim)] hover:bg-[var(--glass-bg)]"
              }
            `}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
            {capturedScreenshots.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-indigo-600 text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">
                {capturedScreenshots.length}
              </span>
            )}
          </button>
        )}

        {/* Button 6: Hide */}
        <button
          onClick={handleHide}
          className={`
            no-drag w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-90
            ${isWindowHidden
              ? "bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)]"
              : "bg-[var(--input-bg)] border border-[var(--glass-border)] text-[var(--text-dim)] hover:bg-[var(--glass-bg)]"
            }
          `}
        >
          {isWindowHidden ? (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          ) : (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
          )}
        </button>
      </div>



      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 settings-overlay z-50 flex items-center justify-center p-4 sm:p-6" onClick={() => setShowSettings(false)}>
          <div 
            className="settings-panel w-full relative" 
            style={{ 
              maxWidth: 'clamp(140px, 95vw, 400px)',
              padding: 'clamp(10px, 4vw, 24px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(10px, 4vw, 24px)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 style={{ fontSize: 'clamp(6px, 1.5vw, 10px)' }} className="font-black text-[var(--text-dim)] uppercase tracking-[0.4em] mb-1">System</h2>
                <h3 style={{ fontSize: 'clamp(12px, 4vw, 24px)' }} className="font-black text-[var(--text-main)] uppercase tracking-tight">Settings</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-2xl bg-[var(--input-bg)] text-[var(--text-dim)] flex items-center justify-center hover:bg-[var(--glass-bg)] hover:text-[var(--text-main)] transition-all"
                style={{ width: 'clamp(28px, 8vw, 48px)', height: 'clamp(28px, 8vw, 48px)' }}
              >
                <svg style={{ width: 'clamp(14px, 4vw, 24px)', height: 'clamp(14px, 4vw, 24px)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Space Mode */}
              <div 
                className="bg-[var(--panel-bg)] rounded-2xl border border-[var(--glass-border)]"
                style={{ padding: 'clamp(8px, 3vw, 20px)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 style={{ fontSize: 'clamp(6px, 1.5vw, 10px)' }} className="font-black text-[var(--text-dim)] uppercase tracking-widest">Input Strategy</h4>
                  <div className="flex bg-[var(--input-bg)] rounded-xl p-1">
                    <button
                      onClick={() => setSpaceMode("hold")}
                      className={`rounded-lg font-black uppercase tracking-widest transition-all ${
                        spaceMode === "hold" ? "bg-[var(--text-main)] text-[var(--panel-bg)]" : "text-[var(--text-dim)]"
                      }`}
                      style={{ fontSize: 'clamp(6px, 1.2vw, 9px)', padding: 'clamp(4px, 1vw, 10px) clamp(6px, 1.5vw, 16px)' }}
                    >
                      Hold
                    </button>
                    <button
                      onClick={() => setSpaceMode("toggle")}
                      className={`rounded-lg font-black uppercase tracking-widest transition-all ${
                        spaceMode === "toggle" ? "bg-[var(--text-main)] text-[var(--panel-bg)]" : "text-[var(--text-dim)]"
                      }`}
                      style={{ fontSize: 'clamp(6px, 1.2vw, 9px)', padding: 'clamp(4px, 1vw, 10px) clamp(6px, 1.5vw, 16px)' }}
                    >
                      Toggle
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: 'clamp(7px, 1.5vw, 10px)' }} className="text-[var(--text-dim)] leading-relaxed uppercase font-bold tracking-tight">
                  {spaceMode === "hold" ? "Hold space to speak, release to send" : "Tap space to start/stop recording"}
                </p>
              </div>

              {/* Reading Guide Toggle */}
              <div 
                className="bg-[var(--panel-bg)] rounded-2xl border border-[var(--glass-border)]"
                style={{ padding: 'clamp(8px, 3vw, 20px)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 style={{ fontSize: 'clamp(6px, 1.5vw, 10px)' }} className="font-black text-[var(--text-dim)] uppercase tracking-widest mb-1">Reading Focus</h4>
                    <p style={{ fontSize: 'clamp(7px, 1.5vw, 10px)' }} className="text-[var(--text-dim)] leading-relaxed uppercase font-bold tracking-tight">Highlight text as it arrives</p>
                  </div>
                  <button
                    onClick={() => {
                      const newVal = !showReadingGuide;
                      setShowReadingGuide(newVal);
                      localStorage.setItem("chintu_reading_guide", newVal.toString());
                    }}
                    className={`w-12 h-6 rounded-full transition-all relative ${showReadingGuide ? "bg-indigo-600" : "bg-gray-600/30"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showReadingGuide ? "left-7" : "left-1"}`} />
                  </button>
                </div>
              </div>

              {/* Profile Section */}
              <div 
                className="bg-[var(--input-bg)] rounded-2xl border border-[var(--glass-border)] flex items-center justify-between"
                style={{ padding: 'clamp(8px, 3vw, 20px)' }}
              >
                <div>
                  <h4 style={{ fontSize: 'clamp(6px, 1.5vw, 10px)' }} className="font-black text-[var(--text-dim)] uppercase tracking-widest mb-1">User Profile</h4>
                  <p style={{ fontSize: 'clamp(8px, 2vw, 12px)' }} className="font-bold text-[var(--text-main)] uppercase tracking-tight">{hasProfile ? "Identity Loaded" : "No Profile"}</p>
                </div>
                <button
                  onClick={() => { setShowSettings(false); setShowProfile(true); }}
                  className="bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
                  style={{ fontSize: 'clamp(6px, 1.5vw, 10px)', padding: 'clamp(6px, 1.5vw, 12px) clamp(8px, 2vw, 20px)' }}
                >
                  {hasProfile ? "Open Vault" : "Setup"}
                </button>
              </div>

              {/* History Section */}
              <div 
                className="bg-[var(--input-bg)] rounded-2xl border border-[var(--glass-border)]"
                style={{ padding: 'clamp(8px, 3vw, 20px)', display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 2vw, 16px)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 style={{ fontSize: 'clamp(6px, 1.5vw, 10px)' }} className="font-black text-[var(--text-dim)] uppercase tracking-widest mb-1">History</h4>
                    <p style={{ fontSize: 'clamp(8px, 2vw, 12px)' }} className="font-bold text-[var(--text-main)] uppercase tracking-tight">{history.length} Sessions</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={exportHistory}
                      className="rounded-xl bg-[var(--glass-bg)] text-[var(--text-main)] flex items-center justify-center hover:bg-indigo-500/20 transition-all border border-[var(--glass-border)]"
                      style={{ width: 'clamp(24px, 6vw, 40px)', height: 'clamp(24px, 6vw, 40px)' }}
                      title="Export History"
                    >
                      <svg style={{ width: 'clamp(12px, 3vw, 20px)', height: 'clamp(12px, 3vw, 20px)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                    <button
                      onClick={() => setShowClearHistoryConfirm(true)}
                      className="rounded-xl bg-[var(--glass-bg)] text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all border border-[var(--glass-border)]"
                      style={{ width: 'clamp(24px, 6vw, 40px)', height: 'clamp(24px, 6vw, 40px)' }}
                      title="Clear History"
                    >
                      <svg style={{ width: 'clamp(12px, 3vw, 20px)', height: 'clamp(12px, 3vw, 20px)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                
                {history.length > 0 && (
                  <div 
                    className="overflow-y-auto space-y-1.5 pr-1.5 custom-scrollbar"
                    style={{ maxHeight: 'clamp(80px, 25vh, 200px)' }}
                  >
                    {history.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => {
                          if (answers.length > 0) {
                            saveToHistory();
                          }
                          setAnswers(session.answers);
                          setAiSpeechBubbles([]);
                          setVisionConversationHistory([]);
                          setChatConversationHistory([]);
                          setShowSettings(false);
                        }}
                        className="w-full text-left rounded-xl bg-[var(--panel-bg)] border border-[var(--glass-border)] hover:border-indigo-500/50 transition-all group flex items-center justify-between"
                        style={{ padding: 'clamp(6px, 1.5vw, 12px)' }}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p style={{ fontSize: 'clamp(7px, 1.5vw, 10px)' }} className="font-bold text-[var(--text-main)] truncate">{session.title}</p>
                          <p style={{ fontSize: 'clamp(6px, 1.2vw, 8px)' }} className="text-[var(--text-dim)] uppercase tracking-tighter mt-0.5">
                            {new Date(session.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSessionToDelete(session.id);
                          }}
                          className="rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                          style={{ width: 'clamp(20px, 5vw, 32px)', height: 'clamp(20px, 5vw, 32px)' }}
                        >
                          <svg style={{ width: 'clamp(10px, 2.5vw, 16px)', height: 'clamp(10px, 2.5vw, 16px)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Account Section */}
              <div 
                className="bg-[var(--input-bg)] rounded-2xl border border-[var(--glass-border)] flex items-center justify-between"
                style={{ padding: 'clamp(8px, 3vw, 20px)' }}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <h4 style={{ fontSize: 'clamp(6px, 1.5vw, 10px)' }} className="font-black text-[var(--text-dim)] uppercase tracking-widest mb-1">Account</h4>
                  <p style={{ fontSize: 'clamp(8px, 2vw, 12px)' }} className="font-bold text-[var(--text-main)] uppercase tracking-tight truncate">
                    {user?.fullName || "User"}
                  </p>
                  <p style={{ fontSize: 'clamp(7px, 1.5vw, 10px)' }} className="text-[var(--text-dim)] truncate flex items-center gap-2">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>


                </div>

                <UserButton afterSignOutUrl="/sign-in" />

              </div>


              {/* Update Section */}
              <div 
                className="bg-[var(--input-bg)] rounded-2xl border border-[var(--glass-border)]"
                style={{ padding: 'clamp(8px, 3vw, 20px)' }}
              >

                <div className="flex items-center justify-between">
                  <div>
                    <h4 style={{ fontSize: 'clamp(6px, 1.5vw, 10px)' }} className="font-black text-[var(--text-dim)] uppercase tracking-widest mb-1">Software</h4>
                    <p style={{ fontSize: 'clamp(8px, 2vw, 12px)' }} className="font-bold text-[var(--text-main)] uppercase tracking-tight">v{appVersion || "1.0.0"}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (updateCheckTimeoutRef.current) clearTimeout(updateCheckTimeoutRef.current);
                      setShowSettings(false);
                      setUpdateStatus({ status: "checking" });
                      (window as any).electronAPI?.checkForUpdates();
                    }}
                    className="bg-[var(--text-main)] text-[var(--panel-bg)] rounded-xl font-black uppercase tracking-widest transition-all active:scale-95"
                    style={{ fontSize: 'clamp(6px, 1.5vw, 10px)', padding: 'clamp(6px, 1.5vw, 12px) clamp(8px, 2vw, 20px)' }}
                  >
                    Check
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 text-center">
              <p className="text-[9px] font-black text-[var(--text-dim)] opacity-50 uppercase tracking-[0.3em]">
                Secure Mode Active • Invisible to Screen Sharing
              </p>
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
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-[var(--panel-bg)] animate-in fade-in duration-300">
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

    {/* Clear History Confirmation Modal */}
    {showClearHistoryConfirm && (
      <div className="absolute inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-black/40 animate-in fade-in duration-300">
        <div className="w-full max-w-xs bg-gradient-to-br from-red-500 via-rose-600 to-pink-700 p-[1.5px] rounded-[32px] shadow-[0_20px_50px_rgba(225,29,72,0.3)] animate-in zoom-in-95 duration-300">
          <div className="bg-[var(--panel-bg)] backdrop-blur-2xl rounded-[30px] p-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-[var(--text-main)] mb-2 uppercase tracking-tight">Wipe History?</h3>
            <p className="text-[var(--text-dim)] text-xs mb-6 leading-relaxed font-medium">
              This will permanently delete <span className="text-red-500 font-bold underline">{history.length}</span> conversation sessions. This action cannot be undone.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={clearHistory}
                className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-red-600/20"
              >
                Delete Everything
              </button>
              <button
                onClick={() => setShowClearHistoryConfirm(false)}
                className="w-full py-3.5 bg-[var(--input-bg)] hover:bg-[var(--glass-bg)] text-[var(--text-dim)] font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl transition-all border border-[var(--glass-border)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Single Session Delete Confirmation */}
    {sessionToDelete && (
      <div className="absolute inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-black/40 animate-in fade-in duration-300">
        <div className="w-full max-w-xs bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 p-[1.5px] rounded-[32px] shadow-[0_20px_50px_rgba(244,63,94,0.3)] animate-in zoom-in-95 duration-300">
          <div className="bg-[var(--panel-bg)] backdrop-blur-2xl rounded-[30px] p-6 text-center">
            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
              <svg className="w-7 h-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-base font-black text-[var(--text-main)] mb-2 uppercase tracking-tight">Delete Session?</h3>
            <p className="text-[var(--text-dim)] text-[10px] mb-6 leading-relaxed font-bold uppercase tracking-wide">
              &quot;{history.find(s => s.id === sessionToDelete)?.title || "This session"}&quot;
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setSessionToDelete(null)}
                className="flex-1 py-3 bg-[var(--input-bg)] hover:bg-[var(--glass-bg)] text-[var(--text-dim)] font-black uppercase text-[9px] tracking-widest rounded-xl transition-all border border-[var(--glass-border)]"
              >
                No
              </button>
              <button
                onClick={() => deleteSession(sessionToDelete)}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[9px] tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-red-600/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
