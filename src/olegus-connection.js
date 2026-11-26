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
let preloadController;

async function preloadBestiary(url, signal) {
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) return;

    const page = document.createElement('template');
    page.innerHTML = await response.text();
    if (signal.aborted) return;

    const images = [];
    signal.addEventListener('abort', () => {
      for (const image of images) image.removeAttribute('src');
    }, { once: true });

    for (const source of page.content.querySelectorAll('.beast-thumbnail img[src], .beast-gallery img[src]')) {
      const image = new Image();
      if (source.closest('.beast-gallery')) image.fetchPriority = 'low';
      images.push(image);
      image.src = new URL(source.getAttribute('src'), response.url).href;
    }
  } catch {
    // Preloading is optional, so a failed request never interrupts the transition.
  }
}

link.addEventListener('click', event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  clearInterval(timer);
  preloadController?.abort();
  preloadController = new AbortController();
  log.replaceChildren();
  terminal.showModal();
  let nextLine = 0;

  function writeLine() {
    if (!terminal.open) return;
    if (nextLine === handshake.length) {
      clearInterval(timer);
      preloadController = undefined;
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
  timer = setInterval(writeLine, 1100);
  void preloadBestiary(link.href, preloadController.signal);
});

terminal.addEventListener('close', () => {
  if (terminal.open) return;
  clearInterval(timer);
  preloadController?.abort();
  preloadController = undefined;
});
