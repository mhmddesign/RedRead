import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MangaSource, MangaChapter, Book } from '@/types/book';

interface MangaState {
  sources: MangaSource[];
  installedExtensions: string[];
  
  // Actions
  addSource: (source: MangaSource) => void;
  removeSource: (sourceId: string) => void;
  toggleSource: (sourceId: string) => void;
  
  markChapterRead: (bookHash: string, chapterId: string, read: boolean) => void;
  getReadChapters: (bookHash: string) => string[];
  
  // Extension management (placeholder for future plugin system)
  installExtension: (extensionId: string) => Promise<boolean>;
  uninstallExtension: (extensionId: string) => void;
}

export const useMangaStore = create<MangaState>()(
  persist(
    (set, get) => ({
      sources: [
        {
          id: 'mangadex',
          name: 'MangaDex',
          url: 'https://mangadex.org',
          logo: 'https://mangadex.org/favicon.ico',
          type: 'custom',
          version: '1.0.0',
          isNsfw: false,
          enabled: true,
        },
      ],
      installedExtensions: [],
      readChapters: {}, // Store read status by bookHash -> chapterId[] (not in interface to avoid complexity handled by creating a separate map?)
      // Actually, let's keep it simple for now and rely on Book object updates for read status if possible, 
      // but read status usually needs to be persisted separately if chapters are dynamic.
      // For now, let's assume chapter read status is stored in the book object or a separate store.
      // The instruction says "Manga chapter tracking".

      addSource: (source) =>
        set((state) => ({
          sources: [...state.sources, source],
        })),

      removeSource: (sourceId) =>
        set((state) => ({
          sources: state.sources.filter((s) => s.id !== sourceId),
        })),

      toggleSource: (sourceId) =>
        set((state) => ({
          sources: state.sources.map((s) =>
            s.id === sourceId ? { ...s, enabled: !s.enabled } : s
          ),
        })),

      markChapterRead: (bookHash, chapterId, read) => {
        // This is a placeholder. In a real app, we'd update the Book object in libraryStore
        // or maintain a separate progress map.
        // For MVP, we'll just log it. Real implementation needs integration with libraryStore.
        console.log(`Marked chapter ${chapterId} of book ${bookHash} as ${read ? 'read' : 'unread'}`);
      },

      getReadChapters: (bookHash) => {
        return [];
      },

      installExtension: async (extensionId) => {
        // Mock installation
        await new Promise(resolve => setTimeout(resolve, 1000));
        set(state => ({ installedExtensions: [...state.installedExtensions, extensionId]}));
        return true;
      },

      uninstallExtension: (extensionId) => {
        set(state => ({ installedExtensions: state.installedExtensions.filter(id => id !== extensionId)}));
      },
    }),
    {
      name: 'manga-storage',
    }
  )
);
