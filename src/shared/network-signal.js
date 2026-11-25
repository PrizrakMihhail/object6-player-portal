const header = document.querySelector('.portal-header');
const signal = document.createElement('div');
signal.className = 'portal-signal';
signal.innerHTML = `
  <span class="signal-label">Связь с Узлом</span>
  <strong class="signal-state">Стабильно</strong>
  <span class="signal-meter" role="meter" aria-label="Уровень сигнала связи с Узлом"
    aria-valuemin="0" aria-valuemax="100" aria-valuenow="86"><span></span></span>
  <span class="signal-ping" aria-hidden="true">32 мс</span>`;
header.lastElementChild.before(signal);

const state = signal.querySelector('.signal-state');
const meter = signal.querySelector('.signal-meter');
const ping = signal.querySelector('.signal-ping');
const ripple = document.createElement('div');
ripple.className = 'signal-ripple';
ripple.setAttribute('aria-hidden', 'true');
document.body.append(ripple);
let timer;
const olegus = document.body.dataset.signalProfile === 'olegus';

function update() {
  const level = olegus ? Math.round(20 + Math.random() * 45) : Math.round(50 + Math.random() * 46);
  const unstable = level < 66;
  const critical = olegus && level < 35;
  const latency = Math.round(unstable ? 140 + (66 - level) * 14 : 18 + (96 - level) * 1.7);
  ripple.classList.toggle('is-active', unstable);
  ripple.classList.toggle('signal-critical', critical);
  signal.classList.toggle('signal-unstable', unstable);
  signal.classList.toggle('signal-critical', critical);
  state.textContent = critical ? 'Критический' : unstable ? 'Нестабильно' : 'Стабильно';
  meter.style.setProperty('--signal-level', `${level}%`);
  meter.setAttribute('aria-valuenow', String(level));
  ping.textContent = `${latency} мс`;
  timer = setTimeout(update, 2500 + Math.random() * 4500);
}

document.addEventListener('visibilitychange', () => {
  clearTimeout(timer);
  ripple.classList.remove('is-active');
  if (!document.hidden) update();
});
if (!document.hidden) update();
