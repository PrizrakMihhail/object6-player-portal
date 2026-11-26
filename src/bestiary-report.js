import { requestData } from './shared/supabase-api.js';

const dialog = document.getElementById('bestiary-report');
const form = document.getElementById('bestiary-report-form');
const fields = form.querySelector('fieldset');
const status = document.getElementById('bestiary-report-status');
const opener = document.getElementById('open-bestiary-report');
const terminal = document.getElementById('bestiary-report-terminal');
const log = terminal.querySelector('.olegus-log');
const confirmation = document.getElementById('bestiary-report-result');
const terminalControls = terminal.querySelector('form');
const transmission = [
  ['> MAIL TX INIT / DEST=OLEGUS.LIBRARY', 'command'],
  ['> ROUTE SELECT / CHANNEL=UNSECURED', 'command'],
  ['[КАНАЛ] Незащищённое соединение. Шифрование отключено.'],
  ['> SEND MESSAGE / MODE=UNPROTECTED', 'command'],
  ['[ПЕРЕДАЧА] Ожидание подтверждения доставки']
];
const errors = {
  invalid_message: 'Заполните тему и сообщение.',
  recipient_not_found: 'Адресат пока недоступен.',
  recipient_ambiguous: 'Адресат пока недоступен.',
  service_unavailable: 'Канал отправки пока недоступен.'
};

let pending;

function setStatus(text, error = false) {
  status.textContent = text;
  status.toggleAttribute('data-error', error);
}

async function playTransmission() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (const [message, kind] of transmission) {
    if (!reducedMotion && log.children.length) await new Promise(resolve => setTimeout(resolve, 700));
    const line = document.createElement('li');
    line.textContent = message;
    if (kind) line.className = kind;
    log.append(line);
    log.scrollTop = log.scrollHeight;
  }
}

async function sendReport({ uuid, title, message }) {
  const response = await requestData('rpc/object6_send_bestiary_report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_uuid: uuid, p_title: title, p_message: message }),
    timeout: 10000
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.code === 'PGRST202' ? 'service_unavailable' : result?.message);
  }
}

opener.addEventListener('click', () => dialog.showModal());

terminal.addEventListener('cancel', event => {
  if (terminalControls.hidden) event.preventDefault();
});

terminal.addEventListener('close', () => {
  if (terminalControls.hidden) {
    form.querySelector('[type="submit"]').focus();
    return;
  }
  dialog.close();
  opener.focus();
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (fields.disabled) return;
  const data = new FormData(form);
  const title = data.get('title').trim();
  const message = data.get('message');
  if (!title || !message.trim()) {
    setStatus(errors.invalid_message, true);
    return;
  }

  if (!pending || pending.title !== title || pending.message !== message) {
    pending = { uuid: crypto.randomUUID(), title, message };
  }

  fields.disabled = true;
  setStatus('');
  log.replaceChildren();
  confirmation.textContent = '';
  terminalControls.hidden = true;
  terminal.showModal();

  try {
    const [delivery] = await Promise.allSettled([sendReport(pending), playTransmission()]);
    if (delivery.status === 'rejected') throw delivery.reason;
    pending = undefined;
    form.reset();
    confirmation.textContent = 'Сообщение успешно отправлено.';
    terminalControls.hidden = false;
    terminalControls.querySelector('button').focus();
  } catch (error) {
    if (error.message === 'message_conflict') pending = undefined;
    setStatus(Object.hasOwn(errors, error.message) ? errors[error.message] : 'Не удалось отправить сообщение. Попробуйте ещё раз.', true);
    terminal.close();
  } finally {
    fields.disabled = false;
  }
});
