// Local-time YYYY-MM-DD formatting, shared by dashboard widgets that need
// to compare against appointmentDate strings (which are local calendar dates).
export const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const todayLocal = (): string => formatDateLocal(new Date());

export const startOfWeek = (date: Date): Date => {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - result.getDay());
  return result;
};

export const endOfWeek = (date: Date): Date => {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  return result;
};
