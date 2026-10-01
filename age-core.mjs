// Shared by the browser and generated snapshots. Calendar units use UTC anchors;
// elapsed days are always 24 hours, independent of the viewer's time zone or DST.
export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;
const numbers = new Intl.NumberFormat('en-US');

export function parseDate(value, label = 'date') {
  const date = new Date(value);
  if (value == null || Number.isNaN(date.getTime())) throw new Error(`Invalid ${label}.`);
  return date;
}

export function addUtcMonths(date, months) {
  const absolute = date.getUTCFullYear() * 12 + date.getUTCMonth() + months;
  const year = Math.floor(absolute / 12);
  const month = ((absolute % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay),
    date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()));
}
export function addUtcYears(date, years) { return addUtcMonths(date, years * 12); }
export function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
export function pluralize(value, label) { return `${numbers.format(value)} ${label}${value === 1 ? '' : 's'}`; }
export function formatAge(parts) {
  return `${pluralize(parts.years, 'year')}, ${pluralize(parts.months, 'month')}, ${pluralize(parts.days, 'day')}`;
}
export function formatClock(parts) {
  return `${pluralize(parts.hours, 'hour')}, ${pluralize(parts.minutes, 'minute')}, ${pluralize(parts.seconds, 'second')}`;
}
export function getAgeParts(start, end) {
  if (end < start) return null;
  // Anchor every month to the original date so a short month cannot permanently
  // shift subsequent anniversaries (January 31 -> February 28 -> March 31).
  let totalMonths = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
  if (addUtcMonths(start, totalMonths) > end) totalMonths -= 1;
  let remainder = end - addUtcMonths(start, totalMonths);
  const days = Math.floor(remainder / DAY); remainder %= DAY;
  const hours = Math.floor(remainder / HOUR); remainder %= HOUR;
  const minutes = Math.floor(remainder / MINUTE); remainder %= MINUTE;
  const seconds = Math.floor(remainder / SECOND);
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12, days, hours, minutes, seconds };
}
export function formatCompactCountdown(target, now) {
  const diff = target - now;
  if (diff <= 0) return 'right now';
  const days = Math.floor(diff / DAY);
  const hours = Math.floor((diff % DAY) / HOUR);
  const minutes = Math.floor((diff % HOUR) / MINUTE);
  if (days > 0) return `${pluralize(days, 'day')}, ${pluralize(hours, 'hour')}`;
  if (hours > 0) return `${pluralize(hours, 'hour')}, ${pluralize(minutes, 'minute')}`;
  return `${pluralize(minutes, 'minute')}, ${pluralize(Math.floor((diff % MINUTE) / SECOND), 'second')}`;
}
export function createModel(data) {
  const birth = parseDate(data.birthIso, 'birthIso');
  const adulthood = parseDate(data.adulthoodIso, 'adulthoodIso');
  if (!(adulthood > birth) || !Number.isInteger(data.adulthoodYears) || data.adulthoodYears < 1) throw new Error('Invalid adulthood configuration.');
  if (typeof data.name !== 'string' || !data.name.trim()) throw new Error('Missing name.');
  if (!Array.isArray(data.milestoneYears) || !data.milestoneYears.length ||
      data.milestoneYears.some((year, index, years) => !Number.isInteger(year) || year <= 0 || (index > 0 && year <= years[index - 1]))) {
    throw new Error('Milestone years must be positive, unique and ascending.');
  }
  const milestones = data.milestoneYears.map(year => ({
    age: year,
    date: parseDate(data.milestones?.find(m => m.age === year)?.dateIso ?? addUtcYears(birth, year), `milestone ${year}`),
  }));
  const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: data.referenceTimezone });
  return { data, birth, adulthood, milestones, formatDate: date => dateFormatter.format(date) };
}
export function getSnapshot(model, now) {
  const age = getAgeParts(model.birth, now);
  const elapsed = Math.max(0, now - model.birth);
  return {
    age, elapsed,
    nextBirthday: { age: age ? age.years + 1 : 1, date: addUtcYears(model.birth, age ? age.years + 1 : 1) },
    nextMilestone: model.milestones.find(m => m.date > now) ?? null,
    adultReached: now >= model.adulthood,
    progress: clamp(elapsed / (model.adulthood - model.birth), 0, 1),
    daysToAdult: Math.max(0, Math.ceil((model.adulthood - now) / DAY)),
  };
}
