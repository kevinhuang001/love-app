import { Lunar, LunarMonth, Solar } from 'lunar-typescript';
const DAY = 86400000;
export function today() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
function parts(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('日期格式应为 YYYY-MM-DD');
  const [year, month, day] = date.split('-').map(Number);
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31)
    throw new Error('日期超出支持范围（1900–2100 年）');
  return [year, month, day];
}
export function validSolarDate(date) {
  try {
    const [y, m, d] = parts(date);
    return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10) === date;
  } catch {
    return false;
  }
}
export function solarDate(input) {
  const [y, m, d] = parts(input.date);
  if (input.calendar === 'lunar') {
    const month = LunarMonth.fromYm(y, input.leapMonth ? -m : m);
    if (!month || d > month.getDayCount())
      throw new Error('这一天不存在，请检查农历月份、日期与闰月');
    return Lunar.fromYmd(y, input.leapMonth ? -m : m, d)
      .getSolar()
      .toYmd();
  }
  if (!validSolarDate(input.date) || input.leapMonth) throw new Error('公历日期无效');
  return input.date;
}
export function daysTogether(start, current = today()) {
  return Math.max(0, Math.round((Date.parse(current) - Date.parse(start)) / DAY) + 1);
}
export function nextTodo(input, current = today()) {
  const original = solarDate(input);
  const difference = (date) => ({
    date,
    days: Math.round((Date.parse(date) - Date.parse(current)) / DAY),
  });
  if (input.repeat !== 'yearly') return difference(original);
  const [anchorYear, month, day] = parts(input.date);
  const [cy, cm, cd] = parts(current);
  const currentYear =
    input.calendar === 'lunar' ? Solar.fromYmd(cy, cm, cd).getLunar().getYear() : cy;
  for (let year = Math.max(anchorYear, currentYear); year <= 2100; year++) {
    let date;
    if (input.calendar === 'lunar') {
      const signedMonth = input.leapMonth ? -month : month;
      const lm = LunarMonth.fromYm(year, signedMonth);
      if (!lm) continue;
      date = Lunar.fromYmd(year, signedMonth, Math.min(day, lm.getDayCount())).getSolar().toYmd();
    } else {
      const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
      date = `${year}-${String(month).padStart(2, '0')}-${String(Math.min(day, count)).padStart(2, '0')}`;
    }
    if (date >= current && (!input.completedDate || date > input.completedDate))
      return difference(date);
  }
  return null;
}
export function lunarLabel(input) {
  if (input.calendar !== 'lunar') return input.date;
  const [y, m, d] = parts(input.date);
  const lunar = Lunar.fromYmd(y, input.leapMonth ? -m : m, d);
  return `农历${input.leapMonth ? '闰' : ''}${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
}

export function clockTime(current = Date.now()) {
  return new Date(current + 8 * 3600000).toISOString().slice(11, 19);
}
export function validTime(time) {
  return /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(time);
}
export function scheduleInstant(date, time = '00:00:00') {
  if (!validSolarDate(date) || !validTime(time)) throw new Error('日期或时间无效');
  return Date.parse(`${date}T${time}+08:00`);
}
export function elapsedSeconds(date, time, current = Date.now()) {
  return Math.max(0, Math.floor((current - scheduleInstant(date, time)) / 1000));
}
export function durationParts(seconds) {
  const total = Math.max(0, Math.floor(Math.abs(seconds)));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor(total / 3600) % 24,
    minutes: Math.floor(total / 60) % 60,
    seconds: total % 60,
  };
}
export function nextTodoInstant(input, current = Date.now()) {
  const currentDate = new Date(current + 8 * 3600000).toISOString().slice(0, 10);
  let next = nextTodo(input, currentDate);
  if (!next) return null;
  const time = input.time || '00:00:00';
  if (input.repeat === 'yearly' && scheduleInstant(next.date, time) < current) {
    next = nextTodo({ ...input, completedDate: next.date }, currentDate);
    if (!next) return null;
  }
  const timestamp = scheduleInstant(next.date, time);
  return { date: next.date, time, timestamp, seconds: Math.ceil((timestamp - current) / 1000) };
}
