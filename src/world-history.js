import { historyEvents } from './world-history-data.js';

const tablist = document.querySelector('.era-tabs');
const tabs = [...tablist.querySelectorAll('[role="tab"]')];

for (const tab of tabs) {
  const era = tab.getAttribute('aria-controls');
  const timeline = document.getElementById(era).querySelector('.timeline');
  let currentDate;
  let cards;

  for (const [date, title, description] of historyEvents[era]) {
    if (date !== currentDate) {
      currentDate = date;
      const entry = document.createElement('li');
      const year = Number.parseInt(date, 10);
      // The Varna disaster starts the final period before the End of Times.
      if (era === 'before' && year >= 1976) {
        const tension = Math.min(100, 20 + (year - 1976) * 80 / (1991 - 1976));
        entry.style.setProperty('--tension', `${tension}%`);
      }
      const label = document.createElement('h2');
      label.className = 'timeline-date';
      label.textContent = date;
      cards = document.createElement('div');
      cards.className = 'timeline-events';
      entry.append(label, cards);
      timeline.append(entry);
    }

    const card = document.createElement('details');
    card.className = 'timeline-event';
    const heading = document.createElement('summary');
    heading.textContent = title;
    const copy = document.createElement('p');
    copy.textContent = description;
    card.append(heading, copy);
    cards.append(card);
  }
}

function selectTab(active, { updateHash = false, focus = false } = {}) {
  for (const tab of tabs) {
    const selected = tab === active;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
  }
  if (updateHash) history.replaceState(null, '', `#${active.getAttribute('aria-controls')}`);
  if (focus) active.focus();
}

function selectFromUrl() {
  const active = tabs.find(tab => `#${tab.getAttribute('aria-controls')}` === location.hash);
  const selected = tabs.find(tab => tab.getAttribute('aria-selected') === 'true');
  selectTab(active ?? (location.hash ? selected : tabs[0]));
}

tablist.addEventListener('click', event => {
  const tab = event.target.closest('[role="tab"]');
  if (tab) selectTab(tab, { updateHash: true });
});

tablist.addEventListener('keydown', event => {
  const index = tabs.indexOf(event.target);
  const destinations = {
    ArrowLeft: (index + tabs.length - 1) % tabs.length,
    ArrowRight: (index + 1) % tabs.length,
    Home: 0,
    End: tabs.length - 1
  };
  if (index < 0 || !Object.hasOwn(destinations, event.key)) return;
  event.preventDefault();
  selectTab(tabs[destinations[event.key]], { updateHash: true, focus: true });
});

window.addEventListener('hashchange', selectFromUrl);
tablist.hidden = false;
selectFromUrl();
