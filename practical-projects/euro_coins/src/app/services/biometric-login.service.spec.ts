import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthError, AuthService, AuthUser } from './auth.service';
import { BiometricLoginService } from './biometric-login.service';
import { FACE_ID_SETTINGS_KEY, INSTALLED_KEY } from './native/first-run.service';
import { BiometricError } from './native/native-adapters';
import { FakeDevice } from './native/fake-device.spec';

const EMAIL = 'collector@example.com';

describe('BiometricLoginService', () => {
  let device: FakeDevice;
  let login: jasmine.Spy<(email: string, password: string) => Promise<boolean>>;
  const authError = signal<AuthError | null>(null);

  function create(): BiometricLoginService {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ...device.providers(),
        {
          provide: AuthService,
          useValue: {
            login,
            authError,
            clearError: () => authError.set(null),
            currentUser: signal<AuthUser | null>({ uid: 'u', email: EMAIL }),
          },
        },
      ],
    });
    return TestBed.inject(BiometricLoginService);
  }

  const stored = () => JSON.parse(device.secure.get(FACE_ID_SETTINGS_KEY) ?? '{}');

  beforeEach(() => {
    device = new FakeDevice();
    device.prefs.set(INSTALLED_KEY, '1');
    login = jasmine.createSpy('login').and.resolveTo(true);
    authError.set(null);
    spyOn(console, 'error');
  });

  it('never offers or stores anything in a browser', async () => {
    device.isNative = false;
    const service = create();
    await service.refresh();
    expect(service.name()).toBeNull();
    expect(await service.onPasswordSignIn(EMAIL, 'pw')).toBeFalse();
    expect(device.credentials).toBeNull();
  });

  it('offers Face ID after a password sign-in and saves it when accepted', async () => {
    const service = create();
    expect(await service.onPasswordSignIn(' Collector@Example.com ', 'pw')).toBeTrue();
    expect(device.credentials).toBeNull();
    await service.accept(EMAIL, 'pw');
    expect(device.credentials).toEqual({ email: EMAIL, password: 'pw' });
    expect(service.enabled()).toBeTrue();
    expect(service.hasSaved()).toBeTrue();
  });

  it('remembers "Not now" for that account only', async () => {
    const service = create();
    await service.decline(EMAIL);
    expect(await service.onPasswordSignIn(EMAIL, 'pw')).toBeFalse();
    expect(await service.onPasswordSignIn('other@example.com', 'pw')).toBeTrue();
  });

  it('does not offer it when no Face ID is set up', async () => {
    device.biometryName = null;
    expect(await create().onPasswordSignIn(EMAIL, 'pw')).toBeFalse();
  });

  it('never puts the password in the settings', async () => {
    await create().accept(EMAIL, 'secret-password');
    expect([...device.secure.values()].join()).not.toContain('secret-password');
  });

  it('signs in with the saved password', async () => {
    const service = create();
    await service.accept(EMAIL, 'pw');
    expect(await service.signIn()).toBe('signed-in');
    expect(login).toHaveBeenCalledOnceWith(EMAIL, 'pw');
  });

  it('removes a password that Supabase rejects', async () => {
    const service = create();
    await service.accept(EMAIL, 'old');
    login.and.callFake(async () => {
      authError.set({ code: 'invalid_credentials', message: '' });
      return false;
    });
    expect(await service.signIn()).toBe('outdated');
    expect(device.credentials).toBeNull();
    expect(service.hasSaved()).toBeFalse();
    expect(authError()).toBeNull();
  });

  it('keeps the password when Supabase cannot be reached', async () => {
    const service = create();
    await service.accept(EMAIL, 'pw');
    login.and.callFake(async () => {
      authError.set({ code: 'unknown', message: 'offline' });
      return false;
    });
    expect(await service.signIn()).toBe('error');
    expect(device.credentials).not.toBeNull();
  });

  it('keeps the password after a cancelled or failed Face ID check', async () => {
    const service = create();
    await service.accept(EMAIL, 'pw');
    device.readAnswers = [new BiometricError('cancelled'), new BiometricError('failed')];
    expect(await service.signIn()).toBe('cancelled');
    expect(await service.signIn()).toBe('failed');
    expect(device.credentials).not.toBeNull();
    expect(login).not.toHaveBeenCalled();
  });

  it('notices that a Face ID change dropped the password, and saves it at the next sign-in', async () => {
    const service = create();
    await service.accept(EMAIL, 'pw');
    device.credentials = null;
    expect(await service.signIn()).toBe('outdated');
    expect(await service.onPasswordSignIn(EMAIL, 'new')).toBeFalse();
    expect(device.credentials as unknown).toEqual({ email: EMAIL, password: 'new' });
  });

  it('forgets the previous account when another one signs in', async () => {
    const service = create();
    await service.accept(EMAIL, 'pw');
    expect(await service.onPasswordSignIn('other@example.com', 'pw2')).toBeTrue();
    expect(device.credentials).toBeNull();
    expect(stored().enabled).toBeFalse();
  });

  it('asks for Face ID before turning it on or off', async () => {
    const service = create();
    await service.accept(EMAIL, 'pw');
    device.verifyAnswers = [new BiometricError('cancelled')];
    await service.disable();
    expect(service.enabled()).toBeTrue();
    await service.disable();
    expect(service.enabled()).toBeFalse();
    expect(device.credentials).toBeNull();

    await service.refresh();
    await service.enable();
    expect(service.enabled()).toBeTrue();
    expect(device.verify).toHaveBeenCalledTimes(3);
  });
});
