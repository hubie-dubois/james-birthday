import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { DAY, createModel, getSnapshot, pluralize, formatAge } from '../age-core.mjs';

const data = JSON.parse(await readFile(new URL('../shortcut-data.json', import.meta.url), 'utf8'));
const model = createModel(data);
const timestamp = new Intl.DateTimeFormat('en-US', {
  month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  timeZone: data.referenceTimezone, timeZoneName: 'short',
});

export function buildMessage(now = new Date()) {
  const { age, elapsed, nextMilestone } = getSnapshot(model, now);
  const lines = [
    `${data.name} daily update`, '',
    `Generated: ${timestamp.format(now)}`, `Website: ${data.sourceUrl}`, '',
  ];
  if (!age) return `${[...lines, `${data.name} is not born yet.`, `Born: ${data.birthLabel}`].join('\n')}\n`;
  lines.push(
    `Current age in days: ${pluralize(Math.floor(elapsed / DAY), 'day')}`,
    `Current age in months: ${pluralize(age.years * 12 + age.months, 'month')}`,
    `Current age in years and months: ${pluralize(age.years, 'year')}, ${pluralize(age.months, 'month')}`,
    `Current age full: ${formatAge(age)}`,
  );
  if (nextMilestone) {
    lines.push(`Next milestone: age ${nextMilestone.age} on ${model.formatDate(nextMilestone.date)}`,
      `Next milestone is ${pluralize(Math.ceil((nextMilestone.date - now) / DAY), 'day')} away`);
  } else {
    lines.push('All planned milestones reached.');
  }
  return `${lines.join('\n')}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.stdout.write(buildMessage());
