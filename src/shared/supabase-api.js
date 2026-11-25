// A missing deployment configuration must not prevent local UI from starting.
const configuration = import('./supabase-config.js').then(module => module.default, () => null);

export async function requestData(path, { query, timeout, ...options }) {
  const config = await configuration;
  if (!config) throw new Error('service_unavailable');

  const url = new URL(`/rest/v1/${path}`, config.url);
  if (query) url.search = new URLSearchParams(query);
  return fetch(url, {
    ...options,
    headers: { apikey: config.publishableKey, ...options.headers },
    signal: AbortSignal.timeout(timeout)
  });
}
