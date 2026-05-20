'use client';

import { useMemo, useState } from 'react';

interface Props {
  value?: string;
  onChange: (isoString: string) => void;
  minDate?: Date;
}

const TIME_SLOTS = [
  { label: 'Sabah (09:00)', value: '09:00' },
  { label: 'Öğle (12:00)', value: '12:00' },
  { label: 'Öğleden Sonra (15:00)', value: '15:00' },
  { label: 'Akşam (18:00)', value: '18:00' },
];

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function DateTimePicker({ value, onChange, minDate }: Props) {
  const today = useMemo(() => startOfDay(minDate ?? new Date()), [minDate]);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const d = new Date(value);
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => value ? startOfDay(new Date(value)) : null);
  const [selectedTime, setSelectedTime] = useState<string>(() => {
    if (value) {
      const d = new Date(value);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return TIME_SLOTS[0]!.value;
  });

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const offset = (firstDay + 6) % 7; // Monday = 0
    const daysCount = new Date(year, month + 1, 0).getDate();
    return { offset, daysCount };
  }, [viewDate]);

  function selectDay(day: number) {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (date < today) return;
    setSelectedDate(date);
    emitChange(date, selectedTime);
  }

  function selectTime(time: string) {
    setSelectedTime(time);
    if (selectedDate) emitChange(selectedDate, time);
  }

  function emitChange(date: Date, time: string) {
    const [h, m] = time.split(':').map(Number);
    const result = new Date(date);
    result.setHours(h ?? 0, m ?? 0, 0, 0);
    onChange(result.toISOString());
  }

  function prevMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  const { offset, daysCount } = daysInMonth;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Month nav */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-900">
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-3 pt-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-400 pb-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
        {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysCount }, (_, i) => i + 1).map((day) => {
          const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
          const disabled = date < today;
          const isSelected = selectedDate && startOfDay(selectedDate).getTime() === startOfDay(date).getTime();
          const isToday = startOfDay(date).getTime() === today.getTime();
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => selectDay(day)}
              className={`mx-auto w-8 h-8 rounded-full text-xs flex items-center justify-center transition-colors
                ${isSelected ? 'bg-[#26496b] text-white font-semibold' : ''}
                ${isToday && !isSelected ? 'border border-[#26496b] text-[#26496b] font-semibold' : ''}
                ${disabled ? 'text-gray-300 cursor-not-allowed' : !isSelected ? 'text-gray-700 hover:bg-gray-100' : ''}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div className="border-t border-gray-100 px-3 py-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Saat seçin</p>
          <div className="grid grid-cols-2 gap-1.5">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot.value}
                type="button"
                onClick={() => selectTime(slot.value)}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors border ${
                  selectedTime === slot.value
                    ? 'bg-[#26496b] text-white border-[#26496b]'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#26496b]/50'
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
