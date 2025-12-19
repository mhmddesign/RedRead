import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Days of the week (0 = Sunday, 6 = Saturday)
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Reminder type
 */
export type ReminderType = 'daily' | 'custom' | 'goal_reminder' | 'streak_reminder';

import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

/**
 * Reminder definition
 */
export interface Reminder {
  id: string;
  type: ReminderType;
  enabled: boolean;
  time: string; // HH:MM format in 24h
  days: DayOfWeek[]; // Days when reminder is active
  message: string;
  lastTriggered?: number;
  createdAt: number;
}

/**
 * Notification history entry
 */
export interface NotificationEntry {
  id: string;
  reminderId: string;
  message: string;
  triggeredAt: number;
  dismissed: boolean;
}

/**
 * Default reminder messages
 */
const DEFAULT_MESSAGES = {
  daily: 'Time to read! 📚 Your next great adventure awaits.',
  goal_reminder: "Don't forget your reading goal for today! 🎯",
  streak_reminder: 'Keep your streak alive! 🔥 Read a few pages today.',
};

/**
 * Reminders State
 */
interface RemindersState {
  reminders: Reminder[];
  notifications: NotificationEntry[];
  notificationsEnabled: boolean;

  // Actions
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'lastTriggered'>) => Reminder;
  updateReminder: (
    reminderId: string,
    updates: Partial<Omit<Reminder, 'id' | 'createdAt'>>,
  ) => void;
  removeReminder: (reminderId: string) => void;
  toggleReminder: (reminderId: string) => void;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  sendTestNotification: () => Promise<void>;

  // Notification management
  addNotification: (reminderId: string, message: string) => void;
  dismissNotification: (notificationId: string) => void;
  clearOldNotifications: () => void;

  // Getters
  getReminder: (id: string) => Reminder | undefined;
  getActiveReminders: () => Reminder[];
  getPendingNotifications: () => NotificationEntry[];
  getRemindersForDay: (day: DayOfWeek) => Reminder[];

  // Trigger checks
  checkReminders: () => Reminder[];
  shouldTriggerReminder: (reminder: Reminder) => boolean;

  // Quick setup helpers
  setupDailyReminder: (time: string) => Reminder;
  setupGoalReminder: (time: string) => Reminder;
  setupStreakReminder: () => Reminder;
}

