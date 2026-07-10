import { getStatusColor, getRoleColor } from '../theme/colors';

export const getStatusBadgeClasses = (status: string): string => {
  const { bg, text } = getStatusColor(status);
  return `${bg} ${text}`;
};

export const getRoleBadgeClasses = (role: string): string => {
  const { bg, text } = getRoleColor(role);
  return `${bg} ${text}`;
};
