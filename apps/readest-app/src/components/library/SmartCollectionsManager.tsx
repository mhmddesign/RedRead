import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useLibraryStore } from '@/store/libraryStore';
import { SmartCollection, FilterRule } from '@/store/libraryStore';
import Dialog from '@/components/Dialog';
import { MdAdd, MdEdit, MdDelete, MdFilterList } from 'react-icons/md';
import SmartCollectionEdit from './SmartCollectionEdit';

interface SmartCollectionsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCollection?: (id: string) => void;
}

const SmartCollectionsManager: React.FC<SmartCollectionsManagerProps> = ({
  isOpen,
  onClose,
  onSelectCollection,
}) => {
  const _ = useTranslation();
  const { smartCollections, addSmartCollection, updateSmartCollection, deleteSmartCollection } =
    useLibraryStore();

  const [editingCollection, setEditingCollection] = useState<Partial<SmartCollection> | null>(null);

  const handleCreate = () => {
    setEditingCollection({
      name: '',
      rules: [],
      matchAll: true,
    });
  };

  const handleEdit = (collection: SmartCollection) => {
    setEditingCollection(collection);
  };

  const handleSave = (collection: Partial<SmartCollection>) => {
    if (collection.id) {
      updateSmartCollection(collection.id, collection);
    } else {
      if (collection.name && collection.rules) {
        addSmartCollection(
          collection.name,
          collection.rules,
          collection.matchAll,
          collection.description,
        );
      }
    }
    setEditingCollection(null);
  };

  const handleDelete = (id: string) => {
    if (confirm(_('Are you sure you want to delete this smart collection?'))) {
      deleteSmartCollection(id);
    }
  };

  return (
    <>
      <Dialog
        title={_('Smart Collections')}
        isOpen={isOpen}
        onClose={onClose}
        boxClassName='w-[500px] max-w-[90%]'
      >
        <div className='flex min-h-[300px] flex-col gap-4 p-4'>
          <div className='flex-1 space-y-2 overflow-y-auto'>
            {smartCollections.length === 0 ? (
              <div className='flex h-full flex-col items-center justify-center gap-2 p-8 opacity-60'>
                <MdFilterList className='text-4xl' />
                <span>{_('No smart collections yet')}</span>
              </div>
            ) : (
              smartCollections.map((collection) => (
                <div
                  key={collection.id}
                  className='bg-base-200 hover:bg-base-300 group flex cursor-pointer items-center justify-between rounded p-3 transition-colors'
                  onClick={() => onSelectCollection?.(collection.id)}
                >
                  <div className='flex flex-col'>
                    <span className='font-medium'>{collection.name}</span>
                    <span className='text-xs opacity-60'>
                      {collection.rules.length} {_('rules')} •{' '}
                      {collection.matchAll ? _('Match All') : _('Match Any')}
                    </span>
                  </div>
                  <div className='flex gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                    <button
                      className='btn btn-sm btn-ghost btn-square'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(collection);
                      }}
                    >
                      <MdEdit />
                    </button>
                    <button
                      className='btn btn-sm btn-ghost btn-square text-error'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(collection.id);
                      }}
                    >
                      <MdDelete />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button className='btn btn-primary w-full gap-2' onClick={handleCreate}>
            <MdAdd /> {_('Create Smart Collection')}
          </button>
        </div>
      </Dialog>

      {editingCollection && (
        <SmartCollectionEdit
          collection={editingCollection}
          isOpen={true}
          onSave={handleSave}
          onClose={() => setEditingCollection(null)}
        />
      )}
    </>
  );
};

export default SmartCollectionsManager;
