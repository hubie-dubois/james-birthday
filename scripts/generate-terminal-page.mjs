import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const dataPath = fileURLToPath(new URL("../shortcut-data.json", import.meta.url));
const data = JSON.parse(await readFile(dataPath, "utf8"));

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const WIDTH = 78;
const ESC = "\u001B";
const BEL = "\u0007";
const RESET = `${ESC}[0m`;

const theme = {
  bold: `${ESC}[1m`,
  dim: `${ESC}[2m`,
  border: rgb(78, 143, 153),
  cyan: rgb(111, 212, 216),
  gold: rgb(243, 198, 119),
  orange: rgb(255, 159, 74),
  green: rgb(117, 222, 141),
  soft: rgb(191, 212, 209),
  muted: rgb(143, 176, 173),
  text: rgb(244, 239, 230),
};

const numberFormatter = new Intl.NumberFormat("en-US");
const timezone = data.referenceTimezone || "America/Chicago";
const birthDate = parseDate(data.birthIso, "birthIso");
const adulthoodDate = data.adulthoodIso
  ? parseDate(data.adulthoodIso, "adulthoodIso")
  : addUtcYears(birthDate, data.adulthoodYears);
const milestoneYears = data.milestoneYears || data.milestones.map(({ age }) => age);

function rgb(red, green, blue) {
  return `${ESC}[38;2;${red};${green};${blue}m`;
}

function color(text, ...styles) {
  return `${styles.join("")}${text}${RESET}`;
}

function gradientText(text, startColor, endColor) {
  const visibleChars = Array.from(text).filter((char) => char !== " ");
  const steps = Math.max(visibleChars.length - 1, 1);
  let index = 0;

  return `${Array.from(text)
    .map((char) => {
      if (char === " ") {
        return char;
      }

      const ratio = index / steps;
      index += 1;
      const nextColor = startColor.map((value, colorIndex) =>
        Math.round(value + (endColor[colorIndex] - value) * ratio)
      );

      return `${rgb(...nextColor)}${char}`;
    })
    .join("")}${RESET}`;
}

const ansiPattern = /\u001B(?:\[[0-?]*[ -/]*[@-~]|\][^\u0007]*(?:\u0007|\u001B\\))/g;

function stripAnsi(text) {
  return text.replace(ansiPattern, "");
}

function visibleLength(text) {
  return Array.from(stripAnsi(text)).length;
}

function padAnsiRight(text, width) {
  return `${text}${" ".repeat(Math.max(width - visibleLength(text), 0))}`;
}

