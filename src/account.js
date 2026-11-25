import { requestData } from './shared/supabase-api.js';

const title = document.getElementById('account-title');
const status = document.getElementById('account-status');
const login = document.getElementById('login-form');
const registration = document.getElementById('registration-form');
const profile = document.getElementById('player-profile');
const logout = document.getElementById('logout');
const retry = document.getElementById('retry');
const fields = profile.querySelectorAll('[data-profile]');
const submitButtons = [login, registration].map(form => form.querySelector('[type="submit"]'));
const sessionKey = 'object6-player-session';
const encoder = new TextEncoder();

const errors = {
  email_taken: 'На этот email уже зарегистрирован аккаунт. Войдите в личный кабинет.',
  invalid_registration: 'Проверьте email, имя персонажа и данные заявки.',
  invalid_credentials: 'Неверный email или пароль.',
  invalid_secret_length: 'Пароль может занимать до 72 байт.',
  login_throttled: 'Слишком много попыток входа. Попробуйте через минуту.',
  session_expired: 'Сессия истекла. Войдите снова.',
  service_unavailable: 'Регистрация и личный кабинет пока недоступны.'
};

const registrationStatuses = {
  pending: 'На рассмотрении',
  approved: 'Одобрена',
  rejected: 'Отклонена'
};

let token = null;
let currentPlayer = null;
let submitting = false;
try { token = sessionStorage.getItem(sessionKey); } catch { /* Storage can be disabled. */ }

async function rpc(name, params) {
  const response = await requestData(`rpc/object6_${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    timeout: 10000
  });
  if (response.status === 204) return;
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result?.code === 'PGRST202' ? 'service_unavailable' : result?.message);
  }
  if (result?.error) throw new Error(result.error);
  return result;
}

function showStatus(message = '', isError = false) {
  status.textContent = message;
  status.toggleAttribute('data-error', isError);
}

function showError(error) {
  const message = Object.hasOwn(errors, error.message) ? errors[error.message] : 'Ошибка связи с сервером. Попробуйте ещё раз.';
  showStatus(message, true);
}

function setSession(nextToken, player = null) {
  token = nextToken;
  currentPlayer = player;
  try {
    if (token) sessionStorage.setItem(sessionKey, token);
    else sessionStorage.removeItem(sessionKey);
  } catch { /* The session can still be used on this page. */ }
  for (const field of fields) {
    const key = field.dataset.profile;
    const value = player?.[key];
    field.textContent = key === 'reg_status' && Object.hasOwn(registrationStatuses, value)
      ? registrationStatuses[value] : value || '—';
  }
}

function showView({ focus = false } = {}) {
  const registering = !token && location.hash === '#register';
  login.hidden = Boolean(token) || registering;
  registration.hidden = !registering;
  profile.hidden = !currentPlayer;
  retry.hidden = true;
  title.textContent = token ? 'Личный кабинет' : registering ? 'Регистрация на игру' : 'Вход в личный кабинет';
  if (focus) title.focus();
}

async function restoreSession() {
  showView();
  if (!token) return;
  showStatus('Загружаем личный кабинет…');
  try {
    setSession(token, await rpc('player_profile', { p_token: token }));
    showView();
    showStatus();
  } catch (error) {
    if (error.message === 'session_expired') {
      setSession(null);
      history.replaceState(null, '', '#login');
      showView();
    } else {
      retry.hidden = false;
    }
    showError(error);
  }
}

async function signIn(email, password) {
  if (encoder.encode(password).length > 72) throw new Error('invalid_secret_length');
  const result = await rpc('player_login', { p_email: email, p_password: password });
  setSession(result.token, result.profile);
  login.reset();
  history.replaceState(null, '', '#profile');
  showView({ focus: true });
}

function onSubmit(form, submit) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (token || submitting) return;
    submitting = true;
    for (const button of submitButtons) button.disabled = true;
    showStatus('Отправляем…');
    try {
      await submit(new FormData(form));
    } catch (error) {
      showError(error);
    } finally {
      submitting = false;
      for (const button of submitButtons) button.disabled = false;
    }
  });
}

onSubmit(login, async data => {
  await signIn(data.get('email').trim(), data.get('password'));
  showStatus();
});

onSubmit(registration, async data => {
  const email = data.get('email').trim();
  const password = data.get('password');
  if (encoder.encode(password).length > 72) throw new Error('invalid_secret_length');
  await rpc('player_register', {
    p_email: email,
    p_password: password,
    p_telegram: data.get('telegram').trim(),
    p_char_name: data.get('char_name').trim(),
    p_faction: data.get('faction').trim()
  });
  registration.reset();
  try {
    await signIn(email, password);
    showStatus('Заявка отправлена. Здесь можно проверить её статус.');
  } catch {
    history.replaceState(null, '', '#login');
    showView({ focus: true });
    login.elements.email.value = email;
    showStatus('Заявка отправлена. Войдите с указанным email и паролем.');
  }
});

logout.addEventListener('click', async () => {
  logout.disabled = true;
  try {
    await rpc('logout', { p_token: token });
  } catch (error) {
    if (error.message !== 'session_expired') {
      showError(error);
      return;
    }
  } finally {
    logout.disabled = false;
  }
  setSession(null);
  history.replaceState(null, '', '#login');
  showView({ focus: true });
  showStatus('Вы вышли из личного кабинета.');
});

retry.addEventListener('click', restoreSession);
window.addEventListener('hashchange', () => {
  if (token) return;
  if (!submitting) showStatus();
  showView({ focus: true });
});
restoreSession();
