import clsx from 'clsx';
import React from 'react';
import { MdFolder } from 'react-icons/md';
import { useLibraryStore } from '@/store/libraryStore';
import { useTranslation } from '@/hooks/useTranslation';

interface FolderNavigationProps {
  currentPath?: string;
  onNavigate: (path: string) => void;
}

const FolderNavigation: React.FC<FolderNavigationProps> = ({ currentPath, onNavigate }) => {
  const { getGroupsByParent } = useLibraryStore();
  const subdirs = getGroupsByParent(currentPath || '');
  const _ = useTranslation();

  if (subdirs.length === 0) {
    return null;
  }

  return (
    <div className='w-full px-4 pt-2'>
      <div className='flex flex-wrap gap-2'>
        {subdirs.map((group) => (
          <button
            key={group.id}
            onClick={() => onNavigate(group.name)}
            className={clsx(
              'btn btn-ghost btn-sm h-auto px-3 py-2',
              'flex flex-col items-center justify-center gap-1',
              'border-base-300 hover:border-base-content/20 border',
              'bg-base-200/50 hover:bg-base-200',
            )}
            title={group.name}
          >
            <MdFolder className='text-secondary h-8 w-8' />
            <span className='max-w-[100px] truncate text-xs'>{group.name.split('/').pop()}</span>
          </button>
        ))}
      </div>
      <div className='divider my-2'></div>
    </div>
  );
};

export default FolderNavigation;
