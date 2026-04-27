const express = require("express");
const log = require("electron-log");
// Override console for server logs too
Object.assign(console, log.functions);
const path = require("path");
const fs = require("fs");
const os = require("os");
const Groq = require("groq-sdk");
const OpenAI = require("openai");
const multer = require("multer");

const RESPONSE_PROMPTS = {
  small: `Keep your answer very brief — about 3-4 short sentences. Speak naturally and conversationally, as if you are thinking on your feet. Do NOT use bullet points, headers, or lists. Make it sound like a natural, off-the-cuff spoken response.`,
  

  balanced: `Keep your answer moderate in length — around 2-3 paragraphs. Use a natural, conversational tone with smooth transitions. Do NOT use bullet points, headers, or any special formatting. It MUST sound like a human speaking aloud in an interview, not reading from a script.`,

  detailed: `Determine the context first — are you looking at screenshot(s) or answering a spoken question?

─── If responding to SCREENSHOT(S) ───
Give a complete, structured, and thorough response. You MAY use:
- Headers to separate sections (e.g. **Overview**, **Step 1**, **Step 2**)
- Numbered steps for sequential tasks
- Code blocks where relevant
Please keep the code changes minimal. Do not add unnecessary information or extra code unless I ask. Do not change the names of any given functions or variables. Only correct the code, and add a single comment line explaining what was changed or what the mistake was. Do not change the whole logic or code structure unless it is required
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

  coding: `Act as an expert programmer helping me in a technical interview. Instead of giving a long summary, please add comments on the exact lines where you fixed the code, with a short explanation of the mistake. This will help me understand the issue quickly and explain it better to the interviewer

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

function createServer(apiKeys, openRouterKey, dashscopeKey, staticDir) {
  const app = express();
  const upload = multer({ dest: os.tmpdir() });

  console.log(`[Server] Groq keys: ${apiKeys.length} | OpenRouter: ${openRouterKey ? "yes" : "no"} | DashScope: ${dashscopeKey ? "yes" : "no"}`);


  app.use(express.json({ limit: "50mb" }));
  app.use(express.static(staticDir, { extensions: ["html"] }));

   app.post("/api/answer", async (req, res) => {
    try {
      const {
        transcript,
        jobDescription,
        aboutYou = "",
        responseLength = "small",
        conversationHistory = [],
        selectedModel = "gpt-oss-120b",
      } = req.body;

      if (!transcript || !jobDescription) {
        return res.status(400).json({ error: "Missing transcript or jobDescription" });
      }

      const lengthInstruction = RESPONSE_PROMPTS[responseLength] || RESPONSE_PROMPTS.small;
      const isCoding = responseLength === "coding";

      // ─── Qwen Rotation Lists ─────────────────────────────────────
      const QWEN_PRIORITY = [
        "qwen3.6-plus",
        "qwen3-vl-235b-a22b-thinking",
        "qwen3-vl-30b-a3b-thinking",
        "qwen3.6-flash",
        "qwen-vl-plus",
        "qwen3.5-35b-a3b",
        "qwen3-vl-8b-thinking",
        "qwen3.5-flash-2026-02-23",
        "qwen3-next-80b-a3b-thinking",
        "qwen3.5-27b"
      ];

      const QWEN_FALLBACK = [
        "qwen2.5-vl-72b-instruct",
        "qwen-vl-plus-2025-05-07",
        "qwen-vl-plus-latest",
        "qwen-vl-max-2025-08-13",
        "qwen3-coder-plus",
        "qwen3-max-preview",
        "qwen3-vl-flash-2025-10-15",
        "qwen-plus",
        "qwen-turbo",
        "qwen3-coder-flash",
        "qwen-vl-plus-2025-08-15",
        "qwen3-vl-flash"
      ];

      // ─── Model mapping: key → { groq model ID, openrouter model ID } ─
      const MODEL_MAP = {
        "gpt-oss-120b":      { provider: "groq",       groq: "openai/gpt-oss-120b",      openrouter: "openai/gpt-oss-120b" },
        "qwen3-Coder":  { provider: "dashscope", dashscope: "qwen3-coder-480b-a35b-instruct" },
        "nemotron-3-120b":   { provider: "groq",       groq: "nvidia/nemotron-3-super-120b-a12b:free", openrouter: "nvidia/nemotron-3-super-120b-a12b:free" },
        "qwen3.6": { provider: "dashscope", dashscope: "qwen3.6-plus" },
        "qwen3.6-plus": { provider: "dashscope", dashscope: "qwen3.6-plus" },
        "llama-3.3-70b": { provider: "groq", groq: "llama-3.3-70b-versatile", openrouter: "meta-llama/llama-3.3-70b-instruct" },
      };

      const modelConfig = MODEL_MAP[selectedModel] || MODEL_MAP["gpt-oss-120b"];
      const isDashScope = modelConfig.provider === "dashscope";
      const groqModel = modelConfig.groq;
      const openrouterModel = modelConfig.openrouter;

      console.log(`[/api/answer] Mode: ${responseLength} | Model: ${selectedModel} | Provider: ${modelConfig.provider} | History: ${conversationHistory.length} messages`);

      const aboutYouBlock = aboutYou
        ? `\n\nHere is the candidate's background — use this to personalize your answers with their real experience, projects, and skills. Speak as if YOU are this person:\n---\n${aboutYou}\n---`
        : "";

      const systemPrompt = isCoding
        ? `You are an expert programmer helping a candidate during a technical interview.
The candidate is interviewing for this role:

---
${jobDescription}
---
${aboutYouBlock}

${lengthInstruction}

You have access to previous questions and answers in the conversation history — use them for context.`
        : `You are generating spoken responses for an interviewee. The candidate is interviewing for a role with the following job description:

---
${jobDescription}
---
${aboutYouBlock}

Write the EXACT words they should speak in response. Write in the first person ("I").
CRITICAL: Sound like a human speaking naturally — conversational, thoughtful, and unscripted.
NEVER use bullet points, numbered lists, bold text, or headers. The candidate will be reading this aloud.
You have access to previous questions and answers in the conversation history — use them for context.

${lengthInstruction}

Rules:
- Be technically accurate
- Do NOT repeat the question back
- Jump straight into the answer
- Avoid robotic or overly formal phrasing
- When relevant, naturally reference the candidate's real projects, experience, and skills from their background`;

      // ─── Keep last 10 history messages to avoid token overflow ─
      const trimmedHistory = conversationHistory.slice(-10);

      let actualModelUsed = selectedModel;
      let stream;
      let lastError;
      const MAX_RETRIES = 3;
      const RETRY_DELAY_MS = 10000; // 10 seconds

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          console.log(`[/api/answer] ⏳ All keys rate-limited. Waiting ${RETRY_DELAY_MS / 1000}s before retry ${attempt + 1}/${MAX_RETRIES}...`);
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        }

        // ─── DashScope (Alibaba) routing ─────────────────────
        if (isDashScope) {
          const modelsToTry = (selectedModel === "qwen3.6" || selectedModel === "qwen3.6-plus")
            ? [...QWEN_PRIORITY, ...QWEN_FALLBACK]
            : [modelConfig.dashscope];

          for (const modelId of modelsToTry) {
            try {
              console.log(`[/api/answer] Using DashScope model: ${modelId}`);
              const dashscope = new OpenAI({
                baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
                apiKey: process.env.DASHSCOPE_API_KEY || dashscopeKey,
              });
              stream = await dashscope.chat.completions.create({
                model: modelId,
                stream: true,
                max_tokens: 2048,
                messages: [
                  { role: "system", content: systemPrompt },
                  ...trimmedHistory,
                  { role: "user", content: transcript },
                ],
              });
              actualModelUsed = modelId;
              console.log(`[/api/answer] ✓ DashScope stream created with ${modelId}`);
              break;
            } catch (err) {
              lastError = err;
              console.error(`[/api/answer] ✗ DashScope model ${modelId} failed:`, err?.message?.slice(0, 100));
            }
          }
          if (stream) break;
          break; // Don't retry with Groq keys for DashScope model
        }

        for (let i = 0; i < apiKeys.length; i++) {
          const key = apiKeys[i];
          try {
            console.log(`[/api/answer] Trying key ${i + 1}/${apiKeys.length} (attempt ${attempt + 1}) (ending: ...${key.slice(-4)})`);
            const groq = new Groq({ apiKey: key });
            stream = await groq.chat.completions.create({
              model: groqModel,
              stream: true,
              max_tokens: 2048,
              messages: [
                { role: "system", content: systemPrompt },
                ...trimmedHistory,
                { role: "user", content: transcript },
              ],
            });
            actualModelUsed = selectedModel;
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

      if (!stream) {
        // ─── OpenRouter fallback ────────────────────────────────
        if (openRouterKey) {
          console.log(`[/api/answer] 🔄 All Groq keys failed. Trying OpenRouter...`);
          try {
            const openrouter = new OpenAI({
              baseURL: "https://openrouter.ai/api/v1",
              apiKey: openRouterKey,
            });
            stream = await openrouter.chat.completions.create({
              model: openrouterModel,
              stream: true,
              max_tokens: 2048,
              messages: [
                { role: "system", content: systemPrompt },
                ...trimmedHistory,
                { role: "user", content: transcript },
              ],
            });
            actualModelUsed = selectedModel;
            console.log(`[/api/answer] ✓ OpenRouter stream created`);
          } catch (orErr) {
            console.error(`[/api/answer] ✗ OpenRouter also failed:`, orErr?.message?.slice(0, 100));
            lastError = orErr;
            
            console.log(`[/api/answer] 🔄 OpenRouter with ${openrouterModel} failed. Falling back...`);
            let fallbackStream;
            for (let i = 0; i < apiKeys.length; i++) {
              try {
                console.log(`[/api/answer] Fallback: Trying Groq key ${i + 1} with meta-llama/llama-4-scout-17b-16e-instruct...`);
                const groq = new Groq({ apiKey: apiKeys[i] });
                fallbackStream = await groq.chat.completions.create({
                  model: "meta-llama/llama-4-scout-17b-16e-instruct",
                  stream: true,
                  max_tokens: 2048,
                  messages: [
                    { role: "system", content: systemPrompt },
                    ...trimmedHistory,
                    { role: "user", content: transcript },
                  ],
                });
                stream = fallbackStream;
                actualModelUsed = "Llama-4-Scout (Groq Fallback)";
                console.log(`[/api/answer] ✓ Groq fallback stream created`);
                break;
              } catch (fallbackGroqErr) {
                lastError = fallbackGroqErr;
              }
            }
          }
        }
      }
      if (!stream) throw lastError;

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Model-Used", actualModelUsed);

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
        aboutYou = "",
        responseLength = "coding",
        additionalContext = "",
        conversationHistory = [],
        selectedModel = "gpt-oss-120b",
      } = req.body;

      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: "No images provided" });
      }

      if (!jobDescription) {
        return res.status(400).json({ error: "Missing jobDescription" });
      }

      const lengthInstruction = RESPONSE_PROMPTS[responseLength] || RESPONSE_PROMPTS.coding;
      const isCoding = responseLength === "coding";

      console.log(`[/api/answer-vision] Mode: ${responseLength} | Images: ${images.length} | Model: ${selectedModel}`);

      // ====================================================================
      // STEP 1: Extract Text from Image using Vision Model (llama-4-scout)
      // ====================================================================
      const visionModel = "meta-llama/llama-4-scout-17b-16e-instruct";
      const visionPrompt = "Extract all text, code, and UI elements from these screenshots accurately. Transcribe everything you see. Do not solve the problem or provide answers.";

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
          ? `User added context: "${additionalContext}". Please include this in your extraction.`
          : "Transcribe the screenshot.",
      });

      let extractedText = "";
      let visionSuccess = false;
      let lastError;

      const MAX_RETRIES = 3;
      const RETRY_DELAY_MS = 10000;

      console.log(`[/api/answer-vision] Step 1: Extracting text using ${visionModel}...`);

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, RETRY_DELAY_MS));

        for (let i = 0; i < apiKeys.length; i++) {
          try {
            const groq = new Groq({ apiKey: apiKeys[i] });
            const response = await groq.chat.completions.create({
              model: visionModel,
              stream: false,
              max_tokens: 2048,
              messages: [
                { role: "system", content: visionPrompt },
                { role: "user", content: contentParts },
              ],
            });
            extractedText = response.choices[0]?.message?.content || "";
            visionSuccess = true;
            break;
          } catch (err) {
            lastError = err;
          }
        }
        if (visionSuccess) break;
      }

      if (!visionSuccess && openRouterKey) {
        console.log(`[/api/answer-vision] Groq vision failed. Trying OpenRouter...`);
        try {
          const openrouter = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: openRouterKey,
          });
          const response = await openrouter.chat.completions.create({
            model: "meta-llama/llama-3.3-70b-instruct:free",
            stream: false,
            max_tokens: 2048,
            messages: [
              { role: "system", content: visionPrompt },
              { role: "user", content: contentParts },
            ],
          });
          extractedText = response.choices[0]?.message?.content || "";
          visionSuccess = true;
        } catch (err) {
          lastError = err;
        }
      }

      if (!visionSuccess) {
        throw new Error("Vision extraction failed: " + (lastError?.message || "Unknown error"));
      }

      console.log(`[/api/answer-vision] ✓ Step 1 Complete. Extracted ${extractedText.length} characters.`);

      // ─── Model mapping ────────────────────────────────────
      const MODEL_MAP = {
        "gpt-oss-120b":      { provider: "groq",       groq: "openai/gpt-oss-120b",      openrouter: "openai/gpt-oss-120b" },
        "qwen3-Coder":  { provider: "dashscope", dashscope: "qwen3-coder-480b-a35b-instruct" },
        "nemotron-3-120b":   { provider: "groq",       groq: "nvidia/nemotron-3-super-120b-a12b:free", openrouter: "nvidia/nemotron-3-super-120b-a12b:free" },
        "qwen3.6": { provider: "dashscope", dashscope: "qwen3.6-plus" },
        "qwen3.6-plus": { provider: "dashscope", dashscope: "qwen3.6-plus" },
        "llama-3.3-70b": { provider: "groq", groq: "llama-3.3-70b-versatile", openrouter: "meta-llama/llama-3.3-70b-instruct" },
      };

      const modelConfig = MODEL_MAP[selectedModel] || MODEL_MAP["gpt-oss-120b"];
      const isDashScope = modelConfig.provider === "dashscope";
      const groqModel = modelConfig.groq;
      const openrouterModel = modelConfig.openrouter;

      const aboutYouBlock = aboutYou
        ? `\n\nHere is the candidate's background — use this to personalize your answers with their real experience, projects, and skills. Speak as if YOU are this person:\n---\n${aboutYou}\n---`
        : "";

      const systemPrompt = isCoding
        ? `You are an expert programmer helping a candidate during a technical interview.
The candidate is interviewing for this role:

---
${jobDescription}
---
${aboutYouBlock}

${lengthInstruction}

You have access to previous questions and answers in the conversation history — use them for context.`
        : `You are generating spoken responses for an interviewee. The candidate is interviewing for a role with the following job description:

---
${jobDescription}
---
${aboutYouBlock}

Write the EXACT words they should speak in response. Write in the first person ("I").
CRITICAL: Sound like a human speaking naturally — conversational, thoughtful, and unscripted.
NEVER use bullet points, numbered lists, bold text, or headers. The candidate will be reading this aloud.
You have access to previous questions and answers in the conversation history — use them for context.

${lengthInstruction}

Rules:
- Be technically accurate
- Do NOT repeat the question back
- Jump straight into the answer
- Avoid robotic or overly formal phrasing
- When relevant, naturally reference the candidate's real projects, experience, and skills from their background`;

      const finalTranscript = `[Screenshot Transcription]:\n${extractedText}\n\n[User Context]: ${additionalContext || "None"}`;
      const trimmedHistory = conversationHistory.slice(-10);

      let actualModelUsed = selectedModel;
      let stream;
      let finalError;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, RETRY_DELAY_MS));

        // DashScope routing for vision Step 2
        if (isDashScope) {
          const modelsToTry = (selectedModel === "qwen3.6" || selectedModel === "qwen3.6-plus")
            ? [...QWEN_PRIORITY, ...QWEN_FALLBACK]
            : [modelConfig.dashscope];

          for (const modelId of modelsToTry) {
            try {
              console.log(`[/api/answer-vision] Step 2: Using DashScope model: ${modelId}`);
              const dashscope = new OpenAI({
                baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
                apiKey: process.env.DASHSCOPE_API_KEY || dashscopeKey,
              });
              stream = await dashscope.chat.completions.create({
                model: modelId,
                stream: true,
                max_tokens: 2048,
                messages: [
                  { role: "system", content: systemPrompt },
                  ...trimmedHistory,
                  { role: "user", content: finalTranscript },
                ],
              });
              actualModelUsed = modelId;
              console.log(`[/api/answer-vision] ✓ DashScope stream created with ${modelId}`);
              break;
            } catch (err) {
              finalError = err;
              console.error(`[/api/answer-vision] ✗ DashScope model ${modelId} failed:`, err?.message?.slice(0, 100));
            }
          }
          if (stream) break;
          break;
        }

        for (let i = 0; i < apiKeys.length; i++) {
          try {
            console.log(`[/api/answer-vision] Step 2: Trying key ${i + 1} with ${groqModel}...`);
            const groq = new Groq({ apiKey: apiKeys[i] });
            stream = await groq.chat.completions.create({
              model: groqModel,
              stream: true,
              max_tokens: 2048,
              messages: [
                { role: "system", content: systemPrompt },
                ...trimmedHistory,
                { role: "user", content: finalTranscript },
              ],
            });
            actualModelUsed = selectedModel;
            break;
          } catch (err) {
            finalError = err;
          }
        }
        if (stream) break;
      }

      if (!stream && openRouterKey) {
        console.log(`[/api/answer-vision] Step 2: Groq failed. Trying OpenRouter with ${openrouterModel}...`);
        try {
          const openrouter = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: openRouterKey,
          });
          stream = await openrouter.chat.completions.create({
            model: openrouterModel,
            stream: true,
            max_tokens: 2048,
            messages: [
              { role: "system", content: systemPrompt },
              ...trimmedHistory,
              { role: "user", content: finalTranscript },
            ],
          });
          actualModelUsed = selectedModel;
        } catch (err) {
          finalError = err;
          console.log(`[/api/answer-vision] OpenRouter with ${openrouterModel} failed. Falling back...`);
          let fallbackStream;
          for (let i = 0; i < apiKeys.length; i++) {
            try {
              console.log(`[/api/answer-vision] Fallback: Trying Groq key ${i + 1} with meta-llama/llama-4-scout-17b-16e-instruct...`);
              const groq = new Groq({ apiKey: apiKeys[i] });
              fallbackStream = await groq.chat.completions.create({
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                stream: true,
                max_tokens: 2048,
                messages: [
                  { role: "system", content: systemPrompt },
                  ...trimmedHistory,
                  { role: "user", content: finalTranscript },
                ],
              });
              stream = fallbackStream;
              actualModelUsed = "Llama-4-Scout (Groq Fallback)";
              console.log(`[/api/answer-vision] ✓ Groq fallback stream created`);
              break;
            } catch (fallbackGroqErr) {
              finalError = fallbackGroqErr;
            }
          }
        }
      }
      if (!stream) throw finalError || new Error("All API keys failed for selected model.");

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Model-Used", actualModelUsed);

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

  // ─── Refine Profile ────────────────────────────────────────
  app.post("/api/refine-profile", async (req, res) => {
    try {
      const { rawText } = req.body;
      if (!rawText || !rawText.trim()) {
        return res.status(400).json({ error: "No text provided" });
      }

      const systemPrompt = `You are an expert resume/profile analyst. The user will paste raw text — likely from a resume, LinkedIn, or a rough self-description.

Your job is to extract and organize this into a clean, structured JSON profile. Be thorough — cover everything.

Return ONLY valid JSON (no markdown, no code fences, no explanation) with this exact structure:

{
  "name": "Full Name",
  "title": "Current Role / Title",
  "summary": "A 2-3 sentence professional summary in first person",
  "experience": [{"role": "Job Title", "company": "Company", "duration": "Jan 2023 - Present", "highlights": ["achievement"]}],
  "projects": [{"name": "Project", "description": "What it does", "tech": ["React"]}],
  "skills": {"languages": [], "frameworks": [], "tools": [], "other": []},
  "education": [{"degree": "B.Tech CS", "institution": "College", "year": "2020-2024"}],
  "certifications": [],
  "achievements": []
}

Rules: Extract EVERYTHING. Return ONLY the JSON object, nothing else.`;

      let response = null;

      // 1. Try DashScope first
      if (dashscopeKey) {
        try {
          console.log(`[/api/refine-profile] Trying DashScope with qwen3-vl-235b-a22b-thinking...`);
          const dashscope = new OpenAI({
            baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
            apiKey: dashscopeKey,
          });
          response = await dashscope.chat.completions.create({
            model: "qwen3-vl-235b-a22b-thinking",
            stream: false,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Parse and structure this:\n\n---\n${rawText}\n---` },
            ],
          });
          console.log(`[/api/refine-profile] ✓ Success with DashScope`);
        } catch (err) {
          console.error(`[/api/refine-profile] ✗ DashScope failed:`, err?.message?.slice(0, 100));
        }
      }

      // 2. Try Groq keys
      if (!response) {
        for (let i = 0; i < apiKeys.length; i++) {
          try {
            const groq = new Groq({ apiKey: apiKeys[i] });
            response = await groq.chat.completions.create({
              model: "qwen3-Coder",
              stream: false,
              max_tokens: 4096,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Parse and structure this:\n\n---\n${rawText}\n---` },
              ],
            });
            console.log(`[/api/refine-profile] ✓ Success with Groq key ${i + 1}`);
            break;
          } catch (err) {
            console.error(`[/api/refine-profile] ✗ Groq key ${i + 1} failed:`, err?.message?.slice(0, 100));
            if (err?.status !== 429) break;
          }
        }
      }

      // 3. Fallback to OpenRouter
      if (!response && openRouterKey) {
        try {
          const openrouter = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: openRouterKey });
          response = await openrouter.chat.completions.create({
            model: "qwen3-coder-480b-a35b-instruct",
            stream: false,
            max_tokens: 4096,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Parse and structure this:\n\n---\n${rawText}\n---` },
            ],
          });
          console.log(`[/api/refine-profile] ✓ Success with OpenRouter`);
        } catch (err) {
          console.error(`[/api/refine-profile] ✗ OpenRouter failed:`, err?.message?.slice(0, 100));
        }
      }

      if (!response) return res.status(500).json({ error: "All API keys failed" });

      let raw = response.choices[0]?.message?.content || "";
      raw = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

      // Strip markdown fences if present
      const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) raw = fenceMatch[1].trim();

      try {
        return res.json({ profile: JSON.parse(raw) });
      } catch {
        const objMatch = raw.match(/\{[\s\S]*\}/);
        if (objMatch) {
          try { return res.json({ profile: JSON.parse(objMatch[0]) }); } catch {}
        }
        return res.status(500).json({ error: "Failed to parse AI response", raw });
      }
    } catch (error) {
      console.error("[/api/refine-profile] Error:", error);
      res.status(500).json({ error: error.message || "Profile refinement failed" });
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