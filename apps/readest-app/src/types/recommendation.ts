import { Book } from './book';

export interface BookSuggestion {
  id: string; // Hash for local, or external ID for AI
  title: string;
  author: string;
  description?: string;
  coverUrl?: string;
  reason?: string; // "From the same author", "Similar subject", etc.
  isLocal: boolean;
  bookReference?: Book; // If local
}

export interface RecommendationEngine {
  name: string;
  getRecommendations(book: Book): Promise<BookSuggestion[]>;
}
