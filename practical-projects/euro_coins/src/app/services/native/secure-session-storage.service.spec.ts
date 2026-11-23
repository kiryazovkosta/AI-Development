import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppLockService } from './app-lock.service';
import { FACE_ID_SETTINGS_KEY, INSTALLED_KEY, SESSION_KEY } from './first-run.service';
import { BiometricError } from './native-adapters';
import { SecureSessionStorage } from './secure-session-storage.service';
import { FakeDevice, settle } from './fake-device.spec';

describe('SecureSessionStorage', () => {
  let device: FakeDevice;
  let legacyBackup: string | null;

  function create(): SecureSessionStorage {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), ...device.providers()],
    });
    return TestBed.inject(SecureSessionStorage);
  }

  beforeEach(() => {
    device = new FakeDevice();
    legacyBackup = localStorage.getItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    spyOn(console, 'error');
  });

  afterEach(() => {
    if (legacyBackup === null) localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, legacyBackup);
  });

  it('moves a session from localStorage on the first run', async () => {
    localStorage.setItem(SESSION_KEY, 'legacy');
    expect(await create().getItem(SESSION_KEY)).toBe('legacy');
    expect(device.secure.get(SESSION_KEY)).toBe('legacy');
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(device.prefs.get(INSTALLED_KEY)).toBe('1');
  });

  it('keeps the localStorage session when it cannot be stored securely', async () => {
    localStorage.setItem(SESSION_KEY, 'legacy');
    device.secureSet.and.rejectWith(new Error('keychain'));
    await create().getItem(SESSION_KEY);
    expect(localStorage.getItem(SESSION_KEY)).toBe('legacy');
    expect(device.prefs.has(INSTALLED_KEY)).toBeFalse();
  });

  it('drops what a deleted installation left in the Keychain', async () => {
    device.secure.set(SESSION_KEY, 'old');
    device.secure.set(FACE_ID_SETTINGS_KEY, '{"enabled":true}');
    device.credentials = { email: 'a@b.c', password: 'old' };
    expect(await create().getItem(SESSION_KEY)).toBeNull();
    expect(device.credentials).toBeNull();
    expect(device.verify).not.toHaveBeenCalled();
  });

  it('reads the Keychain only once and keeps later writes', async () => {
    device.prefs.set(INSTALLED_KEY, '1');
    device.secure.set(SESSION_KEY, 'stored');
    const storage = create();
    await storage.getItem(SESSION_KEY);
    await storage.setItem(SESSION_KEY, 'new');
    expect(await storage.getItem(SESSION_KEY)).toBe('new');
    expect(device.secure.get(SESSION_KEY)).toBe('new');
    expect(device.secureGet.calls.allArgs().filter(([key]) => key === SESSION_KEY).length).toBe(1);
  });

  it('treats an unreadable session as signed out', async () => {
    device.prefs.set(INSTALLED_KEY, '1');
    device.secureGet.and.rejectWith(new Error('corrupt'));
    expect(await create().getItem(SESSION_KEY)).toBeNull();
  });

  describe('with the lock on', () => {
    beforeEach(() => {
      device.prefs.set(INSTALLED_KEY, '1');
      device.secure.set(SESSION_KEY, 'stored');
      device.secure.set(FACE_ID_SETTINGS_KEY, JSON.stringify({ enabled: true, email: 'a@b.c' }));
    });

    it('does not read the session before the app is unlocked', async () => {
      device.verifyAnswers = [new BiometricError('cancelled')];
      const storage = create();
      let session: string | null | undefined;
      void storage.getItem(SESSION_KEY).then((value) => (session = value));
      await settle();
      expect(session).toBeUndefined();
      expect(device.secureGet).not.toHaveBeenCalledWith(SESSION_KEY);

      await TestBed.inject(AppLockService).unlock();
      await settle();
      expect(session).toBe('stored');
    });

    it('can be discarded without unlocking', async () => {
      device.verifyAnswers = [new BiometricError('cancelled')];
      const storage = create();
      const read = storage.getItem(SESSION_KEY);
      await settle();
      await storage.discard();
      expect(await read).toBeNull();
      expect(device.secure.has(SESSION_KEY)).toBeFalse();
    });

    it('does not ask for Face ID once signed out', async () => {
      const storage = create();
      await storage.getItem(SESSION_KEY);
      await storage.removeItem(SESSION_KEY);
      device.verify.calls.reset();
      TestBed.resetTestingModule();
      expect(await create().getItem(SESSION_KEY)).toBeNull();
      expect(device.verify).not.toHaveBeenCalled();
    });
  });
});
