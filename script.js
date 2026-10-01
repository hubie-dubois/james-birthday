import { DAY, WEEK, HOUR, MINUTE, SECOND, createModel, getSnapshot, formatAge, formatClock, formatCompactCountdown } from './age-core.mjs';

const ids = ['ageSummary', 'ageDetail', 'ageYears', 'ageMonths', 'ageDays', 'birthdayAge', 'progressPercent', 'daysAlive', 'nextBirthdayDate', 'nextBirthdayCountdown', 'daysToAdult', 'adultCountdown', 'lifeProgress', 'lifeProgressText', 'milestoneList', 'totalMonths', 'totalWeeks', 'totalHours', 'totalMinutes', 'totalSeconds'];
const elements = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
const numbers = new Intl.NumberFormat('en-US');
function setText(id, value) {
  const element = elements[id];
  if (element && element.textContent !== String(value)) element.textContent = value;
}

async function start() {
  const response = await fetch(new URL('./shortcut-data.json', import.meta.url));
  if (!response.ok) throw new Error(`Configuration request failed (${response.status}).`);
  const model = createModel(await response.json());
  // Build the timeline once; each tick only updates changed text and status.
  elements.milestoneList.replaceChildren();
  const milestoneElements = model.milestones.map(milestone => {
    const row = document.createElement('div'); row.className = 'milestone';
    const copy = document.createElement('div');
    const title = document.createElement('p'); title.className = 'milestone-title';
    title.textContent = `${model.data.name} turns ${milestone.age}`;
    const date = document.createElement('p'); date.className = 'milestone-meta'; date.textContent = model.formatDate(milestone.date);
    const status = document.createElement('p'); status.className = 'milestone-status';
    copy.append(title, date); row.append(copy, status); elements.milestoneList.append(row);
    return { milestone, row, status };
  });

  function render() {
    const now = new Date();
    const snapshot = getSnapshot(model, now);
    const { age, elapsed, nextBirthday, nextMilestone, progress, adultReached } = snapshot;
    setText('ageSummary', age ? formatAge(age) : 'Not born yet');
    setText('ageDetail', age ? `${formatClock(age)} & counting` : `Arriving ${model.data.birthLabel}`);
    for (const [id, part] of [['ageYears', 'years'], ['ageMonths', 'months'], ['ageDays', 'days']]) setText(id, age ? age[part] : '—');
    setText('daysAlive', numbers.format(Math.floor(elapsed / DAY)));
    setText('birthdayAge', nextBirthday.age);
    setText('nextBirthdayDate', model.formatDate(nextBirthday.date));
    setText('nextBirthdayCountdown', `${formatCompactCountdown(nextBirthday.date, now)} until birthday ${nextBirthday.age}.`);
    setText('daysToAdult', numbers.format(snapshot.daysToAdult));
    setText('adultCountdown', adultReached ? 'The first eighteen years, complete.' : `${formatCompactCountdown(model.adulthood, now)} until 18.`);
    elements.lifeProgress.style.width = `${progress * 100}%`;
    // Keep the accessible value useful without changing it every second.
    elements.lifeProgress.parentElement.setAttribute('aria-valuenow', (progress * 100).toFixed(2));
    setText('progressPercent', `${(progress * 100).toFixed(1)}%`);
    setText('lifeProgressText', adultReached ? 'Eighteen years of moments. A whole new chapter ahead.' : `${(progress * 100).toFixed(2)}% of the way from birth to age ${model.data.adulthoodYears}.`);
    for (const [id, unit] of [['totalWeeks', WEEK], ['totalHours', HOUR], ['totalMinutes', MINUTE], ['totalSeconds', SECOND]]) setText(id, numbers.format(Math.floor(elapsed / unit)));
    setText('totalMonths', numbers.format(age ? age.years * 12 + age.months : 0));
    const title = age ? `${model.data.name} is ${age.years}y ${age.months}m ${age.days}d old` : `${model.data.name} · Coming soon`;
    if (document.title !== title) document.title = title;
    for (const { milestone, row, status } of milestoneElements) {
      const reached = now >= milestone.date;
      row.classList.toggle('is-next', milestone === nextMilestone);
      row.classList.toggle('is-complete', reached);
      const text = reached ? 'Reached' : `${formatCompactCountdown(milestone.date, now)} away`;
      if (status.textContent !== text) status.textContent = text;
    }
  }
  let timeout;
  function tick() {
    clearTimeout(timeout);
    render();
    if (!document.hidden) timeout = setTimeout(tick, 1000 - Date.now() % 1000 + 10);
  }
  document.addEventListener('visibilitychange', tick);
  tick();
}

start().catch(error => {
  console.error('Unable to start the age clock:', error);
  setText('ageSummary', 'The clock is taking a moment.');
  setText('ageDetail', 'Could not load the live clock. Please reload to try again.');
});
