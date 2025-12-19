'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useMangaStore } from '@/store/mangaStore';
import { FiArrowLeft, FiSearch, FiGlobe, FiDownload, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import { IoMdBook } from 'react-icons/io';

export default function MangaPage() {
  const router = useRouter();
  const _ = useTranslation();
  const { sources, toggleSource, addSource } = useMangaStore();
  const [searchTerm, setSearchTerm] = useState('');

  const handleBack = () => {
    router.push('/library');
  };

  const filteredSources = sources.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-base-200 text-base-content p-4 sm:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button 
            className="btn btn-circle btn-ghost" 
            onClick={handleBack}
            aria-label={_('Back to Library')}
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <IoMdBook className="text-primary" />
              {_('Manga Sources')}
            </h1>
            <p className="text-neutral-content mt-1">
              {_('Manage extensions and browse manga catalogs')}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-circle" aria-label={_('Refresh')}>
              <FiRefreshCw />
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-content text-lg" />
          <input 
            type="text" 
            placeholder={_('Search sources...')} 
            className="input input-lg input-bordered w-full pl-12 rounded-2xl shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Sources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSources.map((source) => (
            <div key={source.id} className="card bg-base-100 shadow-md hover:shadow-lg transition-all ">
              <div className="card-body flex flex-row items-center gap-4 p-5">
                <div className="avatar placeholder">
                  <div className="bg-neutral text-neutral-content rounded-xl w-16 h-16 shadow-inner">
                    {source.logo ? (
                       // eslint-disable-next-line @next/next/no-img-element
                      <img src={source.logo} alt={source.name} className="object-cover" />
                    ) : (
                      <span className="text-2xl font-bold">{source.name.substring(0, 1)}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="card-title text-lg truncate" title={source.name}>
                    {source.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge badge-sm badge-ghost">{source.version}</span>
                    <span className="badge badge-sm badge-secondary badge-outline">{source.type}</span>
                    {source.isNsfw && <span className="badge badge-sm badge-error badge-outline">18+</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <input 
                    type="checkbox" 
                    className="toggle toggle-primary" 
                    checked={source.enabled}
                    onChange={() => toggleSource(source.id)}
                    aria-label={_('Toggle Source')}
                  />
                </div>
              </div>
              
              <div className="bg-base-200/50 p-3 px-5 flex justify-between items-center border-t border-base-200">
                <button className="btn btn-sm btn-ghost gap-2 text-primary" disabled={!source.enabled}>
                  <FiGlobe /> {_('Browse')}
                </button>
                <button className="btn btn-sm btn-ghost text-neutral-content">
                  {_('Details')}
                </button>
              </div>
            </div>
          ))}
          
          {/* Add Custom Source Card */}
          <div className="card bg-base-100/50 border-2 border-dashed border-base-300 shadow-sm hover:border-primary/50 hover:bg-base-100 transition-all cursor-pointer group flex items-center justify-center p-8 min-h-[160px]">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <FiDownload className="text-xl" />
              </div>
              <h3 className="font-semibold text-lg">{_('Add Source')}</h3>
              <p className="text-sm text-neutral-content mt-1">{_('Install custom extension')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
