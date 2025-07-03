import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const SITE_NAME = 'Ad Lab';

export async function POST(request: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key is not configured' },
        { status: 500 }
      );
    }

    const { message } = await request.json();

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
        "model": "openrouter/cypher-alpha:free",
        "messages": [
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
      console.error('Cypher Alpha API Error:', errorData);
      return NextResponse.json(
        { error: 'Failed to get response from Cypher Alpha', details: errorData },
        { status: 500 }
      );
    }

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content || 'No response generated';

    return NextResponse.json({ response: responseContent });
  } catch (error) {
    console.error('Cypher Alpha API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from Cypher Alpha', details: String(error) },
      { status: 500 }
    );
  }
} 