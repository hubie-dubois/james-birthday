const CONFIG = {
  name: "James",
  siteUrl: "https://james.hubiedubois.com/",
  birthIso: "2024-07-24T11:41:00-05:00",
  birthLabel: "July 24, 2024 at 11:41 AM Central Time",
  milestoneYears: [1, 2, 5, 10, 13, 16, 18],
  timezone: "America/Chicago",
};

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const BIRTH_DATE = new Date(CONFIG.birthIso);

if (Number.isNaN(BIRTH_DATE.getTime())) {
  throw new Error("Invalid birth date.");
}

function daysInUtcMonth(year, monthIndex) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function addUtcMonths(date, monthsToAdd) {
  const absoluteMonths = date.getUTCFullYear() * 12 + date.getUTCMonth() + monthsToAdd;
  const targetYear = Math.floor(absoluteMonths / 12);
  const targetMonth = ((absoluteMonths % 12) + 12) % 12;
  const targetDay = Math.min(date.getUTCDate(), daysInUtcMonth(targetYear, targetMonth));

  return new Date(
    Date.UTC(
      targetYear,
      targetMonth,
      targetDay,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    )
  );
}

function addUtcYears(date, yearsToAdd) {
  return addUtcMonths(date, yearsToAdd * 12);
}

function getAgeParts(start, end) {
  if (end < start) {
    return null;
  }

  let years = end.getUTCFullYear() - start.getUTCFullYear();
  let anchor = addUtcYears(start, years);

  if (anchor > end) {
    years -= 1;
    anchor = addUtcYears(start, years);
  }

  let months =
    (end.getUTCFullYear() - anchor.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - anchor.getUTCMonth());
  let monthAnchor = addUtcMonths(anchor, months);

  if (monthAnchor > end) {
    months -= 1;
    monthAnchor = addUtcMonths(anchor, months);
  }

  let remainder = end.getTime() - monthAnchor.getTime();
  const days = Math.floor(remainder / DAY);
  remainder -= days * DAY;
  const hours = Math.floor(remainder / HOUR);
  remainder -= hours * HOUR;
  const minutes = Math.floor(remainder / MINUTE);
  remainder -= minutes * MINUTE;
  const seconds = Math.floor(remainder / SECOND);

  return { years, months, days, hours, minutes, seconds };
}

function pluralize(value, label) {
  return `${value} ${label}${value === 1 ? "" : "s"}`;
}

function formatAge(parts) {
  return `${pluralize(parts.years, "year")}, ${pluralize(parts.months, "month")}, ${pluralize(parts.days, "day")}`;
}

function formatDateOnly(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatTimestamp(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: CONFIG.timezone,
    timeZoneName: "short",
  }).format(date);
}

function getNextMilestone(now) {
  for (const year of CONFIG.milestoneYears) {
    const date = addUtcYears(BIRTH_DATE, year);
    if (date > now) {
      return { age: year, date };
    }
  }

  const finalAge = CONFIG.milestoneYears[CONFIG.milestoneYears.length - 1];
  return { age: finalAge, date: addUtcYears(BIRTH_DATE, finalAge) };
}

const now = new Date();
const age = getAgeParts(BIRTH_DATE, now);
const nextMilestone = getNextMilestone(now);
const daysUntilMilestone = Math.max(0, Math.floor((nextMilestone.date.getTime() - now.getTime()) / DAY));

const message = [
  "James daily update",
  "",
  `Generated: ${formatTimestamp(now)}`,
  `Website: ${CONFIG.siteUrl}`,
  "",
  `Current age: ${formatAge(age)}`,
  `Next milestone: age ${nextMilestone.age} on ${formatDateOnly(nextMilestone.date)}`,
  `Days until next milestone: ${daysUntilMilestone}`,
].join("\n");

process.stdout.write(`${message}\n`);
