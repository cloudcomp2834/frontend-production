import { formatDateLocal, formatMonthLabel, startOfMonth, endOfMonth } from '../../../utils/dateFormat';

interface CalendarGridProps {
  viewMonth: Date;
  onMonthChange: (month: Date) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  isDayDisabled?: (date: string) => boolean;
  canGoPrevious?: boolean;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarGrid = ({
  viewMonth,
  onMonthChange,
  selectedDate,
  onSelectDate,
  isDayDisabled,
  canGoPrevious = true,
}: CalendarGridProps) => {
  const firstDay = startOfMonth(viewMonth);
  const startOffset = firstDay.getDay();
  const daysInMonth = endOfMonth(viewMonth).getDate();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
          className="btn-secondary px-3 py-1 text-sm"
          disabled={!canGoPrevious}
        >
          Previous
        </button>
        <div className="font-semibold text-gray-900 text-sm">{formatMonthLabel(viewMonth)}</div>
        <button
          type="button"
          onClick={() => onMonthChange(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
          className="btn-secondary px-3 py-1 text-sm"
        >
          Next
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">
        {WEEKDAYS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startOffset }).map((_, index) => (
          <div key={`blank-${index}`} className="h-9" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const date = formatDateLocal(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
          const isDisabled = isDayDisabled?.(date) ?? false;
          const isSelected = selectedDate === date;

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              disabled={isDisabled}
              className={`h-9 rounded-md text-sm transition-colors duration-150 ${
                isSelected
                  ? 'bg-primary text-white'
                  : isDisabled
                    ? 'cursor-not-allowed text-gray-300'
                    : 'text-gray-700 hover:bg-pantai-50'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};
