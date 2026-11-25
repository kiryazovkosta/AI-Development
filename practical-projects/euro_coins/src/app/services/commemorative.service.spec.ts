import { WritableSignal, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService, AuthUser } from './auth.service';
import { LOAD_RETRY_DELAYS_MS, SAVE_DEBOUNCE_MS } from './collection.service';
import { CommemorativeService } from './commemorative.service';
import { SupabaseService } from './supabase.service';

async function settle(): Promise<void> {
  for (let i = 0; i < 20; i++) await Promise.resolve();
}

describe('CommemorativeService', () => {
  let service: CommemorativeService;
  let currentUser: WritableSignal<AuthUser | null>;
  let load: jasmine.Spy;
  let upsert: jasmine.Spy;
  let beforeSignOut: () => Promise<void>;
  const DOWN = { data: null, error: new Error('offline') };

  beforeEach(() => {
    jasmine.clock().install();
    spyOn(console, 'error');
    spyOn(window, 'fetch').and.callFake(async () => new Response('{"coins":[]}'));
    currentUser = signal<AuthUser | null>(null);
    load = jasmine.createSpy('load').and.resolveTo({ data: null, error: null });
    upsert = jasmine.createSpy('upsert').and.resolveTo({ error: null });
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: SupabaseService,
          useValue: {
            client: {
              from: () => ({
                select: () => ({ eq: () => ({ maybeSingle: load }) }),
                upsert,
              }),
            },
          },
        },
        {
          provide: AuthService,
          useValue: {
            currentUser,
            isLoading: signal(false),
            onBeforeSignOut: (task: () => Promise<void>) => (beforeSignOut = task),
          },
        },
      ],
    });
    service = TestBed.inject(CommemorativeService);
  });

  afterEach(() => jasmine.clock().uninstall());

  async function signIn(uid = 'u'): Promise<void> {
    currentUser.set({ uid, email: null });
    TestBed.tick();
    await settle();
  }

  async function failLoading(): Promise<void> {
    load.and.resolveTo(DOWN);
    await signIn();
    for (const ms of LOAD_RETRY_DELAYS_MS) {
      jasmine.clock().tick(ms);
      await settle();
    }
  }

  function setVisibility(state: DocumentVisibilityState): void {
    spyOnProperty(document, 'visibilityState').and.returnValue(state);
    document.dispatchEvent(new Event('visibilitychange'));
  }

  it('saves at once when the app goes to the background', async () => {
    await signIn();
    service.toggle('a');
    setVisibility('hidden');
    await settle();
    expect(upsert.calls.mostRecent().args[0].coin_ids).toEqual(['a']);
    jasmine.clock().tick(SAVE_DEBOUNCE_MS);
    await settle();
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it('saves before signing out', async () => {
    await signIn();
    service.toggle('a');
    await beforeSignOut();
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it('recovers from a brief failure while loading', async () => {
    load.and.returnValues(Promise.resolve(DOWN), Promise.resolve({ data: { coin_ids: ['a'] } }));
    await signIn();
    expect(service.isLoaded()).toBeFalse();
    jasmine.clock().tick(LOAD_RETRY_DELAYS_MS[0]);
    await settle();
    expect(service.isOwned('a')).toBeTrue();
  });

  it('never saves a collection that could not be loaded', async () => {
    await failLoading();
    expect(service.error()).toBe('load');
    service.toggle('a');
    await service.flush();
    expect(upsert).not.toHaveBeenCalled();
  });

  for (const [name, trigger] of [
    ['back online', () => window.dispatchEvent(new Event('online'))],
    ['back in the foreground', () => setVisibility('visible')],
    ['asked to retry', () => service.retry()],
  ] as const) {
    it(`loads again when ${name}`, async () => {
      await failLoading();
      load.and.resolveTo({ data: { coin_ids: ['a'] }, error: null });
      trigger();
      await settle();
      expect(service.isOwned('a')).toBeTrue();
      expect(service.error()).toBeNull();
    });
  }

  it('keeps a change that could not be saved, and saves it later', async () => {
    await signIn();
    upsert.and.rejectWith(new Error('offline'));
    service.toggle('a');
    await service.flush();
    expect(service.error()).toBe('save');
    upsert.and.resolveTo({ error: null });
    window.dispatchEvent(new Event('online'));
    await settle();
    expect(upsert.calls.mostRecent().args[0].coin_ids).toEqual(['a']);
    expect(service.error()).toBeNull();
  });

  it('never lets one account see or save the coins of another', async () => {
    load.and.resolveTo({ data: { coin_ids: ['a'] }, error: null });
    await signIn('first');
    load.and.returnValue(new Promise(() => {}));
    await signIn('second');
    expect(service.isOwned('a')).toBeFalse();
    service.toggle('b');
    await service.flush();
    expect(upsert).not.toHaveBeenCalled();
  });
});
