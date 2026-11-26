import { DOCUMENT, ViewportScroller } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header';
import { Footer } from './components/footer/footer';
import { LockScreenComponent } from './components/lock-screen/lock-screen';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, Footer, LockScreenComponent],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.css',
})
export class App {
  constructor() {
    const document = inject(DOCUMENT);
    // Angular scrolls to anchors by itself, without the page's scroll-padding
    inject(ViewportScroller).setOffset(() => [
      0,
      parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0,
    ]);
  }
}
