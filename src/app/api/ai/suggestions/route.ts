import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the function schema for OpenAI
const functions = [
  {
    name: "generate_seo_suggestion",
    description: "Generate SEO improvement suggestions for website content",
    parameters: {
      type: "object",
      properties: {
        original: {
          type: "string",
          description: "The original content or element"
        },
        suggestion: {
          type: "string",
          description: "The improved version of the content"
        },
        reasoning: {
          type: "string",
          description: "Explanation of why this change improves SEO"
        }
      },
      required: ["original", "suggestion", "reasoning"]
    }
  }
];

export async function POST(req: Request) {
  try {
    const { content, type } = await req.json();
    
    // Different prompts based on suggestion type
    const prompts = {
      title: "Analyze this page title and suggest SEO improvements. Make it more compelling and keyword-rich while keeping it under 60 characters.",
      meta: "Analyze this meta description and suggest SEO improvements. Make it more compelling and include relevant keywords while keeping it under 160 characters.",
      heading: "Analyze this heading structure and suggest SEO improvements. Ensure proper hierarchy and keyword usage.",
      content: "Analyze this content section and suggest SEO improvements. Focus on readability, keyword usage, and engagement."
    };
    
    const prompt = prompts[type] || prompts.content;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert SEO consultant. Provide specific, actionable suggestions to improve website content for search engines and users."
        },
        {
          role: "user",
          content: `${prompt}\n\nHere's the content to analyze:\n${content}`
        }
      ],
      functions,
      function_call: { name: "generate_seo_suggestion" }
    });
    
    // Extract the function call result
    const functionCall = response.choices[0]?.message?.function_call;
    
    if (functionCall && functionCall.name === "generate_seo_suggestion") {
      const args = JSON.parse(functionCall.arguments);
      return NextResponse.json({
        success: true,
        suggestion: {
          original: args.original,
          suggestion: args.suggestion,
          reasoning: args.reasoning
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to generate suggestion"
    });
  } catch (error) {
    console.error("AI suggestion error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
} 