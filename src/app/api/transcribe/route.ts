import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import Groq from "groq-sdk";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { createReadStream } from "fs";

export async function POST(req: NextRequest) {
  let tempPath: string | null = null;

  try {
    const apiKeys = [
      process.env.GROQ_API_KEY,
      process.env.GROQ_API_KEY_2,
      process.env.GROQ_API_KEY_3,
    ].filter(Boolean) as string[];

    if (apiKeys.length === 0) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }

    // Accept both multipart/form-data (desktop/web) AND JSON with base64 (Capacitor native APK)
    let buffer: Buffer;
    let filename: string;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const dataUrl: string | undefined = body?.file || body?.audio;
      filename = body?.filename || "rec.webm";
      if (!dataUrl || typeof dataUrl !== "string") {
        return NextResponse.json({ error: "No audio data provided" }, { status: 400 });
      }
      // Strip data URL prefix if present: data:audio/webm;base64,XXXX
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      buffer = Buffer.from(base64, "base64");
      console.log(`[/api/transcribe] Received JSON audio: ${filename}, size: ${buffer.length} bytes`);
    } else {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
      }
      filename = file.name;
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      console.log(`[/api/transcribe] Received audio: ${filename}, size: ${file.size} bytes`);
    }

    // Write file to temp directory
    tempPath = join(tmpdir(), `transcribe-${Date.now()}-${filename}`);
    await writeFile(tempPath, buffer);

    // Pass file stream to Groq Whisper
    let transcription;
    let lastError;

    for (const apiKey of apiKeys) {
      try {
        const groq = new Groq({ apiKey });
        transcription = await groq.audio.transcriptions.create({
          file: createReadStream(tempPath),
          model: "whisper-large-v3",
          language: "en",
          response_format: "json",
        });
        break; // Success
      } catch (error: any) {
        lastError = error;
        if (error?.status === 429) {
          console.warn("[/api/transcribe] Rate limit hit, trying next API key...");
          continue; // Try next key
        }
        throw error; // Throw non-rate-limit errors
      }
    }

    if (!transcription) {
      throw lastError;
    }

    // Clean up temp file
    try { await unlink(tempPath); } catch { }

    console.log(`[/api/transcribe] Result: "${transcription.text?.slice(0, 80)}..."`);

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error("[/api/transcribe] Error:", error);
    // Clean up temp file on error
    if (tempPath) {
      try { await unlink(tempPath); } catch { }
    }
    const message = error instanceof Error ? error.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
