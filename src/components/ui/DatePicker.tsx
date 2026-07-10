import { useState, useRef, useEffect, type ReactNode } from 'react';
import { CalendarDays } from 'lucide-react';
import { CalendarGrid } from './calendar/CalendarGrid';
import { startOfMonth, parseDateLocal } from '../../utils/dateFormat';

interface DatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  label?: ReactNode;
  id?: string;
  minDate?: string; // "YYYY-MM-DD", days before this are disabled - omit for no restriction
  placeholder?: string;
}

export const DatePicker = ({ value, onChange, label, id, minDate, placeholder }: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(value ? parseDateLocal(value) : new Date()));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOpen = () => {
    setViewMonth(startOfMonth(value ? parseDateLocal(value) : new Date()));
    setIsOpen(true);
  };

  const handleSelect = (date: string) => {
    onChange(date);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <button
        type="button"
        id={id}
        onClick={handleOpen}
        className="input-field flex items-center justify-between cursor-pointer text-left"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>{value || placeholder || 'Select date'}</span>
        <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <CalendarGrid
            viewMonth={viewMonth}
            onMonthChange={setViewMonth}
            selectedDate={value}
            onSelectDate={handleSelect}
            isDayDisabled={minDate ? (date) => date < minDate : undefined}
          />
        </div>
      )}
    </div>
  );
};