function parseDate(value, fieldName) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${fieldName} in shortcut-data.json.`);
  }

  return date;
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

function getMilestoneDate(year) {
  const storedMilestone = data.milestones?.find((milestone) => milestone.age === year);
  return storedMilestone ? parseDate(storedMilestone.dateIso, `milestone ${year}`) : addUtcYears(birthDate, year);
}

function getNextMilestone(now) {
  for (const year of milestoneYears) {
    const date = getMilestoneDate(year);

    if (date > now) {
      return { age: year, date };
    }
  }

  const finalAge = milestoneYears[milestoneYears.length - 1];
  return { age: finalAge, date: getMilestoneDate(finalAge) };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function pluralize(value, label) {
  return `${numberFormatter.format(value)} ${label}${value === 1 ? "" : "s"}`;
}

function formatAge(parts) {
  return `${pluralize(parts.years, "year")}, ${pluralize(parts.months, "month")}, ${pluralize(parts.days, "day")}`;
}

function formatClock(parts) {
  return `${pluralize(parts.hours, "hour")}, ${pluralize(parts.minutes, "minute")}, ${pluralize(parts.seconds, "second")}`;
}

function formatDateOnly(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  }).format(date);
}

function formatTimestamp(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  }).format(date);
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

function progressBar(ratio, width = 38) {
  const filled = clamp(Math.round(ratio * width), 0, width);
  const empty = width - filled;
  return `${color("█".repeat(filled), theme.cyan)}${color("░".repeat(empty), theme.dim, theme.muted)}`;
}

function topBorder() {
  return color(`+${"-".repeat(WIDTH - 2)}+`, theme.border);
}

function separator() {
  return color(`|${"-".repeat(WIDTH - 2)}|`, theme.border);
}

function terminalLine(content = "") {
  const innerWidth = WIDTH - 4;
  return `${color("|", theme.border)} ${padAnsiRight(content, innerWidth)} ${color("|", theme.border)}`;
}

function stat(label, value, accent = theme.text) {
  return `${color(label.padEnd(19), theme.muted)} ${color(value, theme.bold, accent)}`;
}

function hyperlink(url, label) {
  return `${ESC}]8;;${url}${BEL}${label}${ESC}]8;;${BEL}`;
}

function terminalUrl() {
  return new URL("terminal.txt", data.sourceUrl).href;
}

function milestoneToken(year, now, nextMilestone) {
  const date = getMilestoneDate(year);

  if (date <= now) {
    return color(`${year}Y reached`, theme.green);
  }

  if (year === nextMilestone.age) {
    return color(`${year}Y next`, theme.bold, theme.gold);
  }

  return color(`${year}Y ${formatDateOnly(date).replace(", 20", " '")}`, theme.muted);
}

function renderMilestones(now, nextMilestone) {
  const tokens = milestoneYears.map((year) => milestoneToken(year, now, nextMilestone));
  const rows = [];

  for (let index = 0; index < tokens.length; index += 3) {
    rows.push(
      terminalLine(
        tokens
          .slice(index, index + 3)
          .map((token) => padAnsiRight(token, 22))
          .join(" ")
      )
    );
  }

  return rows;
}

function buildDashboard() {
  const now = new Date();
  const age = getAgeParts(birthDate, now);
  const output = [`${ESC}]0;${data.name} Right Now${BEL}${topBorder()}`];

  [
    "      _   _   _   _   _        _   _   _   _   _        _   _   _",
    "     / \\ / \\ / \\ / \\ / \\      / \\ / \\ / \\ / \\ / \\      / \\ / \\ / \\",
    "    ( J | A | M | E | S )    ( R | I | G | H | T )    ( N | O | W )",
    "     \\_/ \\_/ \\_/ \\_/ \\_/      \\_/ \\_/ \\_/ \\_/ \\_/      \\_/ \\_/ \\_/",
  ].forEach((line) => output.push(terminalLine(gradientText(line, [111, 212, 216], [243, 198, 119]))));
  output.push(terminalLine(color("TERMINAL BIRTHDAY TELEMETRY", theme.bold, theme.gold)));
  output.push(separator());
  output.push(terminalLine(`${color("Generated", theme.muted)} ${formatTimestamp(now)}`));
  output.push(terminalLine(`${color("Born", theme.muted)}      ${data.birthLabel}`));
  output.push(terminalLine(`${color("Website", theme.muted)}   ${hyperlink(data.sourceUrl, data.sourceUrl)}`));
  output.push(separator());

  if (!age) {
    const birthCountdown = formatCompactCountdown(birthDate, now);
    output.push(terminalLine(color(`${data.name} is not born yet.`, theme.bold, theme.gold)));
    output.push(terminalLine(`${color("Countdown", theme.muted)} ${birthCountdown}`));
    output.push(topBorder());
    return `${output.join("\n")}\n${RESET}`;
  }

  const totalMs = now.getTime() - birthDate.getTime();
  const totalDays = Math.floor(totalMs / DAY);
  const totalWeeks = Math.floor(totalMs / WEEK);
  const totalHours = Math.floor(totalMs / HOUR);
  const totalMinutes = Math.floor(totalMs / MINUTE);
  const totalSeconds = Math.floor(totalMs / SECOND);
  const totalMonths = age.years * 12 + age.months;
  const nextBirthdayAge = age.years + 1;
  const currentBirthdayDate = addUtcYears(birthDate, age.years);
  const nextBirthdayDate = addUtcYears(birthDate, nextBirthdayAge);
  const nextMilestone = getNextMilestone(now);
  const progressToAdulthood = clamp(totalMs / (adulthoodDate.getTime() - birthDate.getTime()), 0, 1);
  const progressToBirthday = clamp(
    (now.getTime() - currentBirthdayDate.getTime()) /
      (nextBirthdayDate.getTime() - currentBirthdayDate.getTime()),
    0,
    1
  );

  output.push(terminalLine(stat("Age", formatAge(age), theme.gold)));
  output.push(terminalLine(stat("Clock detail", `${formatClock(age)} into this age snapshot`, theme.cyan)));
  output.push(terminalLine(stat("Days alive", pluralize(totalDays, "day"), theme.green)));
  output.push(terminalLine(stat("Total months", pluralize(totalMonths, "month"), theme.orange)));
  output.push(terminalLine(stat("Total weeks", pluralize(totalWeeks, "week"), theme.soft)));
  output.push(separator());
  output.push(
    terminalLine(
      `${color("Birth", theme.green)} ${progressBar(progressToAdulthood)} ${color("Age 18", theme.gold)} ${color(
        `${(progressToAdulthood * 100).toFixed(2)}%`,
        theme.bold,
        theme.gold
      )}`
    )
  );
  output.push(
    terminalLine(
      `${color(`Age ${age.years}`, theme.green)} ${progressBar(progressToBirthday)} ${color(
        `Age ${nextBirthdayAge}`,
        theme.gold
      )} ${color(`${(progressToBirthday * 100).toFixed(1)}%`, theme.bold, theme.gold)}`
    )
  );
  output.push(separator());
  output.push(terminalLine(stat("Next birthday", `Age ${nextBirthdayAge} on ${formatDateOnly(nextBirthdayDate)}`, theme.gold)));
  output.push(terminalLine(stat("Birthday ETA", formatCompactCountdown(nextBirthdayDate, now), theme.cyan)));
  output.push(terminalLine(stat("Next milestone", `Age ${nextMilestone.age} on ${formatDateOnly(nextMilestone.date)}`, theme.gold)));
  output.push(terminalLine(stat("Milestone ETA", formatCompactCountdown(nextMilestone.date, now), theme.cyan)));
  output.push(separator());
  output.push(terminalLine(color("MILESTONE RADAR", theme.bold, theme.gold)));
  output.push(...renderMilestones(now, nextMilestone));
  output.push(separator());
  output.push(terminalLine(stat("Total hours", pluralize(totalHours, "hour"), theme.soft)));
  output.push(terminalLine(stat("Total minutes", pluralize(totalMinutes, "minute"), theme.soft)));
  output.push(terminalLine(stat("Total seconds", pluralize(totalSeconds, "second"), theme.soft)));
  output.push(separator());
  output.push(terminalLine(`${color("Curl", theme.muted)}    curl -sL ${terminalUrl()}`));
  output.push(terminalLine(`${color("Refresh", theme.muted)} rerun curl for the latest generated terminal snapshot`));
  output.push(topBorder());

  return `${output.join("\n")}\n${RESET}`;
}

process.stdout.write(buildDashboard());
