import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

// ─── Response length presets ────────────────────────────────
const RESPONSE_PROMPTS: Record<string, string> = {
  concise: `Keep your answer very brief — about 3-4 short sentences. Speak naturally and conversationally, as if you are thinking on your feet. Do NOT use bullet points, headers, or lists. Make it sound like a natural, off-the-cuff spoken response.`,
  balanced: `Keep your answer moderate in length — around 2-3 paragraphs. Use a natural, conversational tone with smooth transitions. Do NOT use bullet points, headers, or any special formatting. It MUST sound like a human speaking aloud in an interview, not reading from a script.`,
  detailed: `Give a thorough but conversational answer. Tell a cohesive story with natural phrasing. Do NOT use bullet points, headers, or numbered lists. Use a natural speaking style that sounds authentic when spoken aloud. Aim for about 4-5 paragraphs.`,
  coding: `Write extremely accurate, efficient, and well-commented code to solve the core problem. Use markdown code blocks. Keep explanation very brief, let the code speak for itself. You are acting as an expert programmer.`,
};

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }

    const { transcript, jobDescription, responseLength = "balanced" } = await req.json();

    if (!transcript || !jobDescription) {
      return NextResponse.json({ error: "Missing transcript or jobDescription" }, { status: 400 });
    }

    const lengthInstruction = RESPONSE_PROMPTS[responseLength] || RESPONSE_PROMPTS.balanced;

    console.log(`[/api/answer] Mode: ${responseLength} | Question: "${transcript.slice(0, 80)}..."`);

    const groq = new Groq({ apiKey });

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

    // Stream the response using a ReadableStream
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
    console.error("[/api/answer] Error:", error);
    const message = error instanceof Error ? error.message : "Answer generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
