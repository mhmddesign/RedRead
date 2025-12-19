import React, { useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAIStore } from '@/store/aiStore';
import { useProgressStore } from '@/store/progressStore';
import { FiLoader, FiZap, FiBookOpen, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';

const DashboardInsights: React.FC = () => {
  const _ = useTranslation();
  const { isConfigured, readingAnalysis, isAnalyzing, analysisError, analyzeReading } =
    useAIStore();

  const { totalBooksCompleted, totalPagesRead, totalMinutesRead, sessions } = useProgressStore();

  const handleAnalyze = () => {
    // Gather basic stats for analysis
    const avgSessionMinutes =
      sessions.length > 0 ? Math.round(totalMinutesRead / sessions.length) : 0;

    // TODO: Get real genres from library store if possible, for now passing placeholder or derived from books
    // Since we don't have easy access to all books' genres here without heavy computation or library store access,
    // we'll pass a simplified stats object.

    analyzeReading({
      totalBooks: totalBooksCompleted,
      totalPages: totalPagesRead,
      avgSessionMinutes: avgSessionMinutes,
      genres: [], // The service might need to infer or we fetch from library if available
      completionRate: 0, // Calculate if feasible
    });
  };

  if (!isConfigured) {
    return (
      <div className='card bg-base-100 shadow-lg'>
        <div className='card-body items-center text-center'>
          <RiRobot2Line className='text-neutral-content mb-4 text-5xl' />
          <h3 className='card-title'>{_('AI Insights Disabled')}</h3>
          <p className='text-neutral-content max-w-md'>
            {_(
              'Configure your Gemini API key in Settings to unlock personalized reading analysis and book recommendations.',
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {!readingAnalysis && !isAnalyzing && (
        <div className='card bg-base-100 shadow-lg'>
          <div className='card-body items-center py-12 text-center'>
            <FiZap className='text-primary mb-4 text-5xl' />
            <h3 className='card-title mb-2 text-2xl'>{_('Unlock Reading Insights')}</h3>
            <p className='text-neutral-content mb-6 max-w-lg'>
              {_(
                'Let AI analyze your reading patterns to discover your style, habits, and get personalized book recommendations.',
              )}
            </p>
            <button className='btn btn-primary btn-lg gap-2' onClick={handleAnalyze}>
              <RiRobot2Line /> {_('Analyze My Reading')}
            </button>
            {analysisError && (
              <div className='alert alert-error mt-4 max-w-md'>
                <FiAlertCircle /> <span>{analysisError}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className='card bg-base-100 shadow-lg'>
          <div className='card-body items-center py-12 text-center'>
            <FiLoader className='text-primary mb-4 animate-spin text-4xl' />
            <h3 className='text-xl font-medium'>{_('Analyzing your reading history...')}</h3>
          </div>
        </div>
      )}

      {readingAnalysis && !isAnalyzing && (
        <>
          {/* Analysis Result */}
          <div className='grid gap-6 md:grid-cols-2'>
            <div className='card bg-base-100 shadow-lg'>
              <div className='card-body'>
                <h3 className='card-title flex items-center gap-2'>
                  <FiBookOpen className='text-primary' /> {_('Reading Style')}
                </h3>
                <div className='divider my-2'></div>

                <div className='space-y-4'>
                  <div>
                    <div className='text-neutral-content mb-1 text-sm font-semibold uppercase tracking-wider'>
                      {_('Favorite Genres')}
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {readingAnalysis.favoriteGenres.map((genre) => (
                        <span key={genre} className='badge badge-outline'>
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className='text-neutral-content mb-1 text-sm font-semibold uppercase tracking-wider'>
                      {_('Habits')}
                    </div>
                    <p className='text-sm'>{readingAnalysis.readingPatterns.preferredTime}</p>
                  </div>

                  <div className='stats w-full shadow'>
                    <div className='stat place-items-center'>
                      <div className='stat-title'>{_('Est. Books/Year')}</div>
                      <div className='stat-value text-secondary text-2xl'>
                        {readingAnalysis.readingPatterns.booksPerMonth * 12}
                      </div>
                    </div>
                    <div className='stat place-items-center'>
                      <div className='stat-title'>{_('Avg Session')}</div>
                      <div className='stat-value text-2xl'>
                        {readingAnalysis.readingPatterns.avgSessionLength}m
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='card bg-base-100 shadow-lg'>
              <div className='card-body'>
                <h3 className='card-title flex items-center gap-2'>
                  <FiZap className='text-accent' /> {_('Recommendations')}
                </h3>
                <div className='divider my-2'></div>

                <ul className='space-y-3'>
                  {readingAnalysis.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className='hover:bg-base-200 flex items-start gap-3 rounded-lg p-2 transition-colors'
                    >
                      <span className='badge badge-ghost badge-sm mt-0.5'>{i + 1}</span>
                      <span className='text-sm'>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className='flex justify-center'>
            <button className='btn btn-ghost gap-2' onClick={handleAnalyze}>
              <FiRefreshCw /> {_('Refresh Analysis')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardInsights;
