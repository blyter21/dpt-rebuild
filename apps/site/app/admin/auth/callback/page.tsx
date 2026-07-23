'use client';

import { useEffect, useState } from 'react';

function safeCallbackNext(value: string | null) {
  return value && /^\/admin(?:\/|$|\?|#)/.test(value) && !value.startsWith('//') && !value.includes('\\') ? value : '/admin';
}

export default function AdminAuthCallbackPage() {
  const [message, setMessage] = useState('Completing secure sign-in…');

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const next = safeCallbackNext(new URLSearchParams(window.location.search).get('next'));
    const payload = {
      access_token: hash.get('access_token'),
      refresh_token: hash.get('refresh_token'),
      expires_in: Number(hash.get('expires_in')),
      type: hash.get('type'),
      next,
    };
    // Remove credentials from the address bar before making any request.
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);

    void fetch('/api/admin/auth/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'same-origin',
    }).then(async (response) => {
      if (!response.ok) throw new Error('sign-in failed');
      const result = await response.json() as { next?: string };
      window.location.replace(safeCallbackNext(result.next || null));
    }).catch(() => {
      setMessage('This sign-in link could not be completed. Please request a new link.');
    });
  }, []);

  return <main className="dpt-admin-login-page"><section className="dpt-admin-login-card"><h1>Admin sign-in</h1><p role="status">{message}</p></section></main>;
}
