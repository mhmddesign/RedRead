import { create } from 'zustand';
import { Book, BookGroupType, BooksGroup } from '@/types/book';
import { EnvConfigType, isTauriAppPlatform } from '@/services/environment';
import { BOOK_UNGROUPED_NAME } from '@/services/constants';
import { md5Fingerprint } from '@/utils/md5';
import { uniqueId } from '@/utils/misc';
import { useAchievementsStore } from './achievementsStore';

interface LibraryState {
  library: Book[]; // might contain deleted books
  isSyncing: boolean;
  syncProgress: number;
  checkOpenWithBooks: boolean;
  checkLastOpenBooks: boolean;
  currentBookshelf: (Book | BooksGroup)[];
  selectedBooks: Set<string>; // hashes for books, ids for groups
  groups: Record<string, string>;
  setIsSyncing: (syncing: boolean) => void;
  setSyncProgress: (progress: number) => void;
  setSelectedBooks: (ids: string[]) => void;
  getSelectedBooks: () => string[];
  toggleSelectedBook: (id: string) => void;
  getVisibleLibrary: () => Book[];
  setCheckOpenWithBooks: (check: boolean) => void;
  setCheckLastOpenBooks: (check: boolean) => void;
  setLibrary: (books: Book[]) => void;
  updateBook: (envConfig: EnvConfigType, book: Book) => void;
  setCurrentBookshelf: (bookshelf: (Book | BooksGroup)[]) => void;
  refreshGroups: () => void;
  addGroup: (name: string) => BookGroupType;
  getGroups: () => BookGroupType[];
  getGroupId: (path: string) => string | undefined;
  getGroupName: (id: string) => string | undefined;
  getParentPath: (path: string) => string | undefined;
  getGroupsByParent: (parentPath?: string) => BookGroupType[];
  // Shelf Management
  shelves: Shelf[];
  addShelf: (name: string, description?: string) => void;
  deleteShelf: (id: string) => void;
  updateShelf: (id: string, updates: Partial<Shelf>) => void;
  toggleBookInShelf: (shelfId: string, bookHash: string) => void;
  // Smart Collections
  smartCollections: SmartCollection[];
  addSmartCollection: (
    name: string,
    rules: FilterRule[],
    matchAll?: boolean,
    description?: string,
  ) => void;
  deleteSmartCollection: (id: string) => void;
  updateSmartCollection: (id: string, updates: Partial<SmartCollection>) => void;
}

export interface Shelf {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  bookHashes: string[];
  createdAt: number;
  updatedAt: number;
}

export type FilterOperator =
  | 'equals'
  | 'contains'
  | 'greaterThan'
  | 'lessThan'
  | 'startsWith'
  | 'endsWith';
export type FilterField =
  | 'title'
  | 'author'
  | 'tag'
  | 'subject'
  | 'series'
  | 'publisher'
  | 'language'
  | 'pageCount'
  | 'rating'
  | 'dateAdded'
  | 'datePublished';

export interface FilterRule {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string | number | boolean;
}

export interface SmartCollection {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  rules: FilterRule[];
  matchAll: boolean; // true = AND, false = OR
  createdAt: number;
  updatedAt: number;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  library: [],
  isSyncing: false,
  syncProgress: 0,
  currentBookshelf: [],
  selectedBooks: new Set(),
  groups: {},
  checkOpenWithBooks: isTauriAppPlatform(),
  checkLastOpenBooks: isTauriAppPlatform(),

  setIsSyncing: (syncing: boolean) => set({ isSyncing: syncing }),
  setSyncProgress: (progress: number) => set({ syncProgress: progress }),
  getVisibleLibrary: () => get().library.filter((book) => !book.deletedAt),

  setCurrentBookshelf: (bookshelf: (Book | BooksGroup)[]) => {
    set({ currentBookshelf: bookshelf });
  },

