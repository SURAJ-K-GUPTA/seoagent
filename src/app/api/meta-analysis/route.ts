import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { WebsiteData } from '@/types';

// Define the MetaAnalysis interface
interface MetaAnalysis {
  titleLength: number;
  descriptionLength: number;
  titleScore: number;
  descriptionScore: number;
  powerWords: string[];
  searchIntent: string;
  uniqueValue: string;
  suggestions: {
    type: 'title' | 'description';
    original: string;
    suggested: string;
    reasoning: string;
    powerWords: string[];
    improvement: string;
  }[];
}

// Define the HeadingAnalysis interface
interface HeadingAnalysis {
  // Add heading analysis properties as needed
  structure: string;
  recommendations: string[];
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeSEOMetadata(
  targetSite: WebsiteData,
  competitors: WebsiteData[] = []
): Promise<{ meta: MetaAnalysis; headings: HeadingAnalysis | null }> {
  const defaultMetaAnalysis: MetaAnalysis = {
    titleLength: targetSite.title.length,
    descriptionLength: targetSite.metaDescription.length,
    titleScore: 0,
    descriptionScore: 0,
    powerWords: [],
    searchIntent: '',
    uniqueValue: '',
    suggestions: []
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an SEO expert. Analyze the provided website metadata and its competitors to generate SEO recommendations. And make sure each property is returned in correct format. You return after analysis the suggestions for improvement in the metadata that can be insertion deletion or modification based on description given in function call." },
        { role: "user", content: `
          Analyze the following website meta information and its competitors:
          
          Target Site:
          URL: ${targetSite.url}
          Title: ${targetSite.title} (${targetSite.title.length} chars)
          Meta Description: ${targetSite.metaDescription} (${targetSite.metaDescription.length} chars)
          
          Competitors:
          ${competitors.map(comp => `
            URL: ${comp.url}
            Title: ${comp.title} (${comp.title.length} chars)
            Meta Description: ${comp.metaDescription} (${comp.metaDescription.length} chars)
          `).join('\n')}
        `}
      ],
      functions: [
        {
          name: "analyze_metadata",
          description: "Analyzes website metadata and provides SEO recommendations.",
          parameters: {
            type: "object",
            properties: {
              titleLength: { 
                type: "number", 
                description: "The character count of the website's title" 
              },
              descriptionLength: { 
                type: "number", 
                description: "The character count of the website's meta description" 
              },
              titleScore: { 
                type: "number", 
                minimum: 0, 
                maximum: 100, 
                description: "SEO score for the title based on length, keywords, and relevance" 
              },
              descriptionScore: { 
                type: "number", 
                minimum: 0, 
                maximum: 100, 
                description: "SEO score for the meta description based on length and relevance" 
              },
              powerWords: { 
                type: "array", 
                items: { type: "string" }, 
                description: "List of impactful words found in the title and description" 
              },
              searchIntent: { 
                type: "string", 
                description: "The primary search intent the page is targeting (informational, navigational, transactional)" 
              },
              uniqueValue: { 
                type: "string", 
                description: "The unique value proposition of the page compared to competitors" 
              },
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { 
                      type: "string", 
                      enum: ["title", "description"], 
                      description: "Type of metadata being suggested for improvement" 
                    },
                    original: { 
                      type: "string", 
                      description: "The current text of the metadata element. If need to insert text, give the sentence before and after the place need insertion along with the inserted text in between the sentences. If need to delete than just give empty string." 
                    },
                    suggested: { 
                      type: "string", 
                      description: "The improved version of the metadata element. If need to insert text, give the sentence before and after the place need insertion along with the inserted text in between the sentences. If need to delete than just give empty string." 
                    },
                    reasoning: { 
                      type: "string", 
                      description: "Explanation of why the suggested change improves SEO" 
                    },
                    powerWords: { 
                      type: "array", 
                      items: { type: "string" }, 
                      description: "Power words included in the suggested improvement" 
                    },
                    improvement: { 
                      type: "string", 
                      description: "Specific SEO benefits of the suggested change" 
                    }
                  },
                  required: ["type", "original", "suggested", "reasoning", "powerWords", "improvement"]
                }
              }
            },
            required: ["titleLength", "descriptionLength", "titleScore", "descriptionScore", "powerWords", "searchIntent", "uniqueValue", "suggestions"]
          }
        }
      ],
      function_call: { name: "analyze_metadata" },
      temperature: 0.7,
    });

    const functionCall = response.choices[0].message.function_call;
    if (functionCall && functionCall.name === "analyze_metadata") {
      const parsedResponse = JSON.parse(functionCall.arguments);
      return {
        meta: { ...defaultMetaAnalysis, ...parsedResponse },
        headings: null // Heading analysis will be handled separately
      };
    } else {
      throw new Error("Function call not returned by the model.");
    }
  } catch (error) {
    console.error('OpenAI analysis failed:', error);
    return {
      meta: defaultMetaAnalysis,
      headings: null
    };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, suggestion } = body;
    
    // If a suggestion is provided, apply it
    if (suggestion) {
      // Here you would implement logic to apply the suggestion
      // For example, update a database or external service
      
      return NextResponse.json({
        success: true,
        message: "Meta suggestion applied successfully",
        appliedSuggestion: suggestion
      });
    }
    
    // Get website data from the request or fetch it
    const websiteData: WebsiteData = body.websiteData || {
      url,
      title: body.title || "Sample Title",
      metaDescription: body.metaDescription || "Sample Description",
      content: "",
      headings: [],
      metaKeywords: [],
      readabilityScore: 0,
      readabilityLevel: "",
      wordCount: 0
    };
    
    // Get competitor data if available
    const competitors: WebsiteData[] = body.competitors || [];
    
    // Perform the SEO metadata analysis
    const analysisResult = await analyzeSEOMetadata(websiteData, competitors);
    
    return NextResponse.json({
      success: true,
      url,
      metaAnalysis: analysisResult.meta,
      headingAnalysis: analysisResult.headings
    });
  } catch (err) {
    console.error("Meta analysis error:", err);
    return NextResponse.json(
      { error: "Failed to analyze meta tags" },
      { status: 500 }
    );
  }
} 