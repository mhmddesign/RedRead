import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Subscription types
 */
export type SubscriptionType = 'monthly' | 'yearly' | 'lifetime';

/**
 * Feature names that can be gated
 */
export type PremiumFeature =
  | 'unlimited_achievements'
  | 'ai_suggestions'
  | 'advanced_analytics'
  | 'cloud_sync'
  | 'custom_themes'
  | 'audiobook_import'
  | 'manga_sources'
  | 'bionic_reading'
  | 'export_certificates';

/**
 * Feature gate configuration
 * - 'free': Available to all users
 * - 'limited': Available with usage limits
 * - 'premium': Premium only
 */
export type FeatureAccess = 'free' | 'limited' | 'premium';

/**
 * Feature gate definitions
 */
export const FEATURE_GATES: Record<PremiumFeature, FeatureAccess> = {
  unlimited_achievements: 'premium',
  ai_suggestions: 'limited', // 3 free per month
  advanced_analytics: 'premium',
  cloud_sync: 'premium',
  custom_themes: 'premium',
  audiobook_import: 'premium',
  manga_sources: 'premium',
  bionic_reading: 'free', // Free feature for accessibility
  export_certificates: 'limited', // 3 free exports
};

/**
 * Usage limits for 'limited' features
 */
export const FEATURE_LIMITS: Partial<Record<PremiumFeature, number>> = {
  ai_suggestions: 3,
  export_certificates: 3,
};

/**
 * Premium subscription info
 */
export interface Subscription {
  type: SubscriptionType;
  startDate: number;
  expiresAt?: number; // undefined for lifetime
  isActive: boolean;
}

/**
 * Premium State
 */
interface PremiumState {
  // Subscription status
  isPremium: boolean;
  subscription: Subscription | null;

  // Usage tracking for limited features
  usageThisMonth: Record<string, number>;
  usageResetDate: number;

  // Actions
  setPremium: (isPremium: boolean) => void;
  setSubscription: (subscription: Subscription | null) => void;
  incrementUsage: (feature: PremiumFeature) => boolean;
  resetMonthlyUsage: () => void;
  checkAndResetUsage: () => void;

  // Feature access checks
  hasFeatureAccess: (feature: PremiumFeature) => boolean;
  getRemainingUsage: (feature: PremiumFeature) => number;
  getFeatureStatus: (feature: PremiumFeature) => {
    access: FeatureAccess;
    available: boolean;
    remaining?: number;
    limit?: number;
  };

  // Subscription status
  isSubscriptionActive: () => boolean;
  getSubscriptionDaysRemaining: () => number | null;
  getSubscriptionStatus: () => 'active' | 'expired' | 'none';
}

const getMonthKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      isPremium: false,
      subscription: null,
      usageThisMonth: {},
      usageResetDate: Date.now(),

      setPremium: (isPremium: boolean): void => {
        set({ isPremium });
      },

      setSubscription: (subscription: Subscription | null): void => {
        const isPremium = subscription?.isActive ?? false;
        set({ subscription, isPremium });
      },

      incrementUsage: (feature: PremiumFeature): boolean => {
        const { isPremium, usageThisMonth, hasFeatureAccess } = get();

        // Premium users have unlimited access
        if (isPremium) return true;

        // Check if feature is accessible
        if (!hasFeatureAccess(feature)) return false;

        const gate = FEATURE_GATES[feature];
        if (gate === 'free') return true;

        if (gate === 'limited') {
          const limit = FEATURE_LIMITS[feature] || 0;
          const currentUsage = usageThisMonth[feature] || 0;

          if (currentUsage >= limit) return false;

          set({
            usageThisMonth: {
              ...usageThisMonth,
              [feature]: currentUsage + 1,
            },
          });
          return true;
        }

        return false;
      },

      resetMonthlyUsage: (): void => {
        set({
          usageThisMonth: {},
          usageResetDate: Date.now(),
        });
      },

      checkAndResetUsage: (): void => {
        const { usageResetDate, resetMonthlyUsage } = get();
        const now = new Date();
        const resetDate = new Date(usageResetDate);

        if (getMonthKey(now) !== getMonthKey(resetDate)) {
          resetMonthlyUsage();
        }
      },

      hasFeatureAccess: (feature: PremiumFeature): boolean => {
        const { isPremium, usageThisMonth } = get();
        const gate = FEATURE_GATES[feature];

        if (gate === 'free') return true;
        if (isPremium) return true;

        if (gate === 'limited') {
          const limit = FEATURE_LIMITS[feature] || 0;
          const currentUsage = usageThisMonth[feature] || 0;
          return currentUsage < limit;
        }

        return false;
      },

      getRemainingUsage: (feature: PremiumFeature): number => {
        const { isPremium, usageThisMonth } = get();
        const gate = FEATURE_GATES[feature];

        if (gate === 'free' || isPremium) return Infinity;

        if (gate === 'limited') {
          const limit = FEATURE_LIMITS[feature] || 0;
          const currentUsage = usageThisMonth[feature] || 0;
          return Math.max(0, limit - currentUsage);
        }

        return 0;
      },

      getFeatureStatus: (feature: PremiumFeature) => {
        const { isPremium, hasFeatureAccess, getRemainingUsage } = get();
        const gate = FEATURE_GATES[feature];
        const limit = FEATURE_LIMITS[feature];

        return {
          access: gate,
          available: hasFeatureAccess(feature),
          remaining: gate === 'limited' && !isPremium ? getRemainingUsage(feature) : undefined,
          limit: gate === 'limited' && !isPremium ? limit : undefined,
        };
      },

      isSubscriptionActive: (): boolean => {
        const { subscription } = get();
        if (!subscription) return false;

        // Lifetime subscriptions never expire
        if (subscription.type === 'lifetime') return true;

        // Check expiration
        if (subscription.expiresAt && subscription.expiresAt < Date.now()) {
          return false;
        }

        return subscription.isActive;
      },

      getSubscriptionDaysRemaining: (): number | null => {
        const { subscription } = get();
        if (!subscription) return null;
        if (subscription.type === 'lifetime') return null; // Infinite

        if (subscription.expiresAt) {
          const remaining = subscription.expiresAt - Date.now();
          return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
        }

        return null;
      },

      getSubscriptionStatus: (): 'active' | 'expired' | 'none' => {
        const { subscription, isSubscriptionActive } = get();
        if (!subscription) return 'none';
        return isSubscriptionActive() ? 'active' : 'expired';
      },
    }),
    {
      name: 'redread-premium-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/**
 * Hook to check feature access with automatic usage check
 */
export const useFeatureAccess = (feature: PremiumFeature) => {
  const store = usePremiumStore();

  // Check and reset usage on mount
  store.checkAndResetUsage();

  return {
    hasAccess: store.hasFeatureAccess(feature),
    remaining: store.getRemainingUsage(feature),
    status: store.getFeatureStatus(feature),
    use: () => store.incrementUsage(feature),
  };
};
