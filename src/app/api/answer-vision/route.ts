import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/utils/supabase/server";

// ─── Increase body size limit for large screenshot payloads ─
export const maxDuration = 60; // seconds
export const dynamic = "force-dynamic";

// Next.js App Router: increase body size from 1MB default to 50MB
export const fetchCache = "force-no-store";


// ─── Response length presets ────────────────────────────────
const RESPONSE_PROMPTS: Record<string, string> = {
  small: `Keep your answer very brief — about 3-4 short sentences. Speak naturally and conversationally, as if you are thinking on your feet. If a coding question is asked, use JavaScript as the default language. Do NOT use bullet points, headers, or lists. Make it sound like a natural, off-the-cuff spoken response.`,

  balanced: `Keep your answer moderate in length — around 2-3 paragraphs. Use a natural, conversational tone with smooth transitions. If a coding question is asked, use JavaScript as the default language. Do NOT use bullet points, headers, or any special formatting. It MUST sound like a human speaking aloud in an interview, not reading from a script.`,

  detailed: `Determine the context first — are you looking at screenshot(s) or answering a spoken question? If a coding question is asked, use JavaScript as the default language.

─── If responding to SCREENSHOT(S) ───
Give a complete, structured, and thorough response. You MAY use:
- Headers to separate sections (e.g. **Overview**, **Step 1**, **Step 2**)
- Numbered steps for sequential tasks
- Code blocks where relevant
- Please keep the code changes minimal. Do not add unnecessary information or extra code unless I ask. Do not change the names of any given functions or variables. Only correct the code, and add a single comment line explaining what was changed or what the mistake was. Do not change the whole logic or code structure unless it is required
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
If a coding question is asked, use JavaScript as the default language.
Do NOT use bullet points, headers, or numbered lists.
Use a natural speaking style that sounds authentic when spoken aloud.
Aim for about 4-5 paragraphs.`,

  coding: `You are an expert programmer assisting in a technical interview. If a coding question is asked and no specific language is mentioned, use JavaScript as the default language.

FIRST — detect the intent from the screenshot(s):

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
- Detect language from the code visible in screenshot — default to JavaScript if unclear
- ALWAYS put language name after triple backticks
- Prioritize optimal solution over brute force
- Be precise — no unnecessary explanation`,
};

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

