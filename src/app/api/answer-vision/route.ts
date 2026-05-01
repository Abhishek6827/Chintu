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
  small: `Keep your answer very brief — about 3 to 4 short sentences. 

NEVER use contractions or short forms. Write every word in full:
- I would (not I'd), I have (not I've), I am (not I'm)
- do not (not don't), cannot (not can't), it is (not it's)
- that is (not that's), they are (not they're), will not (not won't)

Speak naturally and conversationally, as if you are thinking through the answer on your feet. 
Start with a natural opener like "So the way I think about this is..." or "As we know..." or "To put it simply..."
If a coding question is asked, use JavaScript as the default language.
Do NOT use bullet points, headers, or lists. 
Make it sound like a genuine spoken response — not a definition from a textbook.`,


  balanced: `Keep your answer moderate in length — around 2 to 3 paragraphs.

NEVER use contractions or short forms. Write every word in full:
- I would (not I'd), I have (not I've), I am (not I'm)
- do not (not don't), cannot (not can't), it is (not it's)
- that is (not that's), they are (not they're), will not (not won't)

Use a natural, conversational tone throughout. Weave in phrases like:
- "As we know..." / "The thing about this is..." / "What this really means is..."
- "To put it simply..." / "That being said..." / "The way I see it..."
- "Now, what is interesting here is..." / "And this is where it gets important..."

Begin with a natural opener — do not dive straight into facts. 
Use smooth transitions between ideas so it flows like actual speech, not a written essay.
If a coding question is asked, use JavaScript as the default language.
Do NOT use bullet points, headers, or any formatting. 
It must sound like a human speaking in an interview — thoughtful, confident, and natural.`,


  detailed: `Determine the context first — are you looking at screenshot(s) or answering a spoken question?

─── If responding to SCREENSHOT(S) ───
Give a complete, structured, and thorough response. You MAY use:
- Headers to separate sections (for example: **Overview**, **Step 1**, **Step 2**)
- Numbered steps for sequential tasks
- Code blocks where relevant

Keep code changes minimal. Do not add unnecessary information or extra code unless asked. 
Do not change the names of any given functions or variables. 
Only correct the code, and add a single comment line explaining what was changed or what the mistake was. 
Do not change the whole logic or code structure unless it is required.
- Brief bullet points for lists of options or findings

If multiple screenshots are given:
- First, briefly describe what each screenshot shows (1 line each)
- Then synthesize: what is the overall task or problem across all of them?
- Then give the full answer, referencing specific screenshots where needed
  (for example: "In the first screenshot, the issue is... while the second shows...")
- Do NOT treat each screenshot in isolation — connect them into one coherent answer
- If screenshots show different parts of the same file or flow, combine them mentally

─── If responding to a SPOKEN question ───

NEVER use contractions or short forms. Write every word in full:
- I would (not I'd), I have (not I've), I am (not I'm)
- do not (not don't), cannot (not can't), it is (not it's)
- that is (not that's), they are (not they're), will not (not won't)

Give a thorough but conversational answer across 4 to 5 paragraphs. 
Tell a cohesive story with natural phrasing — not a list of facts stitched together.

Weave in phrases like:
- "As we know..." / "Now, the interesting part here is..."
- "The way I think about it is..." / "To put it simply..."
- "That being said..." / "And this is where things get important..."
- "What this really comes down to is..." / "So in practice, what this means is..."

Begin with a natural opener that sets the stage. 
Use smooth transitions between paragraphs so one idea flows into the next naturally.
If a coding question is asked, use JavaScript as the default language.
Do NOT use bullet points, headers, or numbered lists.
Sound like someone who genuinely understands the topic and is explaining it confidently to an interviewer — not reading from documentation.`,


  coding: `Act as an expert programmer helping me in a technical interview. 
If a coding question is asked and no specific language is mentioned, use JavaScript as the default language. 
Instead of giving a long summary, add comments on the exact lines where the code was fixed, with a short explanation of the mistake. 
This helps understand the issue quickly and explain it better to the interviewer.

NEVER use contractions or short forms anywhere in explanations. Write every word in full:
- I would (not I'd), I have (not I've), I am (not I'm)
- do not (not don't), cannot (not can't), it is (not it's)

FIRST — detect the intent from the problem or question:

1. "Find the bug / What is wrong / Error in this code" → DEBUG mode
2. "Solve / Write / Implement this" → SOLVE mode
3. "Optimize / Improve this" → OPTIMIZE mode
4. "Is this correct / Review this / Any improvements / Is this right?" → DEBUG mode
   (Treat as DEBUG — read the code deeply, find ALL bugs. If no bugs exist, say "No bugs found" and briefly explain why the code is correct.)

---

If DEBUG mode:
Actually read and analyze the code deeply. Do NOT give generic advice.
Find the EXACT line(s) causing the bug — including BOTH runtime errors AND compile-time errors.

Also check for these TypeScript-specific mistakes:
- ReturnType<Fn> instead of ReturnType<typeof Fn>
- Wrong or missing type assertions
- Accessing properties on possibly undefined types
- Missing ! on non-null assertions
- MISSING return statements — a function that returns nothing is a bug
- MISSING required constructor arguments — empty config objects are a bug
These are SILENT bugs — TypeScript will not compile, but they are easy to miss.

ALWAYS check for MISSING code — what the code is supposed to do versus what it actually does.
NEVER flag unused imports or variables as bugs unless they cause an error.
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
// On EVERY line changed: // ← FIXED: [what and why]
// On EVERY line added:   // ← ADDED: [what this does]
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
  — if a bug was found, state it directly; if no bug exists, say "No bugs found"
- NEVER add analysis or suggestions after the Root Cause section — stop there
- If no bugs found: say "No bugs found" with 1 line explanation
---

If SOLVE mode:
**Approach:** [1 to 2 lines — algorithm or pattern and why]

\`\`\`language
// Clean, well-commented optimal solution
// On any non-obvious line, add: // ← [brief explanation]
\`\`\`

**Edge Cases:** [key edge cases handled]

**Complexity:** Time: O(?) | Space: O(?)

---

If OPTIMIZE mode:
**Issue with current approach:** [what is inefficient and why]

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

// ─── Check if model is a Qwen 3.6 variant ─────────────────
function isQwenNativeVision(model: string): boolean {
  return model === "qwen3.6" || model === "qwen3.6-plus";
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const supabaseAdmin = createAdminClient();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ─── Credit Check (graceful — don't block if profile missing) ──
    let currentCredits = 999; // default: allow if no profile found
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("credits, plan")
      .eq("id", userId)
      .maybeSingle(); // ← maybeSingle instead of single — no error if 0 rows

    if (profileError) {
      console.error("[/api/answer-vision] Profile fetch error:", profileError);
      // Continue anyway — don't block the user
    } else if (profile) {
      currentCredits = profile.credits;
    }

    if (currentCredits <= 0) {
      return NextResponse.json({
        error: "Insufficient credits. Please upgrade your plan.",
        code: "OUT_OF_CREDITS"
      }, { status: 403 });
    }

    const {
      images,
      jobDescription,
      aboutYou = "",
      responseLength = "coding",
      additionalContext = "",
      conversationHistory = [],
      selectedModel = "gpt-oss-120b",
    } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    if (!jobDescription) {
      return NextResponse.json({ error: "Missing jobDescription" }, { status: 400 });
    }

    // ─── Plan & Feature Gating ──────────────────────────────
    const userPlan = (profile?.plan || "free").toLowerCase();
    const isElite = userPlan === "elite";
    const isPaid = userPlan === "pro" || userPlan === "elite";

    const isTurboModel = selectedModel === "qwen3.6";
    const isProModel = selectedModel !== "llama-3.3-70b";
    const isProMode = responseLength === "coding" || responseLength === "detailed";

    if (isTurboModel && !isElite) {
      return NextResponse.json({
        error: "Turbo Engine Locked. Please upgrade to Elite to unlock hyper-vision intelligence.",
        code: "UPGRADE_REQUIRED"
      }, { status: 402 });
    }

    if (!isPaid && (isProModel || isProMode)) {
      const reason = isProModel ? "Premium Engine" : "Advanced Mode";
      return NextResponse.json({
        error: `${reason} Locked. Please upgrade to Pro or Elite to unlock this feature.`,
        code: "UPGRADE_REQUIRED"
      }, { status: 402 });
    }

    const apiKeys = [
      process.env.GROQ_API_KEY,
      process.env.GROQ_API_KEY_2,
      process.env.GROQ_API_KEY_3,
    ].filter(Boolean) as string[];

    const openRouterKey = process.env.OPENROUTER_API_KEY || "";
    const dashscopeKey = process.env.DASHSCOPE_API_KEY || "";

    console.log(`[/api/answer-vision] Groq keys: ${apiKeys.length} | OpenRouter: ${openRouterKey ? "yes" : "no"} | DashScope: ${dashscopeKey ? "yes" : "no"}`);

    if (apiKeys.length === 0 && !openRouterKey && !dashscopeKey) {
      return NextResponse.json({ error: "No API keys configured" }, { status: 500 });
    }

    const lengthInstruction = RESPONSE_PROMPTS[responseLength] || RESPONSE_PROMPTS.coding;
    const isCoding = responseLength === "coding";
    const useQwenNative = isQwenNativeVision(selectedModel);

    console.log(`[/api/answer-vision] Mode: ${responseLength} | Images: ${images.length} | Model: ${selectedModel} | Native Vision: ${useQwenNative}`);

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 10000;

    // ─── Build image content parts ────────────────────────────
    const contentParts: any[] = [];
    for (const img of images) {
      contentParts.push({
        type: "image_url",
        image_url: {
          url: img.startsWith("data:") ? img : `data:image/png;base64,${img}`,
        },
      });
    }

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

    // ====================================================================
    // PATH A: Qwen 3.6 Plus → Native Vision (send images directly to Qwen)
    // ====================================================================
    if (useQwenNative) {
      console.log(`[/api/answer-vision] PATH A: Qwen Native Vision`);

      // Add user context to content parts
      contentParts.push({
        type: "text",
        text: additionalContext
          ? `User question/context: "${additionalContext}". Answer based on what you see in the screenshots.`
          : "Analyze the screenshots and provide your answer.",
      });

      const modelsToTry = [...QWEN_PRIORITY, ...QWEN_FALLBACK];

      for (const modelId of modelsToTry) {
        try {
          console.log(`[/api/answer-vision] Trying Qwen model: ${modelId}`);
          const dashscope = new OpenAI({
            baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
            apiKey: dashscopeKey,
          });
          stream = await dashscope.chat.completions.create({
            model: modelId,
            stream: true,
            max_tokens: 2048,
            messages: [
              { role: "system", content: systemPrompt },
              ...trimmedHistory,
              { role: "user", content: contentParts },
            ],
          });
          actualModelUsed = modelId;
          console.log(`[/api/answer-vision] ✓ Qwen native vision stream created with ${modelId}`);
          break;
        } catch (err: any) {
          finalError = err;
          console.error(`[/api/answer-vision] ✗ Qwen model ${modelId} failed:`, err?.message?.slice(0, 100));
          continue;
        }
      }

      // If all Qwen models fail, fall back to Scout extraction + any available model
      if (!stream) {
        console.log(`[/api/answer-vision] All Qwen native models failed. Falling back to Scout extraction...`);
        // Fall through to Path B logic below
      }
    }

    // ====================================================================
    // PATH B: Non-Qwen model → Scout extracts text → Selected model answers
    // Also serves as fallback if Path A (Qwen native) failed
    // ====================================================================
    if (!stream) {
      console.log(`[/api/answer-vision] PATH B: Scout extraction → Selected model answer`);

      // ─── STEP 1: Extract text from images using Scout ───────
      const visionModel = "meta-llama/llama-4-scout-17b-16e-instruct";
      const visionPrompt = "Extract all text, code, and UI elements from these screenshots accurately. Transcribe everything you see. Do not solve the problem or provide answers.";

      const extractionParts = [...contentParts]; // clone
      extractionParts.push({
        type: "text",
        text: additionalContext
          ? `User added context: "${additionalContext}". Please include this in your extraction.`
          : "Transcribe the screenshot.",
      });

      let extractedText = "";
      let visionSuccess = false;

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
                { role: "user", content: extractionParts },
              ],
            });
            extractedText = response.choices[0]?.message?.content || "";
            visionSuccess = true;
            break;
          } catch (err) {
            finalError = err;
          }
        }
        if (visionSuccess) break;
      }

      // Scout extraction via OpenRouter fallback
      if (!visionSuccess && openRouterKey) {
        console.log(`[/api/answer-vision] Groq Scout failed. Trying OpenRouter...`);
        try {
          const openrouter = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: openRouterKey,
          });
          const response = await openrouter.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            stream: false,
            max_tokens: 2048,
            messages: [
              { role: "system", content: visionPrompt },
              { role: "user", content: extractionParts },
            ],
          });
          extractedText = response.choices[0]?.message?.content || "";
          visionSuccess = true;
        } catch (err) {
          finalError = err;
        }
      }

      if (!visionSuccess) {
        throw new Error("Vision extraction failed: " + (finalError?.message || "Unknown error"));
      }

      console.log(`[/api/answer-vision] ✓ Step 1 Complete. Extracted ${extractedText.length} characters.`);

      // ─── STEP 2: Send extracted text to the selected model ──
      const finalTranscript = `[Screenshot Transcription]:\n${extractedText}\n\n[User Context]: ${additionalContext || "None"}`;

      const MODEL_MAP: Record<string, { provider: string; groq?: string; openrouter?: string; dashscope?: string }> = {
        "gpt-oss-120b": { provider: "groq", groq: "openai/gpt-oss-120b", openrouter: "openai/gpt-oss-120b" },
        "qwen3-Coder": { provider: "dashscope", dashscope: "qwen3-coder-480b-a35b-instruct" },
        "nemotron-3-120b": { provider: "openrouter", openrouter: "nvidia/nemotron-3-super-120b-a12b:free" },
        "llama-3.3-70b": { provider: "groq", groq: "llama-3.3-70b-versatile", openrouter: "meta-llama/llama-3.3-70b-instruct" },
        // Qwen falls here only if native vision failed (Path A fallback)
        "qwen3.6": { provider: "dashscope", dashscope: "qwen3.6-plus" },
        "qwen3.6-plus": { provider: "dashscope", dashscope: "qwen3.6-plus" },
      };

      const modelConfig = MODEL_MAP[selectedModel] || MODEL_MAP["gpt-oss-120b"];
      const isDashScope = modelConfig.provider === "dashscope";
      const groqModel = modelConfig.groq || "";
      const openrouterModel = modelConfig.openrouter || "";

      // Try selected model
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, RETRY_DELAY_MS));

        if (isDashScope && dashscopeKey) {
          const modelsToTry = isQwenNativeVision(selectedModel)
            ? [...QWEN_PRIORITY, ...QWEN_FALLBACK]
            : [modelConfig.dashscope!];

          for (const modelId of modelsToTry) {
            try {
              console.log(`[/api/answer-vision] Step 2: Using DashScope model: ${modelId}`);
              const dashscope = new OpenAI({
                baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
                apiKey: dashscopeKey,
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
        }

        if (modelConfig.provider === "openrouter" && openRouterKey) {
          try {
            console.log(`[/api/answer-vision] Step 2: Using OpenRouter with ${openrouterModel}`);
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
            break;
          } catch (err) {
            finalError = err;
          }
        }

        if (groqModel) {
          for (let i = 0; i < apiKeys.length; i++) {
            try {
              console.log(`[/api/answer-vision] Step 2: Trying Groq key ${i + 1} with ${groqModel}...`);
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

      // ─── FALLBACK: If selected model failed, Scout answers directly ──
      if (!stream) {
        console.log(`[/api/answer-vision] Selected model failed. Fallback: Scout answering directly...`);
        for (let i = 0; i < apiKeys.length; i++) {
          try {
            console.log(`[/api/answer-vision] Fallback: Trying Groq key ${i + 1} with Scout...`);
            const groq = new Groq({ apiKey: apiKeys[i] });
            stream = await groq.chat.completions.create({
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              stream: true,
              max_tokens: 2048,
              messages: [
                { role: "system", content: systemPrompt },
                ...trimmedHistory,
                { role: "user", content: finalTranscript },
              ],
            });
            actualModelUsed = "Llama-4-Scout (Fallback)";
            console.log(`[/api/answer-vision] ✓ Scout fallback stream created`);
            break;
          } catch (err) {
            finalError = err;
          }
        }
      }
    }

    if (!stream) throw finalError || new Error("All API keys failed for selected model.");

    // ─── Deduct Credit (2 credits for screenshot) ──────────────
    if (profile) {
      await supabaseAdmin
        .from("profiles")
        .update({ credits: currentCredits - 2 })
        .eq("id", userId);
    }

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