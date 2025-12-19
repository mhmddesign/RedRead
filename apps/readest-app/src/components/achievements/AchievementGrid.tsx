'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAchievementsStore, type Achievement, type AchievementCategory } from '@/store/achievementsStore';
import { usePremiumStore } from '@/store/premiumStore';
import { FiLock, FiShare2, FiAward, FiFilter } from 'react-icons/fi';

/**
 * Achievement Card Component
 */
interface AchievementCardProps {
  achievement: Achievement;
  onShare?: () => void;
}

const tierStyles: Record<string, { bg: string; border: string; glow: string }> = {
  bronze: {
    bg: 'from-amber-700 to-amber-900',
    border: 'border-amber-600',
    glow: 'shadow-amber-500/20',
  },
  silver: {
    bg: 'from-gray-400 to-gray-600',
    border: 'border-gray-400',
    glow: 'shadow-gray-400/20',
  },
  gold: {
    bg: 'from-yellow-400 to-yellow-600',
    border: 'border-yellow-500',
    glow: 'shadow-yellow-500/30',
  },
  platinum: {
    bg: 'from-cyan-400 to-cyan-600',
    border: 'border-cyan-400',
    glow: 'shadow-cyan-400/30',
  },
};

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  onShare,
}) => {
  const _ = useTranslation();
  const isUnlocked = !!achievement.unlockedAt;
  const style = tierStyles[achievement.tier] || tierStyles.bronze;
  const progress = Math.round((achievement.progress / achievement.target) * 100);

  return (
    <div
      className={`card relative overflow-hidden transition-all duration-300 ${
        isUnlocked
          ? `bg-gradient-to-br ${style.bg} ${style.glow} shadow-xl`
          : 'bg-base-200 opacity-70'
      }`}
    >
      {/* Locked overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
          <FiLock className="text-3xl text-white/50" />
        </div>
      )}

      <div className="card-body p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full text-3xl ${
              isUnlocked
                ? 'bg-white/20 shadow-inner'
                : 'bg-base-300'
            }`}
          >
            {achievement.icon}
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3
              className={`font-bold ${
                isUnlocked ? 'text-white' : 'text-base-content'
              }`}
            >
              {achievement.name}
            </h3>
            <p
              className={`text-sm ${
                isUnlocked ? 'text-white/80' : 'text-neutral-content'
              }`}
            >
              {achievement.description}
            </p>

            {/* Progress bar */}
            {!isUnlocked && (
              <div className="mt-2">
                <div className="flex justify-between text-xs">
                  <span>{achievement.progress} / {achievement.target}</span>
                  <span>{progress}%</span>
                </div>
                <progress
                  className="progress progress-primary mt-1 h-2 w-full"
                  value={progress}
                  max="100"
                />
              </div>
            )}

            {/* Unlocked date */}
            {isUnlocked && achievement.unlockedAt && (
              <p className="mt-2 text-xs text-white/60">
                {_('Unlocked')} {new Date(achievement.unlockedAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Share button */}
          {isUnlocked && onShare && (
            <button
              className="btn btn-circle btn-ghost btn-sm text-white/80 hover:text-white"
              onClick={onShare}
              title={_('Share Achievement')}
            >
              <FiShare2 />
            </button>
          )}
        </div>
      </div>

      {/* Tier badge */}
      <div
        className={`absolute right-0 top-0 rounded-bl-lg px-2 py-1 text-xs font-bold uppercase ${
          isUnlocked ? 'bg-white/20 text-white' : 'bg-base-300 text-base-content'
        }`}
      >
        {achievement.tier}
      </div>
    </div>
  );
};

/**
 * Achievement Grid Component
 */
interface AchievementGridProps {
  filter?: AchievementCategory | 'all' | 'unlocked' | 'locked';
}

export const AchievementGrid: React.FC<AchievementGridProps> = ({
  filter = 'all',
}) => {
  const _ = useTranslation();
  const { achievements } = useAchievementsStore();
  const { isPremium } = usePremiumStore();
  const [activeFilter, setActiveFilter] = useState<typeof filter>(filter);

  const filteredAchievements = achievements.filter((a) => {
    if (a.isHidden && !a.unlockedAt) return false;

    switch (activeFilter) {
      case 'unlocked':
        return !!a.unlockedAt;
      case 'locked':
        return !a.unlockedAt;
      case 'all':
        return true;
      default:
        return a.category === activeFilter;
    }
  });

  const categories: Array<{ id: AchievementCategory | 'all' | 'unlocked' | 'locked'; label: string }> = [
    { id: 'all', label: _('All') },
    { id: 'unlocked', label: _('Unlocked') },
    { id: 'locked', label: _('Locked') },
    { id: 'reading', label: _('Reading') },
    { id: 'completion', label: _('Completion') },
    { id: 'streak', label: _('Streaks') },
    { id: 'collection', label: _('Collection') },
  ];

  const handleShare = (achievement: Achievement) => {
    // TODO: Implement share functionality
    console.log('Share achievement:', achievement.name);
  };

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`btn btn-sm ${
              activeFilter === cat.id ? 'btn-primary' : 'btn-ghost'
            }`}
            onClick={() => setActiveFilter(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Premium notice */}
      {!isPremium && (
        <div className="alert alert-warning mb-6">
          <FiAward />
          <span>
            {_('Free tier: 3 achievements max. Upgrade to Premium for unlimited achievements!')}
          </span>
        </div>
      )}

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAchievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            onShare={achievement.unlockedAt ? () => handleShare(achievement) : undefined}
          />
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="py-12 text-center">
          <FiFilter className="mx-auto mb-4 text-4xl opacity-50" />
          <p className="text-neutral-content">{_('No achievements found')}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Achievement Unlock Modal
 */
interface AchievementUnlockModalProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementUnlockModal: React.FC<AchievementUnlockModalProps> = ({
  achievement,
  isOpen,
  onClose,
}) => {
  const _ = useTranslation();

  if (!achievement || !isOpen) return null;

  const style = tierStyles[achievement.tier] || tierStyles.bronze;

  return (
    <div className="modal modal-open">
      <div className={`modal-box bg-gradient-to-br ${style.bg} text-center text-white`}>
        {/* Confetti effect placeholder */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="animate-bounce absolute top-4 left-1/4 text-2xl">🎉</div>
          <div className="animate-bounce absolute top-8 right-1/4 text-2xl delay-100">✨</div>
          <div className="animate-bounce absolute top-6 left-1/3 text-xl delay-200">🌟</div>
        </div>

        <div className="relative z-10">
          <div className="mb-4 text-6xl">{achievement.icon}</div>
          <h2 className="text-2xl font-bold">{_('Achievement Unlocked!')}</h2>
          <h3 className="mt-2 text-xl">{achievement.name}</h3>
          <p className="mt-2 text-white/80">{achievement.description}</p>

          <div className="modal-action justify-center">
            <button className="btn btn-ghost text-white" onClick={onClose}>
              {_('Awesome!')}
            </button>
            <button className="btn bg-white/20 text-white hover:bg-white/30">
              <FiShare2 className="mr-2" />
              {_('Share')}
            </button>
          </div>
        </div>
      </div>
      <div className="modal-backdrop bg-black/50" onClick={onClose} />
    </div>
  );
};

export default AchievementGrid;
