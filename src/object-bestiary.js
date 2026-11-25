document.querySelector('.bestiary').addEventListener('click', event => {
  const button = event.target.closest('button[data-dossier]');
  if (button) document.getElementById(button.dataset.dossier).showModal();
});

const terminal = document.querySelector('.olegus-terminal');
const log = terminal.querySelector('.olegus-log');
const handshake = [
  ['> LINK INIT / FROM=FREECITY', 'command'],
  ['[СВЯЗЬ] Поиск шлюза Зелёной Зоны Олегус'],
  ['> HANDSHAKE SEND / TO=OLEGUS', 'command'],
  ['[ACK] Шлюз Олегуса подтвердил соединение'],
  ['> ROUTE REQUEST / DEST=OLEGUS.LIBRARY', 'command'],
  ['[МАРШРУТ] Фрисити → шлюз Олегуса → Библиотека'],
  ['[КАНАЛ] Сигнал нестабилен. Архив доступен'],
  ['> OPEN ARCHIVE / BESTIARY', 'command']
];
let nextLine = 0;

function writeLine() {
  if (nextLine === handshake.length) {
    terminal.close();
    return;
  }
  const [message, kind] = handshake[nextLine++];
  const line = document.createElement('li');
  line.textContent = message;
  if (kind) line.className = kind;
  log.append(line);
  log.scrollTop = log.scrollHeight;
}

terminal.showModal();
writeLine();
const handshakeTimer = setInterval(writeLine, 800);
terminal.addEventListener('close', () => {
  clearInterval(handshakeTimer);
  document.getElementById('bestiary-page-title').focus({ preventScroll: true });
}, { once: true });
