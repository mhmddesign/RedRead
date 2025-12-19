'use client';

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useRemindersStore, DayOfWeek } from '@/store/remindersStore';
import { FiBell, FiPlus, FiTrash2, FiClock, FiCalendar } from 'react-icons/fi';

export const ReminderSettings: React.FC = () => {
  const _ = useTranslation();
  const {
    reminders,
    notificationsEnabled,
    addReminder,
    removeReminder,
    toggleReminder,
    toggleReminder,
    setNotificationsEnabled,
    sendTestNotification,
  } = useRemindersStore();

  const [newTime, setNewTime] = React.useState('09:00');
  const [selectedDays, setSelectedDays] = React.useState<DayOfWeek[]>([0, 1, 2, 3, 4, 5, 6]);

  const daysLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleAddReminder = () => {
    addReminder({
      type: 'custom',
      enabled: true,
      time: newTime,
      days: selectedDays,
      message: _('Time to read! Take a break and enjoy a book.'),
    });
  };

  const toggleDay = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  return (
    <div className='card bg-base-100 shadow-lg'>
      <div className='card-body'>
        <div className='flex items-center justify-between'>
          <h2 className='card-title flex items-center gap-2'>
            <FiBell /> {_('Reading Reminders')}
          </h2>
          <div className='flex items-center gap-2'>
            <button
              className='btn btn-ghost btn-sm text-primary'
              onClick={() => sendTestNotification()}
              disabled={!notificationsEnabled}
            >
              {_('Test Notification')}
            </button>
            <div className='form-control'>
              <label className='label cursor-pointer gap-2'>
                <span className='label-text'>{_('Enable Notifications')}</span>
                <input
                  type='checkbox'
                  className='toggle toggle-primary'
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                />
              </label>
            </div>
          </div>
        </div>

        <p className='text-neutral-content mb-4 text-sm'>
          {_('Set reminders to build a consistent reading habit.')}
        </p>

        {/* Add new reminder */}
        <div className='bg-base-200 mb-6 rounded-lg p-4'>
          <h3 className='mb-3 font-medium'>{_('Add New Reminder')}</h3>
          <div className='flex flex-col gap-4'>
            <div className='flex flex-wrap gap-2'>
              {daysLabels.map((label, index) => (
                <button
                  key={index}
                  className={`btn btn-xs ${
                    selectedDays.includes(index as DayOfWeek) ? 'btn-primary' : 'btn-ghost'
                  }`}
                  onClick={() => toggleDay(index as DayOfWeek)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className='flex items-center gap-4'>
              <input
                type='time'
                className='input input-bordered input-sm'
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
              <button
                className='btn btn-primary btn-sm'
                onClick={handleAddReminder}
                disabled={selectedDays.length === 0}
              >
                <FiPlus className='mr-1' />
                {_('Add')}
              </button>
            </div>
          </div>
        </div>

        {/* Reminder list */}
        <div className='space-y-3'>
          {reminders.length === 0 ? (
            <p className='text-neutral-content py-4 text-center'>{_('No active reminders')}</p>
          ) : (
            reminders.map((reminder) => (
              <div
                key={reminder.id}
                className='bg-base-200 flex items-center justify-between rounded-md p-3'
              >
                <div className='flex items-center gap-4'>
                  <input
                    type='checkbox'
                    className='toggle toggle-xs'
                    checked={reminder.enabled}
                    onChange={() => toggleReminder(reminder.id)}
                  />
                  <div>
                    <div className='flex items-center gap-2 font-medium'>
                      <FiClock className='text-primary' />
                      {reminder.time}
                    </div>
                    <div className='text-neutral-content mt-1 flex gap-1 text-xs'>
                      <FiCalendar size={10} className='mt-0.5' />
                      {reminder.days.length === 7
                        ? _('Every day')
                        : reminder.days.map((d) => daysLabels[d]).join(', ')}
                    </div>
                  </div>
                </div>

                <button
                  className='btn btn-ghost btn-xs text-error'
                  onClick={() => removeReminder(reminder.id)}
                >
                  <FiTrash2 />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReminderSettings;
