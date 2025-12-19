import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Book } from '@/types/book';
import { GeminiService, createGeminiService, validateApiKey } from '@/services/ai/geminiService';
import type { BookSuggestion, ReadingAnalysis } from '@/services/ai/geminiService';

/**
 * AI Store State
 */
interface AIState {
  // Configuration
  apiKey: string | null;
  isConfigured: boolean;
  isValidating: boolean;
  validationError: string | null;

  // Suggestions
  suggestions: BookSuggestion[];
  isFetchingSuggestions: boolean;
  suggestionsError: string | null;
  lastSuggestionsUpdate: number | null;

  // Reading Analysis
  readingAnalysis: ReadingAnalysis | null;
  isAnalyzing: boolean;
  analysisError: string | null;

  // Actions
  setApiKey: (key: string) => Promise<boolean>;
  clearApiKey: () => void;
  fetchSuggestions: (library: Book[]) => Promise<void>;
  analyzeReading: (stats: {
    totalBooks: number;
    totalPages: number;
    avgSessionMinutes: number;
    genres: string[];
    completionRate: number;
  }) => Promise<void>;
  clearSuggestions: () => void;
  clearAnalysis: () => void;

  // Internal
  _getService: () => GeminiService | null;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      apiKey: null,
      isConfigured: false,
      isValidating: false,
      validationError: null,

      suggestions: [],
      isFetchingSuggestions: false,
      suggestionsError: null,
      lastSuggestionsUpdate: null,

      readingAnalysis: null,
      isAnalyzing: false,
      analysisError: null,

      setApiKey: async (key: string): Promise<boolean> => {
        set({ isValidating: true, validationError: null });

        const isValid = await validateApiKey(key);

        if (isValid) {
          set({
            apiKey: key,
            isConfigured: true,
            isValidating: false,
            validationError: null,
          });
          return true;
        } else {
          set({
            isValidating: false,
            validationError: 'Invalid API key. Please check and try again.',
          });
          return false;
        }
      },

      clearApiKey: (): void => {
        set({
          apiKey: null,
          isConfigured: false,
          validationError: null,
          suggestions: [],
          readingAnalysis: null,
        });
      },

      fetchSuggestions: async (library: Book[]): Promise<void> => {
        const service = get()._getService();
        if (!service) {
          set({ suggestionsError: 'API key not configured' });
          return;
        }

        set({ isFetchingSuggestions: true, suggestionsError: null });

        try {
          const suggestions = await service.getSuggestions(library);
          set({
            suggestions,
            isFetchingSuggestions: false,
            lastSuggestionsUpdate: Date.now(),
          });
        } catch (error) {
          set({
            isFetchingSuggestions: false,
            suggestionsError: error instanceof Error ? error.message : 'Failed to fetch suggestions',
          });
        }
      },

      analyzeReading: async (stats): Promise<void> => {
        const service = get()._getService();
        if (!service) {
          set({ analysisError: 'API key not configured' });
          return;
        }

        set({ isAnalyzing: true, analysisError: null });

        try {
          const analysis = await service.analyzeReadingStyle(stats);
          set({
            readingAnalysis: analysis,
            isAnalyzing: false,
          });
        } catch (error) {
          set({
            isAnalyzing: false,
            analysisError: error instanceof Error ? error.message : 'Failed to analyze reading',
          });
        }
      },

      clearSuggestions: (): void => {
        set({ suggestions: [], suggestionsError: null, lastSuggestionsUpdate: null });
      },

      clearAnalysis: (): void => {
        set({ readingAnalysis: null, analysisError: null });
      },

      _getService: (): GeminiService | null => {
        const { apiKey } = get();
        if (!apiKey) return null;
        return createGeminiService(apiKey);
      },
    }),
    {
      name: 'redread-ai-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        apiKey: state.apiKey,
        isConfigured: state.isConfigured,
        // Don't persist suggestions or analysis - refresh on demand
      }),
    }
  )
);
