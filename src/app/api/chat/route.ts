import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import OpenAI from 'openai';

// Multiple API keys for rotation
function getGroqKeys(): string[] {
  const keys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5,
  ].filter(Boolean) as string[];

  return keys;
}

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const apiKeys = getGroqKeys();
    const openRouterKey = process.env.OPENROUTER_API_KEY || '';

    if (apiKeys.length === 0 && !openRouterKey) {
      return NextResponse.json({
        response: 'Chintu is not configured. Please add GROQ_API_KEY or OPENROUTER_API_KEY to your environment.',
        offline: true
      }, { status: 200 });
    }

    // Format messages for Groq
    const messages = [
      {
        role: 'system',
        content: `You are "Chintu" — the official AI support assistant for Chintu Ji (getchintu.com).

STRICT RULE: ONLY answer questions based on features, pricing, and policies that ACTUALLY EXIST on our website. Do NOT make up features, prices, or policies. If the user asks about something that does not exist on our site, politely say you cannot answer that and direct them to contact@getchintu.com.

WHAT EXISTS ON OUR WEBSITE (verified facts only):
- Product: Real-time AI interview copilot with sub-200ms latency. Stealth overlay invisible to screen-share, recording and proctoring.
- Modes: Live Coding, System Design, Behavioral, Online Proctored Exams, MCQs & Aptitude.
- Platforms supported: Zoom, Google Meet, Microsoft Teams, Webex, Amazon Chime, Skype, HireVue, micro1, Karat, Interviewing.io, HackerRank, LeetCode, CoderPad, Codility, Pramp, Discord.
- Key features:
  • Real-time AI answers
  • Stealth / Invisible Mode
  • Conversational Human Tone (Authentic Voice)
  • Vision OCR Snapshot (screen capture for MCQs / code)
  • Hold-Space Voice Capture
  • Scout + Turbo Debugger (multi-model root-cause code analysis)
  • Universal Overlay
  • 63+ languages
  • Mock Interview Simulator
  • AI Resume Builder (JD-tailored, ATS-ready)
- Pricing plans (verified):
  • Starter — Free: 10 credits/month, 1 profile, Standard Engine only, Basic responses, Community support
  • Professional — $29/month or $9/year: 100 credits/month, Unlimited profiles & JDs, All premium engines, All response types, Stealth session recording, Font size & opacity sliders
  • Elite — $79/month or $29/year: 500 credits/month, Unlimited profiles & JDs, All Pro features, Dedicated support, AI fine-tuning, Early access
- Refund: 7-day money-back guarantee on all paid plans.
- Credits: Credits never expire. Monthly reset on Starter only.
- Contact: contact@getchintu.com for anything not covered here.
- Pages on site: /pricing, /faq, /blog, /about, /download, /support, /resume-builder, /setup, /subscription, /privacy, /terms

WHAT TO DO IF ASKED SOMETHING NOT IN THE LIST ABOVE:
Say: "I do not have verified information about that on our website. Please reach out to contact@getchintu.com and the team will get back to you quickly."

FORMATTING RULES:
- NEVER use markdown tables (no | pipes or table syntax)
- Use simple bullet points or numbered lists
- Keep responses concise, friendly, and conversational
- Use bold (**text**) for emphasis, not tables
- Always address yourself as "Chintu", never "Q" or any other name`
      },
      ...history.map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    // Try each API key in rotation with gpt-oss-120b only
    let lastError: any;
    const MAX_RETRIES = 2;
    const model = 'openai/gpt-oss-120b';

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        console.log(`[/api/chat] ⏳ Retrying attempt ${attempt + 1}/${MAX_RETRIES}...`);
        await new Promise(r => setTimeout(r, 1500));
      }

      for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[i];

        try {
          console.log(`[/api/chat] Trying key ${i + 1}/${apiKeys.length} (attempt ${attempt + 1})`);

          const groq = new Groq({ apiKey });

          const completion = await groq.chat.completions.create({
            model,
            messages: messages as any,
            max_tokens: 2048,
            temperature: 0.7,
          });

          const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

          console.log(`[/api/chat] ✓ Success with key ${i + 1}`);

          return NextResponse.json({
            response,
            offline: false
          });

        } catch (error: any) {
          lastError = error;
          const errorMsg = error?.message || 'Unknown error';
          const errorStatus = error?.status || error?.response?.status || 'N/A';
          console.error(`[/api/chat] ✗ Key ${i + 1} failed (Status: ${errorStatus}): ${errorMsg.slice(0, 100)}`);
          continue;
        }
      }
    }

    // Fallback to OpenRouter if available
    if (openRouterKey) {
      try {
        console.log('[/api/chat] Trying OpenRouter fallback...');

        const openrouter = new OpenAI({
          baseURL: 'https://openrouter.ai/api/v1',
          apiKey: openRouterKey,
        });

        const completion = await openrouter.chat.completions.create({
          model: 'openai/gpt-oss-120b',
          messages: messages as any,
          max_tokens: 2048,
          temperature: 0.7,
        });

        const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

        console.log('[/api/chat] ✓ OpenRouter fallback success');

        return NextResponse.json({
          response,
          offline: false
        });

      } catch (error: any) {
        console.error('[/api/chat] ✗ OpenRouter fallback failed:', error?.message?.slice(0, 100));
        lastError = error;
      }
    }

    // All keys exhausted
    console.error('[/api/chat] All API keys exhausted');
    const errorDetails = lastError?.message || 'No specific error';
    return NextResponse.json({
      response: 'I am currently offline. Please check that your API keys are valid, or try again in a moment.',
      error: errorDetails,
      offline: true
    }, { status: 200 });

  } catch (error) {
    console.error('Chat API error:', error);

    return NextResponse.json({
      response: 'Sorry, I encountered an error. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
      offline: true
    }, { status: 200 });
  }
}
