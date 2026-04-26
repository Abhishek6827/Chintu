import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const apiKeys = [
      process.env.GROQ_API_KEY,
      process.env.GROQ_API_KEY_2,
      process.env.GROQ_API_KEY_3,
    ].filter(Boolean) as string[];

    const openRouterKey = process.env.OPENROUTER_API_KEY || "";
    const dashscopeKey = process.env.DASHSCOPE_API_KEY || "";

    if (apiKeys.length === 0 && !openRouterKey && !dashscopeKey) {
      return NextResponse.json({ error: "No API keys configured" }, { status: 500 });
    }

    const { rawText } = await req.json();

    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const systemPrompt = `You are an expert resume/profile analyst. The user will paste raw text — likely from a resume, LinkedIn, or a rough self-description.

Your job is to extract and organize this into a clean, structured JSON profile. Be thorough — cover everything.

Return ONLY valid JSON (no markdown, no code fences, no explanation) with this exact structure:

{
  "name": "Full Name",
  "title": "Current Role / Title (e.g. 'Full Stack Developer')",
  "summary": "A 2-3 sentence professional summary written in first person ('I am...') that captures their essence",
  "experience": [
    {
      "role": "Job Title",
      "company": "Company Name",
      "duration": "e.g. Jan 2023 - Present",
      "highlights": ["Key achievement 1", "Key achievement 2"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "What it does, tech used, your role",
      "tech": ["React", "Node.js", "etc"]
    }
  ],
  "skills": {
    "languages": ["Python", "JavaScript", "etc"],
    "frameworks": ["React", "Next.js", "etc"],
    "tools": ["Git", "Docker", "etc"],
    "other": ["Communication", "Leadership", "etc"]
  },
  "education": [
    {
      "degree": "B.Tech Computer Science",
      "institution": "College/University Name",
      "year": "2020-2024"
    }
  ],
  "certifications": ["Cert 1", "Cert 2"],
  "achievements": ["Hackathon winner", "Open source contributor", "etc"]
}

Rules:
- Extract EVERYTHING from the raw text — don't skip anything
- If a field has no data, use an empty array [] or empty string ""
- Write the summary in first person as if the candidate is introducing themselves
- Keep highlights concise but impactful
- For projects, always try to extract the tech stack
- Be smart about parsing — the text might be messy or copy-pasted
- Return ONLY the JSON object, nothing else`;

    const userMessage = `Here is the raw text from the user. Parse and structure it:\n\n---\n${rawText}\n---`;

    let response: any;
    let success = false;

    // Try DashScope first (using qwen-max for best performance as requested)
    if (dashscopeKey) {
      try {
        console.log(`[/api/refine-profile] Trying DashScope with qwen3-vl-235b-a22b-thinking...`);
        const dashscope = new OpenAI({
          baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
          apiKey: dashscopeKey,
        });
        response = await dashscope.chat.completions.create({
          model: "qwen3-vl-235b-a22b-thinking", // qwen-max is the most advanced model available on DashScope
          stream: false,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        });
        success = true;
        console.log(`[/api/refine-profile] ✓ Success with DashScope`);
      } catch (err: any) {
        console.error(`[/api/refine-profile] ✗ DashScope failed:`, err?.message?.slice(0, 100));
      }
    }

    // Try Groq fallback
    if (!success) {
      for (let i = 0; i < apiKeys.length; i++) {
        try {
          console.log(`[/api/refine-profile] Trying Groq key ${i + 1} with qwen/qwen3-32b...`);
          const groq = new Groq({ apiKey: apiKeys[i] });
          response = await groq.chat.completions.create({
            model: "qwen/qwen3-32b",
            stream: false,
            max_tokens: 4096,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
          });
          success = true;
          console.log(`[/api/refine-profile] ✓ Success with Groq key ${i + 1}`);
          break;
        } catch (err: any) {
          console.error(`[/api/refine-profile] ✗ Groq key ${i + 1} failed:`, err?.message?.slice(0, 100));
          if (err?.status !== 429) break; // Only retry on rate limit
        }
      }
    }

    // Fallback to OpenRouter
    if (!success && openRouterKey) {
      try {
        console.log(`[/api/refine-profile] Trying OpenRouter with qwen/qwen3-32b...`);
        const openrouter = new OpenAI({
          baseURL: "https://openrouter.ai/api/v1",
          apiKey: openRouterKey,
        });
        response = await openrouter.chat.completions.create({
          model: "qwen/qwen3-32b",
          stream: false,
          max_tokens: 4096,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        });
        success = true;
        console.log(`[/api/refine-profile] ✓ Success with OpenRouter`);
      } catch (err: any) {
        console.error(`[/api/refine-profile] ✗ OpenRouter failed:`, err?.message?.slice(0, 100));
      }
    }

    if (!success || !response) {
      return NextResponse.json({ error: "All API keys failed" }, { status: 500 });
    }

    let rawContent = response.choices[0]?.message?.content || "";

    // Strip <think>...</think> tags (Qwen3/DeepSeek thinking)
    rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // Try to extract JSON from response (handle markdown code fences)
    let jsonStr = rawContent;
    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    // Try to parse
    try {
      const profile = JSON.parse(jsonStr);
      return NextResponse.json({ profile });
    } catch {
      // Try to find JSON object in the response
      const objectMatch = rawContent.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          const profile = JSON.parse(objectMatch[0]);
          return NextResponse.json({ profile });
        } catch {
          return NextResponse.json({ error: "Failed to parse AI response", raw: rawContent }, { status: 500 });
        }
      }
      return NextResponse.json({ error: "Failed to parse AI response", raw: rawContent }, { status: 500 });
    }
  } catch (error) {
    console.error("[/api/refine-profile] Error:", error);
    const message = error instanceof Error ? error.message : "Profile refinement failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
