import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useProgressStore } from '@/store/progressStore';
import { useAchievementsStore } from '@/store/achievementsStore';
import { useGoalsStore } from '@/store/goalsStore';
import { useLibraryStore } from '@/store/libraryStore';
import { usePremiumStore } from '@/store/premiumStore';
import {
  FiBook,
  FiClock,
  FiTrendingUp,
  FiAward,
  FiTarget,
  FiZap,
  FiCalendar,
  FiPieChart,
} from 'react-icons/fi';
import GoalsPanel from '@/components/goals/GoalsPanel';
import AchievementGrid from '@/components/achievements/AchievementGrid';
import DashboardInsights from './components/DashboardInsights';
import { RiRobot2Line } from 'react-icons/ri';

/**
 * Stat Card Component
 */
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  sublabel,
  trend,
  color = 'primary',
}) => (
  <div className='card bg-base-100 shadow-lg transition-all hover:shadow-xl'>
    <div className='card-body p-4'>
      <div className='flex items-center gap-3'>
        <div className={`text-${color} text-2xl`}>{icon}</div>
        <div className='flex-1'>
          <p className='text-neutral-content text-xs uppercase tracking-wide'>{label}</p>
          <div className='flex items-baseline gap-2'>
            <span className='text-2xl font-bold'>{value}</span>
            {sublabel && <span className='text-neutral-content text-sm'>{sublabel}</span>}
            {trend === 'up' && <FiTrendingUp className='text-success' />}
            {trend === 'down' && <FiTrendingUp className='text-error rotate-180' />}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Progress Bar Component
 */
interface ProgressBarProps {
  label: string;
  current: number;
  target: number;
  color?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, current, target, color = 'primary' }) => {
  const percentage = Math.min(100, Math.round((current / target) * 100));

  return (
    <div className='mb-4'>
      <div className='mb-1 flex justify-between text-sm'>
        <span>{label}</span>
        <span className='text-neutral-content'>
          {current} / {target}
        </span>
      </div>
      <progress className={`progress progress-${color} w-full`} value={percentage} max='100' />
    </div>
  );
};

/**
 * Achievement Badge Component
 */
