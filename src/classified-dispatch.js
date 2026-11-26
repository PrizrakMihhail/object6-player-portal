// The G4 word puzzle uses positional matches, false words, revealed letters and traps.
const words = [
  'ACCESS', 'ASSERT', 'ASSESS', 'ASSIST', 'ASSETS', 'ATTACK', 'BACKUP', 'BANNER',
  'BEACON', 'BEFORE', 'BORDER', 'BUNKER', 'CIPHER', 'CIRCLE', 'CLOSED', 'CLOSER',
  'CODECS', 'COHORT', 'COMMIT', 'DECODE', 'DEFEND', 'DEMAND', 'DETECT', 'DEVICE',
  'FILTER', 'FINDER', 'FINGER', 'FOLDER', 'FORGED', 'FORGER', 'FORGET', 'FORMAT',
  'READER', 'REASON', 'RECALL', 'RECORD', 'RELOAD', 'REMOTE', 'REPAIR', 'REPORT'
];
const hintTokens = { remove: '(^-)', reveal: '(.#)', trap: '(?;)' };
const symbols = '!@#$%^&*+=?;:,.//~';
const gate = document.getElementById('classified-dispatch');
const hack = document.getElementById('dispatch-hack');
const letter = document.getElementById('dispatch-letter');
const dump = document.getElementById('dispatch-dump');
const log = document.getElementById('dispatch-log');
const blocks = document.getElementById('dispatch-attempts');
let candidates = [];
let password;
let attempts;
let revealed;

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function junk(length) {
  return Array.from({ length }, () => symbols[Math.floor(Math.random() * symbols.length)]).join('');
}

function addLog(message, className = '') {
  const line = document.createElement('p');
  line.textContent = `> ${message}`;
  line.className = className;
  log.append(line);
  log.scrollTop = log.scrollHeight;
}

function showAttempts() {
  blocks.textContent = `Осталось попыток: ${attempts} из 5 ${'■'.repeat(attempts)}${'□'.repeat(5 - attempts)}`;
}

function startHack() {
  const freshWord = shuffle(words.filter(word => !candidates.includes(word)))[0];
  candidates = shuffle([freshWord, ...shuffle(words.filter(word => word !== freshWord)).slice(0, 11)]);
  password = shuffle(candidates.filter(word => word !== password))[0];
  attempts = 5;
  revealed = new Set();
  dump.replaceChildren();
  log.replaceChildren();
  addLog('Новый сеанс взлома');
  showAttempts();

  const tokens = shuffle([
    ...candidates.map(word => ({ word })),
    ...Object.keys(hintTokens).flatMap(hint => Array.from({ length: 3 }, () => ({ hint }))),
    {}, {}, {}
  ]);
  for (const [index, { word, hint }] of tokens.entries()) {
    const row = document.createElement('div');
    const address = document.createElement('span');
    address.className = 'g4-address';
    address.textContent = `0x${(0xF400 + index * 18).toString(16).toUpperCase()}`;
    row.append(address);
    if (word || hint) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = word ?? hintTokens[hint];
      if (word) button.dataset.word = word;
      else {
        button.dataset.hint = hint;
        button.setAttribute('aria-label', `Подсказка ${hintTokens[hint]}`);
      }
      const room = 18 - button.textContent.length;
      const offset = Math.floor(Math.random() * (room + 1));
      row.append(junk(offset), button, junk(room - offset));
    } else row.append(junk(18));
    dump.append(row);
  }
  hack.showModal();
}

function loseAttempt(message) {
  attempts--;
  showAttempts();
  addLog(message, 'g4-fail');
  if (attempts > 0) return;
  for (const button of dump.querySelectorAll('button')) button.disabled = true;
  addLog('Терминал заблокирован. Закройте сеанс и начните заново.', 'g4-fail');
}

dump.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled || attempts <= 0) return;
  button.disabled = true;
  const { word, hint } = button.dataset;
  if (word) {
    if (word === password) {
      hack.close();
      gate.close();
      letter.showModal();
      return;
    }
    const likeness = [...word].filter((character, index) => character === password[index]).length;
    loseAttempt(`${word} · Совпадение: ${likeness}/6`);
  } else if (hint === 'trap') {
    loseAttempt('Ложная подсказка: попытка потеряна');
  } else if (hint === 'remove') {
    const decoy = shuffle([...dump.querySelectorAll('[data-word]:enabled')]
      .filter(option => option.dataset.word !== password))[0];
    if (decoy) decoy.disabled = true;
    addLog(decoy ? `Ложное слово удалено: ${decoy.dataset.word}` : 'Нет доступных ложных слов');
  } else {
    const position = shuffle([0, 1, 2, 3, 4, 5].filter(index => !revealed.has(index)))[0];
    revealed.add(position);
    const mask = [...password].map((character, index) => revealed.has(index) ? character : '·').join('');
    addLog(`Фрагмент кодового слова: ${mask}`);
  }
});

document.getElementById('start-dispatch-hack').addEventListener('click', startHack);

export function createClassifiedCard() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'timeline-event classified-card';
  button.setAttribute('aria-label', 'Открыть закрытую запись');
  button.setAttribute('aria-haspopup', 'dialog');
  const title = document.createElement('span');
  title.className = 'classified-card-title';
  title.setAttribute('aria-hidden', 'true');
  for (const text of ['▓▒░ ███▒ ░▓█▒▓ ▒█', '░▓░ ▓▒██ ▒░█▓▒ █░', '█░▒ ▒▓▓░ █▒░█▓ ░▒']) {
    const frame = document.createElement('span');
    frame.textContent = text;
    title.append(frame);
  }
  button.append(title);
  button.addEventListener('click', () => gate.showModal());
  return button;
}
