import { NextRequest, NextResponse } from 'next/server';
import { getInstruction, createCustomInstruction, type NicheType } from '@/lib/ai-instructions';
import { checkRateLimit } from '@/lib/rate-limiter';
import { getSession } from '@/lib/session';
import { QueryService } from '@/lib/services/query-service';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SITE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const SITE_NAME = 'Ad Lab';
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let queryRecord = null;
  let userId = null;
  try {
    const { message, instructions, instructionType, niche, locale, sessionId } = await request.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }
    if (message.length > 10000) {
      return NextResponse.json(
        { error: 'Message too long. Maximum 10,000 characters allowed.' },
        { status: 400 }
      );
    }
    if (instructions && typeof instructions !== 'string') {
      return NextResponse.json(
        { error: 'Instructions must be a string' },
        { status: 400 }
      );
    }
    const sanitizedMessage = message.replace(/[<>&"']/g, (match) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return entities[match];
    });
    const estimatedTokens = Math.ceil((sanitizedMessage.length + (instructions || '').length) / 4) + 1000; 
    const session = await getSession();
    userId = session?.user?.id;
    const rateLimitResult = await checkRateLimit(request, estimatedTokens, 'chatGPT', userId);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: rateLimitResult.error,
          type: 'rate_limit',
          resetTime: rateLimitResult.resetTime,
          remaining: rateLimitResult.remaining
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      );
    }
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }
    if (userId) {
      try {
        const createQueryResult = await QueryService.createQuery({
          user_id: userId,
          session_id: sessionId || null,
          query_text: sanitizedMessage,
          model_used: 'gpt-4o',
          query_type: 'chat',
          niche: niche || null,
          language: locale || 'ru',
          success: true 
        });
        if (createQueryResult.success) {
          queryRecord = createQueryResult.data;
        }
      } catch (error) {
        console.error('Failed to create query record:', error);
      }
    }
    const systemPrompt = instructions || 
      createCustomInstruction(instructionType as any, niche as NicheType, undefined, locale || 'ru') || 
      createCustomInstruction('marketing', niche as NicheType, undefined, locale || 'ru');
    const body = {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: sanitizedMessage }
      ],
      max_tokens: 1000,
      temperature: 0.7
    };
    if (process.env.NODE_ENV === 'development') {
      console.log('[OpenAI] Request body:', JSON.stringify(body, null, 2));
    }
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
      if (queryRecord && userId) {
        try {
          await QueryService.markQueryFailed(
            queryRecord.id,
            `OpenAI API Error: ${response.status} - ${JSON.stringify(errorData)}`
          );
        } catch (error) {
          console.error('Failed to update query record with error:', error);
        }
      }
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
    const assistantMessage = data.choices[0]?.message?.content;
    if (!assistantMessage) {
      console.error('[OpenAI] No assistant message in response:', data);
      return NextResponse.json(
        { error: 'No response from ChatGPT' },
        { status: 500 }
      );
    }
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    const tokensUsed = data.usage?.total_tokens || estimatedTokens;
    if (queryRecord && userId) {
      try {
        await QueryService.updateQueryResponse(
          queryRecord.id,
          assistantMessage,
          tokensUsed,
          processingTime
        );
      } catch (error) {
        console.error('Failed to update query record:', error);
      }
    }
    console.log(`[Chat] Request processed successfully in ${processingTime}ms`);
    return NextResponse.json({
      response: assistantMessage,
      model: 'gpt-4o',
      processingTime: processingTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    if (queryRecord && userId) {
      try {
        await QueryService.markQueryFailed(
          queryRecord.id,
          `API Route Error: ${error instanceof Error ? error.message : String(error)}`
        );
      } catch (updateError) {
        console.error('Failed to update query record with error:', updateError);
      }
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
