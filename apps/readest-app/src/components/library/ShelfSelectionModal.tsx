import React from 'react';
import { useLibraryStore, Shelf } from '@/store/libraryStore';
import { useTranslation } from '@/hooks/useTranslation';
import { MdFolder, MdCheck } from 'react-icons/md';
import ModalPortal from '@/components/ModalPortal';

interface ShelfSelectionModalProps {
  bookIds: string[];
  onClose: () => void;
}

const ShelfSelectionModal: React.FC<ShelfSelectionModalProps> = ({
  bookIds,
  onClose,
}) => {
  const { shelves, toggleBookInShelf, addShelf } = useLibraryStore();
  const _ = useTranslation();
  const [newShelfName, setNewShelfName] = React.useState('');

  const handleToggle = (shelf: Shelf) => {
    // If multiple books are selected, we primarily want to ADD them to the shelf.
    // Toggling effectively adds them if they aren't all there, or removes if they are.
    // A simple approach for "Add to Shelf" is to ensure they are all in.
    // But `toggleBookInShelf` handles one book. We need to iterate.
    
    // However, the user might expect a toggle behavior per book. 
    // Usually "Add to Shelf" implies adding. 
    // Let's implement a smart toggle: if any selection is NOT in shelf, add all. If all are in, remove all.
    
    const allInShelf = bookIds.every(id => shelf.bookHashes.includes(id));
    
    bookIds.forEach(id => {
      if (allInShelf) {
        // Remove all
         if (shelf.bookHashes.includes(id)) {
             toggleBookInShelf(shelf.id, id);
         }
      } else {
        // Add all (if not already present)
         if (!shelf.bookHashes.includes(id)) {
             toggleBookInShelf(shelf.id, id);
         }
      }
    });
    // We don't close automatically to allow adding to multiple shelves
  };

  const isShelfSelected = (shelf: Shelf) => {
    // Selected if ALL books are in the shelf
    return bookIds.length > 0 && bookIds.every(id => shelf.bookHashes.includes(id));
  };
  
  const isShelfPartiallySelected = (shelf: Shelf) => {
      // Partially selected if SOME but not ALL books are in the shelf
      if (bookIds.length === 0) return false;
      const count = bookIds.filter(id => shelf.bookHashes.includes(id)).length;
      return count > 0 && count < bookIds.length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className="modal-box bg-base-100 max-w-sm w-full p-0 overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-base-200 flex justify-between items-center">
            <h3 className="font-bold text-lg">{_('Add to Shelf')}</h3>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>✕</button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-2">
            {shelves.length === 0 && (
                <div className="text-center py-8 opacity-50">
                    {_('No shelves found')}
                </div>
            )}
            <ul className="menu bg-base-100 w-full p-0">
                {shelves.map(shelf => {
                    const selected = isShelfSelected(shelf);
                    const partial = isShelfPartiallySelected(shelf);
                    return (
                        <li key={shelf.id}>
                            <a onClick={() => handleToggle(shelf)} className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <MdFolder className="text-secondary text-xl" />
                                    <span>{shelf.name}</span>
                                </div>
                                <div>
                                    {selected && <MdCheck className="text-success text-xl" />}
                                    {partial && <div className="w-3 h-3 rounded-full bg-warning opacity-50" />}
                                </div>
                            </a>
                        </li>
                    );
                })}
            </ul>
        </div>
      </div>
    </div>
  );
};

export default ShelfSelectionModal;