  setCheckOpenWithBooks: (check) => set({ checkOpenWithBooks: check }),
  setCheckLastOpenBooks: (check) => set({ checkLastOpenBooks: check }),
  setLibrary: (books) => {
    const { refreshGroups } = get();
    set({ library: books });
    set({ library: books });
    refreshGroups();
    useAchievementsStore.getState().checkLibrarySize(books.length);
  },
  updateBook: async (envConfig: EnvConfigType, book: Book) => {
    const appService = await envConfig.getAppService();
    const { library } = get();
    const bookIndex = library.findIndex((b) => b.hash === book.hash);
    if (bookIndex !== -1) {
      library[bookIndex] = book;
    }
    set({ library: [...library] });
    await appService.saveLibraryBooks(library);
  },

  setSelectedBooks: (ids: string[]) => {
    set({ selectedBooks: new Set(ids) });
  },

  getSelectedBooks: () => {
    return Array.from(get().selectedBooks);
  },

  toggleSelectedBook: (id: string) => {
    set((state) => {
      const newSelection = new Set(state.selectedBooks);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { selectedBooks: newSelection };
    });
  },

  refreshGroups: () => {
    const { library } = get();
    const groups: Record<string, string> = {};

    library.forEach((book) => {
      if (book.groupName && book.groupName !== BOOK_UNGROUPED_NAME && !book.deletedAt) {
        groups[md5Fingerprint(book.groupName)] = book.groupName;
        let nextSlashIndex = book.groupName.indexOf('/', 0);
        while (nextSlashIndex > 0) {
          const groupName = book.groupName.substring(0, nextSlashIndex);
          groups[md5Fingerprint(groupName)] = groupName;
          nextSlashIndex = book.groupName.indexOf('/', nextSlashIndex + 1);
        }
      }
    });

    set({ groups });
  },

  addGroup: (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Group name cannot be empty');
    }

    const id = md5Fingerprint(trimmedName);
    const { groups } = get();

    set({ groups: { ...groups, [id]: trimmedName } });

    return { id, name: trimmedName };
  },

  getGroups: () => {
    const { groups } = get();
    return Object.entries(groups)
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  getGroupId: (path: string) => {
    const { groups } = get();

    const directId = Object.entries(groups).find(([_, name]) => name === path)?.[0];
    if (directId) {
      return directId;
    }

    return md5Fingerprint(path);
  },

  getGroupName: (id: string) => {
    return get().groups[id];
  },

  getParentPath: (path: string) => {
    const lastSlashIndex = path.lastIndexOf('/');
    if (lastSlashIndex === -1) return '';
    return path.slice(0, lastSlashIndex);
  },

  getGroupsByParent: (parentPath?: string) => {
    const { groups } = get();
    const result: BookGroupType[] = [];
    Object.entries(groups).forEach(([id, name]) => {
      const groupParentPath = get().getParentPath(name);
      if (groupParentPath === (parentPath || '')) {
        result.push({ id, name });
      }
    });
    return result;
  },

  shelves: [],

  addShelf: (name: string, description?: string) => {
    const newShelf: Shelf = {
      id: uniqueId(),
      name,
      description,
      bookHashes: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({ shelves: [...state.shelves, newShelf] }));
  },

  deleteShelf: (id: string) => {
    set((state) => ({
      shelves: state.shelves.filter((s) => s.id !== id),
    }));
  },

  updateShelf: (id: string, updates: Partial<Shelf>) => {
    set((state) => ({
      shelves: state.shelves.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s,
      ),
    }));
  },

  toggleBookInShelf: (shelfId: string, bookHash: string) => {
    set((state) => ({
      shelves: state.shelves.map((s) => {
        if (s.id !== shelfId) return s;
        const hasBook = s.bookHashes.includes(bookHash);
        const newHashes = hasBook
          ? s.bookHashes.filter((h) => h !== bookHash)
          : [...s.bookHashes, bookHash];
      }),
    }));
  },

  smartCollections: [],

  addSmartCollection: (name, rules, matchAll = true, description) => {
    const newCollection: SmartCollection = {
      id: uniqueId(),
      name,
      description,
      rules,
      matchAll,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({ smartCollections: [...state.smartCollections, newCollection] }));
  },

  deleteSmartCollection: (id) => {
    set((state) => ({
      smartCollections: state.smartCollections.filter((c) => c.id !== id),
    }));
  },

  updateSmartCollection: (id, updates) => {
    set((state) => ({
      smartCollections: state.smartCollections.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c,
      ),
    }));
  },
}));
