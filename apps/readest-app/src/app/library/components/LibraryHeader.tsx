import clsx from 'clsx';
import React, { useCallback, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaSearch } from 'react-icons/fa';
import { PiPlus } from 'react-icons/pi';
import { PiSelectionAll, PiSelectionAllFill } from 'react-icons/pi';
import { PiDotsThreeCircle } from 'react-icons/pi';
import { Shelf, SmartCollection } from '@/store/libraryStore';
import { MdOutlineMenu, MdMenuBook, MdFolder, MdFilterList } from 'react-icons/md';

interface LibraryHeaderProps {
  isSelectMode: boolean;
  isSelectAll: boolean;
  onImportBooksFromFiles: () => void;
  onImportBooksFromDirectory?: () => void;
  onOpenCatalogManager: () => void;
  onToggleSelectMode: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleShelfManager: () => void;
  onToggleSmartCollectionsManager: () => void;
  shelves: Shelf[];
  smartCollections: SmartCollection[];
  selectedShelfId: string | null;
  onSelectShelf: (id: string | null) => void;
}

const LibraryHeader: React.FC<LibraryHeaderProps> = ({
  isSelectMode,
  isSelectAll,
  onImportBooksFromFiles,
  onImportBooksFromDirectory,
  onOpenCatalogManager,
  onToggleSelectMode,
  onSelectAll,
  onDeselectAll,
  onToggleShelfManager,
  onToggleSmartCollectionsManager,
  shelves,
  smartCollections,
  selectedShelfId,
  onSelectShelf,
}) => {
  const _ = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { appService } = useEnv();
  const { settings } = useSettingsStore();
  const { systemUIVisible, statusBarHeight } = useThemeStore();
  const { currentBookshelf } = useLibraryStore();
  const { isTrafficLightVisible } = useTrafficLight();
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') ?? '');

  const viewSettings = settings.globalViewSettings;
  const headerRef = useRef<HTMLDivElement>(null);
  const iconSize18 = useResponsiveSize(18);
  const { safeAreaInsets: insets } = useThemeStore();

  useShortcuts({
    onToggleSelectMode,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdateQueryParam = useCallback(
    debounce((value: string) => {
      const params = new URLSearchParams(searchParams?.toString());
      if (value) {
        params.set('q', value);
      } else {
        params.delete('q');
      }
      router.push(`?${params.toString()}`);
    }, 500),
    [searchParams],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    debouncedUpdateQueryParam(newQuery);
  };

  const windowButtonVisible = appService?.hasWindowBar && !isTrafficLightVisible;
  const currentBooksCount = currentBookshelf.reduce(
    (acc, item) => acc + ('books' in item ? item.books.length : 1),
    0,
  );

  if (!insets) return null;

  const isMobile = appService?.isMobile || window.innerWidth <= 640;

  return (
    <div
      ref={headerRef}
      className={clsx(
        'titlebar z-10 flex h-[52px] w-full items-center py-2 pr-4 sm:h-[48px]',
        windowButtonVisible ? 'sm:pr-4' : 'sm:pr-6',
        isTrafficLightVisible ? 'pl-16' : 'pl-0 sm:pl-2',
      )}
      style={{
        marginTop: appService?.hasSafeAreaInset
          ? `max(${insets.top}px, ${systemUIVisible ? statusBarHeight : 0}px)`
          : '0px',
      }}
    >
      <div className='flex w-full items-center justify-between space-x-6 sm:space-x-12'>
        <div className='exclude-title-bar-mousedown relative flex w-full items-center pl-4'>
          <div className='relative flex h-9 w-full items-center sm:h-7'>
            <span className='text-base-content/50 absolute left-3'>
              <FaSearch className='h-4 w-4' />
            </span>
            <input
              type='text'
              value={searchQuery}
              placeholder={
                currentBooksCount > 1
                  ? _('Search in {{count}} Book(s)...', {
                      count: currentBooksCount,
                    })
                  : _('Search Books...')
              }
              onChange={handleSearchChange}
              spellCheck='false'
              className={clsx(
                'input rounded-badge h-9 w-full pl-10 pr-[30%] sm:h-7',
                viewSettings?.isEink
                  ? 'border-1 border-base-content focus:border-base-content'
                  : 'bg-base-300/45 border-none',
                'font-sans text-sm font-light',
                'placeholder:text-base-content/50 truncate',
                'focus:outline-none focus:ring-0',
              )}
            />
          </div>
          <div className='text-base-content/50 absolute right-4 flex items-center space-x-2 sm:space-x-4'>
            {searchQuery && (
              <button
                type='button'
                onClick={() => {
                  setSearchQuery('');
                  debouncedUpdateQueryParam('');
                }}
                className='text-base-content/40 hover:text-base-content/60 pe-1'
                aria-label={_('Clear Search')}
              >
                <IoMdCloseCircle className='h-4 w-4' />
              </button>
            )}
            <span className='bg-base-content/50 mx-2 h-4 w-[0.5px]'></span>
            <Dropdown
              label={_('Import Books')}
              className={clsx(
                'exclude-title-bar-mousedown dropdown-bottom dropdown-center flex h-6 cursor-pointer justify-center',
              )}
              buttonClassName='p-0 h-6 min-h-6 w-6 flex touch-target items-center justify-center !bg-transparent'
              toggleButton={<PiPlus role='none' className='m-0.5 h-5 w-5' />}
            >
              <ImportMenu
                onImportBooksFromFiles={onImportBooksFromFiles}
                onImportBooksFromDirectory={onImportBooksFromDirectory}
                onOpenCatalogManager={onOpenCatalogManager}
              />
            </Dropdown>
            {isMobile ? null : (
              <button
                onClick={onToggleSelectMode}
                aria-label={_('Select Books')}
                title={_('Select Books')}
                className='h-6'
              >
                {isSelectMode ? (
                  <PiSelectionAllFill role='button' className='text-base-content/60 h-6 w-6' />
                ) : (
                  <PiSelectionAll role='button' className='text-base-content/60 h-6 w-6' />
                )}
              </button>
            )}
          </div>
        </div>
        {isSelectMode ? (
          <div
            className={clsx(
              'flex h-full items-center',
              'w-max-[72px] w-min-[72px] sm:w-max-[80px] sm:w-min-[80px]',
            )}
          >
            <button
              onClick={isSelectAll ? onDeselectAll : onSelectAll}
              className='btn btn-ghost text-base-content/85 h-8 min-h-8 w-[72px] p-0 sm:w-[80px]'
              aria-label={isSelectAll ? _('Deselect') : _('Select All')}
            >
              <span className='font-sans text-base font-normal sm:text-sm'>
                {isSelectAll ? _('Deselect') : _('Select All')}
              </span>
            </button>
          </div>
        ) : (
          <div className='flex h-full items-center gap-x-2 sm:gap-x-4'>
            <button
              className='btn btn-ghost flex h-8 min-h-8 w-8 items-center justify-center p-0'
              onClick={() => router.push('/dashboard')}
              title={_('Dashboard')}
              aria-label={_('Dashboard')}
            >
              <IoMdAnalytics size={iconSize18} />
            </button>
            <Dropdown
              label={_('Shelves')}
              className='exclude-title-bar-mousedown dropdown-bottom dropdown-end'
              buttonClassName={clsx(
                'btn btn-ghost h-8 min-h-8 w-8 p-0',
                selectedShelfId && 'text-primary',
              )}
              toggleButton={<MdFolder role='none' size={iconSize18} />}
            >
              <ul className='menu menu-sm bg-base-200 rounded-box max-h-64 w-52 flex-nowrap overflow-y-auto'>
                <li>
                  <button
                    type='button'
                    className={clsx(!selectedShelfId && 'active', 'text-left')}
                    onClick={() => onSelectShelf(null)}
                  >
                    {_('All Books')}
                  </button>
                </li>
                {shelves.map((shelf) => (
                  <li key={shelf.id}>
                    <button
                      type='button'
                      className={clsx(
                        selectedShelfId === shelf.id && 'active',
                        'flex justify-between text-left',
                      )}
                      onClick={() => onSelectShelf(shelf.id)}
                    >
                      <span className='truncate'>{shelf.name}</span>
                      <span className='badge badge-sm badge-ghost ml-2 shrink-0'>
                        {shelf.bookHashes.length}
                      </span>
                    </button>
                  </li>
                ))}
                {shelves.length > 0 && <div className='divider my-1'></div>}

                {/* Smart Collections */}
                {smartCollections.length > 0 && (
                  <li className='menu-title px-2 py-1 text-xs font-bold uppercase opacity-50'>
                    {_('Smart Filter')}
                  </li>
                )}
                {smartCollections.map((collection) => (
                  <li key={collection.id}>
                    <button
                      type='button'
                      className={clsx(
                        selectedShelfId === collection.id && 'active',
                        'flex justify-between text-left',
                      )}
                      onClick={() => onSelectShelf(collection.id)}
                    >
                      <span className='flex items-center gap-2 truncate'>
                        <MdFilterList className='h-3 w-3 opacity-70' />
                        {collection.name}
                      </span>
                    </button>
                  </li>
                ))}

                <div className='divider my-1'></div>
                <li>
                  <button type='button' onClick={onToggleShelfManager} className='text-left'>
                    <MdFolder className='text-secondary' />
                    {_('Manage Shelves')}
                  </button>
                </li>
                <li>
                  <button
                    type='button'
                    onClick={onToggleSmartCollectionsManager}
                    className='text-left'
                  >
                    <MdFilterList className='text-accent' />
                    {_('Manage Smart Collections')}
                  </button>
                </li>
              </ul>
            </Dropdown>
            <button
              className='btn btn-ghost flex h-8 min-h-8 w-8 items-center justify-center p-0'
              onClick={() => router.push('/manga')}
              title={_('Manga')}
              aria-label={_('Manga')}
            >
              <MdMenuBook size={iconSize18} />
            </button>
            <Dropdown
              label={_('View Menu')}
              className='exclude-title-bar-mousedown dropdown-bottom dropdown-end'
              buttonClassName='btn btn-ghost h-8 min-h-8 w-8 p-0'
              toggleButton={<PiDotsThreeCircle role='none' size={iconSize18} />}
            >
              <ViewMenu />
            </Dropdown>
            <Dropdown
              label={_('Settings Menu')}
              className='exclude-title-bar-mousedown dropdown-bottom dropdown-end'
              buttonClassName='btn btn-ghost h-8 min-h-8 w-8 p-0'
              toggleButton={<MdOutlineMenu role='none' size={iconSize18} />}
            >
              <SettingsMenu />
            </Dropdown>
            {appService?.hasWindowBar && (
              <WindowButtons
                headerRef={headerRef}
                showMinimize={windowButtonVisible}
                showMaximize={windowButtonVisible}
                showClose={windowButtonVisible}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryHeader;
