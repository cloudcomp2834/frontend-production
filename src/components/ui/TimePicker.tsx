import { useRef, useState, useEffect, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerProps {
  value: string; // "HH:mm" (24h), same shape used across the app
  onChange: (value: string) => void;
  label?: ReactNode;
  id?: string;
}

const CENTER = 100;
const OUTER_R = 78;
const INNER_R = 48;
const RING_BOUNDARY = 63; // distance from center that separates the hour ring from the minute ring
const HOUR_COUNT = 24;
const MINUTE_STEP = 5;
const MINUTE_COUNT = 60 / MINUTE_STEP;

interface ParsedTime {
  hour: number; // 0-23
  minute: number; // 0-59, snapped to nearest 5
}

const pad = (n: number) => String(n).padStart(2, '0');
const snapTo5 = (minute: number) => (Math.round(minute / MINUTE_STEP) * MINUTE_STEP) % 60;

const parseTime = (value: string): ParsedTime => {
  if (!value) return { hour: 9, minute: 0 };
  const [h, m] = value.split(':').map(Number);
  return { hour: h, minute: snapTo5(m ?? 0) };
};

const toValue = (hour: number, minute: number): string => `${pad(hour)}:${pad(minute)}`;

const angleFromCenter = (clientX: number, clientY: number, rect: DOMRect) => {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const distance = Math.sqrt(dx * dx + dy * dy) / (rect.width / (2 * CENTER));
  const raw = Math.atan2(dx, -dy);
  const degrees = ((raw * 180) / Math.PI + 360) % 360;
  return { degrees, distance };
};

export const TimePicker = ({ value, onChange, label, id }: TimePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dragMode, setDragMode] = useState<'hour' | 'minute' | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsed = parseTime(value);

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

  const applyPointer = (clientX: number, clientY: number, mode: 'hour' | 'minute') => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const { degrees } = angleFromCenter(clientX, clientY, rect);

    if (mode === 'hour') {
      const newHour = Math.round(degrees / (360 / HOUR_COUNT)) % HOUR_COUNT;
      onChange(toValue(newHour, parsed.minute));
    } else {
      const newMinute = (Math.round(degrees / (360 / MINUTE_COUNT)) % MINUTE_COUNT) * MINUTE_STEP;
      onChange(toValue(parsed.hour, newMinute));
    }
  };

  const handlePointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const { distance } = angleFromCenter(e.clientX, e.clientY, rect);
    const mode: 'hour' | 'minute' = distance >= RING_BOUNDARY ? 'hour' : 'minute';
    setDragMode(mode);
    svgRef.current.setPointerCapture(e.pointerId);
    applyPointer(e.clientX, e.clientY, mode);
  };

  const handlePointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragMode) return;
    applyPointer(e.clientX, e.clientY, dragMode);
  };

  const handlePointerUp = () => setDragMode(null);

  const hourAngleRad = (parsed.hour * (360 / HOUR_COUNT) * Math.PI) / 180;
  const minuteAngleRad = ((parsed.minute / MINUTE_STEP) * (360 / MINUTE_COUNT) * Math.PI) / 180;

  const hourHandX = CENTER + OUTER_R * Math.sin(hourAngleRad);
  const hourHandY = CENTER - OUTER_R * Math.cos(hourAngleRad);
  const minuteHandX = CENTER + INNER_R * Math.sin(minuteAngleRad);
  const minuteHandY = CENTER - INNER_R * Math.cos(minuteAngleRad);

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
        onClick={() => setIsOpen((prev) => !prev)}
        className="input-field flex items-center justify-between cursor-pointer text-left"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>{value || 'Select time'}</span>
        <Clock className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-2 bg-white rounded-lg border border-gray-200 shadow-lg p-4 w-[260px]">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-2xl font-bold text-gray-900 tabular-nums">{toValue(parsed.hour, parsed.minute)}</span>
          </div>

          <svg
            ref={svgRef}
            viewBox="0 0 200 200"
            className="w-full touch-none select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <circle cx={CENTER} cy={CENTER} r={94} fill="#f9fafb" />
            <circle cx={CENTER} cy={CENTER} r={OUTER_R} fill="none" stroke="#e5e7eb" strokeWidth={1} />
            <circle cx={CENTER} cy={CENTER} r={INNER_R} fill="none" stroke="#e5e7eb" strokeWidth={1} />

            {/* Hour ring hand */}
            <line x1={CENTER} y1={CENTER} x2={hourHandX} y2={hourHandY} stroke="#0284c7" strokeWidth={2} />
            <circle cx={hourHandX} cy={hourHandY} r={12} fill="#0284c7" />

            {/* Minute ring hand */}
            <line x1={CENTER} y1={CENTER} x2={minuteHandX} y2={minuteHandY} stroke="#0ba5ec" strokeWidth={2} />
            <circle cx={minuteHandX} cy={minuteHandY} r={10} fill="#0ba5ec" />

            <circle cx={CENTER} cy={CENTER} r={3} fill="#374151" />

            {/* Hour numbers (outer ring, 24h) */}
            {Array.from({ length: HOUR_COUNT }, (_, h) => h).map((h) => {
              const angle = (h * (360 / HOUR_COUNT) * Math.PI) / 180;
              const x = CENTER + OUTER_R * Math.sin(angle);
              const y = CENTER - OUTER_R * Math.cos(angle);
              const active = parsed.hour === h;
              return (
                <text
                  key={`hour-${h}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none select-none"
                  fontSize={9}
                  fontWeight={active ? 700 : 500}
                  fill={active ? '#ffffff' : '#374151'}
                >
                  {pad(h)}
                </text>
              );
            })}

            {/* Minute ticks (inner ring, 5-min steps) */}
            {Array.from({ length: MINUTE_COUNT }, (_, i) => i * MINUTE_STEP).map((m) => {
              const angle = ((m / MINUTE_STEP) * (360 / MINUTE_COUNT) * Math.PI) / 180;
              const x = CENTER + INNER_R * Math.sin(angle);
              const y = CENTER - INNER_R * Math.cos(angle);
              const active = parsed.minute === m;
              return (
                <text
                  key={`minute-${m}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none select-none"
                  fontSize={10}
                  fontWeight={active ? 700 : 500}
                  fill={active ? '#ffffff' : '#6b7280'}
                >
                  {pad(m)}
                </text>
              );
            })}
          </svg>

          <div className="flex items-center justify-center mt-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-xs font-semibold rounded-md text-primary hover:bg-pantai-50 transition-colors duration-150"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
