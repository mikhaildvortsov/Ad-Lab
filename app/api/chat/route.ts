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

    const systemPrompt = instructions || getInstruction(instructionType as any) || getInstruction('marketing');

    const body = {
      model: 'google/gemini-flash-1.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7
    };

    console.log('[OpenRouter] Request body:', JSON.stringify(body, null, 2));

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': SITE_URL,
        'X-Title': SITE_NAME,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    let errorData = null;
    if (!response.ok) {
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      console.error('[OpenRouter API Error]', response.status, errorData);
      return NextResponse.json(
        { error: 'Failed to get response from Gemini Flash', details: errorData, status: response.status },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('[OpenRouter] Response:', JSON.stringify(data, null, 2));
    const responseContent = data.choices?.[0]?.message?.content || 'No response generated';

    return NextResponse.json({ response: responseContent });
  } catch (error) {
    console.error('[API Route Error]', error);
    return NextResponse.json(
      { error: 'Failed to get response from Gemini Flash', details: String(error) },
      { status: 500 }
    );
  }
} 