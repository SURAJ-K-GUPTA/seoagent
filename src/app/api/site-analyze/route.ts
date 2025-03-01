import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { JSDOM, VirtualConsole } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';

export const maxDuration = 60;

// Define the WebsiteData interface
interface WebsiteData {
  url: string;
  title: string;
  metaDescription: string;
  content: string;
  headings: { level: number; text: string; position: number }[];
  metaKeywords: string[];
  readabilityScore: number;
}

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

/**
 * Scrapes website content and metadata using multiple libraries
 * Handles CSS parsing errors gracefully
 */
async function scrapeWebsiteContent(url: string): Promise<WebsiteData> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

    const html = response.data;
    const $ = cheerio.load(html);
    
    // Extract meta information
    const title = $('title').text() || $('meta[property="og:title"]').attr('content') || '';
    const metaDescription = $('meta[name="description"]').attr('content') || 
                           $('meta[property="og:description"]').attr('content') || '';
    const metaKeywords = $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim()) || [];

    // Create virtual console to suppress CSS parsing errors
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("error", () => {
      // No-op to skip console errors
    });

    // Use Readability with error-suppressing virtual console
    const dom = new JSDOM(html, { 
      url,
      virtualConsole,
      runScripts: "outside-only"
    });
    
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    // Convert HTML content to markdown
    const content = article ? turndownService.turndown(article.content) : '';

    // Extract headings
    const headings: { level: number; text: string; position: number }[] = [];
    $('h1, h2, h3').each((index, element) => {
      const level = parseInt(element.tagName.substring(1));
      headings.push({
        level,
        text: $(element).text().trim(),
        position: index
      });
    });

    // Calculate basic readability score
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    const readabilityScore = words > 0 ? sentences / words * 100 : 0;

    return {
      url,
      title,
      metaDescription,
      content,
      headings,
      metaKeywords,
      readabilityScore
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    // Validate URL
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(url)) {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Scrape the site
    const websiteData = await scrapeWebsiteContent(url);

    return NextResponse.json({
      success: true,
      data: websiteData
    });
  } catch (error) {
    console.error('Error in site analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze site' },
      { status: 500 }
    );
  }
} 