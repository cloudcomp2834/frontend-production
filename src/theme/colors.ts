// Typed re-export of colors.js for use in React/TS components and charts.
import {
  pantai,
  primary,
  secondary,
  statusColors,
  statusColorDefault,
  roleColors,
  roleColorDefault,
} from './colorTokens.js';

export { pantai, primary, secondary, statusColors, statusColorDefault, roleColors, roleColorDefault };

export type StatusKey = keyof typeof statusColors;
export type RoleKey = keyof typeof roleColors;

export const getStatusColor = (status: string) =>
  (statusColors as Record<string, { bg: string; text: string; hex: string }>)[status] ?? statusColorDefault;

export const getRoleColor = (role: string) =>
  (roleColors as Record<string, { bg: string; text: string }>)[role] ?? roleColorDefault;
