import { NextRequest, NextResponse } from 'next/server';
import { getInstruction, createCustomInstruction, type NicheType } from '@/lib/ai-instructions';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SITE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const SITE_NAME = 'Ad Lab';

export async function POST(request: NextRequest) {
  try {
    const { message, instructions, instructionType, niche } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }



    // Create custom instruction with niche if provided
    const systemPrompt = instructions || 
      createCustomInstruction(instructionType as any, niche as NicheType) || 
      createCustomInstruction('marketing', niche as NicheType);

    const body = {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7
    };

    console.log('[OpenAI] Request body:', JSON.stringify(body, null, 2));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Ad-Lab-App/1.0'
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
      console.error('[OpenAI API Error]', response.status, errorData);
      
      // Специальная обработка для превышения квоты
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'API квота исчерпана. Пожалуйста, проверьте свой план и биллинг в OpenAI.', details: errorData, status: response.status },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to get response from ChatGPT', details: errorData, status: response.status },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('[OpenAI] Response:', JSON.stringify(data, null, 2));
    const responseContent = data.choices?.[0]?.message?.content || 'No response generated';

    return NextResponse.json({ response: responseContent });
  } catch (error) {
    console.error('[API Route Error]', error);
    return NextResponse.json(
              { error: 'Failed to get response from ChatGPT', details: String(error) },
      { status: 500 }
    );
  }
} 