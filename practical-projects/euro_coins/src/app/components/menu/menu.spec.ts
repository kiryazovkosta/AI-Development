import {
  Component,
  provideZonelessChangeDetection,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BUILD_INFO } from '../../build-info';
import { AuthService } from '../../services/auth.service';
import { BiometricLoginService } from '../../services/biometric-login.service';
import { NativePlatform } from '../../services/native/native-adapters';
import { NativeBackButtonService } from '../../services/native-back-button.service';
import { FakeDevice } from '../../services/native/fake-device.spec';
import { MenuComponent } from './menu';

@Component({ changeDetection: ChangeDetectionStrategy.Eager, template: '' })
class BlankPage {}

describe('MenuComponent', () => {
  const isAuthenticated = signal(true);
  const isAdmin = signal(false);
  const toggleLabel = signal<string | null>(null);
  const enabled = signal(false);
  let device: FakeDevice;
  let auth: { logout: jasmine.Spy };
  let biometric: { enable: jasmine.Spy; disable: jasmine.Spy; refresh: jasmine.Spy };
  let fixture: ComponentFixture<MenuComponent>;

  const root = () => fixture.nativeElement as HTMLElement;
  const drawer = () => root().querySelector('dialog')!;
  const items = (selector: string) =>
    [...root().querySelectorAll<HTMLElement>(`${selector} .menu-item`)].map((item) =>
      item.textContent!.trim()
    );
  const item = (text: string) =>
    [...drawer().querySelectorAll<HTMLElement>('.menu-item')].find(
      (element) => element.textContent!.trim() === text
    )!;
  const open = async () => {
    root().querySelector<HTMLElement>('.menu-button')!.click();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    isAuthenticated.set(true);
    isAdmin.set(false);
    toggleLabel.set(null);
    enabled.set(false);
    device = new FakeDevice();
    device.isAndroid = true;
    auth = { logout: jasmine.createSpy('logout').and.resolveTo() };
    biometric = {
      enable: jasmine.createSpy('enable').and.callFake(async () => enabled.set(true)),
      disable: jasmine.createSpy('disable').and.callFake(async () => enabled.set(false)),
      refresh: jasmine.createSpy('refresh').and.resolveTo(),
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'collection', component: BlankPage },
          { path: 'users/new', component: BlankPage },
          { path: 'coins/new', component: BlankPage },
        ]),
        ...device.providers(),
        {
          provide: AuthService,
          useValue: {
            ...auth,
            isAuthenticated,
            isAdmin,
            displayName: signal('Collector'),
            currentUser: signal(null),
          },
        },
        {
          provide: BUILD_INFO,
          useValue: { time: new Date(2026, 10, 25, 21, 33), commit: 'abc1234' },
        },
        { provide: BiometricLoginService, useValue: { ...biometric, toggleLabel, enabled } },
      ],
    });
    await TestBed.inject(Router).navigateByUrl('/collection');
    fixture = TestBed.createComponent(MenuComponent);
    await fixture.whenStable();
  });

  it('is empty when signed out', async () => {
    isAuthenticated.set(false);
    await fixture.whenStable();
    expect(root().textContent!.trim()).toBe('');
    expect(root().querySelector('button')).toBeNull();
  });

  it('shows Home, Commemoratives and Sign Out to everyone, in the bar and in the drawer', () => {
    expect(items('.bar-nav')).toEqual(['Home', 'Commemoratives', 'Sign Out']);
    expect(items('.drawer-nav')).toEqual(['Home', 'Commemoratives', 'Sign Out']);
  });

  it('shows the admin pages to administrators and Face ID where it is available', async () => {
    isAdmin.set(true);
    toggleLabel.set('Face ID');
    await fixture.whenStable();
    expect(items('.bar-nav')).toEqual([
      'Home',
      'Commemoratives',
      'Admin',
      'Turn On Face ID',
      'Sign Out',
    ]);
    // The drawer has no nested menu: the admin pages are plain items under a heading
    expect(items('.drawer-nav')).toEqual([
      'Home',
      'Commemoratives',
      'Add Coin',
      'Create User',
      'Turn On Face ID',
      'Sign Out',
    ]);
    expect(drawer().querySelector('.menu-section')?.textContent?.trim()).toBe('Admin');
  });

  it('opens the Admin dropdown in the bar and closes it after a page is chosen', async () => {
    isAdmin.set(true);
    await fixture.whenStable();
    const toggle = root().querySelector<HTMLElement>('.admin-toggle')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(items('.admin-list')).toEqual(['Add Coin', 'Create User']);

    root().querySelector<HTMLElement>('.admin-list .menu-item')!.click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/coins/new');
    expect(root().querySelector('.admin-list')).toBeNull();
    expect(toggle.classList).toContain('active');
  });

  it('closes the Admin dropdown on a click outside it', async () => {
    isAdmin.set(true);
    await fixture.whenStable();
    root().querySelector<HTMLElement>('.admin-toggle')!.click();
    await fixture.whenStable();
    document.body.click();
    await fixture.whenStable();
    expect(root().querySelector('.admin-list')).toBeNull();
  });

  for (const isNative of [true, false]) {
    it(`${isNative ? 'shows the build in the mobile app' : 'hides the build in a browser'}`, async () => {
      fixture.destroy();
      const platform = TestBed.inject(NativePlatform) as { isNative: boolean };
      const original = platform.isNative;
      platform.isNative = isNative;
      fixture = TestBed.createComponent(MenuComponent);
      platform.isNative = original;
      await fixture.whenStable();
      expect(root().querySelector('.build-info')?.textContent?.trim()).toBe(
        isNative ? 'Build 2026.11.25 21:33 · abc1234' : undefined
      );
    });
  }

  it('turns Face ID on and off, leaving the drawer open', async () => {
    toggleLabel.set('Face ID');
    await fixture.whenStable();
    await open();
    item('Turn On Face ID').click();
    await fixture.whenStable();
    expect(biometric.enable).toHaveBeenCalledTimes(1);
    await fixture.whenStable();
    item('Turn Off Face ID').click();
    await fixture.whenStable();
    expect(biometric.disable).toHaveBeenCalledTimes(1);
    expect(drawer().open).toBeTrue();
  });

  it('marks the current page', async () => {
    isAdmin.set(true);
    await fixture.whenStable();
    expect(item('Home').getAttribute('aria-current')).toBe('page');
    expect(item('Create User').getAttribute('aria-current')).toBeNull();
  });

  it('closes the drawer when a page is chosen', async () => {
    isAdmin.set(true);
    await fixture.whenStable();
    await open();
    expect(drawer().matches(':modal')).toBeTrue();
    item('Create User').click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/users/new');
    expect(drawer().open).toBeFalse();
  });

  it('closes the drawer when the page that is already open is chosen', async () => {
    await open();
    item('Home').click();
    await fixture.whenStable();
    expect(drawer().open).toBeFalse();
  });

  it('closes the drawer on a click outside it, but not on one inside', async () => {
    await open();
    drawer().querySelector<HTMLElement>('.drawer-header')!.click();
    expect(drawer().open).toBeTrue();
    drawer().click();
    expect(drawer().open).toBeFalse();
  });

  it("closes the drawer on Android's Back button instead of leaving the app", async () => {
    TestBed.inject(NativeBackButtonService);
    await open();
    device.back();
    expect(drawer().open).toBeFalse();
    expect(device.exitApp).not.toHaveBeenCalled();
    device.back();
    expect(device.exitApp).toHaveBeenCalledTimes(1);
  });

  it('signs out', async () => {
    item('Sign Out').click();
    await fixture.whenStable();
    expect(auth.logout).toHaveBeenCalledTimes(1);
  });
});
