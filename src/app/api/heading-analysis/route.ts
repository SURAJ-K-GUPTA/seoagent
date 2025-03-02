import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { WebsiteData } from '@/types';

// Define the HeadingAnalysis interface
interface HeadingAnalysis {
  headingDepthScore: number;
  topicCoverage: number;
  missingTopics: string[];
  searchTermOptimization: number;
  hierarchyScore: number;
  suggestions: {
    type: 'structure' | 'topic' | 'searchTerm' | 'hierarchy';
    original: string;
    suggested: string;
    reasoning: string;
    priority: number;
    position: number;
  }[];
  competitorInsights: string[];
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeHeadingStructure(
  targetSite: WebsiteData,
  competitors: WebsiteData[] = [],
  searchTerms: string[] = []
): Promise<HeadingAnalysis> {
  const defaultAnalysis: HeadingAnalysis = {
    headingDepthScore: 0,
    topicCoverage: 0,
    missingTopics: [],
    searchTermOptimization: 0,
    hierarchyScore: 0,
    suggestions: [],
    competitorInsights: []
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an SEO expert. Analyze the heading structure and topic organization of the provided website and its competitors. You return after analysis the suggestions for improvement in the heading structure that can be insertion deletion or modification based on description given in function call." 
        },
        {
          role: "user",
          content: `
            Analyze the heading structure and topic organization:

            Target Site:
            URL: ${targetSite.url}
            Headings: ${JSON.stringify(targetSite.headings)}
            
            Competitors:
            ${competitors.map(comp => `
              URL: ${comp.url}
              Headings: ${JSON.stringify(comp.headings)}
            `).join('\n')}

            Search Terms: ${searchTerms.join(', ')}
          `
        }
      ],
      functions: [
        {
          name: "analyze_headings",
          description: "Analyzes the heading structure and topic organization of a website and its competitors.",
          parameters: {
            type: "object",
            properties: {
              headingDepthScore: { 
                type: "number", 
                minimum: 0, 
                maximum: 100, 
                description: "Score for the logical hierarchy and depth of headings (H1, H2, H3, etc.)" 
              },
              topicCoverage: { 
                type: "number", 
                minimum: 0, 
                maximum: 100, 
                description: "Score for how well the headings cover the main topics of the page" 
              },
              missingTopics: { 
                type: "array", 
                items: { type: "string" }, 
                description: "List of important topics missing from the heading structure" 
              },
              searchTermOptimization: { 
                type: "number", 
                minimum: 0, 
                maximum: 100, 
                description: "Score for how well the headings include relevant search terms" 
              },
              hierarchyScore: { 
                type: "number", 
                minimum: 0, 
                maximum: 100, 
                description: "Score for the logical structure and organization of headings" 
              },
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { 
                      type: "string", 
                      enum: ["structure", "topic", "searchTerm", "hierarchy"], 
                      description: "Type of heading improvement being suggested" 
                    },
                    original: { 
                      type: "string", 
                      description: "The current heading text. If need to insert text, give the sentence before and after the place need insertion. If need to delete text just give the sentence to delete." 
                    },
                    suggested: { 
                      type: "string", 
                      description: "The improved version of the heading. If need to insert text, give the sentence before and after the place need insertion along with the inserted text in between the sentences. If need to delete than just give empty string." 
                    },
                    reasoning: { 
                      type: "string", 
                      description: "Explanation of why the suggested change improves the heading structure" 
                    },
                    priority: { 
                      type: "number", 
                      minimum: 1, 
                      maximum: 5, 
                      description: "Priority level of the suggestion (1 = low, 5 = high)" 
                    },
                    position: { 
                      type: "number", 
                      description: "The position in the content where the heading should be placed or modified" 
                    }
                  },
                  required: ["type", "original", "suggested", "reasoning", "priority", "position"]
                }
              },
              competitorInsights: { 
                type: "array", 
                items: { type: "string" }, 
                description: "Key observations from competitor heading structures that could improve the target site" 
              }
            },
            required: [
              "headingDepthScore",
              "topicCoverage",
              "missingTopics",
              "searchTermOptimization",
              "hierarchyScore",
              "suggestions",
              "competitorInsights"
            ]
          }
        }
      ],
      function_call: { name: "analyze_headings" },
      temperature: 0.7,
    });

    const functionCall = response.choices[0].message.function_call;
    if (functionCall && functionCall.name === "analyze_headings") {
      const parsedResponse = JSON.parse(functionCall.arguments);
      return { ...defaultAnalysis, ...parsedResponse };
    } else {
      throw new Error("Function call not returned by the model.");
    }
  } catch (error) {
    console.error('Heading analysis failed:', error);
    return defaultAnalysis;
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
        message: "Heading suggestion applied successfully",
        appliedSuggestion: suggestion
      });
    }
    
    // Get website data from the request or fetch it
    const websiteData: WebsiteData = body.websiteData || {
      url,
      title: body.title || "Sample Title",
      metaDescription: body.metaDescription || "Sample Description",
      content: "",
      headings: body.headings || [],
      metaKeywords: [],
      readabilityScore: 0,
      readabilityLevel: "",
      wordCount: 0
    };
    
    // Get competitor data if available
    const competitors: WebsiteData[] = body.competitors || [];
    
    // Get search terms if available
    const searchTerms: string[] = body.searchTerms || [];
    
    // Perform the heading structure analysis
    const analysisResult = await analyzeHeadingStructure(websiteData, competitors, searchTerms);
    
    return NextResponse.json({
      success: true,
      url,
      headingAnalysis: analysisResult
    });
  } catch (err) {
    console.error("Heading analysis error:", err);
    return NextResponse.json(
      { error: "Failed to analyze headings" },
      { status: 500 }
    );
  }
} 