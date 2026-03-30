const express = require("express");
const path = require("path");
const fs = require("fs");
const os = require("os");
const Groq = require("groq-sdk");
const multer = require("multer");

// ─── Response length presets ────────────────────────────────
const RESPONSE_PROMPTS = {
  concise: `Keep your answer very brief — about 3-4 short sentences. Speak naturally and conversationally, as if you are thinking on your feet. Do NOT use bullet points, headers, or lists. Make it sound like a natural, off-the-cuff spoken response.`,
  balanced: `Keep your answer moderate in length — around 2-3 paragraphs. Use a natural, conversational tone with smooth transitions. Do NOT use bullet points, headers, or any special formatting. It MUST sound like a human speaking aloud in an interview, not reading from a script.`,
  detailed: `Give a thorough but conversational answer. Tell a cohesive story with natural phrasing. Do NOT use bullet points, headers, or numbered lists. Use a natural speaking style that sounds authentic when spoken aloud. Aim for about 4-5 paragraphs.`,
  coding: `Write extremely accurate, efficient, and well-commented code to solve the core problem. Use markdown code blocks. Keep explanation very brief, let the code speak for itself. You are acting as an expert programmer.`,
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
            content: `You are generating spoken responses for an interviewee. The candidate is interviewing for a role with the following job description:

---
${jobDescription}
---

When the candidate shares a question they were asked, write the EXACT words they should speak in response. Write in the first person ("I").
CRITICAL: The response MUST sound like a human speaking naturally in real-time. It should sound conversational, thoughtful, and unscripted. 
NEVER use bullet points, numbered lists, bold text, or headers. The candidate will be reading this aloud, so formatting ruins the natural flow.

**Response length instruction:** ${lengthInstruction}

Rules:
- Be technically accurate
- Do NOT repeat the question back
- Jump straight into the answer
- Avoid robotic or overly formal phrasing.
- NEVER use markdown formatting like bullet points, lists, or bold text (except for the coding profile).`,
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
    let tempPath = req.file ? req.file.path : null;
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      console.log(`[/api/transcribe] Received audio: ${req.file.originalname}, size: ${req.file.size} bytes`);

      // FIX: Multer saves files without extensions. Groq API requires a valid extension to detect audio format.
      const originalExt = path.extname(req.file.originalname) || ".webm";
      const newPath = tempPath + originalExt;
      fs.renameSync(tempPath, newPath);
      tempPath = newPath;

      // Pass file stream to Groq Whisper
      const transcription = await groq.audio.transcriptions.create({
        file: fs.createReadStream(tempPath),
        model: "whisper-large-v3",
        language: "en",
        response_format: "json",
      });

      // Clean up temp file
      try { fs.unlinkSync(tempPath); } catch {}

      console.log(`[/api/transcribe] Result: "${transcription.text?.slice(0, 80)}..."`);

      res.json({ text: transcription.text });
    } catch (error) {
      console.error("[/api/transcribe] Error:", error);
      // Clean up temp file on error
      if (tempPath) {
        try { fs.unlinkSync(tempPath); } catch {}
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
