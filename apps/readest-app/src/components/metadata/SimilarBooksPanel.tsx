import React, { useEffect, useState } from 'react';
import { MdInfoOutline, MdRefresh } from 'react-icons/md';
import { Book } from '@/types/book';
import { BookSuggestion, RecommendationEngine } from '@/types/recommendation';
import { LocalRecommender, GeminiRecommender } from '@/services/recommendation/recommenders';
import { useTranslation } from '@/hooks/useTranslation';
import Spinner from '@/components/Spinner';

interface SimilarBooksPanelProps {
  book: Book;
  onBookClick?: (bookId: string | Book) => void;
}

const SimilarBooksPanel: React.FC<SimilarBooksPanelProps> = ({ book, onBookClick }) => {
  const _ = useTranslation();
  const [activeTab, setActiveTab] = useState<'local' | 'ai'>('local');
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [engine, setEngine] = useState<RecommendationEngine>(new LocalRecommender());

  useEffect(() => {
    if (activeTab === 'local') {
      setEngine(new LocalRecommender());
    } else {
      // TODO: Get API key from store
      setEngine(new GeminiRecommender(''));
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const results = await engine.getRecommendations(book);
        setSuggestions(results);
      } catch (error) {
        console.error('Failed to get recommendations', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, [book, engine]);

  return (
    <div className='border-base-content/10 mt-4 border-t pt-4'>
      <div className='mb-3 flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>{_('Similar Books')}</h3>
        <div className='bg-base-200 flex rounded-lg p-1'>
          <button
            className={`rounded-md px-3 py-1 text-sm transition-colors ${
              activeTab === 'local'
                ? 'bg-white text-black shadow-sm'
                : 'text-base-content/70 hover:text-base-content'
            }`}
            onClick={() => setActiveTab('local')}
          >
            {_('Library')}
          </button>
          <button
            className={`rounded-md px-3 py-1 text-sm transition-colors ${
              activeTab === 'ai'
                ? 'bg-white text-black shadow-sm'
                : 'text-base-content/70 hover:text-base-content'
            }`}
            onClick={() => setActiveTab('ai')}
          >
            {_('AI Suggestions')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className='flex h-32 items-center justify-center'>
          <Spinner loading />
        </div>
      ) : suggestions.length > 0 ? (
        <div className='scrollbar-hide flex space-x-4 overflow-x-auto pb-2'>
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className='group relative w-24 flex-shrink-0 cursor-pointer'
              onClick={() => onBookClick && onBookClick(suggestion.bookReference || suggestion.id)}
            >
              <div className='bg-base-300 aspect-[2/3] w-full overflow-hidden rounded-md shadow-md transition-transform hover:-translate-y-1 hover:shadow-lg'>
                {suggestion.coverUrl ? (
                  <img
                    src={suggestion.coverUrl}
                    alt={suggestion.title}
                    className='h-full w-full object-cover'
                  />
                ) : (
                  <div className='bg-primary/10 text-primary flex h-full w-full items-center justify-center p-2 text-center text-xs font-medium'>
                    {suggestion.title}
                  </div>
                )}
              </div>
              <div className='mt-1 truncate text-xs font-medium'>{suggestion.title}</div>
              <div className='text-base-content/60 truncate text-[10px]'>{suggestion.author}</div>

              {suggestion.reason && (
                <div className='absolute right-0 top-0 p-1 opacity-0 transition-opacity group-hover:opacity-100'>
                  <div className='tooltip tooltip-left' data-tip={suggestion.reason}>
                    <MdInfoOutline className='text-white drop-shadow-md' />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className='text-base-content/50 flex h-32 flex-col items-center justify-center text-sm'>
          <p>{_('No similar books found.')}</p>
          {activeTab === 'ai' && (
            <p className='mt-1 text-xs'>{_('Check your API key settings.')}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SimilarBooksPanel;
