'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAIStore } from '@/store/aiStore';
import { usePremiumStore } from '@/store/premiumStore';
import {
  FiKey,
  FiCheck,
  FiX,
  FiLoader,
  FiAlertCircle,
  FiExternalLink,
  FiTrash2,
} from 'react-icons/fi';

/**
 * Gemini API Settings Component
 */
export const GeminiSettings: React.FC = () => {
  const _ = useTranslation();

  const {
    apiKey,
    isConfigured,
    isValidating,
    validationError,
    setApiKey,
    clearApiKey,
  } = useAIStore();

  const { hasFeatureAccess, getRemainingUsage, isPremium } = usePremiumStore();

  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const remainingUsage = getRemainingUsage('ai_suggestions');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    const success = await setApiKey(inputKey.trim());
    if (success) {
      setInputKey('');
    }
  };

  const handleClear = () => {
    clearApiKey();
    setInputKey('');
  };

  const maskedKey = apiKey
    ? `${apiKey.slice(0, 6)}${'•'.repeat(20)}${apiKey.slice(-4)}`
    : '';

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h2 className="card-title flex items-center gap-2">
          <FiKey /> {_('Gemini AI Settings')}
        </h2>

        <p className="text-neutral-content text-sm">
          {_('Enter your Gemini API key to enable AI-powered book suggestions and reading analysis.')}
        </p>

        {/* Usage info */}
        <div className="alert alert-info mt-4">
          <FiAlertCircle />
          <div>
            <p className="font-medium">
              {isPremium
                ? _('Premium: Unlimited AI features')
                : _('Free tier: {{remaining}} suggestions remaining this month', {
                    remaining: remainingUsage,
                  })}
            </p>
            <p className="text-sm opacity-80">
              {_('Get your API key from')}{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                Google AI Studio
                <FiExternalLink className="ml-1 inline" />
              </a>
            </p>
          </div>
        </div>

        {/* Current status */}
        {isConfigured ? (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-success">
              <FiCheck />
              <span className="font-medium">{_('API Key Configured')}</span>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                className="input input-bordered flex-1 font-mono text-sm"
                value={maskedKey}
                readOnly
              />
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? _('Hide') : _('Show')}
              </button>
              <button
                className="btn btn-error btn-sm"
                onClick={handleClear}
                title={_('Remove API Key')}
              >
                <FiTrash2 />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">{_('API Key')}</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  className={`input input-bordered flex-1 font-mono ${
                    validationError ? 'input-error' : ''
                  }`}
                  placeholder="AIza..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  disabled={isValidating}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!inputKey.trim() || isValidating}
                >
                  {isValidating ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    _('Save')
                  )}
                </button>
              </div>

              {validationError && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center gap-1">
                    <FiX /> {validationError}
                  </span>
                </label>
              )}
            </div>
          </form>
        )}

        {/* Instructions */}
        <div className="mt-6">
          <h3 className="font-medium mb-2">{_('How to get your API key:')}</h3>
          <ol className="list-decimal list-inside text-sm text-neutral-content space-y-1">
            <li>{_('Go to Google AI Studio')}</li>
            <li>{_('Sign in with your Google account')}</li>
            <li>{_('Click "Get API key" in the sidebar')}</li>
            <li>{_('Create a new API key')}</li>
            <li>{_('Copy and paste it above')}</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default GeminiSettings;
