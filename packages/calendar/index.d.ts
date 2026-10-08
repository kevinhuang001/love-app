export type Schedule = {
  date: string;
  calendar: 'solar' | 'lunar';
  leapMonth: boolean | number;
  repeat: 'none' | 'yearly';
  completedDate?: string | null;
  time?: string;
};
export function today(): string;
export function validSolarDate(date: string): boolean;
export function solarDate(input: Pick<Schedule, 'date' | 'calendar' | 'leapMonth'>): string;
export function daysTogether(start: string, current?: string): number;
export function nextTodo(input: Schedule, current?: string): { date: string; days: number } | null;
export function lunarLabel(input: Schedule): string;
export function clockTime(current?: number): string;
export function validTime(time: string): boolean;
export function scheduleInstant(date: string, time?: string): number;
export function elapsedSeconds(date: string, time: string, current?: number): number;
export function durationParts(seconds: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};
export function nextTodoInstant(
  input: Schedule,
  current?: number,
): { date: string; time: string; timestamp: number; seconds: number } | null;
