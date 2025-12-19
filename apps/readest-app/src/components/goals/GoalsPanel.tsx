'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  useGoalsStore,
  type GoalType,
  type ReadingGoal,
  GOAL_TEMPLATES,
} from '@/store/goalsStore';
import { FiPlus, FiTrash2, FiTarget, FiCheck, FiEdit2 } from 'react-icons/fi';

/**
 * Goal Card Component
 */
interface GoalCardProps {
  goal: ReadingGoal;
  onDelete: () => void;
  onEdit: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onDelete, onEdit }) => {
  const _ = useTranslation();
  const { getGoalProgress } = useGoalsStore();

  const progress = getGoalProgress(goal.id);
  const isCompleted = goal.status === 'completed';
  const template = GOAL_TEMPLATES.find((t) => t.type === goal.type);
  const unit = template?.unit || '';

  const formatGoalType = (type: GoalType): string => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div
      className={`card transition-all ${
        isCompleted
          ? 'bg-gradient-to-r from-success/20 to-success/10 border-success'
          : 'bg-base-100'
      } border shadow-md`}
    >
      <div className="card-body p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <FiCheck className="text-success text-lg" />
              ) : (
                <FiTarget className="text-primary text-lg" />
              )}
              <h3 className="font-semibold">{formatGoalType(goal.type)}</h3>
            </div>
            <p className="text-neutral-content mt-1 text-sm">
              {goal.current} / {goal.target} {unit}
            </p>
          </div>

          <div className="flex gap-1">
            <button
              className="btn btn-ghost btn-xs"
              onClick={onEdit}
              title={_('Edit Goal')}
            >
              <FiEdit2 />
            </button>
            <button
              className="btn btn-ghost btn-xs text-error"
              onClick={onDelete}
              title={_('Delete Goal')}
            >
              <FiTrash2 />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <progress
            className={`progress w-full ${
              isCompleted ? 'progress-success' : 'progress-primary'
            }`}
            value={progress}
            max="100"
          />
          <div className="mt-1 flex justify-between text-xs">
            <span className="text-neutral-content">{progress}%</span>
            {isCompleted && (
              <span className="text-success font-medium">
                {_('Completed!')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Add Goal Modal
 */
interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGoal?: ReadingGoal | null;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({
  isOpen,
  onClose,
  editingGoal,
}) => {
  const _ = useTranslation();
  const { addGoal, updateGoal } = useGoalsStore();

  const [selectedType, setSelectedType] = useState<GoalType>(
    editingGoal?.type || 'daily_pages'
  );
  const [target, setTarget] = useState<number>(
    editingGoal?.target ||
      GOAL_TEMPLATES.find((t) => t.type === 'daily_pages')?.defaultTarget ||
      20
  );

  const selectedTemplate = GOAL_TEMPLATES.find((t) => t.type === selectedType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingGoal) {
      updateGoal(editingGoal.id, { target });
    } else {
      addGoal(selectedType, target);
    }

    onClose();
  };

  const handleTypeChange = (type: GoalType) => {
    setSelectedType(type);
    const template = GOAL_TEMPLATES.find((t) => t.type === type);
    if (template) {
      setTarget(template.defaultTarget);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="text-lg font-bold">
          {editingGoal ? _('Edit Goal') : _('Add New Goal')}
        </h3>

        <form onSubmit={handleSubmit} className="mt-4">
          {/* Goal Type Selection */}
          {!editingGoal && (
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">{_('Goal Type')}</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value as GoalType)}
              >
                {GOAL_TEMPLATES.map((template) => (
                  <option key={template.type} value={template.type}>
                    {template.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Target Input */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">
                {_('Target')} ({selectedTemplate?.unit})
              </span>
            </label>
            <input
              type="number"
              className="input input-bordered w-full"
              value={target}
              onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
              min={1}
              max={1000}
            />
            <label className="label">
              <span className="label-text-alt text-neutral-content">
                {_('Suggested')}: {selectedTemplate?.defaultTarget}{' '}
                {selectedTemplate?.unit}
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {_('Cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {editingGoal ? _('Save Changes') : _('Create Goal')}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-black/50" onClick={onClose} />
    </div>
  );
};

/**
 * Goals Panel Component
 */
export const GoalsPanel: React.FC = () => {
  const _ = useTranslation();
  const { goals, getActiveGoals, getCompletedGoals, removeGoal } = useGoalsStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<ReadingGoal | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const activeGoals = getActiveGoals();
  const completedGoals = getCompletedGoals();

  const handleEdit = (goal: ReadingGoal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FiTarget /> {_('Reading Goals')}
        </h2>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setIsModalOpen(true)}
        >
          <FiPlus className="mr-1" />
          {_('Add Goal')}
        </button>
      </div>

      {/* Active Goals */}
      {activeGoals.length === 0 ? (
        <div className="card bg-base-200 p-8 text-center">
          <FiTarget className="mx-auto mb-4 text-4xl opacity-50" />
          <p className="text-neutral-content">{_('No active goals')}</p>
          <p className="text-sm text-neutral-content">
            {_('Set a reading goal to stay motivated!')}
          </p>
          <button
            className="btn btn-primary btn-sm mt-4 mx-auto"
            onClick={() => setIsModalOpen(true)}
          >
            {_('Create Your First Goal')}
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {activeGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDelete={() => removeGoal(goal.id)}
              onEdit={() => handleEdit(goal)}
            />
          ))}
        </div>
      )}

      {/* Completed Goals Toggle */}
      {completedGoals.length > 0 && (
        <div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            {showCompleted ? _('Hide Completed') : _('Show Completed')} (
            {completedGoals.length})
          </button>

          {showCompleted && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 opacity-70">
              {completedGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onDelete={() => removeGoal(goal.id)}
                  onEdit={() => handleEdit(goal)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AddGoalModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingGoal={editingGoal}
      />
    </div>
  );
};

export default GoalsPanel;
