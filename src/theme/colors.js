// Single source of truth for the Pantai Hospital blue/white color system.
// Plain JS (no TS) so tailwind.config.js can import it directly without a
// config-time TypeScript loader. src/theme/colors.ts re-exports this with types.

export const pantai = {
  50: '#f0f9ff',
  100: '#e0f2fe',
  200: '#b9e6fe',
  300: '#7cd4fd',
  400: '#36bffa',
  500: '#0ba5ec',
  600: '#0284c7',
  700: '#0369a1',
  800: '#075985',
  900: '#0c4a6e',
};

export const primary = {
  DEFAULT: pantai[600],
  light: pantai[500],
  dark: pantai[800],
};

export const secondary = {
  DEFAULT: '#64748b',
  light: '#94a3b8',
  dark: '#475569',
};

// Appointment status -> badge classes + chart hex.
// hex values are validated for CVD-safe adjacent separation and >=3:1 contrast
// (light chart surface #ffffff, dark chart surface #0f172a) via the dataviz
// skill's palette validator - see chartPalette.ts for the flat chart array.
export const statusColors = {
  Scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', hex: '#2563eb' },
  'Paid Scheduled': { bg: 'bg-green-100', text: 'text-green-800', hex: '#16a34a' },
  Cancelled: { bg: 'bg-red-100', text: 'text-red-800', hex: '#dc2626' },
  Completed: { bg: 'bg-purple-100', text: 'text-purple-800', hex: '#9333ea' },
  'No-show': { bg: 'bg-orange-100', text: 'text-orange-800', hex: '#ea580c' },
  Expired: { bg: 'bg-gray-100', text: 'text-gray-800', hex: '#0d9488' },
};

export const statusColorDefault = { bg: 'bg-gray-100', text: 'text-gray-800', hex: '#6b7280' };

// User role -> badge classes.
export const roleColors = {
  Admin: { bg: 'bg-purple-100', text: 'text-purple-800' },
  Doctor: { bg: 'bg-blue-100', text: 'text-blue-800' },
  Patient: { bg: 'bg-green-100', text: 'text-green-800' },
};

export const roleColorDefault = { bg: 'bg-gray-100', text: 'text-gray-800' };
