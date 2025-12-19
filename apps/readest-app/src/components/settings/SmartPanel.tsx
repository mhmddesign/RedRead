'use client';

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import GeminiSettings from './GeminiSettings';
import BionicSettings from './BionicSettings';
import ReminderSettings from './ReminderSettings';
import { useSettingsStore } from '@/store/settingsStore';
import { useReaderStore } from '@/store/readerStore';

interface SmartPanelProps {
  bookKey: string;
  onRegisterReset: (resetFn: () => void) => void;
}

const SmartPanel: React.FC<SmartPanelProps> = ({ bookKey }) => {
  const _ = useTranslation();
  const { settings, updateGlobalViewSettings } = useSettingsStore();
  const { getViewSettings, saveViewSettings } = useReaderStore();

  const isBookSpecific = !!bookKey;
  
  // For Bionic Reading, we might want to store it in view settings
  // If global: settings.globalViewSettings
  // If book: viewSettings from readerStore (if implemented there) or just global for now?
  // The plan said "Global View Settings" for bionic.
  
  // Since Bionic transformer logic isn't fully hooked into the reader yet, 
  // we'll assume it uses a global setting or we pass props.
  // For now, let's stick to global settings for Bionic to keep it simple.
  
  const bionicEnabled = settings.globalViewSettings?.bionicReadingEnabled || false;
  const bionicIntensity = settings.globalViewSettings?.bionicReadingIntensity || 0.5;

  const handleBionicEnabledChange = (enabled: boolean) => {
    updateGlobalViewSettings({ bionicReadingEnabled: enabled });
  };

  const handleBionicIntensityChange = (intensity: number) => {
    updateGlobalViewSettings({ bionicReadingIntensity: intensity });
  };

  return (
    <div className="flex flex-col gap-4 p-1 h-full overflow-y-auto">
      <div className="text-sm font-semibold text-neutral-content uppercase tracking-wider mb-2">
        {_('Smart Features')}
      </div>
      
      <GeminiSettings />
      <div className="divider my-0"></div>
      <ReminderSettings />
      <div className="divider my-0"></div>
      <BionicSettings 
        enabled={bionicEnabled}
        intensity={bionicIntensity}
        onEnabledChange={handleBionicEnabledChange}
        onIntensityChange={handleBionicIntensityChange}
      />
    </div>
  );
};

export default SmartPanel;
