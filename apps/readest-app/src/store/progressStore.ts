import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAchievementsStore } from './achievementsStore';
import { useGoalsStore } from './goalsStore';

/**
 * Reading Session - tracks individual reading periods
 */
export interface ReadingSession {
  id: string;
  bookHash: string;
  bookTitle: string;
  startTime: number; // Unix timestamp
  endTime: number; // Unix timestamp
  pagesRead: number;
  startPage: number;
  endPage: number;
}

/**
 * Daily Reading Stats
 */
export interface DailyStats {
  date: string; // YYYY-MM-DD format
  pagesRead: number;
  minutesRead: number;
  sessionsCount: number;
  booksRead: string[]; // Book hashes
}

/**
 * Progress State - manages reading progress tracking
 */
interface ProgressState {
  // Data
  sessions: ReadingSession[];
  dailyStats: Map<string, DailyStats>;
  currentStreak: number;
  longestStreak: number;
  totalPagesRead: number;
  totalMinutesRead: number;
  totalBooksCompleted: number;

  // Actions
  startSession: (bookHash: string, bookTitle: string, startPage: number) => string;
  endSession: (sessionId: string, endPage: number) => void;
  updateSession: (sessionId: string, currentPage: number) => void;
  recordBookCompletion: (bookHash: string) => void;

  // Getters
  getTodayStats: () => DailyStats | null;
  getWeekStats: () => DailyStats[];
  getMonthStats: () => DailyStats[];
  getStreakInfo: () => { current: number; longest: number };
  getReadingSpeed: () => number; // pages per hour

  // Internal
  _calculateStreak: () => void;
  _getDateKey: (date: Date) => string;
}

const getDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0]!;
};

const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      sessions: [],
      dailyStats: new Map(),
      currentStreak: 0,
      longestStreak: 0,
      totalPagesRead: 0,
      totalMinutesRead: 0,
      totalBooksCompleted: 0,

      startSession: (bookHash: string, bookTitle: string, startPage: number): string => {
        const sessionId = generateSessionId();
        const session: ReadingSession = {
          id: sessionId,
          bookHash,
          bookTitle,
          startTime: Date.now(),
          endTime: 0,
          pagesRead: 0,
          startPage,
          endPage: startPage,
        };

        set((state) => ({
          sessions: [...state.sessions, session],
        }));

        return sessionId;
      },

      endSession: (sessionId: string, endPage: number): void => {
        const { sessions, _calculateStreak } = get();
        const sessionIndex = sessions.findIndex((s) => s.id === sessionId);

        if (sessionIndex === -1) return;

        const session = sessions[sessionIndex]!;
        const endTime = Date.now();
        const pagesRead = Math.max(0, endPage - session.startPage);
        const minutesRead = Math.round((endTime - session.startTime) / 60000);

        const updatedSession: ReadingSession = {
          ...session,
          endTime,
          endPage,
          pagesRead,
        };

        // Update daily stats
        const dateKey = getDateKey(new Date());
        const dailyStats = new Map(get().dailyStats);
        const todayStats = dailyStats.get(dateKey) || {
          date: dateKey,
          pagesRead: 0,
          minutesRead: 0,
          sessionsCount: 0,
          booksRead: [],
        };

        todayStats.pagesRead += pagesRead;
        todayStats.minutesRead += minutesRead;
        todayStats.sessionsCount += 1;
        if (!todayStats.booksRead.includes(session.bookHash)) {
          todayStats.booksRead.push(session.bookHash);
        }
        dailyStats.set(dateKey, todayStats);

        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === sessionId ? updatedSession : s)),
          dailyStats,
          totalPagesRead: state.totalPagesRead + pagesRead,
          totalMinutesRead: state.totalMinutesRead + minutesRead,
        }));

        // Trigger Achievement Checks
        const { checkPagesProgress, checkTimeBasedAchievements } = useAchievementsStore.getState();
        checkPagesProgress(get().totalPagesRead);
        checkTimeBasedAchievements(minutesRead);

        // Limit goal updates: check reset first
        const { onPagesRead, onMinutesRead, checkAndResetGoals } = useGoalsStore.getState();
        checkAndResetGoals();
        onPagesRead(pagesRead);
        onMinutesRead(minutesRead);

        _calculateStreak();
      },

      updateSession: (sessionId: string, currentPage: number): void => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, endPage: currentPage } : s,
          ),
        }));
      },

      recordBookCompletion: (bookHash: string): void => {
        set((state) => ({
          totalBooksCompleted: state.totalBooksCompleted + 1,
        }));
        useAchievementsStore.getState().checkBooksCompleted(get().totalBooksCompleted);
        useGoalsStore.getState().onBookCompleted();
      },

      getTodayStats: (): DailyStats | null => {
        const dateKey = getDateKey(new Date());
        return get().dailyStats.get(dateKey) || null;
      },

      getWeekStats: (): DailyStats[] => {
        const stats: DailyStats[] = [];
        const dailyStats = get().dailyStats;
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateKey = getDateKey(date);
          const dayStats = dailyStats.get(dateKey);
          if (dayStats) {
            stats.push(dayStats);
          } else {
            stats.push({
              date: dateKey,
              pagesRead: 0,
              minutesRead: 0,
              sessionsCount: 0,
              booksRead: [],
            });
          }
        }

        return stats;
      },

      getMonthStats: (): DailyStats[] => {
        const stats: DailyStats[] = [];
        const dailyStats = get().dailyStats;
        const today = new Date();

        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateKey = getDateKey(date);
          const dayStats = dailyStats.get(dateKey);
          if (dayStats) {
            stats.push(dayStats);
          } else {
            stats.push({
              date: dateKey,
              pagesRead: 0,
              minutesRead: 0,
              sessionsCount: 0,
              booksRead: [],
            });
          }
        }

        return stats;
      },

      getStreakInfo: () => {
        const { currentStreak, longestStreak } = get();
        return { current: currentStreak, longest: longestStreak };
      },

      getReadingSpeed: (): number => {
        const { totalPagesRead, totalMinutesRead } = get();
        if (totalMinutesRead === 0) return 0;
        return Math.round((totalPagesRead / totalMinutesRead) * 60);
      },

      _calculateStreak: (): void => {
        const dailyStats = get().dailyStats;
        const today = new Date();
        let streak = 0;
        let date = new Date(today);

        // Check backwards from today
        while (true) {
          const dateKey = getDateKey(date);
          const stats = dailyStats.get(dateKey);

          if (stats && stats.pagesRead > 0) {
            streak++;
            date.setDate(date.getDate() - 1);
          } else {
            break;
          }
        }

        set((state) => ({
          currentStreak: streak,
          longestStreak: Math.max(state.longestStreak, streak),
        }));

        // Trigger Streak Achievement Check
        useAchievementsStore.getState().checkStreakProgress(streak);
      },

      _getDateKey: getDateKey,
    }),
    {
      name: 'redread-progress-store',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: {
              ...state,
              dailyStats: new Map(Object.entries(state.dailyStats)),
            },
          };
        },
        setItem: (name, value) => {
          const state = {
            ...value.state,
            dailyStats: Object.fromEntries(value.state.dailyStats),
          };
          localStorage.setItem(name, JSON.stringify({ state, version: value.version }));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (state) => ({
        sessions: state.sessions.slice(-100), // Keep last 100 sessions
        dailyStats: state.dailyStats, // handled by custom setItem
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        totalPagesRead: state.totalPagesRead,
        totalMinutesRead: state.totalMinutesRead,
        totalBooksCompleted: state.totalBooksCompleted,
      }),
    },
  ),
);
