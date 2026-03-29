import { NextRequest } from "next/server";
import groq from "@/lib/groq";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No audio file provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[/api/transcribe] Received audio: ${file.name}, size: ${file.size} bytes`);

    // Use Groq's Whisper API for fast transcription
    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3",
      language: "en",
      response_format: "json",
    });

    console.log(`[/api/transcribe] Result: "${transcription.text?.slice(0, 80)}..."`);

    return new Response(
      JSON.stringify({ text: transcription.text }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[/api/transcribe] Error:", error);
    const message =
      error instanceof Error ? error.message : "Transcription failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
