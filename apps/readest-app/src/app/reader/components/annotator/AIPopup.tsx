import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import Popup from '@/components/Popup';
import { Position } from '@/utils/sel';
import { useAIStore } from '@/store/aiStore';
import { FiLoader, FiCopy, FiCheck, FiCpu } from 'react-icons/fi';
import { useFeatureAccess } from '@/store/premiumStore';
import { useEnv } from '@/context/EnvContext';

interface AIPopupProps {
  text: string;
  position: Position;
  onDismiss: () => void;
  width?: number;
  height?: number;
}

type AIMode = 'menu' | 'summarize' | 'explain' | 'character' | 'flashcard';

const AIPopup: React.FC<AIPopupProps> = ({
  text,
  position,
  onDismiss,
  width = 300,
  height = 300,
}) => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const { _getService, isConfigured } = useAIStore();
  const { hasAccess, use: incrementUsage, remaining } = useFeatureAccess('ai_suggestions');

  const [mode, setMode] = useState<AIMode>('menu');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isConfigured) {
      setError(_('AI is not configured. Please add an API Key in settings.'));
    }
  }, [isConfigured, _]);

  const handleAction = async (action: AIMode) => {
    if (!isConfigured) return;
    if (!hasAccess) {
      setError(_('You have reached your free AI usage limit.'));
      return;
    }

    setMode(action);
    setLoading(true);
    setError(null);
    setResult('');

    try {
      if (incrementUsage()) {
        const service = _getService();
        if (!service) throw new Error('Service not initialized');

        let response = '';

        switch (action) {
          case 'summarize':
            response = await service.summarizeText(text);
            break;
          case 'explain':
            response = await service.ask(
              `Explain the following text in simple terms, clarifying any complex concepts:\n\n"${text}"`,
            );
            break;
          case 'character':
            response = await service.ask(
              `Analyze the character mentioned or speaking in this text. What does this reveal about them?\n\n"${text}"`,
            );
            break;
          case 'flashcard':
            response = await service.ask(
              `Create a flashcard from the following text. Format it as:\nQuestion: [Question]\nAnswer: [Answer]\n\nText:\n"${text}"`,
            );
            break;
        }

        setResult(response);
      } else {
        throw new Error('Failed to valid usage.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI Error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderMenu = () => (
    <div className='flex flex-col gap-2 p-4'>
      <h3 className='mb-2 flex items-center gap-2 text-lg font-bold'>
        <FiCpu /> {_('AI Assistant')}
      </h3>
      {error && <div className='alert alert-error p-2 text-xs'>{error}</div>}

      <button
        className='btn btn-sm btn-outline justify-start'
        onClick={() => handleAction('summarize')}
        disabled={!isConfigured}
      >
        {_('Summarize Selection')}
      </button>
      <button
        className='btn btn-sm btn-outline justify-start'
        onClick={() => handleAction('explain')}
        disabled={!hasAccess}
      >
        {_('Explain Logic/Concept')}
      </button>

      <button
        className='btn btn-sm btn-outline justify-start'
        onClick={() => handleAction('character')}
        disabled={!hasAccess}
      >
        {_('Analyze Character')}
      </button>

      <button
        className='btn btn-sm btn-outline justify-start'
        onClick={() => handleAction('flashcard')}
        disabled={!hasAccess}
      >
        {_('Generate Flashcard')}
      </button>

      <div className='text-neutral-content mt-2 flex justify-between text-xs'>
        <span>{isConfigured ? _('Powered by Gemini') : _('Configure in Settings')}</span>
        {hasAccess && remaining !== Infinity && (
          <span>{_('{{remaining}} free uses left', { remaining })}</span>
        )}
      </div>
    </div>
  );

  const renderResult = () => (
    <div className='flex h-full flex-col p-4'>
      <div className='mb-2 flex items-center justify-between'>
        <button className='btn btn-xs btn-ghost' onClick={() => setMode('menu')}>
          ← {_('Back')}
        </button>
        <button className='btn btn-xs btn-ghost' onClick={handleCopy}>
          {copied ? <FiCheck className='text-success' /> : <FiCopy />}
        </button>
      </div>

      {loading ? (
        <div className='flex flex-1 items-center justify-center'>
          <FiLoader className='animate-spin text-2xl' />
        </div>
      ) : error ? (
        <div className='text-error text-sm'>{error}</div>
      ) : (
        <div className='flex-1 overflow-auto whitespace-pre-wrap text-sm leading-relaxed'>
          {result}
        </div>
      )}
    </div>
  );

  return (
    <Popup
      width={width}
      height={height}
      position={position}
      onDismiss={onDismiss}
      className='bg-base-100 text-base-content border-base-300 border shadow-xl'
    >
      {mode === 'menu' ? renderMenu() : renderResult()}
    </Popup>
  );
};

export default AIPopup;
