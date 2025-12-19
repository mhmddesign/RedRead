'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  BIONIC_INTENSITY_PRESETS,
  getIntensityFromPreset,
  transformWord,
} from '@/services/transformers/bionicTransformer';
import { FiEye, FiSliders } from 'react-icons/fi';

interface BionicSettingsProps {
  enabled: boolean;
  intensity: number;
  onEnabledChange: (enabled: boolean) => void;
  onIntensityChange: (intensity: number) => void;
}

/**
 * Bionic Reading Settings Component
 */
export const BionicSettings: React.FC<BionicSettingsProps> = ({
  enabled,
  intensity,
  onEnabledChange,
  onIntensityChange,
}) => {
  const _ = useTranslation();
  const [previewText] = useState(
    'Reading is an amazing way to explore new worlds and ideas. With bionic reading, your eyes can flow through text more naturally.'
  );

  const intensityPresets = [
    { key: 'light', label: _('Light'), value: BIONIC_INTENSITY_PRESETS.light },
    { key: 'medium', label: _('Medium'), value: BIONIC_INTENSITY_PRESETS.medium },
    { key: 'strong', label: _('Strong'), value: BIONIC_INTENSITY_PRESETS.strong },
  ];

  const currentPreset = intensityPresets.find(
    (p) => Math.abs(p.value - intensity) < 0.05
  )?.key || 'custom';

  const handlePresetChange = (presetKey: string) => {
    const preset = presetKey as keyof typeof BIONIC_INTENSITY_PRESETS;
    if (preset in BIONIC_INTENSITY_PRESETS) {
      onIntensityChange(getIntensityFromPreset(preset));
    }
  };

  // Generate preview HTML
  const previewHtml = enabled
    ? previewText
        .split(/(\s+)/)
        .map((word) => {
          if (/^\s+$/.test(word)) return word;
          return transformWord(word, { intensity, useClasses: false });
        })
        .join('')
    : previewText;

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h2 className="card-title flex items-center gap-2">
          <FiEye /> {_('Bionic Reading')}
          <span className="badge badge-success badge-sm">{_('Free')}</span>
        </h2>

        <p className="text-neutral-content text-sm">
          {_('Bionic reading helps your eyes flow through text faster by bolding the beginning of words. Great for ADHD and improving focus.')}
        </p>

        {/* Enable toggle */}
        <div className="form-control mt-4">
          <label className="label cursor-pointer justify-start gap-4">
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={enabled}
              onChange={(e) => onEnabledChange(e.target.checked)}
            />
            <span className="label-text font-medium">
              {enabled ? _('Enabled') : _('Disabled')}
            </span>
          </label>
        </div>

        {/* Intensity settings */}
        {enabled && (
          <div className="mt-4 space-y-4">
            {/* Preset buttons */}
            <div className="form-control">
              <label className="label">
                <span className="label-text flex items-center gap-2">
                  <FiSliders /> {_('Intensity')}
                </span>
              </label>
              <div className="btn-group">
                {intensityPresets.map((preset) => (
                  <button
                    key={preset.key}
                    className={`btn btn-sm ${
                      currentPreset === preset.key ? 'btn-primary' : 'btn-ghost'
                    }`}
                    onClick={() => handlePresetChange(preset.key)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fine-tune slider */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">{_('Fine-tune')}</span>
                <span className="label-text-alt">
                  {Math.round(intensity * 100)}%
                </span>
              </label>
              <input
                type="range"
                min="30"
                max="70"
                value={intensity * 100}
                onChange={(e) => onIntensityChange(parseInt(e.target.value) / 100)}
                className="range range-primary range-sm"
              />
              <div className="flex w-full justify-between px-2 text-xs text-neutral-content">
                <span>{_('Subtle')}</span>
                <span>{_('Strong')}</span>
              </div>
            </div>

            {/* Preview */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">{_('Preview')}</span>
              </label>
              <div
                className="rounded-box bg-base-200 p-4 text-lg leading-relaxed"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-4 rounded-box bg-info/10 p-3 text-sm">
          <p className="font-medium text-info">{_('How it works')}</p>
          <p className="text-neutral-content mt-1">
            {_('Bionic reading guides your eyes by bolding the initial letters of words. This creates visual anchors that help your brain recognize words faster, reducing reading fatigue and improving focus.')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BionicSettings;
