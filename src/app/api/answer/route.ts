import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/utils/supabase/server";

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

export async function POST(req: NextRequest) {
  const { userId } = auth();
  const supabaseAdmin = createAdminClient();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ─── Credit Check (graceful) ──────────────────────────────
    let currentCredits = 999;
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("credits, plan")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[/api/answer] Profile fetch error:", profileError);
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
      transcript,
      jobDescription,
      aboutYou = "",
      responseLength = "small",
      conversationHistory = [],
      selectedModel = "gpt-oss-120b",
    } = await req.json();

    if (!transcript || !jobDescription) {
      return NextResponse.json({ error: "Missing transcript or jobDescription" }, { status: 400 });
    }

    // ─── Plan & Model Gating ──────────────────────────────
    const userPlan = (profile?.plan || "free").toLowerCase();
    const isElite = userPlan === "elite";
    const isPaid = userPlan === "pro" || userPlan === "elite";

    const isTurboModel = selectedModel === "qwen3.6";
    const isProModel = selectedModel !== "llama-3.3-70b";

    if (isTurboModel && !isElite) {
      return NextResponse.json({
        error: "Turbo Engine Locked. Please upgrade to Elite to unlock this hyper-intelligence.",
        code: "UPGRADE_REQUIRED"
      }, { status: 402 });
    }

    if (!isPaid && isProModel) {
      return NextResponse.json({
        error: "Premium Engine Locked. Please upgrade to Pro or Elite to use this engine.",
        code: "UPGRADE_REQUIRED"
      }, { status: 402 });
    }

    // ─── Deduct 1 Credit Upfront ─────────────────────────────
    const { error: deductError } = await supabaseAdmin
      .from("profiles")
      .update({ credits: currentCredits - 1 })
      .eq("id", userId);

    if (deductError) {
      console.error("[/api/answer] Credit deduction failed:", deductError.message);
      // We continue anyway so the user doesn't get blocked by a DB lag, 
      // but in production you might want to handle this strictly.
    }

    const apiKeys = [
      process.env.GROQ_API_KEY,
      process.env.GROQ_API_KEY_2,
      process.env.GROQ_API_KEY_3,
    ].filter(Boolean) as string[];

    const openRouterKey = process.env.OPENROUTER_API_KEY || "";

    if (apiKeys.length === 0 && !openRouterKey) {
      return NextResponse.json({ error: "No API keys configured" }, { status: 500 });
    }

    const lengthInstruction = RESPONSE_PROMPTS[responseLength] || RESPONSE_PROMPTS.balanced;
    const isCoding = responseLength === "coding";

    // ─── Model mapping: key → { provider, groq model ID, openrouter model ID } ─
    const MODEL_MAP: Record<string, { provider: string; groq?: string; openrouter?: string; dashscope?: string }> = {
      "gpt-oss-120b": { provider: "groq", groq: "openai/gpt-oss-120b", openrouter: "openai/gpt-oss-120b" },
      "qwen3-Coder": { provider: "dashscope", dashscope: "qwen3-coder-480b-a35b-instruct" },
      "nemotron-3-120b": { provider: "openrouter", openrouter: "nvidia/nemotron-3-super-120b-a12b:free" },
      "qwen3.6": { provider: "dashscope", dashscope: "qwen3.6-plus" },
      "llama-3.3-70b": { provider: "groq", groq: "llama-3.3-70b-versatile", openrouter: "meta-llama/llama-3.3-70b-instruct" },
    };

    const modelConfig = MODEL_MAP[selectedModel] || MODEL_MAP["gpt-oss-120b"];
    const isDashScope = modelConfig.provider === "dashscope";
    const groqModel = modelConfig.groq || "";
    const openrouterModel = modelConfig.openrouter || "";

    console.log(`[/api/answer] Mode: ${responseLength} | Model: ${selectedModel} | Provider: ${modelConfig.provider} | History: ${conversationHistory.length} messages`);

    const aboutYouBlock = aboutYou
      ? `\n\nHere is the candidate's background — you MUST use this to personalize EVERY answer with their real experience, projects, and skills. Speak as if YOU are this person. NEVER give generic answers when you have specific details from the candidate's background:\n---\n${aboutYou}\n---`
      : "";

    // ─── Separate system prompts for coding vs spoken responses ───
    const systemPrompt = isCoding
      ? `You are an expert programmer helping a candidate during a technical interview.
The candidate is interviewing for this role:

---
${jobDescription}
---
${aboutYouBlock}

You have access to previous questions and answers in the conversation history — use them for context.

${lengthInstruction}`

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
- CRITICAL: In EVERY answer, naturally reference the candidate's real projects, experience, and skills from their background above. NEVER give generic answers. Even for theoretical questions, connect your answer to the candidate's specific experience.
- If the candidate has relevant project experience, mention it by name
- If the candidate has specific tech skills, frame answers using those technologies`;

    // ─── Keep last 20 history messages to maintain profile context ─
    const trimmedHistory = conversationHistory.slice(-20);

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

      // DashScope routing
      if (isDashScope) {
        const modelsToTry = selectedModel === "qwen3.6"
          ? [...QWEN_PRIORITY, ...QWEN_FALLBACK]
          : [modelConfig.dashscope!];

        for (const modelId of modelsToTry) {
          try {
            console.log(`[/api/answer] Using DashScope model: ${modelId}`);
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
                { role: "user", content: transcript },
              ],
            });
            actualModelUsed = modelId;
            console.log(`[/api/answer] ✓ DashScope stream created with ${modelId}`);
            break;
          } catch (error: any) {
            lastError = error;
            console.error(`[/api/answer] ✗ DashScope model ${modelId} failed:`, error?.message?.slice(0, 100));
            // Try next model if this one hits a limit or fails
            continue;
          }
        }
        if (stream) break;
        // If all Qwen models fail, don't fall back to Groq immediately if it's explicitly a DashScope request
        // But the original code had 'break' here, so I'll keep it.
        break;
      }

      if (modelConfig.provider === "openrouter") {
        console.log(`[/api/answer] Explicitly using OpenRouter for ${selectedModel}`);
        break; // Exit retry loop and go straight to OpenRouter
      } else {
        for (let i = 0; i < apiKeys.length; i++) {
          const apiKey = apiKeys[i];
          try {
            console.log(`[/api/answer] Trying key ${i + 1}/${apiKeys.length} (attempt ${attempt + 1}) (ending: ...${apiKey.slice(-4)})`);
            const groq = new Groq({ apiKey });
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
            break; // Success, exit key loop
          } catch (error: any) {
            lastError = error;
            console.error(`[/api/answer] ✗ Key ${i + 1} failed — status: ${error?.status}, message: ${error?.message?.slice(0, 100)}`);
            if (error?.status === 429) {
              console.warn(`[/api/answer] Rate limit on key ${i + 1}, trying next...`);
            } else {
              console.warn(`[/api/answer] Key ${i + 1} failed (Status: ${error?.status}), trying next...`);
            }
            continue; // Ensure we try every available key before giving up
          }
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
        } catch (orErr: any) {
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
            } catch (fallbackGroqErr: any) {
              lastError = fallbackGroqErr;
            }
          }
        }
      }
    }

    if (!stream) {
      throw lastError;
    }

    // ─── Deduct Credit (1 credit for voice/text) ──────────────
    if (profile) {
      await supabaseAdmin
        .from("profiles")
        .update({ credits: currentCredits - 1 })
        .eq("id", userId);
    }

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

            // Entering <think> block — stop writing to client
            if (buffer.includes("<think>")) {
              insideThinkTag = true;
              buffer = buffer.split("<think>").pop() ?? "";
              continue;
            }

            // Exiting </think> block — resume writing after the closing tag
            if (insideThinkTag && buffer.includes("</think>")) {
              insideThinkTag = false;
              const afterThink = buffer.split("</think>").pop() ?? "";
              buffer = afterThink;
              if (afterThink) controller.enqueue(encoder.encode(afterThink));
              continue;
            }

            // Inside think block — skip silently
            if (insideThinkTag) continue;

            // Normal content — send to client
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
    console.error("[/api/answer] Error:", error);
    const userFriendlyMessage = "Please try again in a moment.";
    return NextResponse.json({ error: userFriendlyMessage }, { status: 500 });
  }
}