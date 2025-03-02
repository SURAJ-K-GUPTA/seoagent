import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an AI writing assistant that continues existing text based on context from prior text. ' +
            'Give more weight/priority to the later characters than the beginning ones. ' +
            'Limit your response to no more than 200 characters, but make sure to construct complete sentences.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: false,
      n: 1,
    });
    
    // Extract the completion text
    const completionText = response.choices[0]?.message?.content || '';
    
    return NextResponse.json({ completion: completionText });
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate text' },
      { status: 500 }
    );
  }
}
