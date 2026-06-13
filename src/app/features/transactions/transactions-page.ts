import { httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../environments/environment';
import { AccountsApi } from '../../core/api/accounts-api';
import { CategoriesApi } from '../../core/api/categories-api';
import { TransactionsApi } from '../../core/api/transactions-api';
import { Category, Paginated, Transaction } from '../../core/models';
import { MoneyPipe } from '../../core/money.pipe';

@Component({
  selector: 'ft-transactions',
  imports: [TranslocoDirective, MoneyPipe],
  template: `
    <div *transloco="let t" class="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <!-- Header + month nav -->
      <header class="flex items-center justify-between">
        <h1 class="text-xl font-semibold tracking-tight text-ink">{{ t('tx.title') }}</h1>
        <div class="flex items-center gap-1">
          <button type="button" (click)="shiftMonth(-1)" aria-label="‹"
            class="grid size-8 place-items-center rounded-[8px] text-ink-muted transition hover:bg-surface-2 hover:text-ink">
            <i class="ph ph-caret-left" aria-hidden="true"></i>
          </button>
          <span class="min-w-32 text-center text-sm font-medium capitalize text-ink">{{ monthLabel() }}</span>
          <button type="button" (click)="shiftMonth(1)" aria-label="›"
            class="grid size-8 place-items-center rounded-[8px] text-ink-muted transition hover:bg-surface-2 hover:text-ink">
            <i class="ph ph-caret-right" aria-hidden="true"></i>
          </button>
        </div>
      </header>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3">
        <select [value]="accountId()" (change)="setAccount($any($event.target).value)"
          class="rounded-[8px] border border-line bg-surface px-3 py-1.5 text-sm text-ink outline-none focus:border-accent">
          <option value="">{{ t('tx.allAccounts') }}</option>
          @for (acc of accounts() ?? []; track acc.id) {
            <option [value]="acc.id">{{ acc.name }}</option>
          }
        </select>

        <select [value]="categoryId()" (change)="setCategory($any($event.target).value)"
          class="rounded-[8px] border border-line bg-surface px-3 py-1.5 text-sm text-ink outline-none focus:border-accent">
          <option value="">{{ t('tx.allCategories') }}</option>
          @for (cat of categories() ?? []; track cat.id) {
            <option [value]="cat.id">{{ cat.name }}</option>
          }
        </select>

        <label class="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input type="checkbox" [checked]="uncategorized()" (change)="setUncategorized($any($event.target).checked)"
            class="size-4 rounded border-line accent-accent" />
          {{ t('tx.onlyUncategorized') }}
        </label>
      </div>

      <!-- List -->
      <section class="rounded-card border border-line bg-surface">
        @if (list.isLoading()) {
          <div class="animate-pulse space-y-3 p-5">
            @for (i of [1,2,3,4,5]; track i) { <div class="h-9 rounded bg-surface-2"></div> }
          </div>
        } @else if (list.value(); as page) {
          @if (page.items.length === 0) {
            <p class="px-5 py-10 text-center text-sm text-ink-muted">{{ t('tx.empty') }}</p>
          } @else {
            <ul class="divide-y divide-line">
              @for (tx of page.items; track tx.id) {
                <li class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-5">
                  <div class="order-1 min-w-0 flex-1">
                    <p class="truncate text-sm text-ink">{{ tx.description || t('tx.uncategorized') }}</p>
                    <p class="text-xs text-ink-muted">
                      {{ formatDate(tx.postedAt) }} · {{ tx.account?.name }}
                    </p>
                  </div>

                  <p class="money order-2 w-28 shrink-0 text-right text-sm md:order-4"
                     [class.text-pos]="tx.type === 'INCOME'"
                     [class.text-neg]="tx.type === 'EXPENSE'"
                     [class.text-ink-muted]="tx.type === 'TRANSFER'">
                    {{ tx.amountCents | money: tx.currency }}
                  </p>

                  <div class="order-3 w-full md:order-3 md:w-48 md:shrink-0">
                    @if (tx.type === 'TRANSFER') {
                      <span class="text-xs text-ink-muted">{{ t('tx.transfer') }}</span>
                    } @else {
                      <select
                        [value]="tx.category?.id ?? ''"
                        (change)="recategorize(tx, $any($event.target).value)"
                        [disabled]="savingId() === tx.id"
                        class="w-full rounded-[8px] border px-2 py-1 text-xs outline-none focus:border-accent disabled:opacity-50"
                        [class.border-line]="tx.category"
                        [class.border-accent]="!tx.category"
                        [class.text-ink]="tx.category"
                        [class.text-accent]="!tx.category">
                        <option value="">{{ t('tx.uncategorized') }}</option>
                        @for (cat of categories() ?? []; track cat.id) {
                          <option [value]="cat.id">{{ cat.name }}</option>
                        }
                      </select>
                    }
                  </div>
                </li>
              }
            </ul>

            <!-- Pagination -->
            <div class="flex items-center justify-between border-t border-line px-5 py-3 text-sm text-ink-muted">
              <span>{{ t('tx.pageInfo', { from: rangeFrom(page), to: rangeTo(page), total: page.total }) }}</span>
              <div class="flex gap-1">
                <button type="button" (click)="prevPage()" [disabled]="page.page <= 1" aria-label="‹"
                  class="grid size-8 place-items-center rounded-[8px] transition hover:bg-surface-2 hover:text-ink disabled:opacity-40">
                  <i class="ph ph-caret-left" aria-hidden="true"></i>
                </button>
                <button type="button" (click)="nextPage(page)" [disabled]="!hasNext(page)" aria-label="›"
                  class="grid size-8 place-items-center rounded-[8px] transition hover:bg-surface-2 hover:text-ink disabled:opacity-40">
                  <i class="ph ph-caret-right" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          }
        }
      </section>
    </div>
  `,
})
export class TransactionsPage {
  private readonly api = inject(TransactionsApi);
  private readonly accountsApi = inject(AccountsApi);
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly transloco = inject(TranslocoService);
  private readonly apiUrl = environment.apiUrl;

  protected readonly accounts = toSignal(this.accountsApi.list(), { initialValue: undefined });
  protected readonly categories = toSignal(this.categoriesApi.list(), { initialValue: undefined });

  protected readonly month = signal(currentMonth());
  protected readonly accountId = signal('');
  protected readonly categoryId = signal('');
  protected readonly uncategorized = signal(false);
  protected readonly page = signal(1);
  protected readonly savingId = signal<string | null>(null);

  private readonly lang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  private readonly limit = 50;

  protected readonly list = httpResource<Paginated<Transaction>>(() => {
    const params = new URLSearchParams({
      month: this.month(),
      page: String(this.page()),
      limit: String(this.limit),
    });
    if (this.accountId()) params.set('accountId', this.accountId());
    if (this.categoryId()) params.set('categoryId', this.categoryId());
    if (this.uncategorized()) params.set('uncategorized', 'true');
    return `${this.apiUrl}/transactions?${params.toString()}`;
  });

  protected readonly monthLabel = computed(() => {
    const locale = this.lang() === 'en' ? 'en-US' : 'es-AR';
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
      new Date(`${this.month()}-15T12:00:00Z`),
    );
  });

  protected formatDate(iso: string): string {
    const locale = this.lang() === 'en' ? 'en-US' : 'es-AR';
    return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit' }).format(
      new Date(iso),
    );
  }

  protected shiftMonth(delta: number): void {
    const [year, month] = this.month().split('-').map(Number);
    const next = new Date(Date.UTC(year, month - 1 + delta, 1));
    this.page.set(1);
    this.month.set(
      `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`,
    );
  }

  protected setAccount(value: string): void {
    this.page.set(1);
    this.accountId.set(value);
  }
  protected setCategory(value: string): void {
    this.page.set(1);
    this.categoryId.set(value);
  }
  protected setUncategorized(value: boolean): void {
    this.page.set(1);
    this.uncategorized.set(value);
  }

  protected recategorize(tx: Transaction, categoryId: string): void {
    this.savingId.set(tx.id);
    this.api.updateCategory(tx.id, categoryId || null).subscribe({
      next: () => {
        this.savingId.set(null);
        this.list.reload();
      },
      error: () => this.savingId.set(null),
    });
  }

  protected prevPage(): void {
    this.page.update((p) => Math.max(1, p - 1));
  }
  protected nextPage(page: Paginated<Transaction>): void {
    if (this.hasNext(page)) {
      this.page.update((p) => p + 1);
    }
  }
  protected hasNext(page: Paginated<Transaction>): boolean {
    return page.page * page.limit < page.total;
  }
  protected rangeFrom(page: Paginated<Transaction>): number {
    return page.total === 0 ? 0 : (page.page - 1) * page.limit + 1;
  }
  protected rangeTo(page: Paginated<Transaction>): number {
    return Math.min(page.page * page.limit, page.total);
  }
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
