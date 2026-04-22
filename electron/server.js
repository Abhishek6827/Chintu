const express = require("express");
const path = require("path");
const fs = require("fs");
const os = require("os");
const Groq = require("groq-sdk");
const multer = require("multer");

// ─── Response length presets ────────────────────────────────
const RESPONSE_PROMPTS = {
  small: `Keep your answer very brief — about 3-4 short sentences. Speak naturally and conversationally, as if you are thinking on your feet. Do NOT use bullet points, headers, or lists. Make it sound like a natural, off-the-cuff spoken response.`,

  balanced: `Keep your answer moderate in length — around 2-3 paragraphs. Use a natural, conversational tone with smooth transitions. Do NOT use bullet points, headers, or any special formatting. It MUST sound like a human speaking aloud in an interview, not reading from a script.`,

  detailed: `Give a thorough but conversational answer. Tell a cohesive story with natural phrasing. Do NOT use bullet points, headers, or numbered lists. Use a natural speaking style that sounds authentic when spoken aloud. Aim for about 4-5 paragraphs.`,

  coding: `You are an expert programmer assisting in a technical interview.

FIRST — detect the intent from the problem/question:

1. "Find the bug / What's wrong / Error in this code" → DEBUG mode
2. "Solve / Write / Implement this" → SOLVE mode
3. "Optimize / Improve this" → OPTIMIZE mode
4. "Is this correct / Review this / Any improvements / Is this right?" → DEBUG mode
   (Treat as DEBUG — read the code deeply, find ALL bugs. If no bugs exist, say "No bugs found" and briefly explain why the code is correct.)

---

If DEBUG mode:
You MUST actually read and analyze the code deeply. Do NOT give generic advice.
Find the EXACT line(s) causing the bug — including BOTH runtime errors AND compile-time errors.

IMPORTANT — Also check for these TypeScript-specific mistakes:
- ReturnType<Fn> instead of ReturnType<typeof Fn>
- Wrong or missing type assertions
- Accessing properties on possibly undefined types
- Missing ! on non-null assertions
- MISSING return statements — a function that returns nothing is a bug
- MISSING required constructor arguments — empty config objects are a bug
These are SILENT bugs — TypeScript won't compile, but they are easy to miss.

ALWAYS check for MISSING code — what the code is supposed to do vs what it actually does.
NEVER flag unused imports/variables as bugs unless they cause an error.
NEVER respond in multiple modes at once — pick ONE mode and stick to it.

─── RESPONSE FORMAT — follow this EXACT order ───

**Summary:**
| # | Line | Bug | Type |
|---|------|-----|------|
| 1 | Line N | [one line — what is wrong] | runtime crash / TS error / logic error |
| 2 | Line N | [one line — what is wrong] | runtime crash / TS error / logic error |

**Fixed Code:**
\`\`\`language
// Show the COMPLETE corrected code
// On EVERY line you changed: // ← FIXED: [what and why]
// On EVERY line you added:   // ← ADDED: [what this does]
// Unchanged lines have no comment
\`\`\`

**Root Cause:**
[For each bug in the table — 1 line explaining WHY it breaks at runtime or compile time]

─── Rules ───
- Summary table MUST come first — always
- Fixed code MUST come second — always
- NEVER say "the code looks mostly correct"
- NEVER miss TypeScript type-level errors
- NEVER use words like "might", "seems", "appears", "potentially", "could be"
  — if you found a bug, state it directly; if no bug exists, say "No bugs found"
- NEVER add analysis or suggestions after the Fixed Code — Root Cause ke baad STOP
- If no bugs found: say "No bugs found" with 1 line explanation
---

If SOLVE mode:
**Approach:** [1-2 lines — algorithm/pattern and why]

\`\`\`language
// Clean, well-commented optimal solution
// On any non-obvious line, add: // ← [brief explanation]
\`\`\`

**Edge Cases:** [key edge cases handled]

**Complexity:** Time: O(?) | Space: O(?)

---

If OPTIMIZE mode:
**Issue with current approach:** [what's inefficient and why]

**Optimized Solution:**
\`\`\`language
// On every line changed from original: // ← CHANGED: [what and why]
// On every line added:                 // ← ADDED: [what this does]
\`\`\`

**Before vs After:** Time: O(?) → O(?) | Space: O(?) → O(?)

---

Global Rules:
- NEVER rewrite entire code if only a small fix is needed
- Detect language from the code — default to JavaScript if unclear
- ALWAYS put language name after triple backticks
- Prioritize optimal solution over brute force
- Be precise — no unnecessary explanation`,
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

  app.use(express.json({ limit: "10mb" }));

  // ─── Serve static files from Next.js export ───────────────
  app.use(express.static(staticDir, { extensions: ["html"] }));

  // ─── API: Answer generation (streaming) ───────────────────
  app.post("/api/answer", async (req, res) => {
    try {
      const { transcript, jobDescription, responseLength = "small" } = req.body;

      if (!transcript || !jobDescription) {
        return res.status(400).json({ error: "Missing transcript or jobDescription" });
      }

      const lengthInstruction = RESPONSE_PROMPTS[responseLength] || RESPONSE_PROMPTS.small;
      const isCoding = responseLength === "coding";

      console.log(`[/api/answer] Mode: ${responseLength} | Question: "${transcript.slice(0, 80)}..."`);

      // ─── Coding uses DeepSeek R1 (reasoning model), spoken uses Llama ───
      const model = isCoding
        ? "openai/gpt-oss-120b"  // best for code accuracy & bug detection
        : "openai/gpt-oss-120b";       // best for natural spoken responses

      // ─── Separate system prompts for coding vs spoken ────────
      const systemPrompt = isCoding
        ? `You are an expert programmer helping a candidate during a technical interview.
The candidate is interviewing for this role:

---
${jobDescription}
---

${lengthInstruction}`

        : `You are generating spoken responses for an interviewee. The candidate is interviewing for a role with the following job description:

---
${jobDescription}
---

Write the EXACT words they should speak in response. Write in the first person ("I").
CRITICAL: Sound like a human speaking naturally — conversational, thoughtful, and unscripted.
NEVER use bullet points, numbered lists, bold text, or headers. The candidate will be reading this aloud.

${lengthInstruction}

Rules:
- Be technically accurate
- Do NOT repeat the question back
- Jump straight into the answer
- Avoid robotic or overly formal phrasing`;

      const stream = await groq.chat.completions.create({
        model,
        stream: true,
        max_tokens: 2048,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
      });

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // ─── Stream with <think> tag filter (DeepSeek R1 internal reasoning) ───
      let insideThinkTag = false;
      let buffer = "";

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (!text) continue;

        buffer += text;

        // Entering <think> block — stop writing to client
        if (buffer.includes("<think>")) {
          insideThinkTag = true;
          // Discard everything up to and including <think>
          buffer = buffer.split("<think>").pop() ?? "";
          continue;
        }

        // Exiting </think> block — resume writing after the closing tag
        if (insideThinkTag && buffer.includes("</think>")) {
          insideThinkTag = false;
          const afterThink = buffer.split("</think>").pop() ?? "";
          buffer = afterThink;
          if (afterThink) res.write(afterThink);
          continue;
        }

        // Inside think block — skip silently
        if (insideThinkTag) {
          continue;
        }

        // Normal content — write to client
        res.write(text);
        buffer = "";
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

      const originalExt = path.extname(req.file.originalname) || ".webm";
      const newPath = tempPath + originalExt;
      fs.renameSync(tempPath, newPath);
      tempPath = newPath;

      const transcription = await groq.audio.transcriptions.create({
        file: fs.createReadStream(tempPath),
        model: "whisper-large-v3",
        language: "en",
        response_format: "json",
      });

      try { fs.unlinkSync(tempPath); } catch {}

      console.log(`[/api/transcribe] Result: "${transcription.text?.slice(0, 80)}..."`);

      res.json({ text: transcription.text });
    } catch (error) {
      console.error("[/api/transcribe] Error:", error);
      if (tempPath) {
        try { fs.unlinkSync(tempPath); } catch {}
      }
      const message = error instanceof Error ? error.message : "Transcription failed";
      res.status(500).json({ error: message });
    }
  });

  // ─── SPA Fallback ─────────────────────────────────────────
  app.get("*", (req, res) => {
    const htmlFile = path.join(staticDir, req.path + ".html");
    const indexFile = path.join(staticDir, req.path, "index.html");

    if (fs.existsSync(htmlFile)) {
      res.sendFile(htmlFile);
    } else if (fs.existsSync(indexFile)) {
      res.sendFile(indexFile);
    } else {
      res.sendFile(path.join(staticDir, "index.html"));
    }
  });

  return app;
}

module.exports = { createServer };