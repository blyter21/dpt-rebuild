import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as login } from '../app/api/admin/auth/login/route';
import { middleware } from '../middleware';

const originalEnv = { ...process.env };

function configureAuth() {
  process.env.SUPABASE_URL = 'https://staging.example.test';
  process.env.SUPABASE_ANON_KEY = 'public-anon-test-key';
  process.env.DPT_ADMIN_REVIEW_MODE = 'disabled';
}

function loginRequest(fields: Record<string, string>) {
  return new NextRequest('https://dpt.example.test/api/admin/auth/login', {
    method: 'POST',
    body: new URLSearchParams(fields),
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  });
}

function adminRequest(path = '/admin') {
  return new NextRequest(`https://dpt.example.test${path}`);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  process.env = { ...originalEnv };
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.DPT_ADMIN_REVIEW_MODE;
  vi.restoreAllMocks();
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
});

describe('DPT admin login route', () => {
  it('fails closed when Supabase auth is not configured', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await login(loginRequest({ email: 'admin@example.test', password: 'secret' }));

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://dpt.example.test/admin/login?error=configuration');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('does not issue cookies when Supabase rejects the credentials', async () => {
    configureAuth();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message: 'invalid credentials' }, 400));
    vi.stubGlobal('fetch', fetchMock);

    const response = await login(loginRequest({ email: 'admin@example.test', password: 'wrong' }));

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toContain('/admin/login?error=invalid');
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not issue cookies to an authenticated account without DPT admin authorization', async () => {
    configureAuth();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        access_token: 'access-secret',
        refresh_token: 'refresh-secret',
        expires_in: 3600,
        user: { id: 'auth-user-1' },
      }))
      .mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    const response = await login(loginRequest({ email: 'user@example.test', password: 'valid' }));

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toContain('/admin/login?error=unauthorized');
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('sets HTTP-only cookies only after both authentication and authorization succeed', async () => {
    configureAuth();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        access_token: 'access-secret',
        refresh_token: 'refresh-secret',
        expires_in: 1800,
        user: { id: 'auth-user-1' },
      }))
      .mockResolvedValueOnce(jsonResponse([{
        legacy_user_id: null,
        role_name: 'administrator',
        can_view_admin: true,
        is_active: true,
      }]));
    vi.stubGlobal('fetch', fetchMock);

    const response = await login(loginRequest({
      email: 'ADMIN@EXAMPLE.TEST ',
      password: 'valid',
      remember: '1',
      next: '/admin/tournaments',
    }));

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://dpt.example.test/admin/tournaments');
    const cookies = response.headers.get('set-cookie') || '';
    expect(cookies).toContain('dpt_admin_access_token=access-secret');
    expect(cookies).toContain('dpt_admin_refresh_token=refresh-secret');
    expect(cookies).toContain('HttpOnly');
    expect(cookies).toContain('SameSite=lax');
    expect(cookies).not.toContain('Domain=');

    const tokenCall = fetchMock.mock.calls[0];
    expect(tokenCall[0]).toBe('https://staging.example.test/auth/v1/token?grant_type=password');
    expect(JSON.parse(String(tokenCall[1]?.body))).toEqual({ email: 'admin@example.test', password: 'valid' });
  });

  it('rejects an external post-login redirect target', async () => {
    configureAuth();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        access_token: 'access-secret',
        refresh_token: 'refresh-secret',
        user: { id: 'auth-user-1' },
      }))
      .mockResolvedValueOnce(jsonResponse([{
        legacy_user_id: null,
        role_name: 'administrator',
        can_view_admin: true,
        is_active: true,
      }]));
    vi.stubGlobal('fetch', fetchMock);

    const response = await login(loginRequest({
      email: 'admin@example.test',
      password: 'valid',
      next: 'https://attacker.example/admin',
    }));

    expect(response.headers.get('location')).toBe('https://dpt.example.test/admin');
  });
});

describe('DPT admin middleware', () => {
  it('rejects the retired read-only review environment flag', async () => {
    configureAuth();
    process.env.DPT_ADMIN_REVIEW_MODE = 'enabled';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await middleware(adminRequest('/admin/events'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://dpt.example.test/admin/login?next=%2Fadmin%2Fevents');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('redirects to login when real auth is enabled but no access cookie exists', async () => {
    configureAuth();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await middleware(adminRequest('/admin/events'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://dpt.example.test/admin/login?next=%2Fadmin%2Fevents');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('allows an authenticated user only when the DPT admin authorization row is active', async () => {
    configureAuth();
    const request = adminRequest('/admin/events');
    request.cookies.set('dpt_admin_access_token', 'access-secret');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ id: 'auth-user-1', email: 'admin@example.test' }))
      .mockResolvedValueOnce(jsonResponse([{ auth_user_id: 'auth-user-1' }]));
    vi.stubGlobal('fetch', fetchMock);

    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain('can_view_admin=eq.true');
    expect(String(fetchMock.mock.calls[1][0])).toContain('is_active=eq.true');
  });

  it('redirects when the access token is valid but no active DPT admin row is visible', async () => {
    configureAuth();
    const request = adminRequest('/admin');
    request.cookies.set('dpt_admin_access_token', 'access-secret');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ id: 'auth-user-1' }))
      .mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://dpt.example.test/admin/login?next=%2Fadmin');
  });
});
