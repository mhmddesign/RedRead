import clsx from 'clsx';
import React, { useCallback } from 'react';
import { TbBoxMargin } from 'react-icons/tb';
import { RxLineHeight } from 'react-icons/rx';
import { useEnv } from '@/context/EnvContext';
import { useReaderStore } from '@/store/readerStore';
import { useTranslation } from '@/hooks/useTranslation';
import { saveViewSettings } from '@/helpers/settings';
import Slider from '@/components/Slider';

const FONT_SIZE_LIMITS = {
  MIN: 8,
  MAX: 30,
  DEFAULT: 16,
} as const;

const LINE_HEIGHT_LIMITS = {
  MIN: 8,
  MAX: 24,
  DEFAULT: 16,
  MULTIPLIER: 10,
} as const;

const MARGIN_CONSTANTS = {
  MAX_MARGIN_PX: 88,
  MAX_GAP_PERCENT: 10,
  MARGIN_RATIO: 50,
} as const;

interface FontLayoutPanelProps {
  bookKey: string;
  actionTab: string;
  bottomOffset: string;
  marginIconSize: number;
}

export const FontLayoutPanel: React.FC<FontLayoutPanelProps> = ({
  bookKey,
  actionTab,
  bottomOffset,
  marginIconSize,
}) => {
  const _ = useTranslation();
  const { envConfig } = useEnv();
  const { getView, getViewSettings } = useReaderStore();
  const viewSettings = getViewSettings(bookKey);
  const view = getView(bookKey);

  const handleFontSizeChange = useCallback(
    (value: number) => {
      saveViewSettings(envConfig, bookKey, 'defaultFontSize', value);
    },
    [envConfig, bookKey],
  );

  const handleMarginChange = useCallback(
    (value: number) => {
      const currentViewSettings = getViewSettings(bookKey);
      if (!currentViewSettings) return;

      const { MAX_MARGIN_PX, MAX_GAP_PERCENT } = MARGIN_CONSTANTS;
      const marginPx = Math.round((value / 100) * MAX_MARGIN_PX);
      const gapPercent = Math.round((value / 100) * MAX_GAP_PERCENT);

      currentViewSettings.marginTopPx = marginPx;
      currentViewSettings.marginBottomPx = marginPx / 2;
      currentViewSettings.marginLeftPx = marginPx / 2;
      currentViewSettings.marginRightPx = marginPx / 2;

      saveViewSettings(envConfig, bookKey, 'gapPercent', gapPercent, false, false);
      view?.renderer.setAttribute('margin', `${marginPx}px`);
      view?.renderer.setAttribute('gap', `${gapPercent}%`);

      if (currentViewSettings?.scrolled) {
        view?.renderer.setAttribute('flow', 'scrolled');
      }
    },
    [envConfig, bookKey, view, getViewSettings],
  );

  const handleLineHeightChange = useCallback(
    (value: number) => {
      saveViewSettings(envConfig, bookKey, 'lineHeight', value / LINE_HEIGHT_LIMITS.MULTIPLIER);
    },
    [envConfig, bookKey],
  );

  const getMarginProgressValue = useCallback((marginPx: number, gapPercent: number) => {
    const { MAX_MARGIN_PX, MAX_GAP_PERCENT, MARGIN_RATIO } = MARGIN_CONSTANTS;
    return (marginPx / MAX_MARGIN_PX + gapPercent / MAX_GAP_PERCENT) * MARGIN_RATIO;
  }, []);

  const classes = clsx(
    'footerbar-font-mobile bg-base-200 absolute flex w-full flex-col items-center gap-y-8 px-4 transition-all sm:hidden',
    actionTab === 'font'
      ? 'pointer-events-auto translate-y-0 pb-4 pt-8 ease-out'
      : 'pointer-events-none invisible translate-y-full overflow-hidden pb-0 pt-0 ease-in',
  );

  return (
    <div className={classes} style={{ bottom: bottomOffset }}>
      <Slider
        label={_('Font Size')}
        initialValue={viewSettings?.defaultFontSize ?? FONT_SIZE_LIMITS.DEFAULT}
        bubbleLabel={`${viewSettings?.defaultFontSize ?? FONT_SIZE_LIMITS.DEFAULT}`}
        minLabel='A'
        maxLabel='A'
        minClassName='text-xs'
        maxClassName='text-base'
        onChange={handleFontSizeChange}
        min={FONT_SIZE_LIMITS.MIN}
        max={FONT_SIZE_LIMITS.MAX}
      />
      <div className='flex w-full items-center justify-between gap-x-6'>
        <Slider
          label={_('Page Margin')}
          initialValue={getMarginProgressValue(
            viewSettings?.marginTopPx ?? 44,
            viewSettings?.gapPercent ?? 5,
          )}
          bubbleElement={<TbBoxMargin size={marginIconSize} />}
          minLabel={_('Small')}
          maxLabel={_('Large')}
          step={10}
          onChange={handleMarginChange}
        />
        <Slider
          label={_('Line Spacing')}
          initialValue={(viewSettings?.lineHeight ?? 1.6) * LINE_HEIGHT_LIMITS.MULTIPLIER}
          bubbleElement={<RxLineHeight size={marginIconSize} />}
          minLabel={_('Small')}
          maxLabel={_('Large')}
          min={LINE_HEIGHT_LIMITS.MIN}
          max={LINE_HEIGHT_LIMITS.MAX}
          onChange={handleLineHeightChange}
        />
      </div>

      <div className='border-base-300 w-full border-t pt-4'>
        <div className='mb-2 flex items-center justify-between'>
          <span className='text-sm font-semibold'>{_('Bionic Reading')}</span>
          <input
            type='checkbox'
            className='toggle toggle-primary toggle-sm'
            checked={viewSettings?.bionicReadingEnabled ?? false}
            onChange={(e) => {
              saveViewSettings(envConfig, bookKey, 'bionicReadingEnabled', e.target.checked);
              // Force re-render of view to apply transformer
              if (view?.renderer) {
                view.renderer.border?.clear();
                // We might need to reload or re-render. A simple way is to toggle flow or similar,
                // but transformers run on content load. Ideally we re-render the current location.
                // For now, let's just save. The user might need to reload or chapter change to see effect if we don't force it.
                // Actually, foliate-js view might not expose easy "re-transform" without reload.
                // Let's trigger a reload of component or similar if needed, but saveViewSettings usually triggers updates.
                // However, Transformers are applied at 'content-load' time in FoliateViewer.tsx (getDocTransformHandler).
                // So we need to reload the section.
                setTimeout(() => {
                  const currentCfi = view.renderer.location;
                  // This is a bit hacky, but effectively reloading the view or section is required.
                  // We can use recreateViewer from store if we want a full reload, or just let user know.
                  // For now, let's rely on the fact that changing settings updates state,
                  // and FoliateViewer might react if we depend on it.
                  // FoliateViewer.tsx depends on viewSettings.
                  // But transformers are only run when `data` event fires (loading resource).
                  // We might need to force a reload of the current resource.
                  view.reload();
                }, 100);
              }
            }}
          />
        </div>
        {viewSettings?.bionicReadingEnabled && (
          <Slider
            label={_('Intensity')}
            initialValue={(viewSettings?.bionicReadingIntensity ?? 0.5) * 100}
            bubbleLabel={`${Math.round((viewSettings?.bionicReadingIntensity ?? 0.5) * 100)}%`}
            minLabel='Low'
            maxLabel='High'
            min={10}
            max={100}
            step={10}
            onChange={(val) => {
              saveViewSettings(envConfig, bookKey, 'bionicReadingIntensity', val / 100);
              if (view?.renderer && viewSettings.bionicReadingEnabled) {
                setTimeout(() => view.reload(), 500); // Debounce slightly or just wait for slide end
              }
            }}
          />
        )}
      </div>
    </div>
  );
};
