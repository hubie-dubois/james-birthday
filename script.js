const CONFIG = {
  name: "James",
  // Chicago was observing daylight saving time on July 24, 2024.
  birthIso: "2024-07-24T11:41:00-05:00",
  birthLabel: "July 24, 2024 at 11:41 AM Central Time",
  adulthoodYears: 18,
  milestoneYears: [1, 2, 5, 10, 13, 16, 18],
};

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const BIRTH_DATE = new Date(CONFIG.birthIso);
const ADULTHOOD_DATE = addUtcYears(BIRTH_DATE, CONFIG.adulthoodYears);
const numberFormatter = new Intl.NumberFormat("en-US");

const elements = {
  ageSummary: document.getElementById("ageSummary"),
  ageDetail: document.getElementById("ageDetail"),
  daysAlive: document.getElementById("daysAlive"),
  nextBirthdayDate: document.getElementById("nextBirthdayDate"),
  nextBirthdayCountdown: document.getElementById("nextBirthdayCountdown"),
  daysToAdult: document.getElementById("daysToAdult"),
  adultCountdown: document.getElementById("adultCountdown"),
  lifeProgress: document.getElementById("lifeProgress"),
  lifeProgressText: document.getElementById("lifeProgressText"),
  milestoneList: document.getElementById("milestoneList"),
  totalMonths: document.getElementById("totalMonths"),
  totalWeeks: document.getElementById("totalWeeks"),
  totalHours: document.getElementById("totalHours"),
  totalMinutes: document.getElementById("totalMinutes"),
  totalSeconds: document.getElementById("totalSeconds"),
};

if (Number.isNaN(BIRTH_DATE.getTime())) {
  throw new Error("The birth date is invalid. Update CONFIG.birthIso in script.js.");
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
  remainder -= seconds * SECOND;

  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    milliseconds: remainder,
  };
}

function pluralize(value, label) {
  return `${numberFormatter.format(value)} ${label}${value === 1 ? "" : "s"}`;
}

function formatAgeSummary(parts) {
  return `${pluralize(parts.years, "year")}, ${pluralize(parts.months, "month")}, ${pluralize(parts.days, "day")}`;
}

function formatAgeDetail(parts) {
  return `${pluralize(parts.hours, "hour")}, ${pluralize(parts.minutes, "minute")}, ${pluralize(parts.seconds, "second")}`;
}

function formatCompactCountdown(target, now) {
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return "right now";
  }

  const days = Math.floor(diff / DAY);
  const hours = Math.floor((diff % DAY) / HOUR);
  const minutes = Math.floor((diff % HOUR) / MINUTE);

  if (days > 0) {
    return `${pluralize(days, "day")}, ${pluralize(hours, "hour")}`;
  }

  if (hours > 0) {
    return `${pluralize(hours, "hour")}, ${pluralize(minutes, "minute")}`;
  }

  const seconds = Math.floor((diff % MINUTE) / SECOND);
  return `${pluralize(minutes, "minute")}, ${pluralize(seconds, "second")}`;
}

function formatDateOnly(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getNextBirthday(currentAgeYears) {
  const nextAge = currentAgeYears + 1;
  return {
    age: nextAge,
    date: addUtcYears(BIRTH_DATE, nextAge),
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function renderMilestones(now) {
  const nextMilestoneAge = CONFIG.milestoneYears.find((year) => addUtcYears(BIRTH_DATE, year) > now);

  elements.milestoneList.innerHTML = CONFIG.milestoneYears
    .map((year) => {
      const date = addUtcYears(BIRTH_DATE, year);
      const reached = now >= date;
      const isNext = nextMilestoneAge === year;

      return `
        <div class="milestone${isNext ? " is-next" : ""}">
          <div>
            <p class="milestone-title">${CONFIG.name} turns ${year}</p>
            <p class="milestone-meta">${formatDateOnly(date)}</p>
          </div>
          <p class="milestone-status">${reached ? "Reached" : `${formatCompactCountdown(date, now)} away`}</p>
        </div>
      `;
    })
    .join("");
}

function render() {
  const now = new Date();
  const age = getAgeParts(BIRTH_DATE, now);

  if (!age) {
    elements.ageSummary.textContent = "Not born yet";
    elements.ageDetail.textContent = `The countdown is set to ${CONFIG.birthLabel}.`;
    return;
  }

  const totalMs = now.getTime() - BIRTH_DATE.getTime();
  const totalDays = Math.floor(totalMs / DAY);
  const totalWeeks = Math.floor(totalMs / WEEK);
  const totalHours = Math.floor(totalMs / HOUR);
  const totalMinutes = Math.floor(totalMs / MINUTE);
  const totalSeconds = Math.floor(totalMs / SECOND);
  const totalMonths = age.years * 12 + age.months;
  const nextBirthday = getNextBirthday(age.years);
  const adulthoodDiff = ADULTHOOD_DATE.getTime() - now.getTime();
  const adulthoodDays = Math.max(0, Math.floor(adulthoodDiff / DAY));
  const progress = clamp(totalMs / (ADULTHOOD_DATE.getTime() - BIRTH_DATE.getTime()), 0, 1);

  elements.ageSummary.textContent = formatAgeSummary(age);
  elements.ageDetail.textContent = `${formatAgeDetail(age)} into the current day.`;
  elements.ageSummary.setAttribute(
    "aria-label",
    `${CONFIG.name} is ${formatAgeSummary(age)} and ${formatAgeDetail(age)} old.`
  );

  elements.daysAlive.textContent = numberFormatter.format(totalDays);
  elements.nextBirthdayDate.textContent = formatDateOnly(nextBirthday.date);
  elements.nextBirthdayCountdown.textContent = `${formatCompactCountdown(nextBirthday.date, now)} until birthday ${nextBirthday.age}.`;
  elements.daysToAdult.textContent = numberFormatter.format(adulthoodDays);
  elements.adultCountdown.textContent = `${formatCompactCountdown(ADULTHOOD_DATE, now)} until 18.`;
  elements.lifeProgress.style.width = `${(progress * 100).toFixed(4)}%`;
  elements.lifeProgressText.textContent = `${(progress * 100).toFixed(2)}% of the way from birth to age ${CONFIG.adulthoodYears}.`;

  elements.totalMonths.textContent = numberFormatter.format(totalMonths);
  elements.totalWeeks.textContent = numberFormatter.format(totalWeeks);
  elements.totalHours.textContent = numberFormatter.format(totalHours);
  elements.totalMinutes.textContent = numberFormatter.format(totalMinutes);
  elements.totalSeconds.textContent = numberFormatter.format(totalSeconds);

  document.title = `${CONFIG.name} is ${age.years}y ${age.months}m ${age.days}d old`;
  renderMilestones(now);
}

function schedule() {
  render();
  const delay = 1000 - (Date.now() % 1000) + 10;
  window.setTimeout(schedule, delay);
}

schedule();
