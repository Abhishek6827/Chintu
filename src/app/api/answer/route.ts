import { NextRequest } from "next/server";
import groq from "@/lib/groq";

export const runtime = "nodejs";

const RESPONSE_PROMPTS: Record<string, string> = {
  concise: `Keep your answer very brief — 2-4 bullet points or 3-4 sentences max. No fluff. Get straight to the core answer.`,
  balanced: `Keep your answer well-structured and moderate in length — around 150-200 words. Use bullet points when helpful. Balance depth with brevity.`,
  detailed: `Give a thorough, comprehensive answer with examples, explanations, and context. Use structured formatting with headers and bullet points. Aim for 300-500 words to cover the topic in depth.`,
};

export async function POST(req: NextRequest) {
  try {
    const { transcript, jobDescription, responseLength = "balanced" } = await req.json();

    if (!transcript || !jobDescription) {
      return new Response(
        JSON.stringify({ error: "Missing transcript or jobDescription" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const lengthInstruction = RESPONSE_PROMPTS[responseLength] || RESPONSE_PROMPTS.balanced;

    console.log(
      `[/api/answer] Mode: ${responseLength} | Question: "${transcript.slice(0, 80)}..."`
    );

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

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          console.error("[/api/answer] Stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error("[/api/answer] Error:", error);
    const message =
      error instanceof Error ? error.message : "Answer generation failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
