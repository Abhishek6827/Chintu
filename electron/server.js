const express = require("express");
const path = require("path");
const fs = require("fs");
const os = require("os");
const Groq = require("groq-sdk");
const multer = require("multer");

// ─── Response length presets ────────────────────────────────
const RESPONSE_PROMPTS = {
  concise: `Keep your answer very brief — 2-4 bullet points or 3-4 sentences max. No fluff. Get straight to the core answer.`,
  balanced: `Keep your answer well-structured and moderate in length — around 150-200 words. Use bullet points when helpful. Balance depth with brevity.`,
  detailed: `Give a thorough, comprehensive answer with examples, explanations, and context. Use structured formatting with headers and bullet points. Aim for 300-500 words to cover the topic in depth.`,
};

/**
 * Creates and returns an Express app with API routes and static file serving.
 * @param {string} apiKey - Groq API key
 * @param {string} staticDir - Path to the Next.js static export directory (out/)
 * @returns {express.Express}
 */
function createServer(apiKey, staticDir) {
  const app = express();
  const upload = multer({ dest: os.tmpdir() });

  const groq = new Groq({ apiKey });

  // Parse JSON bodies
  app.use(express.json({ limit: "10mb" }));

  // ─── Serve static files from Next.js export ───────────────
  // The `extensions` option lets Express resolve /room → /room.html
  app.use(express.static(staticDir, { extensions: ["html"] }));

  // ─── API: Answer generation (streaming) ───────────────────
  app.post("/api/answer", async (req, res) => {
    try {
      const { transcript, jobDescription, responseLength = "balanced" } = req.body;

      if (!transcript || !jobDescription) {
        return res.status(400).json({ error: "Missing transcript or jobDescription" });
      }

      const lengthInstruction = RESPONSE_PROMPTS[responseLength] || RESPONSE_PROMPTS.balanced;

      console.log(`[/api/answer] Mode: ${responseLength} | Question: "${transcript.slice(0, 80)}..."`);

      const stream = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        stream: true,
        messages: [
          {
            role: "system",
            content: `You are an expert interview coach. The candidate is interviewing for a role with the following job description:

---
${jobDescription}
---

When the candidate shares a question they were asked, provide a well-structured answer they can use.

**Response length instruction:** ${lengthInstruction}

Rules:
- Be technically accurate
- Do NOT repeat the question back
- Jump straight into the answer`,
          },
          {
            role: "user",
            content: transcript,
          },
        ],
      });

      // Stream the response as chunked text
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) {
          res.write(text);
        }
      }

      res.end();
    } catch (error) {
      console.error("[/api/answer] Error:", error);
      const message = error instanceof Error ? error.message : "Answer generation failed";
      if (!res.headersSent) {
        res.status(500).json({ error: message });
      } else {
        res.end();
      }
    }
  });

  // ─── API: Audio transcription via Groq Whisper ────────────
  app.post("/api/transcribe", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      console.log(`[/api/transcribe] Received audio: ${req.file.originalname}, size: ${req.file.size} bytes`);

      // Pass file stream to Groq Whisper
      const transcription = await groq.audio.transcriptions.create({
        file: fs.createReadStream(req.file.path),
        model: "whisper-large-v3",
        language: "en",
        response_format: "json",
      });

      // Clean up temp file
      try { fs.unlinkSync(req.file.path); } catch {}

      console.log(`[/api/transcribe] Result: "${transcription.text?.slice(0, 80)}..."`);

      res.json({ text: transcription.text });
    } catch (error) {
      console.error("[/api/transcribe] Error:", error);
      // Clean up temp file on error
      if (req.file) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
      const message = error instanceof Error ? error.message : "Transcription failed";
      res.status(500).json({ error: message });
    }
  });

  // ─── SPA Fallback ─────────────────────────────────────────
  // For client-side routes like /room, serve the corresponding HTML file
  app.get("*", (req, res) => {
    // Try /room.html for /room
    const htmlFile = path.join(staticDir, req.path + ".html");
    // Try /room/index.html for /room/
    const indexFile = path.join(staticDir, req.path, "index.html");

    if (fs.existsSync(htmlFile)) {
      res.sendFile(htmlFile);
    } else if (fs.existsSync(indexFile)) {
      res.sendFile(indexFile);
    } else {
      // Fall back to root index.html
      res.sendFile(path.join(staticDir, "index.html"));
    }
  });

  return app;
}

module.exports = { createServer };
