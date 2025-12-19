import React, { useEffect } from 'react';
import { Book } from '@/types/book';
import { Insets } from '@/types/misc';
import { useTranslation } from '@/hooks/useTranslation';
import { useViewerEvents } from '../hooks/useViewerEvents';

interface MangaViewerProps {
  bookKey: string;
  book: Book;
  gridInsets: Insets;
  contentInsets: Insets;
}

const MangaViewer: React.FC<MangaViewerProps> = ({ bookKey, book, gridInsets, contentInsets }) => {
  const _ = useTranslation();
  
  // Placeholder for manga content loading
  // In a real implementation, we would fetch chapter images here based on book.mangaId and book.chapters
  
  const events = useViewerEvents(bookKey);

  return (
    <div 
      className="manga-viewer h-full w-full overflow-y-auto bg-base-200 flex flex-col items-center"
      style={{
        paddingTop: contentInsets.top,
        paddingBottom: contentInsets.bottom,
        paddingLeft: contentInsets.left,
        paddingRight: contentInsets.right,
      }}
      {...events}
    >
      <div className="max-w-4xl w-full p-4 flex flex-col gap-4">
        <div className="alert alert-info shadow-sm">
          <span>{_('Manga Reader Mode (Beta)')}</span>
        </div>
        
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">{book.title}</h2>
            <p>{_('Format')}: {book.format}</p>
            {book.isManga && <div className="badge badge-secondary">Manga</div>}
            
            <div className="divider"></div>
            
            <div className="min-h-[500px] flex items-center justify-center bg-base-200 rounded-box">
              <p className="opacity-60">{_('Manga content will appear here')}</p>
              {/* Future: Image List Component */}
            </div>
            
            <div className="flex justify-between mt-4">
               <button className="btn btn-neutral">{_('Prev Chapter')}</button>
               <button className="btn btn-primary">{_('Next Chapter')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MangaViewer;
