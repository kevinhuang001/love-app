import { z } from 'zod';
import { today, validSolarDate, solarDate } from '@love/calendar';
export const anniversarySchema = z.object({
  title: z.string().trim().min(1).max(80),
  date: z
    .string()
    .refine(
      (v) => validSolarDate(v) && v <= today(),
      '纪念日请选择今天或过去的日期；未来的安排请放到 To Do',
    ),
});
export const todoSchema = z
  .object({
    title: z.string().trim().min(1).max(80),
    date: z.string(),
    calendar: z.enum(['solar', 'lunar']).default('solar'),
    leapMonth: z.boolean().default(false),
    repeat: z.enum(['none', 'yearly']).default('none'),
  })
  .superRefine((value, ctx) => {
    try {
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
