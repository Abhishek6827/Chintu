import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

// ─── Response length presets ────────────────────────────────
const RESPONSE_PROMPTS: Record<string, string> = {
  small: `Keep your answer very brief — about 3-4 short sentences. Speak naturally and conversationally, as if you are thinking on your feet. Do NOT use bullet points, headers, or lists. Make it sound like a natural, off-the-cuff spoken response.`,

  balanced: `Keep your answer moderate in length — around 2-3 paragraphs. Use a natural, conversational tone with smooth transitions. Do NOT use bullet points, headers, or any special formatting. It MUST sound like a human speaking aloud in an interview, not reading from a script.`,

  detailed: `Give a thorough but conversational answer. Tell a cohesive story with natural phrasing. Do NOT use bullet points, headers, or numbered lists. Use a natural speaking style that sounds authentic when spoken aloud. Aim for about 4-5 paragraphs.`,

  coding: `You are an expert programmer assisting in a technical interview.

FIRST — detect the intent from the screenshot(s):

1. "Find the bug / What's wrong / Error in this code" → DEBUG mode
2. "Solve / Write / Implement this" → SOLVE mode
3. "Optimize / Improve this" → OPTIMIZE mode

---

If DEBUG mode:
You MUST actually read and analyze the code deeply. Do NOT give generic advice.
Find the EXACT line(s) causing the bug — including BOTH runtime errors AND compile-time errors.

IMPORTANT — Also check for these TypeScript-specific mistakes:
- ReturnType<Fn> instead of ReturnType<typeof Fn>
- Wrong or missing type assertions
- Accessing properties on possibly undefined types
- Missing ! on non-null assertions
These are SILENT bugs — TypeScript won't compile, but they are easy to miss.

**Bugs Found:** [List EVERY bug — both runtime AND compile-time, numbered]
Format: Line [N]: [what is wrong] — [runtime crash / TS compile error / logic error]
Find as many bugs as actually exist — do not stop at one.

**Root Cause per bug:** [1 line each — WHY it breaks]

**Fix:**
\`\`\`language
// On EVERY line you changed: // ← FIXED: [what and why]
// On EVERY line you added:   // ← ADDED: [what this does]
\`\`\`

Rules for DEBUG mode:
- NEVER say "the code looks mostly correct" — call out EVERY bug directly
- NEVER miss TypeScript type-level errors — they are as critical as runtime bugs
- NEVER give generic suggestions unless that IS the actual bug
- If multiple bugs exist, number and fix EACH one separately

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

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }

    const { images, jobDescription, responseLength = "coding", additionalContext = "" } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    if (!jobDescription) {
      return NextResponse.json({ error: "Missing jobDescription" }, { status: 400 });
    }

    const lengthInstruction = RESPONSE_PROMPTS[responseLength] || RESPONSE_PROMPTS.coding;
    const isCoding = responseLength === "coding";

    console.log(`[/api/answer-vision] Mode: ${responseLength} | Images: ${images.length}`);

    // ─── NOTE: Vision route always uses llama-4-scout ─────────
    // DeepSeek R1 does not support image inputs.
    // llama-4-scout is the best vision-capable model on Groq.
    const model = "meta-llama/llama-4-scout-17b-16e-instruct";

    const groq = new Groq({ apiKey });

    // ─── Build content array with images ──────────────────────
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
        ? `Look at the screenshot(s) carefully. The user says: "${additionalContext}". Based on what you see, provide the answer.`
        : "Look at the screenshot(s) carefully. Read ALL visible text, code, and questions. Then provide a complete answer.",
    });

    // ─── Separate system prompts for coding vs spoken ──────────
    const systemPrompt = isCoding
      ? `You are an expert programmer helping a candidate during a technical interview.
The candidate is interviewing for this role:

---
${jobDescription}
---

The candidate will share screenshot(s) of problems they see on screen.
Read all visible text and code from the screenshots carefully.
If multiple screenshots show the same problem, combine context from all of them.

${lengthInstruction}`

      : `You are generating spoken responses for an interviewee. The candidate is interviewing for:

---
${jobDescription}
---

The candidate will share screenshot(s) of questions they see on screen.
Read the question from the screenshot and write the EXACT words they should speak in response.
Write in the first person ("I"). Sound natural and conversational — never robotic.
NEVER use bullet points, numbered lists, bold text, or headers.
If multiple screenshots show the same question, combine context from all of them.

${lengthInstruction}

Rules:
- Be technically accurate
- Jump straight into the answer
- Avoid overly formal phrasing`;

    const stream = await groq.chat.completions.create({
      model,
      stream: true,
      max_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: contentParts },
      ],
    });

    // ─── Stream response ───────────────────────────────────────
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
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
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[/api/answer-vision] Error:", error);
    const message = error instanceof Error ? error.message : "Vision answer failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}