const generateReminderId = (): string => {
  return `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateNotificationId = (): string => {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours: hours || 0, minutes: minutes || 0 };
};

export const useRemindersStore = create<RemindersState>()(
  persist(
    (set, get) => ({
      reminders: [],
      notifications: [],
      notificationsEnabled: true,

      addReminder: (reminder): Reminder => {
        const newReminder: Reminder = {
          ...reminder,
          id: generateReminderId(),
          createdAt: Date.now(),
        };

        set((state) => ({
          reminders: [...state.reminders, newReminder],
        }));

        return newReminder;
      },

      updateReminder: (reminderId: string, updates): void => {
        set((state) => ({
          reminders: state.reminders.map((r) => (r.id === reminderId ? { ...r, ...updates } : r)),
        }));
      },

      removeReminder: (reminderId: string): void => {
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== reminderId),
        }));
      },

      toggleReminder: (reminderId: string): void => {
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === reminderId ? { ...r, enabled: !r.enabled } : r,
          ),
        }));
      },

      setNotificationsEnabled: async (enabled: boolean): Promise<void> => {
        if (enabled) {
          let granted = await isPermissionGranted();
          if (!granted) {
            const permission = await requestPermission();
            granted = permission === 'granted';
          }

          if (!granted) {
            console.warn('Notification permission denied');
            set({ notificationsEnabled: false });
            return;
          }
        }
        set({ notificationsEnabled: enabled });
      },

      sendTestNotification: async (): Promise<void> => {
        let granted = await isPermissionGranted();
        if (!granted) {
          const permission = await requestPermission();
          granted = permission === 'granted';
        }

        if (granted) {
          sendNotification({
            title: 'RedRead Test',
            body: 'This is a test notification from RedRead! 📚',
          });
        } else {
          console.warn('Cannot send test notification: permission denied');
        }
      },

      addNotification: (reminderId: string, message: string): void => {
        const { notificationsEnabled } = get();

        const notification: NotificationEntry = {
          id: generateNotificationId(),
          reminderId,
          message,
          triggeredAt: Date.now(),
          dismissed: false,
        };

        set((state) => ({
          notifications: [...state.notifications, notification],
          reminders: state.reminders.map((r) =>
            r.id === reminderId ? { ...r, lastTriggered: Date.now() } : r,
          ),
        }));

        if (notificationsEnabled) {
          sendNotification({
            title: 'RedRead Reminder',
            body: message,
          });
        }
      },

      dismissNotification: (notificationId: string): void => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, dismissed: true } : n,
          ),
        }));
      },

      clearOldNotifications: (): void => {
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        set((state) => ({
          notifications: state.notifications.filter(
            (n) => n.triggeredAt > oneWeekAgo || !n.dismissed,
          ),
        }));
      },

      getReminder: (id: string): Reminder | undefined => {
        return get().reminders.find((r) => r.id === id);
      },

      getActiveReminders: (): Reminder[] => {
        return get().reminders.filter((r) => r.enabled);
      },

      getPendingNotifications: (): NotificationEntry[] => {
        return get().notifications.filter((n) => !n.dismissed);
      },

      getRemindersForDay: (day: DayOfWeek): Reminder[] => {
        return get().reminders.filter((r) => r.enabled && r.days.includes(day));
      },

      checkReminders: (): Reminder[] => {
        const { reminders, notificationsEnabled, shouldTriggerReminder, addNotification } = get();

        if (!notificationsEnabled) return [];

        const triggeredReminders: Reminder[] = [];

        reminders.forEach((reminder) => {
          if (shouldTriggerReminder(reminder)) {
            addNotification(reminder.id, reminder.message);
            triggeredReminders.push(reminder);
          }
        });

        return triggeredReminders;
      },

      shouldTriggerReminder: (reminder: Reminder): boolean => {
        if (!reminder.enabled) return false;

        const now = new Date();
        const currentDay = now.getDay() as DayOfWeek;
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        // Check if today is an active day
        if (!reminder.days.includes(currentDay)) return false;

        // Check if it's the right time (within 1 minute window)
        const { hours: reminderHours, minutes: reminderMinutes } = parseTime(reminder.time);
        const { hours: currentHours, minutes: currentMinutes } = parseTime(currentTime);

        if (reminderHours !== currentHours || Math.abs(reminderMinutes - currentMinutes) > 1) {
          return false;
        }

        // Check if already triggered today
        if (reminder.lastTriggered) {
          const lastTriggeredDate = new Date(reminder.lastTriggered);
          if (
            lastTriggeredDate.getDate() === now.getDate() &&
            lastTriggeredDate.getMonth() === now.getMonth() &&
            lastTriggeredDate.getFullYear() === now.getFullYear()
          ) {
            return false;
          }
        }

        return true;
      },

      // Quick setup helpers
      setupDailyReminder: (time: string): Reminder => {
        return get().addReminder({
          type: 'daily',
          enabled: true,
          time,
          days: [0, 1, 2, 3, 4, 5, 6], // Every day
          message: DEFAULT_MESSAGES.daily,
        });
      },

      setupGoalReminder: (time: string): Reminder => {
        return get().addReminder({
          type: 'goal_reminder',
          enabled: true,
          time,
          days: [0, 1, 2, 3, 4, 5, 6],
          message: DEFAULT_MESSAGES.goal_reminder,
        });
      },

      setupStreakReminder: (): Reminder => {
        // Default to 8 PM reminder to maintain streak
        return get().addReminder({
          type: 'streak_reminder',
          enabled: true,
          time: '20:00',
          days: [0, 1, 2, 3, 4, 5, 6],
          message: DEFAULT_MESSAGES.streak_reminder,
        });
      },
    }),
    {
      name: 'redread-reminders-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
