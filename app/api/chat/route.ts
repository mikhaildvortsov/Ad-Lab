import { NextRequest, NextResponse } from 'next/server';
import { getInstruction } from '@/lib/ai-instructions';

const OPENROUTER_API_KEY = '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';
const SITE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const SITE_NAME = 'Ad Lab';

export async function POST(request: NextRequest) {
  try {
    const { message, instructions, instructionType } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-flash-1.5",
        "messages": [
          {
            "role": "system",
            "content": instructions || getInstruction(instructionType as any) || getInstruction('marketing')
          },
          {
            "role": "user",
            "content": message
          }
        ],
        "max_tokens": 1000,
        "temperature": 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini Flash API Error:', errorData);
      return NextResponse.json(
        { error: 'Failed to get response from Gemini Flash', details: errorData },
        { status: 500 }
      );
    }

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content || 'No response generated';

    return NextResponse.json({ response: responseContent });
  } catch (error) {
    console.error('Gemini Flash API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from Gemini Flash', details: String(error) },
      { status: 500 }
    );
  }
} 