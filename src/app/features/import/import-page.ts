import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AccountsApi } from '../../core/api/accounts-api';
import { ImportApi } from '../../core/api/import-api';
import {
  CreditCardStatement,
  Currency,
  ImportBatch,
  ImportSummary,
} from '../../core/models';
import { MoneyPipe } from '../../core/money.pipe';

@Component({
  selector: 'ft-import',
  imports: [TranslocoDirective, RouterLink, MoneyPipe],
  template: `
    <div *transloco="let t" class="mx-auto max-w-4xl space-y-8 px-4 py-6 md:px-8 md:py-8">
      <h1 class="text-xl font-semibold tracking-tight text-ink">{{ t('import.title') }}</h1>

      @if (accounts() && accounts()!.length === 0) {
        <div class="grid place-items-center rounded-card border border-line bg-surface px-6 py-12 text-center">
          <i class="ph ph-bank mb-3 text-3xl text-ink-muted" aria-hidden="true"></i>
          <h2 class="font-medium text-ink">{{ t('import.noAccountsTitle') }}</h2>
          <p class="mt-1 max-w-sm text-sm text-ink-muted">{{ t('import.noAccountsBody') }}</p>
          <a routerLink="/accounts" class="mt-4 rounded-[8px] bg-accent px-4 py-2 text-sm font-medium text-accent-ink">
            {{ t('import.goAccounts') }}
          </a>
        </div>
      } @else {
        <!-- Upload -->
        <section class="rounded-card border border-line bg-surface p-5">
          <h2 class="text-sm font-medium text-ink">{{ t('import.uploadTitle') }}</h2>
          <p class="mt-1 text-xs text-ink-muted">{{ t('import.uploadHint') }}</p>

          <div class="mt-4 space-y-3">
            <label class="block">
              <span class="mb-1.5 block text-sm text-ink">{{ t('import.account') }}</span>
              <select
                [value]="accountId() ?? ''"
                (change)="accountId.set($any($event.target).value || null)"
                class="w-full rounded-[8px] border border-line bg-surface-2 px-3 py-2 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              >
                <option value="" disabled>{{ t('import.selectAccount') }}</option>
                @for (acc of accounts() ?? []; track acc.id) {
                  <option [value]="acc.id">{{ acc.name }} ({{ acc.currency }})</option>
                }
              </select>
            </label>

            <button
              type="button"
              (click)="fileInput.click()"
              (dragover)="$event.preventDefault()"
              (drop)="onDrop($event)"
              [disabled]="!accountId() || uploading()"
              class="flex w-full flex-col items-center gap-2 rounded-card border border-dashed border-line bg-surface-2 px-4 py-10 text-sm text-ink-muted transition hover:border-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              <i class="ph ph-upload-simple text-2xl" aria-hidden="true"></i>
              {{ uploading() ? t('import.uploading') : t('import.dropHere') }}
            </button>
            <input #fileInput type="file" accept=".pdf,.csv" hidden (change)="onPick($event)" />

            @if (lastResult(); as r) {
              <div class="rounded-[8px] border border-pos/30 bg-pos/10 px-4 py-3 text-sm">
                <p class="money text-ink">
                  {{ t('import.result', { imported: r.imported, skipped: r.skipped, uncategorized: r.uncategorized }) }}
                </p>
                @if (r.uncategorized > 0) {
                  <a routerLink="/transactions" class="mt-1 inline-block text-accent hover:underline">
                    {{ t('import.reviewLink') }}
                  </a>
                }
              </div>
            }
            @if (error()) {
              <p class="text-sm text-neg" role="alert">{{ t('import.uploadError') }}</p>
            }
          </div>
        </section>

        <!-- Card statements -->
        <section class="rounded-card border border-line bg-surface">
          <h2 class="border-b border-line px-5 py-4 text-sm font-medium text-ink">{{ t('import.statements') }}</h2>
          @if (statements().length === 0) {
            <p class="px-5 py-6 text-sm text-ink-muted">{{ t('import.noStatements') }}</p>
          } @else {
            <ul class="divide-y divide-line">
              @for (s of statements(); track s.id) {
                <li class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-ink">{{ s.account?.name }}</p>
                    <p class="text-xs text-ink-muted">
                      {{ t('import.closing') }} {{ s.closingDate }} · {{ t('import.due') }} {{ s.dueDate }}
                    </p>
                  </div>
                  <div class="flex items-center justify-between gap-4 sm:justify-end">
                    <div class="sm:text-right">
                      @if (s.usdSpendCents !== 0) {
                        <p class="money text-xs text-ink-muted">{{ s.usdSpendCents | money: 'USD' }}</p>
                      }
                      @if (s.perceptionArsCents !== 0) {
                        <p class="money text-xs text-ink-muted">
                          percepción {{ s.perceptionArsCents | money }}
                        </p>
                      }
                    </div>
                    @if (s.status === 'OPEN') {
                      <button
                        type="button"
                        (click)="settleTarget.set(s)"
                        class="shrink-0 rounded-[8px] border border-line px-3 py-1.5 text-sm text-ink transition hover:border-accent hover:text-accent"
                      >
                        {{ t('import.settle') }}
                      </button>
                    } @else {
                      <span class="shrink-0 rounded-full bg-surface-2 px-3 py-1 text-xs text-ink-muted">
                        {{ t('import.paidIn', { currency: s.paymentCurrency }) }}
                      </span>
                    }
                  </div>
                </li>
              }
            </ul>
          }
        </section>

        <!-- Batch history -->
        <section class="rounded-card border border-line bg-surface">
          <h2 class="border-b border-line px-5 py-4 text-sm font-medium text-ink">{{ t('import.batches') }}</h2>
          @if (batches().length === 0) {
            <p class="px-5 py-6 text-sm text-ink-muted">{{ t('import.noBatches') }}</p>
          } @else {
            <ul class="divide-y divide-line">
              @for (b of batches(); track b.id) {
                <li class="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm text-ink">{{ b.filename }}</p>
                    <p class="text-xs text-ink-muted">
                      {{ t('import.rows', { imported: b.rowsImported, skipped: b.rowsSkipped }) }}
                    </p>
                  </div>
                  <button
                    type="button"
                    (click)="undo(b)"
                    class="text-sm text-ink-muted transition hover:text-neg"
                  >
                    {{ t('import.undo') }}
                  </button>
                </li>
              }
            </ul>
          }
        </section>
      }

      <!-- Settle modal -->
      @if (settleTarget(); as s) {
        <div
          class="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          (click)="settleTarget.set(null)"
        >
          <div class="w-full max-w-sm rounded-card border border-line bg-surface p-5" (click)="$event.stopPropagation()">
            <h3 class="text-base font-medium text-ink">{{ t('import.settleTitle') }}</h3>
            <p class="mt-1 text-xs text-ink-muted">{{ s.account?.name }} · {{ s.closingDate }}</p>

            <div class="mt-5 space-y-3">
              <button
                type="button"
                (click)="settle(s, 'ARS')"
                class="w-full rounded-[8px] border border-line p-3 text-left transition hover:border-accent"
              >
                <span class="block text-sm font-medium text-ink">{{ t('import.settleArs') }}</span>
                <span class="mt-0.5 block text-xs text-ink-muted">{{ t('import.settleArsHint') }}</span>
              </button>
              <button
                type="button"
                (click)="settle(s, 'USD')"
                class="w-full rounded-[8px] border border-line p-3 text-left transition hover:border-accent"
              >
                <span class="block text-sm font-medium text-ink">{{ t('import.settleUsd') }}</span>
                <span class="mt-0.5 block text-xs text-pos money">
                  {{ t('import.settleUsdHint', { amount: absMoney(s.perceptionArsCents) }) }}
                </span>
              </button>
            </div>

            <button
              type="button"
              (click)="settleTarget.set(null)"
              class="mt-4 w-full rounded-[8px] px-4 py-2 text-sm text-ink-muted transition hover:bg-surface-2"
            >
              {{ t('common.cancel') }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ImportPage {
  private readonly importApi = inject(ImportApi);
  private readonly accountsApi = inject(AccountsApi);
  private readonly transloco = inject(TranslocoService);
  private readonly money = new MoneyPipe();

  protected readonly accounts = toSignal(this.accountsApi.list(), { initialValue: undefined });
  protected readonly accountId = signal<string | null>(null);
  protected readonly uploading = signal(false);
  protected readonly lastResult = signal<ImportSummary | null>(null);
  protected readonly error = signal(false);

  protected readonly batches = signal<ImportBatch[]>([]);
  protected readonly statements = signal<CreditCardStatement[]>([]);
  protected readonly settleTarget = signal<CreditCardStatement | null>(null);

  constructor() {
    this.refresh();
  }

  protected onPick(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.upload(file);
    }
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file && this.accountId() && !this.uploading()) {
      this.upload(file);
    }
  }

  private upload(file: File): void {
    const accountId = this.accountId();
    if (!accountId) {
      return;
    }
    this.uploading.set(true);
    this.error.set(false);
    this.lastResult.set(null);
    this.importApi.upload(accountId, file).subscribe({
      next: (result) => {
        this.uploading.set(false);
        this.lastResult.set(result);
        this.refresh();
      },
      error: () => {
        this.uploading.set(false);
        this.error.set(true);
      },
    });
  }

  protected undo(batch: ImportBatch): void {
    if (!confirm(this.transloco.translate('import.undoConfirm'))) {
      return;
    }
    this.importApi.deleteBatch(batch.id).subscribe(() => this.refresh());
  }

  protected settle(statement: CreditCardStatement, currency: Currency): void {
    this.importApi.settle(statement.id, currency).subscribe(() => {
      this.settleTarget.set(null);
      this.refresh();
    });
  }

  protected absMoney(cents: number): string {
    return this.money.transform(Math.abs(cents), 'ARS');
  }

  private refresh(): void {
    this.importApi.batches().subscribe((b) => this.batches.set(b));
    this.importApi.statements().subscribe((s) => this.statements.set(s));
  }
}
