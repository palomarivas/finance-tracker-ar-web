import { Injectable, signal } from '@angular/core';

const THEME_KEY = 'ft.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** index.html applies the class pre-paint; this signal mirrors it. */
  private readonly darkSignal = signal(
    document.documentElement.classList.contains('dark'),
  );
  readonly dark = this.darkSignal.asReadonly();

  toggle(): void {
    const next = !this.darkSignal();
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
    this.darkSignal.set(next);
  }
}
