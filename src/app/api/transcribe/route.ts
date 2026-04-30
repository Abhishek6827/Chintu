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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    console.log(`[/api/transcribe] Received audio: ${file.name}, size: ${file.size} bytes`);

    // Write file to temp directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    tempPath = join(tmpdir(), `transcribe-${Date.now()}-${file.name}`);
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
    try { await unlink(tempPath); } catch {}

    console.log(`[/api/transcribe] Result: "${transcription.text?.slice(0, 80)}..."`);

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error("[/api/transcribe] Error:", error);
    // Clean up temp file on error
    if (tempPath) {
      try { await unlink(tempPath); } catch {}
    }
    const message = error instanceof Error ? error.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
