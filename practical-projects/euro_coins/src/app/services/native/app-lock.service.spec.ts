import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NativeBackButtonService } from '../native-back-button.service';
import { AppLockService, LOCK_AFTER_MS } from './app-lock.service';
import { FACE_ID_SETTINGS_KEY, INSTALLED_KEY } from './first-run.service';
import { BiometricError } from './native-adapters';
import { FakeDevice, settle } from './fake-device.spec';

describe('AppLockService', () => {
  let device: FakeDevice;
  let now: number;

  function create(): AppLockService {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([]), ...device.providers()],
    });
    return TestBed.inject(AppLockService);
  }

  async function startUnlocked(): Promise<AppLockService> {
    const lock = create();
    await lock.waitAtStart();
    device.verify.calls.reset();
    return lock;
  }

  async function awayFor(ms: number): Promise<void> {
    device.setActive(false);
    device.pause();
    now += ms;
    device.resume();
    device.setActive(true);
    await settle();
  }

  beforeEach(() => {
    device = new FakeDevice();
    device.prefs.set(INSTALLED_KEY, '1');
    device.secure.set(FACE_ID_SETTINGS_KEY, JSON.stringify({ enabled: true, email: 'a@b.c' }));
    now = 1_000_000;
    spyOn(Date, 'now').and.callFake(() => now);
  });

  it('does nothing in a browser', async () => {
    device.isNative = false;
    expect(await create().waitAtStart()).toBeTrue();
    expect(device.verify).not.toHaveBeenCalled();
  });

  it('does nothing while turned off', async () => {
    device.secure.delete(FACE_ID_SETTINGS_KEY);
    const lock = create();
    expect(await lock.waitAtStart()).toBeTrue();
    await awayFor(LOCK_AFTER_MS * 10);
    expect(lock.locked()).toBeFalse();
    expect(device.verify).not.toHaveBeenCalled();
  });

  it('asks once at the start', async () => {
    const lock = create();
    expect(await lock.waitAtStart()).toBeTrue();
    expect(lock.locked()).toBeFalse();
    expect(device.verify).toHaveBeenCalledTimes(1);
  });

  it('waits until the app is active', async () => {
    device.active = false;
    const lock = create();
    void lock.waitAtStart();
    await settle();
    expect(lock.locked()).toBeTrue();
    expect(device.verify).not.toHaveBeenCalled();
    device.setActive(true);
    await settle();
    expect(lock.locked()).toBeFalse();
  });

  it('asks again only after a minute away', async () => {
    const lock = await startUnlocked();
    await awayFor(LOCK_AFTER_MS - 1);
    expect(device.verify).not.toHaveBeenCalled();
    await awayFor(LOCK_AFTER_MS);
    expect(device.verify).toHaveBeenCalledTimes(1);
    expect(lock.locked()).toBeFalse();
  });

  it('locks when the clock was set back', async () => {
    await startUnlocked();
    await awayFor(-1);
    expect(device.verify).toHaveBeenCalledTimes(1);
  });

  it('is locked before the app is active again', async () => {
    const lock = await startUnlocked();
    device.setActive(false);
    device.pause();
    now += LOCK_AFTER_MS;
    device.resume();
    expect(lock.locked()).toBeTrue();
    expect(device.verify).not.toHaveBeenCalled();
  });

  it('stays locked after a cancel, and the Face ID sheet itself never asks again', async () => {
    const lock = await startUnlocked();
    device.verifyAnswers = [new BiometricError('cancelled')];
    await awayFor(LOCK_AFTER_MS);
    // What iOS reports around its own sheet
    device.setActive(false);
    device.setActive(true);
    await settle();
    expect(lock.locked()).toBeTrue();
    expect(device.verify).toHaveBeenCalledTimes(1);
    await lock.unlock();
    expect(lock.locked()).toBeFalse();
  });

  it('is not asked again by the Android prompt pausing the app', async () => {
    const lock = await startUnlocked();
    let cancel!: (error: unknown) => void;
    device.verifyAnswers = [new Promise<void>((_, reject) => (cancel = reject))];
    await awayFor(LOCK_AFTER_MS);
    device.pause();
    cancel(new BiometricError('cancelled'));
    await settle();
    device.resume();
    await settle();
    expect(lock.locked()).toBeTrue();
    expect(device.verify).toHaveBeenCalledTimes(1);
  });

  it('asks again when coming back while still locked', async () => {
    const lock = await startUnlocked();
    device.verifyAnswers = [new BiometricError('cancelled')];
    await awayFor(LOCK_AFTER_MS);
    await awayFor(10);
    expect(device.verify).toHaveBeenCalledTimes(2);
    expect(lock.locked()).toBeFalse();
  });

  it('explains a failed check', async () => {
    device.verifyAnswers = [new BiometricError('unavailable')];
    const lock = create();
    void lock.waitAtStart();
    await settle();
    expect(lock.locked()).toBeTrue();
    expect(lock.message()).toContain('Sign in with your password');
  });

  it('keeps Android Back from closing the lock screen', async () => {
    device.isAndroid = true;
    device.verifyAnswers = [new BiometricError('cancelled')];
    const lock = create();
    TestBed.inject(NativeBackButtonService);
    void lock.waitAtStart();
    await settle();

    const dialog = document.createElement('dialog');
    document.body.append(dialog);
    dialog.showModal();
    device.back();
    expect(dialog.open).toBeTrue();
    expect(device.exitApp).toHaveBeenCalledTimes(1);

    await lock.unlock();
    device.back();
    expect(dialog.open).toBeFalse();
    dialog.remove();
  });
});
