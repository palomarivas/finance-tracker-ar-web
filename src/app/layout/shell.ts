import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { TokenStore } from '../core/auth/token-store';
import { ThemeService } from '../core/theme.service';

interface NavItem {
  path: string;
  labelKey: string;
  icon: string;
}

@Component({
  selector: 'ft-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslocoDirective],
  template: `
    <div *transloco="let t" class="flex min-h-[100dvh] bg-bg">
      <!-- Sidebar (desktop) / bottom bar (mobile) -->
      <aside
        class="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface
               md:static md:inset-auto md:flex md:w-60 md:flex-col md:border-r md:border-t-0"
      >
        <div class="hidden items-center gap-2 px-5 py-5 md:flex">
          <span class="grid size-8 place-items-center rounded-[8px] bg-accent font-mono text-sm font-bold text-accent-ink">
            ft
          </span>
          <span class="font-semibold tracking-tight text-ink">{{ t('app.name') }}</span>
        </div>

        <nav class="flex justify-around md:flex-1 md:flex-col md:justify-start md:gap-1 md:px-3">
          @for (item of nav; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="text-accent md:bg-surface-2 md:text-ink"
              [routerLinkActiveOptions]="{ exact: item.path === '/' }"
              class="flex flex-col items-center gap-1 px-3 py-2.5 text-xs text-ink-muted transition
                     hover:text-ink md:flex-row md:gap-3 md:rounded-[8px] md:text-sm"
            >
              <i class="ph {{ item.icon }} text-xl md:text-lg" aria-hidden="true"></i>
              <span>{{ t(item.labelKey) }}</span>
            </a>
          }
        </nav>

        <div class="hidden border-t border-line p-3 md:block">
          <div class="flex items-center justify-between gap-2">
            <button
              type="button"
              (click)="theme.toggle()"
              [attr.aria-label]="theme.dark() ? t('theme.light') : t('theme.dark')"
              class="grid size-9 place-items-center rounded-[8px] text-ink-muted transition hover:bg-surface-2 hover:text-ink"
            >
              <i class="ph text-lg" [class.ph-sun]="theme.dark()" [class.ph-moon]="!theme.dark()" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              (click)="toggleLang()"
              class="rounded-[8px] px-3 py-2 font-mono text-xs uppercase text-ink-muted transition hover:bg-surface-2 hover:text-ink"
            >
              {{ lang() }}
            </button>
            <button
              type="button"
              (click)="logout()"
              [attr.aria-label]="t('nav.logout')"
              class="grid size-9 place-items-center rounded-[8px] text-ink-muted transition hover:bg-surface-2 hover:text-neg"
            >
              <i class="ph ph-sign-out text-lg" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </aside>

      <main class="min-w-0 flex-1 pb-20 md:pb-0">
        <router-outlet />
      </main>
    </div>
  `,
})
export class Shell {
  protected readonly theme = inject(ThemeService);
  private readonly transloco = inject(TranslocoService);
  private readonly store = inject(TokenStore);
  private readonly router = inject(Router);

  protected readonly nav: NavItem[] = [
    { path: '/', labelKey: 'nav.dashboard', icon: 'ph-squares-four' },
    { path: '/transactions', labelKey: 'nav.transactions', icon: 'ph-list-bullets' },
    { path: '/import', labelKey: 'nav.import', icon: 'ph-upload-simple' },
    { path: '/accounts', labelKey: 'nav.accounts', icon: 'ph-bank' },
    { path: '/budgets', labelKey: 'nav.budgets', icon: 'ph-target' },
    { path: '/categories', labelKey: 'nav.categories', icon: 'ph-tag' },
  ];

  protected lang = () => this.transloco.getActiveLang();

  protected toggleLang(): void {
    const next = this.transloco.getActiveLang() === 'es' ? 'en' : 'es';
    this.transloco.setActiveLang(next);
    localStorage.setItem('ft.lang', next);
  }

  protected logout(): void {
    this.store.clear();
    void this.router.navigate(['/auth/login']);
  }
}
