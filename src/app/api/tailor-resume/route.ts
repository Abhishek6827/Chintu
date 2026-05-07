import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKeys = [
      process.env.GROQ_API_KEY,
      process.env.GROQ_API_KEY_2,
      process.env.GROQ_API_KEY_3,
    ].filter(Boolean) as string[];

    const dashscopeKey = process.env.DASHSCOPE_API_KEY || "";

    if (apiKeys.length === 0 && !dashscopeKey) {
      return NextResponse.json({ error: "No API keys configured" }, { status: 500 });
    }

    const { resumeText, jdText } = await req.json();

    if (!resumeText || !jdText) {
      return NextResponse.json({ error: "Missing resume or job description" }, { status: 400 });
    }

    // ─── Credit Check ─────────────────────────────────────
    const { createAdminClient } = await import("@/utils/supabase/server");
    const { clerkClient } = await import("@clerk/nextjs/server");
    const supabase = createAdminClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("credits, email")
      .eq("id", userId)
      .single();

    if (!profile || (profile.credits || 0) <= 0) {
      return NextResponse.json({ error: "Insufficient credits. Please upgrade your plan." }, { status: 403 });
    }

    const systemPrompt = `You are an elite career coach and resume strategist. 
Your task is to take a user's resume and a job description (JD), and tailor the resume to perfectly match the JD while maintaining 100% honesty.

Optimizations:
1. Keyword Alignment: Incorporate key terms from the JD naturally into the experience and skills.
2. Impactful Highlights: Rewrite bullet points to focus on outcomes and metrics (STAR method).
3. Summary: Craft a compelling 2-3 sentence summary that highlights why the candidate is the perfect fit for THIS specific role.
4. Skills: Re-categorize and prioritize skills that are most relevant to the JD.
5. Relevancy Filtering: EXCLUDE experience, projects, or skills that are completely irrelevant to the target role.
6. Project Limit: Include ONLY the top 2-3 most relevant projects, but provide more detailed descriptions and multiple bullet points for each to showcase impact.
7. ATS Scoring: Calculate a simulated ATS compatibility score (0-100) based on keyword match and formatting, and provide 3-4 actionable feedback points.

Return ONLY valid JSON with this exact structure:
{
  "name": "Full Name",
  "title": "Optimized Role Title",
  "atsScore": 85,
  "atsFeedback": ["Include more metrics", "Add specific framework versions"],
  "contact": {
    "email": "email@example.com",
    "phone": "+1234567890",
    "linkedin": "linkedin.com/in/username",
    "github": "github.com/username"
  },
  "summary": "Tailored summary",
  "experience": [
    {
      "role": "Job Title",
      "company": "Company",
      "duration": "Duration",
      "highlights": ["Optimized bullet point 1", "Optimized bullet point 2"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Tailored description",
      "tech": ["Tech 1", "Tech 2"]
    }
  ],
  "skills": {
    "languages": [],
    "frameworks": [],
    "tools": [],
    "other": []
  },
  "education": [
    {
      "degree": "Degree",
      "institution": "Institution",
      "year": "Year"
    }
  ],
  "certifications": [],
  "achievements": []
}

Rules:
- Do not invent experience. Only rephrase and prioritize existing info.
- Maintain the original tone but make it more professional and data-driven.
- Return ONLY the JSON object. No prose, no markdown fences.
`;

    const userMessage = `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jdText}`;

    let response: any;
    let success = false;

    if (dashscopeKey) {
      try {
        const dashscope = new OpenAI({
          baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
          apiKey: dashscopeKey,
        });
        response = await dashscope.chat.completions.create({
          model: "qwen-max",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        });
        success = true;
      } catch (err) {
        console.error("Tailor Resume API: DashScope failed", err);
      }
    }

    if (!success) {
      for (const key of apiKeys) {
        try {
          const groq = new Groq({ apiKey: key });
          response = await groq.chat.completions.create({
            model: "gpt-oss-120b",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
          });
          success = true;
          break;
        } catch (err) {
          console.error("Tailor Resume API: Groq key failed", err);
        }
      }
    }

    if (!success || !response) {
      return NextResponse.json({ error: "Tailoring failed" }, { status: 500 });
    }

    let rawContent = response.choices[0]?.message?.content || "";
    rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // Extract JSON if wrapped in markdown
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const tailoredProfile = JSON.parse(jsonMatch[0]);

        // ─── Deduct Credit & Save Profile ───────────────────
        try {
          const userObj = await (await clerkClient()).users.getUser(userId);
          const email = userObj.emailAddresses[0]?.emailAddress;

          const newHistoryEntry = {
            type: "deduction",
            amount: 1,
            description: `Resume Builder (AI Tailoring): ${tailoredProfile.title}`,
            timestamp: new Date().toISOString()
          };

          const existingHistory = (profile.profile_data as any)?.credit_history || [];

          await supabase.from("profiles").upsert({
            id: userId,
            email: email,
            credits: (profile.credits || 1) - 1,
            profile_data: {
              ...(profile.profile_data as any || {}),
              profile_data: tailoredProfile,
              credit_history: [newHistoryEntry, ...existingHistory].slice(0, 50)
            },
            updated_at: new Date().toISOString()
          }, { onConflict: 'email' });
        } catch (dbErr) {
          console.error("Failed to update credits/profile in Supabase", dbErr);
        }

        return NextResponse.json({ profile: tailoredProfile });
      } catch {
        return NextResponse.json({ error: "Invalid AI response format", raw: rawContent }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Failed to generate tailored resume" }, { status: 500 });

  } catch (error: any) {
    console.error("Tailor Resume API Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
