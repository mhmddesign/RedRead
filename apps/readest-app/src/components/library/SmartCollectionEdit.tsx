import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { SmartCollection, FilterRule } from '@/store/libraryStore';
import { FIELDS, OPERATORS, FilterField, FilterOperator } from '@/utils/filter';
import Dialog from '@/components/Dialog';
import { MdAdd, MdDelete } from 'react-icons/md';
import clsx from 'clsx';
import { uniqueId } from '@/utils/misc';

interface SmartCollectionEditProps {
  collection: Partial<SmartCollection>;
  isOpen: boolean;
  onSave: (collection: Partial<SmartCollection>) => void;
  onClose: () => void;
}

const SmartCollectionEdit: React.FC<SmartCollectionEditProps> = ({
  collection: initialCollection,
  isOpen,
  onSave,
  onClose,
}) => {
  const _ = useTranslation();
  const [name, setName] = useState(initialCollection.name || '');
  const [rules, setRules] = useState<FilterRule[]>(initialCollection.rules || []);
  const [matchAll, setMatchAll] = useState(initialCollection.matchAll ?? true);

  useEffect(() => {
    setName(initialCollection.name || '');
    setRules(initialCollection.rules || []);
    setMatchAll(initialCollection.matchAll ?? true);
  }, [initialCollection]);

  const handleAddRule = () => {
    setRules([
      ...rules,
      {
        id: uniqueId(),
        field: 'title',
        operator: 'contains',
        value: '',
      },
    ]);
  };

  const handleRemoveRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const handleRuleChange = (id: string, field: keyof FilterRule, value: any) => {
    setRules(
      rules.map((r) => {
        if (r.id === id) {
          const updated = { ...r, [field]: value };
          // Reset operator/value if field changes if needed
          return updated;
        }
        return r;
      }),
    );
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      ...initialCollection,
      name,
      rules,
      matchAll,
    });
    onClose();
  };

  return (
    <Dialog
      title={_('Edit Smart Collection')}
      isOpen={isOpen}
      onClose={onClose}
      boxClassName='w-[600px] max-w-[90%]'
    >
      <div className='flex flex-col gap-4 p-4'>
        {/* Name */}
        <div className='form-control'>
          <label className='label'>
            <span className='label-text'>{_('Collection Name')}</span>
          </label>
          <input
            type='text'
            className='input input-bordered w-full'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={_('e.g. Sci-Fi Books')}
          />
        </div>

        {/* Match Type */}
        <div className='form-control'>
          <label className='label cursor-pointer justify-start gap-4'>
            <span className='label-text'>{_('Match:')}</span>
            <div className='flex gap-4'>
              <label className='flex items-center gap-2'>
                <input
                  type='radio'
                  className='radio'
                  checked={matchAll}
                  onChange={() => setMatchAll(true)}
                />
                <span>{_('All rules (AND)')}</span>
              </label>
              <label className='flex items-center gap-2'>
                <input
                  type='radio'
                  className='radio'
                  checked={!matchAll}
                  onChange={() => setMatchAll(false)}
                />
                <span>{_('Any rule (OR)')}</span>
              </label>
            </div>
          </label>
        </div>

        {/* Rules List */}
        <div className='flex max-h-[300px] flex-col gap-2 overflow-y-auto'>
          {rules.map((rule) => (
            <div
              key={rule.id}
              className='bg-base-200 flex flex-wrap items-center gap-2 rounded p-2'
            >
              <select
                className='select select-bordered select-sm'
                value={rule.field}
                onChange={(e) => handleRuleChange(rule.id, 'field', e.target.value)}
              >
                {Object.entries(FIELDS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {_(label)}
                  </option>
                ))}
              </select>

              <select
                className='select select-bordered select-sm'
                value={rule.operator}
                onChange={(e) => handleRuleChange(rule.id, 'operator', e.target.value)}
              >
                {Object.entries(OPERATORS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {_(label)}
                  </option>
                ))}
              </select>

              <input
                type='text'
                className='input input-bordered input-sm min-w-[100px] flex-1'
                value={String(rule.value)}
                onChange={(e) => handleRuleChange(rule.id, 'value', e.target.value)}
                placeholder={_('Value')}
              />

              <button
                className='btn btn-ghost btn-sm btn-circle text-error'
                onClick={() => handleRemoveRule(rule.id)}
              >
                <MdDelete />
              </button>
            </div>
          ))}
          {rules.length === 0 && (
            <div className='p-4 text-center text-sm opacity-60'>
              {_('No rules defined. Collection will include all books.')}
            </div>
          )}
          <button className='btn btn-sm btn-ghost gap-2 self-start' onClick={handleAddRule}>
            <MdAdd /> {_('Add Rule')}
          </button>
        </div>

        <div className='modal-action'>
          <button className='btn' onClick={onClose}>
            {_('Cancel')}
          </button>
          <button className='btn btn-primary' onClick={handleSave} disabled={!name.trim()}>
            {_('Save')}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default SmartCollectionEdit;
