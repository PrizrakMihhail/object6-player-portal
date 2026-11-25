const tablist = document.querySelector('.object-tabs');
const tabs = [...tablist.querySelectorAll('[role="tab"]')];
const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));

function selectTab(active, updateUrl = false) {
  tabs.forEach((tab, index) => {
    const selected = index === active;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    panels[index].hidden = !selected;
  });
  if (updateUrl) history.replaceState(null, '', `#${panels[active].id}`);
}

function selectFromUrl() {
  selectTab(Math.max(0, panels.findIndex(panel => `#${panel.id}` === location.hash)));
}

tablist.addEventListener('click', event => {
  const index = tabs.indexOf(event.target);
  if (index >= 0) selectTab(index, true);
});

tablist.addEventListener('keydown', event => {
  const index = tabs.indexOf(event.target);
  const next = {
    ArrowLeft: (index + tabs.length - 1) % tabs.length,
    ArrowRight: (index + 1) % tabs.length,
    Home: 0,
    End: tabs.length - 1
  }[event.key];
  if (index < 0 || !Number.isInteger(next)) return;
  event.preventDefault();
  selectTab(next, true);
  tabs[next].focus();
});

window.addEventListener('hashchange', selectFromUrl);
selectFromUrl();
tablist.hidden = false;
