import { httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import type { EChartsCoreOption } from 'echarts/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { environment } from '../../../environments/environment';
import {
  BudgetVsActualReport,
  ExchangeRate,
  MonthlySummary,
  NetWorthReport,
  RateType,
  SpendByCategoryReport,
} from '../../core/models';
import { MoneyPipe } from '../../core/money.pipe';
import { ThemeService } from '../../core/theme.service';

const RATE_ORDER: RateType[] = ['OFICIAL', 'TARJETA', 'BLUE', 'MEP', 'CCL', 'MAYORISTA', 'CRIPTO'];
const DONUT_COLORS = ['#3b82f6', '#60a5fa', '#1d4ed8', '#93c5fd', '#71717a', '#a1a1aa', '#52525b', '#bfdbfe'];

@Component({
  selector: 'ft-dashboard',
  imports: [TranslocoDirective, MoneyPipe, NgxEchartsDirective, RouterLink],
  template: `
    <div *transloco="let t" class="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-8 md:py-8">
      <!-- Month navigation -->
      <header class="flex items-center justify-between">
        <h1 class="text-xl font-semibold tracking-tight text-ink">{{ t('nav.dashboard') }}</h1>
        <div class="flex items-center gap-1">
          <button type="button" (click)="shiftMonth(-1)" aria-label="‹"
            class="grid size-8 place-items-center rounded-[8px] text-ink-muted transition hover:bg-surface-2 hover:text-ink">
            <i class="ph ph-caret-left" aria-hidden="true"></i>
          </button>
          <span class="min-w-36 text-center text-sm font-medium capitalize text-ink">{{ monthLabel() }}</span>
          <button type="button" (click)="shiftMonth(1)" aria-label="›"
            class="grid size-8 place-items-center rounded-[8px] text-ink-muted transition hover:bg-surface-2 hover:text-ink">
            <i class="ph ph-caret-right" aria-hidden="true"></i>
          </button>
        </div>
      </header>

      <!-- Global empty state -->
      @if (isEmpty()) {
        <div class="grid place-items-center rounded-card border border-line bg-surface px-6 py-16 text-center">
          <i class="ph ph-files mb-3 text-4xl text-ink-muted" aria-hidden="true"></i>
          <h2 class="text-lg font-medium text-ink">{{ t('dashboard.emptyTitle') }}</h2>
          <p class="mt-1 max-w-sm text-sm text-ink-muted">{{ t('dashboard.emptyBody') }}</p>
          <a routerLink="/import"
            class="mt-5 rounded-[8px] bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition active:scale-[0.98]">
            {{ t('dashboard.goImport') }}
          </a>
        </div>
      } @else {
        <!-- Net worth + monthly summary -->
        <section class="grid gap-4 lg:grid-cols-[2fr_3fr]">
          <div class="rounded-card border border-line bg-surface p-5">
            @if (netWorth.isLoading()) {
              <div class="animate-pulse space-y-3">
                <div class="h-4 w-28 rounded bg-surface-2"></div>
                <div class="h-9 w-48 rounded bg-surface-2"></div>
              </div>
            } @else if (netWorth.value(); as nw) {
              <p class="text-sm text-ink-muted">{{ t('dashboard.netWorth') }}</p>
              <p class="money mt-1 text-3xl font-semibold tracking-tight"
                 [class.text-pos]="nw.totalArsCents >= 0" [class.text-neg]="nw.totalArsCents < 0">
                {{ nw.totalArsCents | money }}
              </p>
            } @else {
              <p class="text-sm text-neg">{{ t('dashboard.loadError') }}</p>
              <button type="button" (click)="netWorth.reload()" class="mt-2 text-sm text-accent hover:underline">
                {{ t('common.retry') }}
              </button>
            }
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            @if (summary.isLoading()) {
              @for (i of [1, 2, 3]; track i) {
                <div class="animate-pulse rounded-card border border-line bg-surface p-5">
                  <div class="h-4 w-16 rounded bg-surface-2"></div>
                  <div class="mt-3 h-6 w-24 rounded bg-surface-2"></div>
                </div>
              }
            } @else if (summary.value(); as s) {
              <div class="rounded-card border border-line bg-surface p-5">
                <p class="text-sm text-ink-muted">{{ t('dashboard.income') }}</p>
                <p class="money mt-1 truncate text-lg font-medium text-pos">{{ s.incomeArsCents | money }}</p>
              </div>
              <div class="rounded-card border border-line bg-surface p-5">
                <p class="text-sm text-ink-muted">{{ t('dashboard.expenses') }}</p>
                <p class="money mt-1 truncate text-lg font-medium text-neg">{{ s.expenseArsCents | money }}</p>
              </div>
              <div class="rounded-card border border-line bg-surface p-5">
                <p class="text-sm text-ink-muted">{{ t('dashboard.net') }}</p>
                <p class="money mt-1 truncate text-lg font-medium"
                   [class.text-pos]="s.netArsCents >= 0" [class.text-neg]="s.netArsCents < 0">
                  {{ s.netArsCents | money }}
                </p>
              </div>
            }
          </div>
        </section>

        <!-- Spend by category + budgets -->
        <section class="grid gap-4 lg:grid-cols-2">
          <div class="rounded-card border border-line bg-surface p-5">
            <h2 class="text-sm font-medium text-ink">{{ t('dashboard.spendByCategory') }}</h2>
            @if (spend.isLoading()) {
              <div class="mt-4 h-52 animate-pulse rounded bg-surface-2"></div>
            } @else if (spend.value(); as sp) {
              @if (sp.items.length === 0) {
                <p class="mt-6 text-sm text-ink-muted">{{ t('dashboard.monthEmpty') }}</p>
              } @else {
                <div class="mt-2 grid items-center gap-2 sm:grid-cols-[200px_1fr]">
                  <div echarts [options]="chartOptions()" class="h-52 w-full" aria-hidden="true"></div>
                  <ul class="space-y-2">
                    @for (item of sp.items.slice(0, 7); track item.categoryId; let i = $index) {
                      <li class="flex items-center gap-2 text-sm">
                        <span class="size-2.5 shrink-0 rounded-full" [style.background]="donutColor(i)"></span>
                        <span class="min-w-0 flex-1 truncate text-ink">{{ item.categoryName }}</span>
                        <span class="money text-ink-muted">{{ item.spentArsCents | money }}</span>
                      </li>
                    }
                  </ul>
                </div>
              }
            }
          </div>

          <div class="rounded-card border border-line bg-surface p-5">
            <h2 class="text-sm font-medium text-ink">{{ t('dashboard.budgets') }}</h2>
            @if (budgets.isLoading()) {
              <div class="mt-4 space-y-4">
                @for (i of [1, 2]; track i) {
                  <div class="animate-pulse space-y-2">
                    <div class="h-4 w-32 rounded bg-surface-2"></div>
                    <div class="h-2 rounded bg-surface-2"></div>
                  </div>
                }
              </div>
            } @else if (budgets.value(); as b) {
              @if (b.items.length === 0) {
                <p class="mt-6 text-sm text-ink-muted">
                  {{ t('dashboard.noBudgets') }} ·
                  <a routerLink="/budgets" class="text-accent hover:underline">{{ t('dashboard.createBudget') }}</a>
                </p>
              } @else {
                <ul class="mt-4 space-y-4">
                  @for (item of b.items; track item.budgetId) {
                    <li>
                      <div class="flex items-baseline justify-between gap-2 text-sm">
                        <span class="text-ink">{{ item.categoryName }}</span>
                        <span class="money text-ink-muted">
                          {{ item.actualCents | money }} / {{ item.budgetCents | money }}
                        </span>
                      </div>
                      <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2" role="progressbar"
                           [attr.aria-valuenow]="item.usedPct" aria-valuemin="0" aria-valuemax="100">
                        <div class="h-full rounded-full transition-all"
                             [class.bg-accent]="item.usedPct <= 100" [class.bg-neg]="item.usedPct > 100"
                             [style.width.%]="clampPct(item.usedPct)"></div>
                      </div>
                    </li>
                  }
                </ul>
              }
            }
          </div>
        </section>

        <!-- Accounts -->
        <section class="rounded-card border border-line bg-surface">
          <h2 class="border-b border-line px-5 py-4 text-sm font-medium text-ink">{{ t('dashboard.accounts') }}</h2>
          @if (netWorth.isLoading()) {
            <div class="animate-pulse space-y-3 p-5">
              @for (i of [1, 2, 3]; track i) {
                <div class="h-10 rounded bg-surface-2"></div>
              }
            </div>
          } @else if (netWorth.value(); as nw) {
            <ul class="divide-y divide-line">
              @for (acc of nw.accounts; track acc.accountId) {
                <li class="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-ink">{{ acc.name }}</p>
                    <p class="text-xs text-ink-muted">{{ t('dashboard.types.' + acc.type) }}</p>
                  </div>
                  <div class="text-right">
                    @if (acc.balances.USD !== undefined) {
                      <p class="money text-xs text-ink-muted">{{ acc.balances.USD | money: 'USD' }}</p>
                    }
                    <p class="money text-sm" [class.text-pos]="acc.valueArsCents >= 0" [class.text-neg]="acc.valueArsCents < 0">
                      {{ acc.valueArsCents | money }}
                    </p>
                    @if (acc.rateUsed; as rate) {
                      <p class="text-xs text-ink-muted">
                        {{ t('dashboard.valuedWith', { rate: rate.rateType, side: t('dashboard.buy') }) }}
                      </p>
                    }
                  </div>
                </li>
              }
            </ul>
          }
        </section>

        <!-- FX strip -->
        @if (fx.value(); as rates) {
          <section aria-label="{{ t('dashboard.rates') }}">
            <h2 class="mb-2 text-sm font-medium text-ink">{{ t('dashboard.rates') }}</h2>
            <div class="flex flex-wrap gap-2">
              @for (rate of orderedRates(); track rate.rateType) {
                <span class="rounded-[8px] border border-line bg-surface px-3 py-1.5 text-xs">
                  <span class="font-medium text-ink-muted">{{ rate.rateType }}</span>
                  <span class="money ml-2 text-ink">{{ rate.sellCents | money }}</span>
                </span>
              }
            </div>
          </section>
        }
      }
    </div>
  `,
})
export class Dashboard {
  protected readonly theme = inject(ThemeService);
  private readonly transloco = inject(TranslocoService);
  private readonly api = environment.apiUrl;

  protected readonly month = signal(currentMonth());
  private readonly lang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly summary = httpResource<MonthlySummary>(
    () => `${this.api}/reports/summary?month=${this.month()}`,
  );
  protected readonly spend = httpResource<SpendByCategoryReport>(
    () => `${this.api}/reports/spend-by-category?month=${this.month()}`,
  );
  protected readonly budgets = httpResource<BudgetVsActualReport>(
    () => `${this.api}/reports/budget-vs-actual?month=${this.month()}`,
  );
  protected readonly netWorth = httpResource<NetWorthReport>(
    () => `${this.api}/reports/net-worth`,
  );
  protected readonly fx = httpResource<ExchangeRate[]>(() => `${this.api}/fx/rates`);

  protected readonly monthLabel = computed(() => {
    const locale = this.lang() === 'en' ? 'en-US' : 'es-AR';
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
      new Date(`${this.month()}-15T12:00:00Z`),
    );
  });

  protected readonly isEmpty = computed(() => {
    const nw = this.netWorth.value();
    return nw !== undefined && nw.accounts.length === 0;
  });

  protected readonly orderedRates = computed(() => {
    const rates = this.fx.value() ?? [];
    return RATE_ORDER.map((type) => rates.find((r) => r.rateType === type)).filter(
      (r): r is ExchangeRate => r !== undefined,
    );
  });

  protected readonly chartOptions = computed<EChartsCoreOption>(() => {
    const items = this.spend.value()?.items.slice(0, 7) ?? [];
    const locale = this.lang() === 'en' ? 'en-US' : 'es-AR';
    const dark = this.theme.dark();
    return {
      backgroundColor: 'transparent',
      color: DONUT_COLORS,
      tooltip: {
        trigger: 'item',
        backgroundColor: dark ? '#18181b' : '#ffffff',
        borderColor: dark ? '#27272a' : '#e4e4e7',
        textStyle: { color: dark ? '#f4f4f5' : '#18181b', fontSize: 12 },
        valueFormatter: (value: number) =>
          new Intl.NumberFormat(locale, { style: 'currency', currency: 'ARS' }).format(value),
      },
      series: [
        {
          type: 'pie',
          radius: ['62%', '85%'],
          itemStyle: { borderRadius: 4, borderColor: dark ? '#111113' : '#ffffff', borderWidth: 2 },
          label: { show: false },
          data: items.map((item) => ({
            name: item.categoryName,
            value: Math.abs(item.spentArsCents) / 100,
          })),
        },
      ],
    };
  });

  protected shiftMonth(delta: number): void {
    const [year, month] = this.month().split('-').map(Number);
    const next = new Date(Date.UTC(year, month - 1 + delta, 1));
    this.month.set(
      `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`,
    );
  }

  protected donutColor(index: number): string {
    return DONUT_COLORS[index % DONUT_COLORS.length];
  }

  protected clampPct(pct: number): number {
    return Math.min(pct, 100);
  }
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
