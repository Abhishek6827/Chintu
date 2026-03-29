"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import AnswerDisplay from "@/components/AnswerDisplay";

interface AnswerEntry {
  id: string;
  question: string;
  answer: string;
  isStreaming: boolean;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

type ResponseLength = "concise" | "balanced" | "detailed";

// Check if running in Electron
const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;

export default function RoomPage() {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "recording" | "generating">("idle");
  const [answers, setAnswers] = useState<AnswerEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [micReady, setMicReady] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [responseLength, setResponseLength] = useState<ResponseLength>("balanced");
  const [showSettings, setShowSettings] = useState(false);
  const [isWindowHidden, setIsWindowHidden] = useState(false);

  // ─── System Audio State ──────────────────────────────────
  const [systemAudioActive, setSystemAudioActive] = useState(false);
  const [systemAudioError, setSystemAudioError] = useState<string | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mixedStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");
  const isRecordingRef = useRef(false);
  const responseLengthRef = useRef<ResponseLength>("balanced");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { responseLengthRef.current = responseLength; }, [responseLength]);

  // Auto-scroll to latest answer
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [answers]);

  useEffect(() => {
    const jd = sessionStorage.getItem("jobDescription");
    if (!jd) { router.push("/"); return; }
    setJobDescription(jd);
  }, [router]);

  // ─── System Audio Capture ─────────────────────────────────
  const startSystemAudio = useCallback(async () => {
    try {
      setSystemAudioError(null);

      // Request system audio via getDisplayMedia.
      // Electron's main process intercepts this and provides loopback audio.
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,   // Electron requires video in the request
        audio: true,   // This gets system loopback audio
      });

      // We only need the audio tracks; stop video tracks to save resources
      displayStream.getVideoTracks().forEach((t) => t.stop());

      const audioTracks = displayStream.getAudioTracks();
      if (audioTracks.length === 0) {
        setSystemAudioError("No system audio captured. Try again.");
        return;
      }

      systemStreamRef.current = displayStream;
      setSystemAudioActive(true);

      // Now set up the AudioContext to mix mic + system audio
      await setupMixedRecognition(displayStream);

    } catch (err: any) {
      console.error("System audio error:", err);
      if (err.name === "NotAllowedError") {
        setSystemAudioError("Permission denied. Allow screen capture to enable system audio.");
      } else {
        setSystemAudioError(err.message || "Failed to capture system audio.");
      }
    }
  }, []);

  const stopSystemAudio = useCallback(() => {
    // Stop system audio tracks
    if (systemStreamRef.current) {
      systemStreamRef.current.getTracks().forEach((t) => t.stop());
      systemStreamRef.current = null;
    }

    // Stop mic stream used for mixing
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    mixedStreamRef.current = null;
    setSystemAudioActive(false);

    // Re-initialize plain mic-only speech recognition
    setupPlainRecognition();
  }, []);

  // ─── Mixed Audio Recognition (Mic + System) ──────────────
  const setupMixedRecognition = useCallback(async (systemStream: MediaStream) => {
    try {
      // Get microphone stream
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = micStream;

      // Create AudioContext to mix both streams
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      const micSource = audioCtx.createMediaStreamSource(micStream);
      const systemSource = audioCtx.createMediaStreamSource(systemStream);

      // Create a destination to merge both into one stream
      const destination = audioCtx.createMediaStreamDestination();

      // Optional: Adjust gains so system audio doesn't overpower mic
      const micGain = audioCtx.createGain();
      micGain.gain.value = 1.0;
      const systemGain = audioCtx.createGain();
      systemGain.gain.value = 1.2; // Boost system audio slightly

      micSource.connect(micGain);
      systemGain.connect(destination);
      micGain.connect(destination);
      systemSource.connect(systemGain);

      const mixedStream = destination.stream;
      mixedStreamRef.current = mixedStream;

      // Now re-create SpeechRecognition.
      // Unfortunately, Web Speech API uses the default mic, not a custom stream.
      // The mixed stream approach won't work directly with the browser's
      // SpeechRecognition API since it always uses the default input device.
      //
      // WORKAROUND: We keep the Web Speech API on the mic as before,
      // BUT we also run a parallel live transcript of the system audio
      // using a separate SpeechRecognition if possible, or we display
      // the system audio waveform to confirm it's being captured.
      //
      // BEST APPROACH for Electron: Set the mixed stream as the
      // default audio input by outputting it to a virtual audio device.
      // But that requires extra drivers.
      //
      // PRACTICAL APPROACH: Since we're in Electron, we'll use the
      // Groq Whisper API to transcribe system audio chunks in real-time.
      // This gives us the AI interviewer's words separately.

      console.log("[System Audio] Mixed stream created with", mixedStream.getAudioTracks().length, "tracks");

    } catch (err: any) {
      console.error("Mixed audio setup error:", err);
      setSystemAudioError("Failed to set up audio mixer: " + err.message);
    }
  }, []);

  // ─── Plain Speech Recognition (Mic only) ──────────────────
  const setupPlainRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError("Use Chrome or Edge for speech recognition."); return; }

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
      if (event.error === "not-allowed") setError("Mic access denied.");
    };

    recognition.onstart = () => setMicReady(true);
    recognitionRef.current = recognition;
    setMicReady(true);
  }, []);

  // Speech Recognition init
  useEffect(() => {
    setupPlainRecognition();
    return () => { try { recognitionRef.current?.stop(); } catch {} };
  }, [setupPlainRecognition]);

  // ─── System Audio Transcription via Groq Whisper ──────────
  // Records system audio chunks and sends to Groq for transcription
  const systemRecorderRef = useRef<MediaRecorder | null>(null);
  const systemTranscriptRef = useRef("");
  const [aiSpeechBubbles, setAiSpeechBubbles] = useState<string[]>([]);

  const startSystemTranscription = useCallback(() => {
    const stream = systemStreamRef.current;
    if (!stream || stream.getAudioTracks().length === 0) return;

    // Create a new stream with only audio tracks
    const audioStream = new MediaStream(stream.getAudioTracks());

    try {
      const recorder = new MediaRecorder(audioStream, {
        mimeType: "audio/webm;codecs=opus",
      });
      systemRecorderRef.current = recorder;

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      // Every 5 seconds, send accumulated audio to Groq Whisper for transcription
      recorder.onstop = async () => {
        if (chunks.length === 0) return;
        const blob = new Blob(chunks, { type: "audio/webm" });
        chunks.length = 0;

        // Only transcribe if blob has meaningful size (>1KB = likely has speech)
        if (blob.size < 1000) return;

        try {
          const formData = new FormData();
          formData.append("file", blob, "system_audio.webm");

          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.text && data.text.trim()) {
              const text = data.text.trim();
              systemTranscriptRef.current += " " + text;
              setAiSpeechBubbles((prev) => [...prev, text]);
            }
          }
        } catch (err) {
          console.error("Transcription error:", err);
        }
      };

      // Record in 5-second intervals
      recorder.start();

      const intervalId = setInterval(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          // Restart immediately for continuous capture
          setTimeout(() => {
            if (systemStreamRef.current && systemStreamRef.current.active) {
              try {
                const newAudioStream = new MediaStream(systemStreamRef.current.getAudioTracks());
                const newRecorder = new MediaRecorder(newAudioStream, {
                  mimeType: "audio/webm;codecs=opus",
                });
                const newChunks: Blob[] = [];

                newRecorder.ondataavailable = (e) => {
                  if (e.data.size > 0) newChunks.push(e.data);
                };

                newRecorder.onstop = async () => {
                  if (newChunks.length === 0) return;
                  const newBlob = new Blob(newChunks, { type: "audio/webm" });
                  newChunks.length = 0;
                  if (newBlob.size < 1000) return;

                  try {
                    const formData = new FormData();
                    formData.append("file", newBlob, "system_audio.webm");
                    const res = await fetch("/api/transcribe", {
                      method: "POST",
                      body: formData,
                    });
                    if (res.ok) {
                      const data = await res.json();
                      if (data.text && data.text.trim()) {
                        setAiSpeechBubbles((prev) => [...prev, data.text.trim()]);
                      }
                    }
                  } catch (err) {
                    console.error("Transcription error:", err);
                  }
                };

                systemRecorderRef.current = newRecorder;
                newRecorder.start();
              } catch {}
            }
          }, 100);
        }
      }, 5000);

      // Store interval for cleanup
      (recorder as any)._intervalId = intervalId;

    } catch (err: any) {
      console.error("MediaRecorder error:", err);
      setSystemAudioError("Failed to start recording: " + err.message);
    }
  }, []);

  const stopSystemTranscription = useCallback(() => {
    const recorder = systemRecorderRef.current;
    if (recorder) {
      if ((recorder as any)._intervalId) {
        clearInterval((recorder as any)._intervalId);
      }
      if (recorder.state === "recording") {
        recorder.stop();
      }
      systemRecorderRef.current = null;
    }
  }, []);

  // Toggle system audio capture
  const toggleSystemAudio = useCallback(async () => {
    if (systemAudioActive) {
      stopSystemTranscription();
      stopSystemAudio();
    } else {
      await startSystemAudio();
      // Small delay to ensure stream is ready
      setTimeout(() => {
        startSystemTranscription();
      }, 500);
    }
  }, [systemAudioActive, startSystemAudio, stopSystemAudio, startSystemTranscription, stopSystemTranscription]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSystemTranscription();
      stopSystemAudio();
    };
  }, [stopSystemAudio, stopSystemTranscription]);

  const startRecording = useCallback(() => {
    if (isRecordingRef.current || !recognitionRef.current) return;
    isRecordingRef.current = true;
    setError(null);
    setStatus("recording");
    setLiveTranscript("");
    finalTranscriptRef.current = "";
    try { recognitionRef.current.start(); }
    catch { try { recognitionRef.current.stop(); setTimeout(() => recognitionRef.current.start(), 100); } catch {} }
  }, []);

  const stopRecordingAndGenerate = useCallback(async () => {
    if (!isRecordingRef.current || !recognitionRef.current) return;
    isRecordingRef.current = false;
    setError(null);
    try { recognitionRef.current.stop(); } catch {}
    await new Promise((r) => setTimeout(r, 300));

    const transcript = (finalTranscriptRef.current || liveTranscript).trim();
    setLiveTranscript("");
    if (!transcript || transcript.length < 3) {
      setError("No speech detected. Try again.");
      setStatus("idle");
      return;
    }

    setStatus("generating");
    const entryId = Date.now().toString();

    // Include AI speech context if available
    const aiContext = aiSpeechBubbles.length > 0
      ? "\n\n[AI Interviewer said]: " + aiSpeechBubbles.join(" ")
      : "";

    const fullTranscript = transcript + aiContext;

    setAnswers((prev) => [...prev, { id: entryId, question: transcript, answer: "", isStreaming: true }]);

    // Clear AI speech bubbles after using them
    setAiSpeechBubbles([]);

    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fullTranscript, jobDescription, responseLength: responseLengthRef.current }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Failed"); }
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setAnswers((prev) => prev.map((a) => a.id === entryId ? { ...a, answer: a.answer + chunk } : a));
      }
      setAnswers((prev) => prev.map((a) => a.id === entryId ? { ...a, isStreaming: false } : a));
      setStatus("idle");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
      setAnswers((prev) => prev.map((a) => a.id === entryId ? { ...a, answer: "⚠️ " + msg, isStreaming: false } : a));
      setStatus("idle");
    }
  }, [jobDescription, liveTranscript, aiSpeechBubbles]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.code === "Space" && !e.repeat) { e.preventDefault(); startRecording(); }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.code === "Space") { e.preventDefault(); stopRecordingAndGenerate(); }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => { document.removeEventListener("keydown", onKeyDown); document.removeEventListener("keyup", onKeyUp); };
  }, [startRecording, stopRecordingAndGenerate]);

  const handleMicButton = () => {
    if (isRecordingRef.current) stopRecordingAndGenerate();
    else startRecording();
  };

  const handleHide = async () => {
    if (isElectron) {
      const hidden = await (window as any).electronAPI.hideToggle();
      setIsWindowHidden(hidden);
    }
  };

  const handleClose = () => {
    if (isElectron) (window as any).electronAPI.close();
    else router.push("/");
  };

  return (
    <div className="app-container">
      {/* Draggable title bar */}
      <div className="drag-region flex items-center justify-between px-4 h-12 shrink-0">
        <div className="flex items-center gap-2 no-drag">
          <span className="text-white/90 text-sm font-bold">✦ Angel</span>
        </div>
        <div className="flex items-center gap-1 no-drag">
          {/* System Audio indicator */}
          {systemAudioActive && (
            <div className="system-audio-badge mr-2">
              <span className="system-audio-dot" />
              <span className="text-[10px] text-emerald-300 font-medium">AI Listening</span>
            </div>
          )}
          {isElectron && (
            <>
              <button onClick={handleHide} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs">─</button>
              <button onClick={handleClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-red-500/30 transition-all text-xs">✕</button>
            </>
          )}
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

      {/* AI Speech bubbles (from system audio transcription) */}
      {aiSpeechBubbles.length > 0 && (
        <div className="px-4 pb-2">
          <div className="ai-speech-container rounded-xl px-4 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <svg className="w-3.5 h-3.5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
              <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">AI Interviewer</span>
            </div>
            <p className="text-[13px] text-cyan-100/90 leading-relaxed">
              {aiSpeechBubbles[aiSpeechBubbles.length - 1]}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {(error || systemAudioError) && (
        <div className="px-4 pb-2">
          <div className="bg-red-500/20 rounded-xl px-4 py-2 text-red-200 text-xs flex items-center justify-between">
            <span>{error || systemAudioError}</span>
            <button onClick={() => { setError(null); setSystemAudioError(null); }} className="text-red-300 hover:text-white ml-2">✕</button>
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto py-3" style={{ scrollbarGutter: "stable" }}>
        <AnswerDisplay answers={answers} />
        <div ref={chatEndRef} />
      </div>

      {/* Bottom toolbar */}
      <div className="toolbar px-4 py-3 flex items-center justify-between shrink-0">
        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="no-drag w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Center controls */}
        <div className="flex items-center gap-3">
          {/* System Audio toggle */}
          <button
            onClick={toggleSystemAudio}
            className={`
              no-drag w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
              ${systemAudioActive
                ? "bg-cyan-500/30 text-cyan-300 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/20 system-audio-pulse"
                : "bg-white/10 text-white/50 hover:bg-white/20 hover:text-white"
              }
            `}
            title={systemAudioActive ? "Stop listening to AI" : "Listen to AI (capture system audio)"}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              {systemAudioActive ? (
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              ) : (
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              )}
            </svg>
          </button>

          {/* Mic button */}
          <button
            onClick={handleMicButton}
            disabled={!micReady || status === "generating"}
            className={`
              no-drag w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300
              ${status === "recording"
                ? "bg-red-500 text-white shadow-lg shadow-red-500/40 scale-110 mic-recording"
                : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105"
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

          {/* Clear answers */}
          <button
            onClick={() => { setAnswers([]); setAiSpeechBubbles([]); }}
            className="no-drag w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
            title="Clear answers"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          </button>
        </div>

        {/* Hide/Show toggle button */}
        <button
          onClick={handleHide}
          className={`
            no-drag w-10 h-10 rounded-full flex items-center justify-center transition-all
            ${isWindowHidden
              ? "bg-emerald-500/30 text-emerald-300 hover:bg-emerald-500/40 ring-1 ring-emerald-500/50"
              : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
            }
          `}
          title={isWindowHidden ? "Show window" : "Hide window"}
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

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 settings-overlay z-50 flex items-center justify-center p-6" onClick={() => setShowSettings(false)}>
          <div className="settings-panel w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            {/* Settings Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Settings</h2>
                <p className="text-xs text-gray-400">AI preferences</p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-200 transition-all font-bold"
              >
                ✕
              </button>
            </div>

            {/* Response Detail */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Response Detail</p>
                  <p className="text-xs text-gray-400">How detailed answers should be</p>
                </div>
                <select
                  value={responseLength}
                  onChange={(e) => setResponseLength(e.target.value as ResponseLength)}
                  className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none"
                >
                  <option value="concise">Small</option>
                  <option value="balanced">Balanced</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
            </div>

            {/* System Audio Info */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-700">System Audio</p>
                  <p className="text-xs text-gray-400">Capture AI interviewer&apos;s voice</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${systemAudioActive ? "bg-cyan-100 text-cyan-700" : "bg-gray-100 text-gray-500"}`}>
                  {systemAudioActive ? "Active" : "Off"}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Click the 🔊 speaker button in the toolbar to start capturing system audio.
                This records what the AI interviewer says and transcribes it using Whisper.
              </p>
            </div>

            {/* Shortcuts */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Shortcuts</p>
              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Record</span>
                  <kbd className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">Space (hold)</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Hide window</span>
                  <kbd className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">Tray icon</kbd>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="text-center">
              <p className="text-[10px] text-gray-300">
                🔒 Window is invisible to screen sharing
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
