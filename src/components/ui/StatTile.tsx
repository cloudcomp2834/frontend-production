import type { LucideIcon } from 'lucide-react';

interface StatTileProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  subLabel?: string;
  accent?: 'primary' | 'green' | 'orange' | 'purple';
}

const accentClasses: Record<NonNullable<StatTileProps['accent']>, string> = {
  primary: 'bg-pantai-50 text-primary',
  green: 'bg-green-50 text-green-700',
  orange: 'bg-orange-50 text-orange-700',
  purple: 'bg-purple-50 text-purple-700',
};

export const StatTile = ({ label, value, icon: Icon, subLabel, accent = 'primary' }: StatTileProps) => (
  <div className="card flex items-start gap-4">
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${accentClasses[accent]}`}>
      <Icon className="w-5 h-5" strokeWidth={2} />
    </div>
    <div className="min-w-0">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      {subLabel && <p className="text-xs text-gray-500 mt-0.5">{subLabel}</p>}
    </div>
  </div>
);
