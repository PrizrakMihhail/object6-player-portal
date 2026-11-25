import { historyEvents } from './world-history-data.js';
import { createClassifiedCard } from './classified-dispatch.js';

const tablist = document.querySelector('.era-tabs');
const tabs = [...tablist.querySelectorAll('[role="tab"]')];
const escalationStart = 1976;
const escalationEnd = Number.parseInt(historyEvents.before.at(-1)[0], 10);

for (const [era, events] of Object.entries(historyEvents)) {
  const timeline = document.getElementById(era).querySelector('.timeline');
  let currentDate;
  let cards;

  for (const [date, title, description, extraTemplate] of events) {
    if (date !== currentDate) {
      currentDate = date;
      const entry = document.createElement('li');
      const year = Number.parseInt(date, 10);
      // The Varna disaster starts the final period before the End of Times.
      if (era === 'before' && year >= escalationStart) {
        const tension = 20 + (year - escalationStart) * 80 / (escalationEnd - escalationStart);
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

    if (extraTemplate === 'classified-dispatch') {
      cards.append(createClassifiedCard());
      continue;
    }
    const card = document.createElement('details');
    card.className = 'timeline-event';
    const heading = document.createElement('summary');
    heading.textContent = title;
    const copy = document.createElement('p');
    copy.textContent = description;
    card.append(heading, copy);
    if (extraTemplate) card.append(document.getElementById(extraTemplate).content.cloneNode(true));
    cards.append(card);
  }
}

const map = document.querySelector('.timeline-map-view');
const mapReport = document.getElementById('map-report');
const reports = mapReport?.querySelectorAll('[data-report]');
const fullMap = document.querySelector('.full-map');
const mapViewport = fullMap?.querySelector('.full-map-viewport');
const mapHome = map?.parentElement;

document.querySelector('.map-open')?.addEventListener('click', () => {
  mapViewport.append(map);
  fullMap.showModal();
  mapViewport.scrollTo((mapViewport.scrollWidth - mapViewport.clientWidth) / 2,
    (mapViewport.scrollHeight - mapViewport.clientHeight) / 2);
});

fullMap?.addEventListener('close', () => mapHome.prepend(map));

let drag;
mapViewport?.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'mouse' || event.button !== 0) return;
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY,
    left: mapViewport.scrollLeft, top: mapViewport.scrollTop };
});

mapViewport?.addEventListener('pointermove', event => {
  if (drag?.id !== event.pointerId) return;
  if (!(event.buttons & 1)) { drag = undefined; return; }
  const x = event.clientX - drag.x;
  const y = event.clientY - drag.y;
  if (!mapViewport.hasPointerCapture(event.pointerId)) {
    if (Math.hypot(x, y) < 5) return;
    mapViewport.setPointerCapture(event.pointerId);
  }
  mapViewport.scrollTo(drag.left - x, drag.top - y);
});

for (const type of ['pointerup', 'pointercancel']) {
  mapViewport?.addEventListener(type, () => { drag = undefined; });
}

function positionMapReport() {
  if (!mapReport?.open) return;
  const mapBounds = map.getBoundingClientRect();
  const popupBounds = mapReport.getBoundingClientRect();
  const left = Math.max(8, Math.min(innerWidth - popupBounds.width - 8,
    mapBounds.left + (mapBounds.width - popupBounds.width) / 2));
  const top = Math.max(8, Math.min(innerHeight - popupBounds.height - 8,
    mapBounds.top + (mapBounds.height - popupBounds.height) / 2));
  mapReport.style.left = `${left}px`;
  mapReport.style.top = `${top}px`;
}

map?.addEventListener('click', event => {
  const point = event.target.closest('.map-point');
  if (!point) return;

  for (const report of reports) report.hidden = report.dataset.report !== point.dataset.region;
  point.focus({ preventScroll: true });
  mapReport.showModal();
  positionMapReport();
});

mapReport?.addEventListener('click', () => mapReport.close());
window.addEventListener('resize', positionMapReport);
window.addEventListener('scroll', positionMapReport, { passive: true });
mapViewport?.addEventListener('scroll', positionMapReport, { passive: true });

function selectTab(active, { updateHash = false, focus = false } = {}) {
  if (mapReport?.open) mapReport.close();
  if (fullMap?.open) fullMap.close();
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

const backToTop = document.querySelector('.back-to-top');
const title = document.getElementById('world-title');

function updateBackToTop() {
  backToTop.hidden = window.scrollY <= 0;
}

backToTop.addEventListener('click', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  title.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
});

window.addEventListener('scroll', updateBackToTop, { passive: true });
window.addEventListener('pageshow', updateBackToTop);
updateBackToTop();