export async function POST(req: NextRequest) {
  const { userId } = auth();
  const supabaseAdmin = createAdminClient();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ─── Credit Check ─────────────────────────────────────────
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("[/api/answer-vision] Profile fetch error:", profileError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.credits <= 0) {
      return NextResponse.json({ 
        error: "Insufficient credits. Please upgrade your plan.",
        code: "OUT_OF_CREDITS"
      }, { status: 403 });
    }
    const apiKeys = [
      process.env.GROQ_API_KEY,
      process.env.GROQ_API_KEY_2,
      process.env.GROQ_API_KEY_3,
    ].filter(Boolean) as string[];

    const openRouterKey = process.env.OPENROUTER_API_KEY || "";

    console.log(`[/api/answer-vision] Groq keys: ${apiKeys.length} | OpenRouter: ${openRouterKey ? "yes" : "no"}`);

    if (apiKeys.length === 0 && !openRouterKey) {
      return NextResponse.json({ error: "No API keys configured" }, { status: 500 });
    }

    const {
      images,
      jobDescription,
      aboutYou = "",
      responseLength = "coding",
      additionalContext = "",
      conversationHistory = [],   // ← NEW: previous messages for context
      selectedModel = "gpt-oss-120b",
    } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    if (!jobDescription) {
      return NextResponse.json({ error: "Missing jobDescription" }, { status: 400 });
    }

    const lengthInstruction = RESPONSE_PROMPTS[responseLength] || RESPONSE_PROMPTS.coding;
    const isCoding = responseLength === "coding";

    console.log(`[/api/answer-vision] Mode: ${responseLength} | Images: ${images.length} | Model: ${selectedModel}`);

    // ====================================================================
    // STEP 1: Extract Text from Image using Vision Model (llama-4-scout)
    // ====================================================================
    const visionModel = "meta-llama/llama-4-scout-17b-16e-instruct";
    const visionPrompt = "Extract all text, code, and UI elements from these screenshots accurately. Transcribe everything you see. Do not solve the problem or provide answers.";

    const contentParts: any[] = [];
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
    let lastError: any;

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

    // ====================================================================
    // STEP 2: Generate Final Answer using Selected Model
    // ====================================================================
    const MODEL_MAP: Record<string, { provider: string; groq?: string; openrouter?: string; dashscope?: string }> = {
      "gpt-oss-120b": { provider: "groq", groq: "openai/gpt-oss-120b", openrouter: "openai/gpt-oss-120b" },
      "qwen3-Coder": { provider: "dashscope", dashscope: "qwen3-coder-480b-a35b-instruct" },
      "nemotron-3-120b": { provider: "openrouter", openrouter: "nvidia/nemotron-3-super-120b-a12b:free" },
      "qwen3.6": { provider: "dashscope", dashscope: "qwen3.6-plus" },
      "qwen3.6-plus": { provider: "dashscope", dashscope: "qwen3.6-plus" },
      "llama-3.3-70b": { provider: "groq", groq: "llama-3.3-70b-versatile", openrouter: "meta-llama/llama-3.3-70b-instruct" },
    };

    const modelConfig = MODEL_MAP[selectedModel] || MODEL_MAP["gpt-oss-120b"];
    const isDashScope = modelConfig.provider === "dashscope";
    const groqModel = modelConfig.groq || "";
    const openrouterModel = modelConfig.openrouter || "";

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

    const sanitizedHistory = conversationHistory.map((msg: any) => {
      if (Array.isArray(msg.content)) {
        const textParts = msg.content.filter((part: any) => part.type === "text").map((part: any) => part.text).join("\n");
        return { ...msg, content: "[User sent screenshots]\n" + textParts };
      }
      return msg;
    });
    const trimmedHistory = sanitizedHistory.slice(-10);

    let actualModelUsed = selectedModel;
    let stream: any;
    let finalError: any;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, RETRY_DELAY_MS));

      // DashScope routing for vision Step 2
      if (isDashScope) {
        const modelsToTry = (selectedModel === "qwen3.6" || selectedModel === "qwen3.6-plus")
          ? [...QWEN_PRIORITY, ...QWEN_FALLBACK]
          : [modelConfig.dashscope!];

        for (const modelId of modelsToTry) {
          try {
            console.log(`[/api/answer-vision] Step 2: Using DashScope model: ${modelId}`);
            const dashscope = new OpenAI({
              baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
              apiKey: process.env.DASHSCOPE_API_KEY || "",
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
          } catch (err: any) {
            finalError = err;
            console.error(`[/api/answer-vision] ✗ DashScope model ${modelId} failed:`, err?.message?.slice(0, 100));
            continue;
          }
        }
        if (stream) break;
        break;
      }

      if (modelConfig.provider === "openrouter") {
        console.log(`[/api/answer-vision] Explicitly using OpenRouter for ${selectedModel}`);
        break;
      } else {
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
        console.log(`[/api/answer-vision] ✓ OpenRouter stream created`);
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

    // ─── Deduct Credit ────────────────────────────────────────
    await supabaseAdmin
      .from("profiles")
      .update({ credits: profile.credits - 1 })
      .eq("id", userId);

    // ─── Stream with <think> tag filter ───────────────────────
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
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
              if (afterThink) controller.enqueue(encoder.encode(afterThink));
              continue;
            }

            if (insideThinkTag) continue;

            controller.enqueue(encoder.encode(text));
            buffer = "";
          }

          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Model-Used": actualModelUsed,
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[/api/answer-vision] Error:", error);
    const userFriendlyMessage = "All vision models are busy. Please try again in a moment.";
    return NextResponse.json({ error: userFriendlyMessage }, { status: 500 });
  }
}