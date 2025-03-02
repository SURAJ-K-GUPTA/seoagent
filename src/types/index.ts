export interface WebsiteData {
  url: string;
  title: string;
  metaDescription: string;
  content: string;
  headings: { level: number; text: string; position: number }[];
  metaKeywords: string[];
  readabilityScore: number;
  readabilityLevel: string;
  wordCount: number;
} 