interface AchievementBadgeProps {
  name: string;
  icon: string;
  unlocked: boolean;
  tier: string;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ name, icon, unlocked, tier }) => {
  const tierColors: Record<string, string> = {
    bronze: 'from-amber-600 to-amber-800',
    silver: 'from-gray-300 to-gray-500',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-cyan-300 to-cyan-500',
  };

  return (
    <div
      className={`flex flex-col items-center gap-1 ${unlocked ? '' : 'opacity-40 grayscale'}`}
      title={name}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${
          tierColors[tier] || tierColors.bronze
        } text-2xl shadow-lg`}
      >
        {icon}
      </div>
      <span className='text-xs font-medium'>{name}</span>
    </div>
  );
};

/**
 * Week Calendar Heatmap
 */
interface WeekHeatmapProps {
  data: Array<{ date: string; pagesRead: number }>;
}

const WeekHeatmap: React.FC<WeekHeatmapProps> = ({ data }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className='flex gap-2'>
      {data.map((day, index) => {
        const intensity = Math.min(100, Math.round((day.pagesRead / 50) * 100));
        return (
          <div key={day.date} className='flex flex-col items-center gap-1'>
            <div
              className='h-8 w-8 rounded'
              style={{
                backgroundColor: `hsl(142, 76%, ${100 - intensity * 0.6}%)`,
              }}
              title={`${day.date}: ${day.pagesRead} pages`}
            />
            <span className='text-neutral-content text-xs'>{days[index]}</span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Dashboard Page
 */
export default function DashboardPage() {
  const _ = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'achievements' | 'insights'>(
    'overview',
  );

  // Store hooks
  const {
    totalPagesRead,
    totalMinutesRead,
    totalBooksCompleted,
    currentStreak,
    longestStreak,
    getWeekStats,
    getTodayStats,
  } = useProgressStore();

  const { achievements, getUnlockedAchievements, getRemainingFreeUnlocks } = useAchievementsStore();

  const { getActiveGoals, getGoalProgress } = useGoalsStore();

  const { getVisibleLibrary } = useLibraryStore();

  const { isPremium } = usePremiumStore();

  // Computed values
  const todayStats = useMemo(() => getTodayStats(), [getTodayStats]);
  const weekStats = useMemo(() => getWeekStats(), [getWeekStats]);
  const unlockedAchievements = useMemo(() => getUnlockedAchievements(), [getUnlockedAchievements]);
  const activeGoals = useMemo(() => getActiveGoals(), [getActiveGoals]);
  const librarySize = useMemo(() => getVisibleLibrary().length, [getVisibleLibrary]);

  const readingSpeed = useMemo(() => {
    if (totalMinutesRead === 0) return 0;
    return Math.round((totalPagesRead / totalMinutesRead) * 60);
  }, [totalPagesRead, totalMinutesRead]);

  // Initialize achievements on mount
  useEffect(() => {
    const { initializeAchievements } = useAchievementsStore.getState();
    initializeAchievements();
  }, []);

  return (
    <div className='container mx-auto max-w-6xl p-4 lg:p-8'>
      {/* Header */}
      <div className='mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <div>
          <h1 className='text-3xl font-bold'>{_('Dashboard')}</h1>
          <p className='text-neutral-content mt-1'>{_('Your reading journey at a glance')}</p>
        </div>

        {/* Tabs */}
        <div className='tabs tabs-boxed'>
          <button
            className={`tab ${activeTab === 'overview' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FiPieChart className='mr-2' /> {_('Overview')}
          </button>
          <button
            className={`tab ${activeTab === 'goals' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('goals')}
          >
            <FiTarget className='mr-2' /> {_('Goals')}
          </button>
          <button
            className={`tab ${activeTab === 'achievements' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            <FiAward className='mr-2' /> {_('Achievements')}
          </button>
          <button
            className={`tab ${activeTab === 'insights' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            <RiRobot2Line className='mr-2' /> {_('Insights')}
          </button>
        </div>
      </div>

      {activeTab === 'goals' && <GoalsPanel />}

      {activeTab === 'achievements' && <AchievementGrid filter='all' />}

      {activeTab === 'insights' && <DashboardInsights />}

      {activeTab === 'overview' && (
        <>
          {/* Today's Stats */}
          <section className='mb-8'>
            <h2 className='mb-4 flex items-center gap-2 text-xl font-semibold'>
              <FiCalendar /> {_('Today')}
            </h2>
            <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
              <StatCard
                icon={<FiBook />}
                label={_('Pages Read')}
                value={todayStats?.pagesRead || 0}
                color='primary'
              />
              <StatCard
                icon={<FiClock />}
                label={_('Minutes Read')}
                value={todayStats?.minutesRead || 0}
                color='secondary'
              />
              <StatCard
                icon={<FiZap />}
                label={_('Current Streak')}
                value={currentStreak}
                sublabel={_('days')}
                color='accent'
              />
              <StatCard
                icon={<FiTrendingUp />}
                label={_('Sessions')}
                value={todayStats?.sessionsCount || 0}
                color='info'
              />
            </div>
          </section>

          {/* All-Time Stats */}
          <section className='mb-8'>
            <h2 className='mb-4 flex items-center gap-2 text-xl font-semibold'>
              <FiTrendingUp /> {_('All Time')}
            </h2>
            <div className='grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5'>
              <StatCard
                icon={<FiBook />}
                label={_('Total Pages')}
                value={totalPagesRead.toLocaleString()}
              />
              <StatCard
                icon={<FiClock />}
                label={_('Hours Read')}
                value={Math.round(totalMinutesRead / 60)}
              />
              <StatCard icon='📚' label={_('Books Completed')} value={totalBooksCompleted} />
              <StatCard
                icon={<FiZap />}
                label={_('Longest Streak')}
                value={longestStreak}
                sublabel={_('days')}
              />
              <StatCard
                icon='⚡'
                label={_('Reading Speed')}
                value={readingSpeed}
                sublabel={_('pages/hr')}
              />
            </div>
          </section>

          <div className='grid gap-8 lg:grid-cols-2'>
            {/* Goals Section (Summary) */}
            <section className='card bg-base-100 shadow-lg'>
              <div className='card-body'>
                <div className='flex items-center justify-between'>
                  <h2 className='card-title flex items-center gap-2'>
                    <FiTarget /> {_('Active Goals')}
                  </h2>
                  <button
                    className='btn btn-ghost btn-sm text-primary'
                    onClick={() => setActiveTab('goals')}
                  >
                    {_('Manage')}
                  </button>
                </div>

                {activeGoals.length === 0 ? (
                  <div className='text-neutral-content py-8 text-center'>
                    <FiTarget className='mx-auto mb-2 text-4xl opacity-50' />
                    <p>{_('No active goals')}</p>
                    <p className='text-sm'>{_('Set a goal to track your progress')}</p>
                  </div>
                ) : (
                  <div className='mt-4'>
                    {activeGoals.slice(0, 4).map((goal) => (
                      <ProgressBar
                        key={goal.id}
                        label={goal.type
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                        current={goal.current}
                        target={goal.target}
                        color={getGoalProgress(goal.id) >= 100 ? 'success' : 'primary'}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Achievements Section (Summary) */}
            <section className='card bg-base-100 shadow-lg'>
              <div className='card-body'>
                <div className='flex items-center justify-between'>
                  <h2 className='card-title flex items-center gap-2'>
                    <FiAward /> {_('Achievements')}
                  </h2>
                  <span className='badge badge-primary'>
                    {unlockedAchievements.length} / {achievements.length}
                  </span>
                </div>

                {!isPremium && (
                  <div className='alert alert-info mt-2'>
                    <span>
                      {_('{{remaining}} free unlocks remaining', {
                        remaining: getRemainingFreeUnlocks(),
                      })}
                    </span>
                  </div>
                )}

                <div className='mt-4 flex flex-wrap gap-4'>
                  {achievements.slice(0, 8).map((achievement) => (
                    <AchievementBadge
                      key={achievement.id}
                      name={achievement.name}
                      icon={achievement.icon}
                      unlocked={!!achievement.unlockedAt}
                      tier={achievement.tier}
                    />
                  ))}
                </div>

                <div className='mt-4 text-center'>
                  <button
                    className='btn btn-ghost btn-sm'
                    onClick={() => setActiveTab('achievements')}
                  >
                    {_('View All Achievements →')}
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Week Activity */}
          <section className='mt-8'>
            <div className='card bg-base-100 shadow-lg'>
              <div className='card-body'>
                <h2 className='card-title flex items-center gap-2'>
                  <FiCalendar /> {_('This Week')}
                </h2>
                <div className='mt-4 flex justify-center'>
                  <WeekHeatmap data={weekStats} />
                </div>
              </div>
            </div>
          </section>

          {/* Library Stats */}
          <section className='mt-8'>
            <div className='card bg-base-100 shadow-lg'>
              <div className='card-body'>
                <h2 className='card-title'>{_('Library')}</h2>
                <div className='stats stats-vertical lg:stats-horizontal'>
                  <div className='stat'>
                    <div className='stat-title'>{_('Total Books')}</div>
                    <div className='stat-value'>{librarySize}</div>
                  </div>
                  <div className='stat'>
                    <div className='stat-title'>{_('Completed')}</div>
                    <div className='stat-value'>{totalBooksCompleted}</div>
                  </div>
                  <div className='stat'>
                    <div className='stat-title'>{_('Completion Rate')}</div>
                    <div className='stat-value'>
                      {librarySize > 0 ? Math.round((totalBooksCompleted / librarySize) * 100) : 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
