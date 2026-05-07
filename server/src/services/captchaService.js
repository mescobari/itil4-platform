'use strict';
// Cloudflare Turnstile validation.
// En desarrollo (TURNSTILE_SECRET vacío), todo pasa: { ok: true, devMode: true }.

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET || '';
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

async function verify(token, ip) {
  if (!TURNSTILE_SECRET) return { ok: true, devMode: true };
  if (!token) return { ok: false, reason: 'missing_token' };

  try {
    const params = new URLSearchParams();
    params.append('secret',   TURNSTILE_SECRET);
    params.append('response', token);
    if (ip) params.append('remoteip', ip);

    const res = await fetch(VERIFY_URL, { method: 'POST', body: params });
    const data = await res.json();
    if (!data.success) {
      return { ok: false, reason: 'turnstile_failed', errors: data['error-codes'] || [] };
    }
    return { ok: true };
  } catch (err) {
    console.error('[CAPTCHA] verify error:', err.message);
    return { ok: false, reason: 'verify_error' };
  }
}

module.exports = { verify };
