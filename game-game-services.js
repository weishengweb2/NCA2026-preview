// Public client configuration only. Never put a CreateSend API key in this file.
export const services = Object.freeze({
  release: 'action-06',
  measurementId: 'G-EL97J47SBN',
  // Set only after a real subscription endpoint and its consent/suppression handling are verified.
  subscriptionEndpoint: '',
  reviewBypass: true,
  consentVersion: 'newsletter-game-2026-09-13',
});

export function sourceVariant(search = '') {
  const value = new URLSearchParams(search).get('from');
  return ['scrolling', 'identity'].includes(value) ? value : 'standalone';
}
export function returnDestination(source) {
  return source === 'identity' ? './identity-05.html' : './index.html';
}
export function needsNewsletter(level, access) {
  return level >= 1 && level < 5 && !['subscribed', 'review'].includes(access);
}

export function subscriptionReady(endpoint) {
  try { const u = new URL(endpoint); return u.protocol === 'https:' && !u.username && !u.password && !u.search && !u.hash; }
  catch { return false; }
}

// Fail closed: only a recognised, successful server response unlocks the subscriber route.
// Confirmation-pending is not the same as an active subscription.
export function subscriptionOutcome(httpOK, body) {
  if (!httpOK || !body || typeof body !== 'object') return 'error';
  if (body.status === 'subscribed') return 'subscribed';
  if (body.status === 'pending_confirmation') return 'pending';
  return 'error';
}

export async function subscribe(email, consent, { endpoint = services.subscriptionEndpoint, fetcher = fetch } = {}) {
  if (!subscriptionReady(endpoint)) return 'unavailable';
  if (consent !== true || typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'invalid';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetcher(endpoint, {
      method: 'POST', credentials: 'omit', redirect: 'error', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
      body: JSON.stringify({ email: email.trim(), newsletterConsent: true, consentVersion: services.consentVersion, source: 'make-it-land' }),
    });
    return subscriptionOutcome(response.ok, await response.json());
  } catch { return 'error'; }
  finally { clearTimeout(timer); }
}
