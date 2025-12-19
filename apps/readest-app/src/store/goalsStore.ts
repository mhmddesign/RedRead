import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Goal types
 */
export type GoalType =
  | 'daily_pages'
  | 'daily_minutes'
  | 'weekly_books'
  | 'weekly_pages'
  | 'monthly_books'
  | 'yearly_books';

/**
 * Goal status
 */
export type GoalStatus = 'active' | 'completed' | 'failed' | 'paused';

/**
 * Reading Goal definition
 */
export interface ReadingGoal {
  id: string;
  type: GoalType;
  target: number;
  current: number;
  status: GoalStatus;
  startDate: number;
  endDate?: number;
  completedAt?: number;
  createdAt: number;
}

/**
 * Goal progress entry for history
 */
export interface GoalProgressEntry {
  goalId: string;
  date: string;
  progress: number;
}

/**
 * Goal templates for easy creation
 */
export const GOAL_TEMPLATES: { type: GoalType; label: string; defaultTarget: number; unit: string }[] = [
  { type: 'daily_pages', label: 'Daily Pages', defaultTarget: 20, unit: 'pages' },
  { type: 'daily_minutes', label: 'Daily Reading Time', defaultTarget: 30, unit: 'minutes' },
  { type: 'weekly_books', label: 'Weekly Books', defaultTarget: 1, unit: 'books' },
  { type: 'weekly_pages', label: 'Weekly Pages', defaultTarget: 100, unit: 'pages' },
  { type: 'monthly_books', label: 'Monthly Books', defaultTarget: 4, unit: 'books' },
  { type: 'yearly_books', label: 'Yearly Books', defaultTarget: 24, unit: 'books' },
];

/**
 * Goals State
 */
interface GoalsState {
  goals: ReadingGoal[];
  progressHistory: GoalProgressEntry[];
  lastResetCheck: number;

  // Actions
  addGoal: (type: GoalType, target: number, endDate?: number) => ReadingGoal;
  updateGoal: (goalId: string, updates: Partial<Pick<ReadingGoal, 'target' | 'status'>>) => void;
  removeGoal: (goalId: string) => void;
  updateProgress: (goalId: string, progress: number) => void;
  incrementProgress: (goalId: string, amount: number) => void;
  resetDailyGoals: () => void;
  resetWeeklyGoals: () => void;
  checkAndResetGoals: () => void;

  // Getters
  getGoal: (id: string) => ReadingGoal | undefined;
  getActiveGoals: () => ReadingGoal[];
  getCompletedGoals: () => ReadingGoal[];
  getGoalsByType: (type: GoalType) => ReadingGoal[];
  getGoalProgress: (goalId: string) => number; // percentage 0-100
  getGoalProgressHistory: (goalId: string) => GoalProgressEntry[];

  // Auto-update hooks
  onPagesRead: (pages: number) => void;
  onMinutesRead: (minutes: number) => void;
  onBookCompleted: () => void;
}

const generateGoalId = (): string => {
  return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0]!;
};

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],
      progressHistory: [],
      lastResetCheck: Date.now(),

      addGoal: (type: GoalType, target: number, endDate?: number): ReadingGoal => {
        const goal: ReadingGoal = {
          id: generateGoalId(),
          type,
          target,
          current: 0,
          status: 'active',
          startDate: Date.now(),
          endDate,
          createdAt: Date.now(),
        };

        set((state) => ({
          goals: [...state.goals, goal],
        }));

        return goal;
      },

      updateGoal: (goalId: string, updates: Partial<Pick<ReadingGoal, 'target' | 'status'>>): void => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId ? { ...g, ...updates } : g
          ),
        }));
      },

      removeGoal: (goalId: string): void => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== goalId),
          progressHistory: state.progressHistory.filter((p) => p.goalId !== goalId),
        }));
      },

      updateProgress: (goalId: string, progress: number): void => {
        const { goals } = get();
        const goal = goals.find((g) => g.id === goalId);

        if (!goal || goal.status !== 'active') return;

        const newProgress = Math.max(0, progress);
        const isCompleted = newProgress >= goal.target;

        // Record progress history
        const dateKey = getDateKey(new Date());
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  current: newProgress,
                  status: isCompleted ? 'completed' : g.status,
                  completedAt: isCompleted ? Date.now() : g.completedAt,
                }
              : g
          ),
          progressHistory: [
            ...state.progressHistory.filter(
              (p) => !(p.goalId === goalId && p.date === dateKey)
            ),
            { goalId, date: dateKey, progress: newProgress },
          ],
        }));
      },

      incrementProgress: (goalId: string, amount: number): void => {
        const goal = get().goals.find((g) => g.id === goalId);
        if (goal) {
          get().updateProgress(goalId, goal.current + amount);
        }
      },

      resetDailyGoals: (): void => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.type.startsWith('daily_') && g.status === 'active'
              ? { ...g, current: 0 }
              : g
          ),
        }));
      },

      resetWeeklyGoals: (): void => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.type.startsWith('weekly_') && g.status === 'active'
              ? { ...g, current: 0 }
              : g
          ),
        }));
      },

      checkAndResetGoals: (): void => {
        const { lastResetCheck, resetDailyGoals, resetWeeklyGoals } = get();
        const now = new Date();
        const lastCheck = new Date(lastResetCheck);

        // Check if day changed
        if (getDateKey(now) !== getDateKey(lastCheck)) {
          resetDailyGoals();

          // Check if week changed (Sunday = 0)
          if (now.getDay() === 0 && lastCheck.getDay() !== 0) {
            resetWeeklyGoals();
          }

          set({ lastResetCheck: now.getTime() });
        }
      },

      getGoal: (id: string): ReadingGoal | undefined => {
        return get().goals.find((g) => g.id === id);
      },

      getActiveGoals: (): ReadingGoal[] => {
        return get().goals.filter((g) => g.status === 'active');
      },

      getCompletedGoals: (): ReadingGoal[] => {
        return get().goals.filter((g) => g.status === 'completed');
      },

      getGoalsByType: (type: GoalType): ReadingGoal[] => {
        return get().goals.filter((g) => g.type === type);
      },

      getGoalProgress: (goalId: string): number => {
        const goal = get().goals.find((g) => g.id === goalId);
        if (!goal || goal.target === 0) return 0;
        return Math.min(100, Math.round((goal.current / goal.target) * 100));
      },

      getGoalProgressHistory: (goalId: string): GoalProgressEntry[] => {
        return get()
          .progressHistory.filter((p) => p.goalId === goalId)
          .sort((a, b) => a.date.localeCompare(b.date));
      },

      // Auto-update hooks called from other parts of the app
      onPagesRead: (pages: number): void => {
        const { goals, incrementProgress } = get();
        goals
          .filter((g) => g.status === 'active' && (g.type === 'daily_pages' || g.type === 'weekly_pages'))
          .forEach((g) => incrementProgress(g.id, pages));
      },

      onMinutesRead: (minutes: number): void => {
        const { goals, incrementProgress } = get();
        goals
          .filter((g) => g.status === 'active' && g.type === 'daily_minutes')
          .forEach((g) => incrementProgress(g.id, minutes));
      },

      onBookCompleted: (): void => {
        const { goals, incrementProgress } = get();
        goals
          .filter(
            (g) =>
              g.status === 'active' &&
              (g.type === 'weekly_books' || g.type === 'monthly_books' || g.type === 'yearly_books')
          )
          .forEach((g) => incrementProgress(g.id, 1));
      },
    }),
    {
      name: 'redread-goals-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
