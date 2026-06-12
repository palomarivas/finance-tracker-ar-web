import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { AuthApi } from '../../core/api/auth-api';
import { TokenStore } from '../../core/auth/token-store';

@Component({
  selector: 'ft-login',
  imports: [ReactiveFormsModule, RouterLink, TranslocoDirective],
  template: `
    <div *transloco="let t" class="flex min-h-[100dvh] items-center justify-center bg-bg px-4">
      <div class="w-full max-w-sm">
        <h1 class="mb-1 text-2xl font-semibold tracking-tight text-ink">
          {{ t('auth.loginTitle') }}
        </h1>
        <p class="mb-8 text-sm text-ink-muted">{{ t('app.name') }}</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
          <div class="space-y-2">
            <label for="email" class="block text-sm font-medium text-ink">
              {{ t('auth.email') }}
            </label>
            <input
              id="email"
              type="email"
              formControlName="email"
              autocomplete="email"
              class="w-full rounded-[8px] border border-line bg-surface px-3 py-2 text-ink
                     outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <div class="space-y-2">
            <label for="password" class="block text-sm font-medium text-ink">
              {{ t('auth.password') }}
            </label>
            <input
              id="password"
              type="password"
              formControlName="password"
              autocomplete="current-password"
              class="w-full rounded-[8px] border border-line bg-surface px-3 py-2 text-ink
                     outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </div>

          @if (error()) {
            <p class="text-sm text-neg" role="alert">{{ t(error()!) }}</p>
          }

          <button
            type="submit"
            [disabled]="form.invalid || loading()"
            class="w-full rounded-[8px] bg-accent px-4 py-2.5 font-medium text-accent-ink
                   transition active:scale-[0.98] disabled:opacity-50"
          >
            {{ loading() ? t('app.loading') : t('auth.login') }}
          </button>
        </form>

        <p class="mt-6 text-sm text-ink-muted">
          {{ t('auth.noAccount') }}
          <a routerLink="/auth/register" class="font-medium text-accent hover:underline">
            {{ t('auth.goRegister') }}
          </a>
        </p>
      </div>
    </div>
  `,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AuthApi);
  private readonly store = inject(TokenStore);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected submit(): void {
    if (this.form.invalid || this.loading()) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.api.login(email, password).subscribe({
      next: (result) => {
        this.store.store(result);
        void this.router.navigate(['/']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(
          err.status === 401 ? 'auth.errors.invalidCredentials' : 'auth.errors.generic',
        );
      },
    });
  }
}
