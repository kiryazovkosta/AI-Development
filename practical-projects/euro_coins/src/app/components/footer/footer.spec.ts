import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BUILD_INFO, BuildInfo } from '../../build-info';
import { Footer } from './footer';

describe('Footer', () => {
  async function buildLine(info?: BuildInfo): Promise<string | undefined> {
    TestBed.configureTestingModule({
      imports: [Footer],
      providers: [
        provideZonelessChangeDetection(),
        ...(info ? [{ provide: BUILD_INFO, useValue: info }] : []),
      ],
    });
    const fixture = TestBed.createComponent(Footer);
    await fixture.whenStable();
    const paragraphs = (fixture.nativeElement as HTMLElement).querySelectorAll('p');
    expect(paragraphs[0].textContent).toContain('Kosta Kiryazov');
    return paragraphs[1].textContent?.trim();
  }

  it('shows the build time, in local time, and the commit under the name', async () => {
    const time = new Date(2026, 10, 23, 22, 5);
    expect(await buildLine({ time, commit: 'abc1234+' })).toBe(
      'Build 23 Nov 2026, 22:05 · abc1234+'
    );
  });

  it('says so when it was not built by the build script', async () => {
    expect(await buildLine()).toBe('Development build');
  });
});
