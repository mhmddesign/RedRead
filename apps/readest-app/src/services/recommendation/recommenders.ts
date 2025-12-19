import { Book } from '@/types/book';
import { BookSuggestion, RecommendationEngine } from '@/types/recommendation';
import { useLibraryStore } from '@/store/libraryStore';
import { formatAuthors } from '@/utils/book';

export class LocalRecommender implements RecommendationEngine {
  name = 'Local Library';

  async getRecommendations(sourceBook: Book): Promise<BookSuggestion[]> {
    const { library } = useLibraryStore.getState();
    const suggestions: BookSuggestion[] = [];

    if (!library || library.length === 0) return [];

    const sourceAuthors = sourceBook.author
      ? sourceBook.author.split(',').map((a) => a.trim().toLowerCase())
      : [];
    const sourceSubjects = sourceBook.subjects || [];
    const sourceTags = sourceBook.tags || [];

    for (const book of library) {
      if (book.hash === sourceBook.hash) continue; // Skip self

      let score = 0;
      let reasons: string[] = [];

      // 1. Author Match
      if (book.author) {
        const authors = book.author.split(',').map((a) => a.trim().toLowerCase());
        const commonAuthors = authors.filter((a) => sourceAuthors.includes(a));
        if (commonAuthors.length > 0) {
          score += 5;
          reasons.push('Same author');
        }
      }

      // 2. Series Match (if available in metadata, assuming simple title checks for now or metadata field)
      // TODO: Add proper series support. For now, check if titles start similarly
      if (sourceBook.title.length > 5 && book.title.startsWith(sourceBook.title.substring(0, 10))) {
        score += 3;
        reasons.push('Similar title');
      }

      // 3. Subject/Genre Match
      if (book.subjects) {
        const commonSubjects = book.subjects.filter((s) => sourceSubjects.includes(s));
        if (commonSubjects.length > 0) {
          score += commonSubjects.length * 2;
          reasons.push(`Similar subjects: ${commonSubjects.slice(0, 2).join(', ')}`);
        }
      }

      // 4. Tags Match
      if (book.tags) {
        const commonTags = book.tags.filter((t) => sourceTags.includes(t));
        if (commonTags.length > 0) {
          score += commonTags.length * 2;
          reasons.push(`Common tags: ${commonTags.slice(0, 2).join(', ')}`);
        }
      }

      if (score > 0) {
        suggestions.push({
          id: book.hash,
          title: book.title,
          author: book.author,
          description: book.description,
          coverUrl: book.coverImageUrl,
          reason: reasons[0], // Show primary reason
          isLocal: true,
          bookReference: book,
        });
      }
    }

    // Sort by score (implicitly by order of insertion? No, need to carry score)
    // For simplicity, let's just return top 10 found.
    // To do proper ranking, I'd need to store score.
    // Let's re-map to include score for sorting.

    return suggestions.slice(0, 10);
  }
}

export class GeminiRecommender implements RecommendationEngine {
  name = 'AI Suggestions';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getRecommendations(book: Book): Promise<BookSuggestion[]> {
    if (!this.apiKey) {
      return [
        {
          id: 'error-no-key',
          title: 'API Key Required',
          author: 'System',
          reason: 'Please configure your Gemini API key in Settings > AI to get suggestions.',
          isLocal: false,
        },
      ];
    }

    // TODO: Implement actual Gemini API call
    // Mocking for now to establish UI
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'ext-1',
            title: 'Mock AI Book 1',
            author: 'AI Author',
            description: 'This is a simulated AI suggestion.',
            reason: 'Because you liked ' + book.title,
            isLocal: false,
          },
          {
            id: 'ext-2',
            title: 'Mock AI Book 2',
            author: 'AI Author',
            reason: 'Analyzed plot similarity',
            isLocal: false,
          },
        ]);
      }, 1000);
    });
  }
}
