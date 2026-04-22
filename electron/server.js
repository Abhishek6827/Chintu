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

  detailed: `Determine the context first — are you looking at screenshot(s) or answering a spoken question?

─── If responding to SCREENSHOT(S) ───
Give a complete, structured, and thorough response. You MAY use:
- Headers to separate sections (e.g. **Overview**, **Step 1**, **Step 2**)
- Numbered steps for sequential tasks
- Code blocks where relevant
- Brief bullet points for lists of options or findings

If multiple screenshots are given:
- First, briefly describe what each screenshot shows (1 line each)
- Then synthesize: what is the overall task or problem across all of them?
- Then give the full answer, referencing specific screenshots where needed
  (e.g. "In the first screenshot, the issue is... while the second shows...")
- Do NOT treat each screenshot in isolation — connect them into one coherent answer
- If screenshots show different parts of the same file or flow, combine them mentally

─── If responding to a SPOKEN question ───
Give a thorough but conversational answer. Tell a cohesive story with natural phrasing.
Do NOT use bullet points, headers, or numbered lists.
Use a natural speaking style that sounds authentic when spoken aloud.
Aim for about 4-5 paragraphs.`,

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

function createServer(apiKeys, staticDir) {
  const app = express();
  const upload = multer({ dest: os.tmpdir() });

  // apiKeys is now passed directly from main.js (already resolved from env/config.json)
  console.log(`[Server] API keys loaded: ${apiKeys.length} (keys ending: ${apiKeys.map(k => '...' + k.slice(-4)).join(', ')})`);


  app.use(express.json({ limit: "10mb" }));
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

      const model = isCoding
        ? "openai/gpt-oss-120b"
        : "openai/gpt-oss-120b";

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

      let stream;
      let lastError;
      const MAX_RETRIES = 3;
      const RETRY_DELAY_MS = 10000; // 10 seconds

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          console.log(`[/api/answer] ⏳ All keys rate-limited. Waiting ${RETRY_DELAY_MS / 1000}s before retry ${attempt + 1}/${MAX_RETRIES}...`);
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        }

        for (let i = 0; i < apiKeys.length; i++) {
          const key = apiKeys[i];
          try {
            console.log(`[/api/answer] Trying key ${i + 1}/${apiKeys.length} (attempt ${attempt + 1}) (ending: ...${key.slice(-4)})`);
            const groq = new Groq({ apiKey: key });
            stream = await groq.chat.completions.create({
              model,
              stream: true,
              max_tokens: 2048,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: transcript },
              ],
            });
            console.log(`[/api/answer] ✓ Stream created with key ${i + 1}`);
            break;
          } catch (error) {
            lastError = error;
            console.error(`[/api/answer] ✗ Key ${i + 1} failed — status: ${error?.status}, message: ${error?.message?.slice(0, 100)}`);
            if (error?.status === 429) {
              console.warn(`[/api/answer] Rate limit on key ${i + 1}, trying next...`);
              continue;
            }
            throw error;
          }
        }

        if (stream) break; // success — exit retry loop
      }

      if (!stream) throw lastError;

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let insideThinkTag = false;
      let buffer = "";

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (!text) continue;

        buffer += text;

        if (buffer.includes("<think>")) {
          insideThinkTag = true;
          buffer = buffer.split("<think>").pop() ?? "";
          continue;
        }

        if (insideThinkTag && buffer.includes("</think>")) {
          insideThinkTag = false;
          const afterThink = buffer.split("</think>").pop() ?? "";
          buffer = afterThink;
          if (afterThink) res.write(afterThink);
          continue;
        }

        if (insideThinkTag) continue;

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

  // ─── API: Answer generation with Vision ───────────────────
  app.post("/api/answer-vision", async (req, res) => {
    try {
      const {
        images,
        jobDescription,
        responseLength = "coding",
        additionalContext = "",
        conversationHistory = [],   // ← NEW: previous messages for context
      } = req.body;

      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: "No images provided" });
      }

      if (!jobDescription) {
        return res.status(400).json({ error: "Missing jobDescription" });
      }

      const lengthInstruction = RESPONSE_PROMPTS[responseLength] || RESPONSE_PROMPTS.coding;
      const isCoding = responseLength === "coding";

      console.log(`[/api/answer-vision] Mode: ${responseLength} | Images: ${images.length} | History: ${conversationHistory.length} messages`);

      const model = "meta-llama/llama-4-scout-17b-16e-instruct";

      // ─── Build new user message with screenshots ───────────
      const contentParts = [];
      for (const img of images) {
        contentParts.push({
          type: "image_url",
          image_url: {
            url: img.startsWith("data:") ? img : `data:image/png;base64,${img}`,
          },
        });
      }
      contentParts.push({
        type: "text",
        text: additionalContext
          ? `Look at the screenshot(s) carefully. The user says: "${additionalContext}". Based on what you see, provide the answer.`
          : "Look at the screenshot(s) carefully. Read ALL visible text, code, and questions. Then provide a complete answer.",
      });

      const systemPrompt = isCoding
        ? `You are an expert programmer helping a candidate during a technical interview.
The candidate is interviewing for this role:

---
${jobDescription}
---

The candidate will share screenshot(s) of problems they see on screen.
Read all visible text and code from the screenshots carefully.
If multiple screenshots show the same problem, combine context from all of them.
You have access to previous screenshots and answers in the conversation history — use them for context.

${lengthInstruction}`
        : `You are generating spoken responses for an interviewee. The candidate is interviewing for:

---
${jobDescription}
---

The candidate will share screenshot(s) of questions they see on screen.
Read the question from the screenshot and write the EXACT words they should speak in response.
Write in the first person ("I"). Sound natural and conversational — never robotic.
NEVER use bullet points, numbered lists, bold text, or headers.
You have access to previous screenshots and answers in the conversation history — use them for context.

${lengthInstruction}

${images && images.length > 1
  ? `Note: The candidate has shared ${images.length} screenshots. Treat them as parts of one task — connect context across all of them.`
  : ""
}

Rules:
- Be technically accurate
- Jump straight into the answer
- Avoid overly formal phrasing`;

      // ─── Keep last 6 history messages to avoid token overflow ─
      const trimmedHistory = conversationHistory.slice(-10);

      let stream;
      let lastError;
      const MAX_RETRIES = 3;
      const RETRY_DELAY_MS = 10000; // 10 seconds

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          console.log(`[/api/answer-vision] ⏳ All keys rate-limited. Waiting ${RETRY_DELAY_MS / 1000}s before retry ${attempt + 1}/${MAX_RETRIES}...`);
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        }

        for (let i = 0; i < apiKeys.length; i++) {
          const key = apiKeys[i];
          try {
            console.log(`[/api/answer-vision] Trying key ${i + 1}/${apiKeys.length} (attempt ${attempt + 1}) (ending: ...${key.slice(-4)})`);
            const groq = new Groq({ apiKey: key });
            stream = await groq.chat.completions.create({
              model,
              stream: true,
              max_tokens: 2048,
              messages: [
                { role: "system", content: systemPrompt },
                ...trimmedHistory,              // ← previous messages
                { role: "user", content: contentParts }, // ← new screenshot message
              ],
            });
            console.log(`[/api/answer-vision] ✓ Stream created with key ${i + 1}`);
            break;
          } catch (error) {
            lastError = error;
            console.error(`[/api/answer-vision] ✗ Key ${i + 1} failed — status: ${error?.status}, message: ${error?.message?.slice(0, 100)}`);
            if (error?.status === 429) {
              console.warn(`[/api/answer-vision] Rate limit on key ${i + 1}, trying next...`);
              continue;
            }
            throw error;
          }
        }

        if (stream) break; // success — exit retry loop
      }

      if (!stream) throw lastError;

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let insideThinkTag = false;
      let buffer = "";

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (!text) continue;

        buffer += text;

        if (buffer.includes("<think>")) {
          insideThinkTag = true;
          buffer = buffer.split("<think>").pop() ?? "";
          continue;
        }

        if (insideThinkTag && buffer.includes("</think>")) {
          insideThinkTag = false;
          const afterThink = buffer.split("</think>").pop() ?? "";
          buffer = afterThink;
          if (afterThink) res.write(afterThink);
          continue;
        }

        if (insideThinkTag) continue;

        res.write(text);
        buffer = "";
      }

      res.end();
    } catch (error) {
      console.error("[/api/answer-vision] Error:", error);
      const message = error instanceof Error ? error.message : "Vision answer failed";
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

      let transcription;
      let lastError;

      for (const key of apiKeys) {
        try {
          const groq = new Groq({ apiKey: key });
          transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(tempPath),
            model: "whisper-large-v3",
            language: "en",
            response_format: "json",
          });
          break;
        } catch (error) {
          lastError = error;
          if (error?.status === 429) {
            console.warn("[/api/transcribe] Rate limit hit, trying next API key...");
            continue;
          }
          throw error;
        }
      }

      if (!transcription) throw lastError;

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