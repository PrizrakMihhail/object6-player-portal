import { requestData } from './shared/supabase-api.js';

const dialog = document.getElementById('bestiary-report');
const form = document.getElementById('bestiary-report-form');
const fields = form.querySelector('fieldset');
const status = document.getElementById('bestiary-report-status');
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

document.getElementById('open-bestiary-report').addEventListener('click', () => dialog.showModal());

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
  setStatus('Отправка…');
  try {
    const response = await requestData('rpc/object6_send_bestiary_report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_uuid: pending.uuid, p_title: title, p_message: message }),
      timeout: 10000
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.code === 'PGRST202' ? 'service_unavailable' : result?.message);
    }
    pending = undefined;
    form.reset();
    setStatus('Сообщение отправлено.');
  } catch (error) {
    if (error.message === 'message_conflict') pending = undefined;
    setStatus(Object.hasOwn(errors, error.message) ? errors[error.message] : 'Не удалось отправить сообщение. Попробуйте ещё раз.', true);
  } finally {
    fields.disabled = false;
  }
});
