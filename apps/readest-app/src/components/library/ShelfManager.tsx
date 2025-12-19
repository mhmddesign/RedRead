import React, { useState } from 'react';
import { useLibraryStore, Shelf } from '@/store/libraryStore';
import { useTranslation } from '@/hooks/useTranslation';
import { MdAdd, MdDelete, MdEdit, MdFolder } from 'react-icons/md';

const ShelfManager: React.FC = () => {
  const { shelves, addShelf, deleteShelf, updateShelf } = useLibraryStore();
  const _ = useTranslation();
  const [newShelfName, setNewShelfName] = useState('');
  const [editingShelfId, setEditingShelfId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAddShelf = () => {
    if (newShelfName.trim()) {
      addShelf(newShelfName.trim());
      setNewShelfName('');
    }
  };

  const handleStartEdit = (shelf: Shelf) => {
    setEditingShelfId(shelf.id);
    setEditName(shelf.name);
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      updateShelf(id, { name: editName.trim() });
      setEditingShelfId(null);
      setEditName('');
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl compact">
      <div className="card-body">
        <h3 className="card-title text-sm uppercase tracking-wide opacity-70 mb-2">
          {_('Shelves')}
        </h3>
        
        <ul className="menu bg-base-200 rounded-box p-2 mb-4">
          {shelves.length === 0 && (
            <li className="disabled">
              <a>{_('No shelves created')}</a>
            </li>
          )}
          {shelves.map((shelf) => (
            <li key={shelf.id} className="group flex flex-row items-center justify-between">
              {editingShelfId === shelf.id ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    className="input input-sm input-bordered w-full"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(shelf.id);
                      if (e.key === 'Escape') setEditingShelfId(null);
                    }}
                    autoFocus
                  />
                  <button 
                    className="btn btn-xs btn-square btn-success"
                    onClick={() => handleSaveEdit(shelf.id)}
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <a className="flex items-center gap-2 flex-grow">
                    <MdFolder className="text-secondary" />
                    <span>{shelf.name}</span>
                    <span className="badge badge-sm">{shelf.bookHashes.length}</span>
                  </a>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      className="btn btn-ghost btn-xs btn-square"
                      onClick={() => handleStartEdit(shelf)}
                    >
                      <MdEdit />
                    </button>
                    <button 
                      className="btn btn-ghost btn-xs btn-square text-error"
                      onClick={() => deleteShelf(shelf.id)}
                    >
                      <MdDelete />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <input
            type="text"
            className="input input-bordered input-sm flex-grow"
            placeholder={_('New Shelf Name...')}
            value={newShelfName}
            onChange={(e) => setNewShelfName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddShelf()}
          />
          <button 
            className="btn btn-sm btn-primary btn-square"
            onClick={handleAddShelf}
            disabled={!newShelfName.trim()}
          >
            <MdAdd className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShelfManager;
