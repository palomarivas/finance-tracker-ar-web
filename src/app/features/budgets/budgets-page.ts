import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { BudgetsApi } from '../../core/api/budgets-api';
import { CategoriesApi } from '../../core/api/categories-api';
import { Budget } from '../../core/models';
import { MoneyPipe } from '../../core/money.pipe';

@Component({
  selector: 'ft-budgets',
  imports: [TranslocoDirective, FormsModule, MoneyPipe],
  template: `
    <div *transloco="let t" class="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <header class="flex items-center justify-between">
        <h1 class="text-xl font-semibold tracking-tight text-ink">{{ t('budgets.title') }}</h1>
        <div class="flex items-center gap-1">
          <button type="button" (click)="shiftMonth(-1)" aria-label="‹" class="grid size-8 place-items-center rounded-[8px] text-ink-muted transition hover:bg-surface-2 hover:text-ink"><i class="ph ph-caret-left"></i></button>
          <span class="min-w-32 text-center text-sm font-medium capitalize text-ink">{{ monthLabel() }}</span>
          <button type="button" (click)="shiftMonth(1)" aria-label="›" class="grid size-8 place-items-center rounded-[8px] text-ink-muted transition hover:bg-surface-2 hover:text-ink"><i class="ph ph-caret-right"></i></button>
        </div>
      </header>

      <!-- New budget -->
      <form (ngSubmit)="create()" class="rounded-card border border-line bg-surface p-5">
        <h2 class="mb-4 text-sm font-medium text-ink">{{ t('budgets.new') }}</h2>
        <div class="grid gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
          <label class="block">
            <span class="mb-1 block text-xs text-ink-muted">{{ t('budgets.category') }}</span>
            <select [(ngModel)]="categoryId" name="cat" class="w-full rounded-[8px] border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent">
              <option value="">—</option>
              @for (c of categories() ?? []; track c.id) { <option [value]="c.id">{{ c.name }}</option> }
            </select>
          </label>
          <label class="block">
            <span class="mb-1 block text-xs text-ink-muted">{{ t('budgets.amount') }}</span>
            <input type="number" min="1" step="0.01" [(ngModel)]="amount" name="amount" class="money w-full rounded-[8px] border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
          </label>
          <button type="submit" [disabled]="!categoryId() || !amount() || saving()" class="rounded-[8px] bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition active:scale-[0.98] disabled:opacity-50">
            {{ t('common.create') }}
          </button>
        </div>
        @if (error()) { <p class="mt-2 text-sm text-neg">{{ t('budgets.duplicate') }}</p> }
      </form>

      <!-- List -->
      <section class="rounded-card border border-line bg-surface">
        @if (budgets().length === 0) {
          <p class="px-5 py-8 text-center text-sm text-ink-muted">{{ t('budgets.empty') }}</p>
        } @else {
          <ul class="divide-y divide-line">
            @for (b of budgets(); track b.id) {
              <li class="flex items-center gap-4 px-5 py-3.5">
                <span class="min-w-0 flex-1 truncate text-sm text-ink">{{ b.category.name }}</span>
                <span class="money text-sm text-ink">{{ b.amountCents | money }}</span>
                <button type="button" (click)="remove(b)" [attr.aria-label]="t('common.delete')" class="grid size-8 place-items-center rounded-[8px] text-ink-muted transition hover:bg-surface-2 hover:text-neg"><i class="ph ph-trash"></i></button>
              </li>
            }
          </ul>
        }
      </section>
    </div>
  `,
})
export class BudgetsPage {
  private readonly api = inject(BudgetsApi);
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly transloco = inject(TranslocoService);

  protected readonly categories = toSignal(this.categoriesApi.list(), { initialValue: undefined });
  protected readonly budgets = signal<Budget[]>([]);
  protected readonly saving = signal(false);
  protected readonly error = signal(false);

  protected readonly month = signal(currentMonth());
  protected readonly categoryId = signal('');
  protected readonly amount = signal<number | null>(null);

  private readonly lang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly monthLabel = computed(() => {
    const locale = this.lang() === 'en' ? 'en-US' : 'es-AR';
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
      new Date(`${this.month()}-15T12:00:00Z`),
    );
  });

  constructor() {
    this.refresh();
  }

  protected shiftMonth(delta: number): void {
    const [year, month] = this.month().split('-').map(Number);
    const next = new Date(Date.UTC(year, month - 1 + delta, 1));
    this.month.set(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`);
    this.refresh();
  }

  protected create(): void {
    if (!this.categoryId() || !this.amount() || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.error.set(false);
    this.api
      .create({
        categoryId: this.categoryId(),
        amountCents: Math.round(this.amount()! * 100),
        month: this.month(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.categoryId.set('');
          this.amount.set(null);
          this.refresh();
        },
        error: () => {
          this.saving.set(false);
          this.error.set(true);
        },
      });
  }

  protected remove(b: Budget): void {
    if (!confirm(this.transloco.translate('budgets.deleteConfirm'))) {
      return;
    }
    this.api.remove(b.id).subscribe(() => this.refresh());
  }

  private refresh(): void {
    this.api.list(this.month()).subscribe((b) => this.budgets.set(b));
  }
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
