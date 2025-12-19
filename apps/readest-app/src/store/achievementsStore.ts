import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Achievement tiers - Bronze, Silver, Gold, Platinum
 */
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

/**
 * Achievement types for categorization
 */
export type AchievementCategory =
  | 'reading'
  | 'completion'
  | 'streak'
  | 'collection'
  | 'exploration'
  | 'special';

/**
 * Achievement definition
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  tier: AchievementTier;
  target: number;
  progress: number;
  unlockedAt?: number;
  isHidden?: boolean;
}

/**
 * Certificate for completing books
 */
export interface Certificate {
  id: string;
  bookHash: string;
  bookTitle: string;
  bookAuthor: string;
  completedAt: number;
  pagesRead: number;
  readingTime: number; // in minutes
}

/**
 * Premium tier limits
 */
const FREE_TIER_ACHIEVEMENT_LIMIT = 3;

/**
 * Default achievements list
 */
const DEFAULT_ACHIEVEMENTS: Omit<Achievement, 'progress' | 'unlockedAt'>[] = [
  // Reading achievements
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Read your first book',
    icon: '📖',
    category: 'reading',
    tier: 'bronze',
    target: 1,
  },
  {
    id: 'page_turner',
    name: 'Page Turner',
    description: 'Read 100 pages',
    icon: '📚',
    category: 'reading',
    tier: 'bronze',
    target: 100,
  },
  {
    id: 'bookworm',
    name: 'Bookworm',
    description: 'Read 1,000 pages',
    icon: '🐛',
    category: 'reading',
    tier: 'silver',
    target: 1000,
  },
  {
    id: 'voracious_reader',
    name: 'Voracious Reader',
    description: 'Read 5,000 pages',
    icon: '🦋',
    category: 'reading',
    tier: 'gold',
    target: 5000,
  },
  {
    id: 'legendary_reader',
    name: 'Legendary Reader',
    description: 'Read 10,000 pages',
    icon: '🏆',
    category: 'reading',
    tier: 'platinum',
    target: 10000,
  },

  // Completion achievements
  {
    id: 'finisher',
    name: 'Finisher',
    description: 'Complete your first book',
    icon: '✅',
    category: 'completion',
    tier: 'bronze',
    target: 1,
  },
  {
    id: 'five_down',
    name: 'Five Down',
    description: 'Complete 5 books',
    icon: '🎯',
    category: 'completion',
    tier: 'silver',
    target: 5,
  },
  {
    id: 'double_digits',
    name: 'Double Digits',
    description: 'Complete 10 books',
    icon: '🔟',
    category: 'completion',
    tier: 'gold',
    target: 10,
  },
  {
    id: 'book_connoisseur',
    name: 'Book Connoisseur',
    description: 'Complete 25 books',
    icon: '🎓',
    category: 'completion',
    tier: 'platinum',
    target: 25,
  },

  // Streak achievements
  {
    id: 'getting_started',
    name: 'Getting Started',
    description: 'Read 3 days in a row',
    icon: '🔥',
    category: 'streak',
    tier: 'bronze',
    target: 3,
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Read 7 days in a row',
    icon: '⚡',
    category: 'streak',
    tier: 'silver',
    target: 7,
  },
  {
    id: 'fortnight_fighter',
    name: 'Fortnight Fighter',
    description: 'Read 14 days in a row',
    icon: '💪',
    category: 'streak',
    tier: 'gold',
    target: 14,
  },
  {
    id: 'month_master',
    name: 'Month Master',
    description: 'Read 30 days in a row',
    icon: '👑',
    category: 'streak',
    tier: 'platinum',
    target: 30,
  },

  // Collection achievements
  {
    id: 'library_builder',
    name: 'Library Builder',
    description: 'Add 10 books to your library',
    icon: '📕',
    category: 'collection',
    tier: 'bronze',
    target: 10,
  },
  {
    id: 'library_curator',
    name: 'Library Curator',
    description: 'Add 50 books to your library',
    icon: '📗',
    category: 'collection',
    tier: 'silver',
    target: 50,
  },
  {
    id: 'library_master',
    name: 'Library Master',
    description: 'Add 100 books to your library',
    icon: '📘',
    category: 'collection',
    tier: 'gold',
    target: 100,
  },

  // Exploration achievements
  {
    id: 'genre_explorer',
    name: 'Genre Explorer',
    description: 'Read books from 3 different genres',
    icon: '🧭',
    category: 'exploration',
    tier: 'bronze',
    target: 3,
  },
  {
    id: 'genre_adventurer',
    name: 'Genre Adventurer',
    description: 'Read books from 5 different genres',
    icon: '🗺️',
    category: 'exploration',
    tier: 'silver',
    target: 5,
  },

  // Time-based achievements
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Read for 30 minutes after 10 PM',
    icon: '🦉',
    category: 'special',
    tier: 'bronze',
    target: 1,
    isHidden: true,
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Read before 7 AM',
    icon: '🐦',
    category: 'special',
    tier: 'bronze',
    target: 1,
    isHidden: true,
  },
  {
    id: 'marathon_reader',
    name: 'Marathon Reader',
    description: 'Read for 2+ hours in one session',
    icon: '🏃',
    category: 'special',
    tier: 'silver',
    target: 1,
    isHidden: true,
  },
];

