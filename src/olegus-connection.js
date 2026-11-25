const link = document.getElementById('open-bestiary');
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
let timer;

link.addEventListener('click', event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  clearInterval(timer);
  log.replaceChildren();
  terminal.showModal();
  let nextLine = 0;

  function writeLine() {
    if (!terminal.open) return;
    if (nextLine === handshake.length) {
      clearInterval(timer);
      terminal.close();
      location.assign(link.href);
      return;
    }
    const [message, kind] = handshake[nextLine++];
    const line = document.createElement('li');
    line.textContent = message;
    if (kind) line.className = kind;
    log.append(line);
    log.scrollTop = log.scrollHeight;
  }

  writeLine();
  timer = setInterval(writeLine, 800);
});

terminal.addEventListener('close', () => {
  if (!terminal.open) clearInterval(timer);
});
