import { useRef, useState, useEffect, type PointerEvent as ReactPointerEvent } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerProps {
  value: string; // "HH:mm" (24h), same shape the schedule pages already use
  onChange: (value: string) => void;
  label?: string;
  id?: string;
}

const CENTER = 100;
const OUTER_R = 78;
const INNER_R = 48;
const RING_BOUNDARY = 63; // distance from center that separates the hour ring from the minute ring

interface ParsedTime {
  hour12: number; // 1-12
  minute: number; // 0-59, snapped to nearest 5
  isPM: boolean;
}

const snapTo5 = (minute: number) => (Math.round(minute / 5) * 5) % 60;

const parseTime = (value: string): ParsedTime => {
  if (!value) return { hour12: 12, minute: 0, isPM: false };
  const [h, m] = value.split(':').map(Number);
  const isPM = h >= 12;
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute: snapTo5(m ?? 0), isPM };
};

const toValue = ({ hour12, minute, isPM }: ParsedTime): string => {
  let hour24 = hour12 % 12;
  if (isPM) hour24 += 12;
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

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

const HOUR_POSITIONS = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));

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
    const step = Math.round(degrees / 30) % 12;

    if (mode === 'hour') {
      onChange(toValue({ ...parsed, hour12: HOUR_POSITIONS[step] }));
    } else {
      onChange(toValue({ ...parsed, minute: step * 5 }));
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

  const hourStep = parsed.hour12 % 12; // 0 for 12
  const hourAngleRad = (hourStep * 30 * Math.PI) / 180;
  const minuteAngleRad = ((parsed.minute / 5) * 30 * Math.PI) / 180;

  const hourHandX = CENTER + OUTER_R * Math.sin(hourAngleRad);
  const hourHandY = CENTER - OUTER_R * Math.cos(hourAngleRad);
  const minuteHandX = CENTER + INNER_R * Math.sin(minuteAngleRad);
  const minuteHandY = CENTER - INNER_R * Math.cos(minuteAngleRad);

  const displayLabel = value
    ? `${String(parsed.hour12).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')} ${parsed.isPM ? 'PM' : 'AM'}`
    : '';

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
            <span className="text-2xl font-bold text-gray-900 tabular-nums">{displayLabel || '--:-- --'}</span>
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

            {/* Hour numbers (outer ring) */}
            {HOUR_POSITIONS.map((h, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const x = CENTER + OUTER_R * Math.sin(angle);
              const y = CENTER - OUTER_R * Math.cos(angle);
              const active = parsed.hour12 === h;
              return (
                <text
                  key={`hour-${h}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none select-none"
                  fontSize={13}
                  fontWeight={active ? 700 : 500}
                  fill={active ? '#ffffff' : '#374151'}
                >
                  {h}
                </text>
              );
            })}

            {/* Minute ticks (inner ring, 5-min steps) */}
            {Array.from({ length: 12 }, (_, i) => i * 5).map((m, i) => {
              const angle = (i * 30 * Math.PI) / 180;
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
                  {String(m).padStart(2, '0')}
                </text>
              );
            })}
          </svg>

          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => onChange(toValue({ ...parsed, isPM: false }))}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors duration-150 ${
                !parsed.isPM ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => onChange(toValue({ ...parsed, isPM: true }))}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors duration-150 ${
                parsed.isPM ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              PM
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="ml-2 px-3 py-1 text-xs font-semibold rounded-md text-primary hover:bg-pantai-50 transition-colors duration-150"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
