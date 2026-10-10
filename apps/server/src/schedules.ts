import { z } from 'zod';
import { validSolarDate, solarDate, annualDate, validTime, scheduleInstant } from '@love/calendar';
export const timeSchema = z.string().refine(validTime, '时间格式应为 HH:mm:ss').default('00:00:00');
export const anniversarySchema = z
  .object({
    title: z.string().trim().min(1).max(80),
    date: z.string().refine(validSolarDate, '日期无效'),
    time: timeSchema,
  })
  .refine(
    (v) =>
      validSolarDate(v.date) && validTime(v.time) && scheduleInstant(v.date, v.time) <= Date.now(),
    '纪念日不能晚于当前时间',
  );
export const relationshipSchema = z
  .object({
    startDate: z.string().refine(validSolarDate, '日期无效'),
    startTime: timeSchema,
  })
  .refine(
    (v) =>
      validSolarDate(v.startDate) &&
      validTime(v.startTime) &&
      scheduleInstant(v.startDate, v.startTime) <= Date.now(),
    '开始时间不能晚于当前时间',
  );
export const todoSchema = z
  .object({
    title: z.string().trim().min(1).max(80),
    date: z.string(),
    time: timeSchema,
    calendar: z.enum(['solar', 'lunar']).default('solar'),
    leapMonth: z.boolean().default(false),
    repeat: z.enum(['none', 'yearly']).default('none'),
  })
  .superRefine((value, ctx) => {
    try {
      if (value.repeat === 'yearly')
        value.date = annualDate(value.date.slice(5), value.calendar, value.leapMonth);
      solarDate(value);
    } catch (error) {
      ctx.addIssue({ code: 'custom', path: ['date'], message: (error as Error).message });
    }
  });
export const aiNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(24)
  .regex(/^[^\s@]+$/u, 'AI 名称不能包含空格或 @');
export const aiProfileSchema = z.object({
  name: aiNameSchema,
  avatarMediaId: z.string().uuid().nullable().optional(),
});
export function mentionsAI(content: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|\\s)@${escaped}(?=$|[\\s，。！？、,:;!?.])`, 'u').test(content);
}
