const header = document.querySelector('.portal-header');
const signal = document.createElement('div');
signal.className = 'portal-signal';
signal.innerHTML = `
  <span class="signal-label">Игровая связь</span>
  <strong class="signal-state">Стабильно</strong>
  <span class="signal-meter" role="meter" aria-label="Уровень игрового сигнала"
    aria-valuemin="0" aria-valuemax="100" aria-valuenow="86"><span></span></span>
  <span class="signal-ping" aria-hidden="true">32 мс</span>`;
header.lastElementChild.before(signal);

const state = signal.querySelector('.signal-state');
const meter = signal.querySelector('.signal-meter');
const ping = signal.querySelector('.signal-ping');
let timer;

function update() {
  const level = Math.round(50 + Math.random() * 46);
  const unstable = level < 66;
  const latency = Math.round(unstable ? 140 + (66 - level) * 14 : 18 + (96 - level) * 1.7);
  signal.classList.toggle('signal-unstable', unstable);
  state.textContent = unstable ? 'Нестабильно' : 'Стабильно';
  meter.style.setProperty('--signal-level', `${level}%`);
  meter.setAttribute('aria-valuenow', String(level));
  ping.textContent = `${latency} мс`;
  timer = setTimeout(update, 2500 + Math.random() * 4500);
}

document.addEventListener('visibilitychange', () => {
  clearTimeout(timer);
  if (!document.hidden) update();
});
if (!document.hidden) update();
