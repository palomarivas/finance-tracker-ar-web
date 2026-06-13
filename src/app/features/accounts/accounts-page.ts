import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AccountInput, AccountsApi } from '../../core/api/accounts-api';
import { Account, AccountType, Currency, RateType } from '../../core/models';

const ACCOUNT_TYPES: AccountType[] = ['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'WALLET', 'CASH'];
const RATE_TYPES: RateType[] = ['MEP', 'BLUE', 'OFICIAL', 'CCL', 'TARJETA', 'MAYORISTA', 'CRIPTO'];

@Component({
  selector: 'ft-accounts',
  imports: [TranslocoDirective, FormsModule],
  template: `
    <div *transloco="let t" class="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <h1 class="text-xl font-semibold tracking-tight text-ink">{{ t('accounts.title') }}</h1>

      <!-- New account -->
      <form (ngSubmit)="create()" class="rounded-card border border-line bg-surface p-5">
        <h2 class="mb-4 text-sm font-medium text-ink">{{ t('accounts.new') }}</h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-xs text-ink-muted">{{ t('accounts.name') }}</span>
            <input [(ngModel)]="name" name="name" required class="w-full rounded-[8px] border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs text-ink-muted">{{ t('accounts.institution') }}</span>
            <input [(ngModel)]="institution" name="institution" class="w-full rounded-[8px] border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs text-ink-muted">{{ t('accounts.type') }}</span>
            <select [(ngModel)]="type" name="type" class="w-full rounded-[8px] border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent">
              @for (ty of accountTypes; track ty) { <option [value]="ty">{{ t('dashboard.types.' + ty) }}</option> }
            </select>
          </label>
          <label class="block">
            <span class="mb-1 block text-xs text-ink-muted">{{ t('accounts.currency') }}</span>
            <select [(ngModel)]="currency" name="currency" class="w-full rounded-[8px] border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent">
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </label>
          @if (currency() === 'USD') {
            <label class="block sm:col-span-2">
              <span class="mb-1 block text-xs text-ink-muted">{{ t('accounts.valuationRate') }}</span>
              <select [(ngModel)]="valuationRateType" name="rate" class="w-full rounded-[8px] border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent">
                @for (r of rateTypes; track r) { <option [value]="r">{{ r }}</option> }
              </select>
            </label>
          }
        </div>
        <button type="submit" [disabled]="!name() || saving()" class="mt-4 rounded-[8px] bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition active:scale-[0.98] disabled:opacity-50">
          {{ t('common.create') }}
        </button>
      </form>

      <!-- List -->
      <section class="rounded-card border border-line bg-surface">
        @if (accounts().length === 0) {
          <p class="px-5 py-8 text-center text-sm text-ink-muted">{{ t('accounts.empty') }}</p>
        } @else {
          <ul class="divide-y divide-line">
            @for (acc of accounts(); track acc.id) {
              <li class="flex items-center gap-4 px-5 py-3.5">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-ink">{{ acc.name }}</p>
                  <p class="text-xs text-ink-muted">
                    {{ t('dashboard.types.' + acc.type) }} · {{ acc.currency }}
                    @if (acc.institution) { · {{ acc.institution }} }
                    @if (acc.valuationRateType) { · {{ acc.valuationRateType }} }
                  </p>
                </div>
                <button type="button" (click)="remove(acc)" [attr.aria-label]="t('common.delete')"
                  class="grid size-8 place-items-center rounded-[8px] text-ink-muted transition hover:bg-surface-2 hover:text-neg">
                  <i class="ph ph-trash" aria-hidden="true"></i>
                </button>
              </li>
            }
          </ul>
        }
      </section>
    </div>
  `,
})
export class AccountsPage {
  private readonly api = inject(AccountsApi);
  private readonly transloco = inject(TranslocoService);

  protected readonly accountTypes = ACCOUNT_TYPES;
  protected readonly rateTypes = RATE_TYPES;

  protected readonly accounts = signal<Account[]>([]);
  protected readonly saving = signal(false);

  protected readonly name = signal('');
  protected readonly institution = signal('');
  protected readonly type = signal<AccountType>('CHECKING');
  protected readonly currency = signal<Currency>('ARS');
  protected readonly valuationRateType = signal<RateType>('MEP');

  constructor() {
    this.refresh();
  }

  protected create(): void {
    if (!this.name() || this.saving()) {
      return;
    }
    this.saving.set(true);
    const input: AccountInput = {
      name: this.name(),
      type: this.type(),
      currency: this.currency(),
      ...(this.institution() ? { institution: this.institution() } : {}),
      ...(this.currency() === 'USD' ? { valuationRateType: this.valuationRateType() } : {}),
    };
    this.api.create(input).subscribe({
      next: () => {
        this.saving.set(false);
        this.name.set('');
        this.institution.set('');
        this.refresh();
      },
      error: () => this.saving.set(false),
    });
  }

  protected remove(acc: Account): void {
    if (!confirm(this.transloco.translate('accounts.deleteConfirm'))) {
      return;
    }
    this.api.remove(acc.id).subscribe(() => this.refresh());
  }

  private refresh(): void {
    this.api.list().subscribe((a) => this.accounts.set(a));
  }
}