/**
 * Achievements State
 */
interface AchievementsState {
  achievements: Achievement[];
  certificates: Certificate[];
  totalUnlocked: number;
  isPremium: boolean;

  // Actions
  initializeAchievements: () => void;
  updateProgress: (achievementId: string, progress: number) => void;
  incrementProgress: (achievementId: string, amount?: number) => void;
  unlockAchievement: (achievementId: string) => boolean;
  addCertificate: (certificate: Omit<Certificate, 'id'>) => void;
  setPremium: (isPremium: boolean) => void;

  // Getters
  getAchievement: (id: string) => Achievement | undefined;
  getUnlockedAchievements: () => Achievement[];
  getLockedAchievements: () => Achievement[];
  getAchievementsByCategory: (category: AchievementCategory) => Achievement[];
  getCertificates: () => Certificate[];
  canUnlockMore: () => boolean;
  getRemainingFreeUnlocks: () => number;

  // Trigger checks
  checkPagesProgress: (totalPages: number) => void;
  checkBooksCompleted: (totalBooks: number) => void;
  checkStreakProgress: (currentStreak: number) => void;
  checkLibrarySize: (librarySize: number) => void;
  checkTimeBasedAchievements: (sessionMinutes: number) => void;
}

export const useAchievementsStore = create<AchievementsState>()(
  persist(
    (set, get) => ({
      achievements: [],
      certificates: [],
      totalUnlocked: 0,
      isPremium: false,

      initializeAchievements: (): void => {
        const existingAchievements = get().achievements;
        if (existingAchievements.length === 0) {
          const initialAchievements: Achievement[] = DEFAULT_ACHIEVEMENTS.map((a) => ({
            ...a,
            progress: 0,
          }));
          set({ achievements: initialAchievements });
        }
      },

      updateProgress: (achievementId: string, progress: number): void => {
        const { achievements, unlockAchievement } = get();
        const achievement = achievements.find((a) => a.id === achievementId);

        if (!achievement || achievement.unlockedAt) return;

        const newProgress = Math.min(progress, achievement.target);

        set({
          achievements: achievements.map((a) =>
            a.id === achievementId ? { ...a, progress: newProgress } : a
          ),
        });

        if (newProgress >= achievement.target) {
          unlockAchievement(achievementId);
        }
      },

      incrementProgress: (achievementId: string, amount: number = 1): void => {
        const { achievements, updateProgress } = get();
        const achievement = achievements.find((a) => a.id === achievementId);

        if (!achievement) return;

        updateProgress(achievementId, achievement.progress + amount);
      },

      unlockAchievement: (achievementId: string): boolean => {
        const { achievements, totalUnlocked, isPremium, canUnlockMore } = get();
        const achievement = achievements.find((a) => a.id === achievementId);

        if (!achievement || achievement.unlockedAt) return false;

        // Check premium limits
        if (!isPremium && !canUnlockMore()) {
          console.log('Free tier limit reached. Upgrade to premium for unlimited achievements.');
          return false;
        }

        set({
          achievements: achievements.map((a) =>
            a.id === achievementId
              ? { ...a, progress: a.target, unlockedAt: Date.now() }
              : a
          ),
          totalUnlocked: totalUnlocked + 1,
        });

        return true;
      },

      addCertificate: (certificate: Omit<Certificate, 'id'>): void => {
        const id = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        set((state) => ({
          certificates: [...state.certificates, { ...certificate, id }],
        }));
      },

      setPremium: (isPremium: boolean): void => {
        set({ isPremium });
      },

      getAchievement: (id: string): Achievement | undefined => {
        return get().achievements.find((a) => a.id === id);
      },

      getUnlockedAchievements: (): Achievement[] => {
        return get().achievements.filter((a) => a.unlockedAt);
      },

      getLockedAchievements: (): Achievement[] => {
        return get().achievements.filter((a) => !a.unlockedAt && !a.isHidden);
      },

      getAchievementsByCategory: (category: AchievementCategory): Achievement[] => {
        return get().achievements.filter((a) => a.category === category);
      },

      getCertificates: (): Certificate[] => {
        return get().certificates;
      },

      canUnlockMore: (): boolean => {
        const { totalUnlocked, isPremium } = get();
        return isPremium || totalUnlocked < FREE_TIER_ACHIEVEMENT_LIMIT;
      },

      getRemainingFreeUnlocks: (): number => {
        const { totalUnlocked, isPremium } = get();
        if (isPremium) return Infinity;
        return Math.max(0, FREE_TIER_ACHIEVEMENT_LIMIT - totalUnlocked);
      },

      // Trigger checks for different achievement types
      checkPagesProgress: (totalPages: number): void => {
        const { updateProgress } = get();
        updateProgress('page_turner', totalPages);
        updateProgress('bookworm', totalPages);
        updateProgress('voracious_reader', totalPages);
        updateProgress('legendary_reader', totalPages);
      },

      checkBooksCompleted: (totalBooks: number): void => {
        const { updateProgress } = get();
        updateProgress('first_steps', Math.min(totalBooks, 1));
        updateProgress('finisher', Math.min(totalBooks, 1));
        updateProgress('five_down', totalBooks);
        updateProgress('double_digits', totalBooks);
        updateProgress('book_connoisseur', totalBooks);
      },

      checkStreakProgress: (currentStreak: number): void => {
        const { updateProgress } = get();
        updateProgress('getting_started', currentStreak);
        updateProgress('week_warrior', currentStreak);
        updateProgress('fortnight_fighter', currentStreak);
        updateProgress('month_master', currentStreak);
      },

      checkLibrarySize: (librarySize: number): void => {
        const { updateProgress } = get();
        updateProgress('library_builder', librarySize);
        updateProgress('library_curator', librarySize);
        updateProgress('library_master', librarySize);
      },

      checkTimeBasedAchievements: (sessionMinutes: number): void => {
        const { updateProgress } = get();
        const now = new Date();
        const hour = now.getHours();

        // Night Owl: after 10 PM with 30+ mins
        if (hour >= 22 && sessionMinutes >= 30) {
          updateProgress('night_owl', 1);
        }

        // Early Bird: before 7 AM
        if (hour < 7) {
          updateProgress('early_bird', 1);
        }

        // Marathon Reader: 2+ hours
        if (sessionMinutes >= 120) {
          updateProgress('marathon_reader', 1);
        }
      },
    }),
    {
      name: 'redread-achievements-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Initialize achievements when the store loads
if (typeof window !== 'undefined') {
  const { initializeAchievements } = useAchievementsStore.getState();
  initializeAchievements();
}
