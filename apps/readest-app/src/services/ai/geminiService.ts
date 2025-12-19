/**
 * Gemini AI Service for RedRead
 * Provides AI-powered book suggestions and analysis
 */

import type { Book } from '@/types/book';

/**
 * Book suggestion from AI
 */
export interface BookSuggestion {
  title: string;
  author: string;
  genre: string;
  reason: string;
  matchScore: number; // 0-100
}

/**
 * Reading analysis result
 */
export interface ReadingAnalysis {
  favoriteGenres: string[];
  readingPatterns: {
    preferredTime: string;
    avgSessionLength: number;
    booksPerMonth: number;
  };
  recommendations: string[];
}

/**
 * AI Service configuration
 */
interface GeminiConfig {
  apiKey: string;
  model?: string;
}

/**
 * Gemini API request body
 */
interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}

/**
 * Gemini API response
 */
interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-1.5-flash';

/**
 * Gemini AI Service
 */
export class GeminiService {
  private apiKey: string;
  private model: string;

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || DEFAULT_MODEL;
  }

  /**
   * Check if the service is configured with an API key
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Make a request to the Gemini API
   */
  public async ask(prompt: string): Promise<string> {
    return this.makeRequest(prompt);
  }

  /**
   * Internal request handler
   */
  private async makeRequest(prompt: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured. Please add your API key in settings.');
    }

    const url = `${GEMINI_API_BASE}/${this.model}:generateContent?key=${this.apiKey}`;

    const requestBody: GeminiRequest = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data: GeminiResponse = await response.json();

      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message}`);
      }

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      return data.candidates[0]!.content.parts[0]!.text;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to communicate with Gemini API');
    }
  }

  /**
   * Get book suggestions based on user's library
   */
  async getSuggestions(library: Book[]): Promise<BookSuggestion[]> {
    const bookList = library
      .slice(0, 20) // Limit to recent 20 books
      .map((b) => `- "${b.title}" by ${b.author}`)
      .join('\n');

    const prompt = `Based on the following books in a user's reading library, suggest 5 books they might enjoy. For each suggestion, provide:
1. Book title
2. Author name
3. Genre
4. A brief reason why they might enjoy it (1-2 sentences)
5. A match score from 0-100

User's library:
${bookList}

Respond in JSON format only, with no markdown:
{
  "suggestions": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "genre": "Genre",
      "reason": "Brief reason",
      "matchScore": 85
    }
  ]
}`;

    const response = await this.makeRequest(prompt);

    try {
      // Extract JSON from response (handle potential markdown wrapping)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.suggestions as BookSuggestion[];
    } catch {
      console.error('Failed to parse AI suggestions:', response);
      throw new Error('Failed to parse book suggestions');
    }
  }

  /**
   * Get a summary of a book chapter or section
   */
  async summarizeText(text: string, maxLength: number = 200): Promise<string> {
    const truncatedText = text.slice(0, 5000); // Limit input size

    const prompt = `Summarize the following text in ${maxLength} words or less. Focus on key points and main ideas:

${truncatedText}

Provide only the summary, no additional commentary.`;

    return await this.makeRequest(prompt);
  }

  /**
   * Analyze user's reading patterns
   */
  async analyzeReadingStyle(stats: {
    totalBooks: number;
    totalPages: number;
    avgSessionMinutes: number;
    genres: string[];
    completionRate: number;
  }): Promise<ReadingAnalysis> {
    const prompt = `Analyze the following reading statistics and provide insights:

- Total books read: ${stats.totalBooks}
- Total pages read: ${stats.totalPages}
- Average session length: ${stats.avgSessionMinutes} minutes
- Favorite genres: ${stats.genres.join(', ')}
- Book completion rate: ${stats.completionRate}%

Provide analysis in JSON format only, no markdown:
{
  "favoriteGenres": ["genre1", "genre2"],
  "readingPatterns": {
    "preferredTime": "description of when they likely read",
    "avgSessionLength": ${stats.avgSessionMinutes},
    "booksPerMonth": estimated_number
  },
  "recommendations": [
    "recommendation 1",
    "recommendation 2",
    "recommendation 3"
  ]
}`;

    const response = await this.makeRequest(prompt);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      return JSON.parse(jsonMatch[0]) as ReadingAnalysis;
    } catch {
      console.error('Failed to parse reading analysis:', response);
      throw new Error('Failed to analyze reading style');
    }
  }

  /**
   * Get a motivational message based on reading progress
   */
  async getMotivationalMessage(
    currentStreak: number,
    todayPages: number,
    goalPages: number,
  ): Promise<string> {
    const prompt = `Generate a short, encouraging message (1-2 sentences) for a reader with:
- Current reading streak: ${currentStreak} days
- Pages read today: ${todayPages}
- Daily goal: ${goalPages} pages

Make it personal, encouraging, and specific to their progress. No quotes around the message.`;

    return await this.makeRequest(prompt);
  }
}

/**
 * Create a GeminiService instance
 */
export const createGeminiService = (apiKey: string): GeminiService => {
  return new GeminiService({ apiKey });
};

/**
 * Validate an API key by making a test request
 */
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const service = new GeminiService({ apiKey });
    await service.getMotivationalMessage(1, 10, 20);
    return true;
  } catch {
    return false;
  }
};
