export type Schedule = {
  date: string;
  calendar: 'solar' | 'lunar';
  leapMonth: boolean | number;
  repeat: 'none' | 'yearly';
  completedDate?: string | null;
};
export function today(): string;
export function validSolarDate(date: string): boolean;
export function solarDate(input: Pick<Schedule, 'date' | 'calendar' | 'leapMonth'>): string;
export function daysTogether(start: string, current?: string): number;
export function nextTodo(input: Schedule, current?: string): { date: string; days: number } | null;
export function lunarLabel(input: Schedule): string;
