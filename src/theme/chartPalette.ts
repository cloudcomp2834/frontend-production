// Chart-specific tokens, validated via the dataviz skill's palette validator
// (node scripts/validate_palette.js) against a white chart surface.
// The app has no dark-mode support today, so only light-surface values are wired up.
import { pantai } from './colors.js';

// Single-series trend bar/line fill (brand blue, passes lightness/chroma/contrast checks).
export const trendSeriesColor = pantai[600];

// Chart chrome - recessive grid/axis ink, not brand-colored.
export const chartChrome = {
  surface: '#ffffff',
  gridline: '#e5e7eb',
  axis: '#9ca3af',
  mutedInk: '#6b7280',
};
