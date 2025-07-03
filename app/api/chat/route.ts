import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Only initialize OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI client is available
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Provide clear, concise, and accurate responses.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'No response generated';

    return NextResponse.json({ response });
  } catch (error) {
    console.error('ChatGPT API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from ChatGPT' },
      { status: 500 }
    );
  }
} 