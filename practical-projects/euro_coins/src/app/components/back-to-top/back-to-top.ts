import { Component, ElementRef, HostListener, inject, input, Input, signal, ViewChild } from '@angular/core';

@Component({
  selector: 'app-back-to-top',
  imports: [],
  templateUrl: './back-to-top.html',
  styleUrl: './back-to-top.css',
})
export class BackToTop {
  readonly scrollThreshold = input<number>(0);
  readonly pulseDuration = input<number>(0);
  readonly focusDelay = input<number>(0);

  isVisible = signal<boolean>(false);
  isPulse = signal<boolean>(false);

  @ViewChild('backToTopButton', { static: true }) button!: ElementRef<HTMLButtonElement>;

  private lastScrollTime = 0;
  private readonly throttleDelay = 100;

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const now = Date.now();
    if (now - this.lastScrollTime < this.throttleDelay) {
      return;
    }
    this.lastScrollTime = now;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

    if (scrollTop > this.scrollThreshold()) {
      if (!this.isVisible()) {
        this.isVisible.set(true);
        if (!this.isPulse()) {
          this.isPulse.set(true);
          setTimeout(() => {
            this.isPulse.set(false);
          }, this.pulseDuration());
        }
      }
    } else {
      this.isVisible.set(false);
    }

    if (scrollTop === 0) {
      this.isVisible.set(false);
    }
  }

  scrollToTop() {
    if (this.button) {
      this.button.nativeElement.style.transform = 'scale(0.9)';
      setTimeout(() => {
        this.button.nativeElement.style.transform = '';
      }, 150);
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    setTimeout(() => {
      const header = document.querySelector('.header') as HTMLElement;
      if (header) {
        header.focus();
      } else {
        console.warn('Header element not found for focus after scroll to top.');
      }
    }, (this.focusDelay()));
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.scrollToTop();
    }
  }
}
