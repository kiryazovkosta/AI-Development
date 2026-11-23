import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

/** Uses the real supabase-js client, so the test covers what is sent to the server */
describe('AuthService.logout', () => {
  let stored: Map<string, string>;
  let logoutRequests: string[];
  let online: boolean;
  let navigate: jasmine.Spy;
  let service: AuthService;

  beforeEach(async () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, '');
    const session = {
      access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: 'u', exp: expiresAt })}.x`,
      refresh_token: 'r',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: expiresAt,
      user: { id: 'u', email: 'collector@example.com' },
    };
    stored = new Map([['session', JSON.stringify(session)]]);
    logoutRequests = [];
    online = true;
    navigate = jasmine.createSpy('navigate');

    const client = createClient('https://example.supabase.co', 'anon', {
      auth: {
        storageKey: 'session',
        autoRefreshToken: false,
        storage: {
          getItem: (key) => stored.get(key) ?? null,
          setItem: (key, value) => void stored.set(key, value),
          removeItem: (key) => void stored.delete(key),
        },
      },
      global: {
        fetch: async (input) => {
          const url = String(input);
          if (url.includes('/logout')) logoutRequests.push(url);
          if (!online) throw new TypeError('Failed to fetch');
          return url.includes('/logout')
            ? new Response(null, { status: 204 })
            : new Response('[]', { headers: { 'content-type': 'application/json' } });
        },
      },
    });

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: SupabaseService, useValue: { client } },
        { provide: Router, useValue: { navigate } },
      ],
    });
    service = TestBed.inject(AuthService);
    await client.auth.getSession();
    while (service.isLoading()) await new Promise((resolve) => setTimeout(resolve));
  });

  it('ends only the session of this device', async () => {
    expect(service.isAuthenticated()).toBeTrue();
    await service.logout();
    expect(logoutRequests.length).toBe(1);
    expect(new URL(logoutRequests[0]).searchParams.get('scope')).toBe('local');
    expect(service.isAuthenticated()).toBeFalse();
    expect(stored.has('session')).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('signs out on this device without a network', async () => {
    online = false;
    await service.logout();
    expect(service.isAuthenticated()).toBeFalse();
    expect(stored.has('session')).toBeFalse();
  });
});
