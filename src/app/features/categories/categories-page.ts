import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { CategoriesApi } from '../../core/api/categories-api';
import { RulesApi } from '../../core/api/rules-api';
import { Category, CategoryKind, Rule, RuleMatchType } from '../../core/models';

const MATCH_TYPES: RuleMatchType[] = ['CONTAINS', 'STARTS_WITH', 'REGEX'];

@Component({
  selector: 'ft-categories',
  imports: [TranslocoDirective, FormsModule],
  template: `
    <div *transloco="let t" class="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <h1 class="text-xl font-semibold tracking-tight text-ink">{{ t('categories.title') }}</h1>

      <!-- Tabs -->
      <div class="flex gap-1 border-b border-line">
        <button type="button" (click)="tab.set('categories')"
          class="border-b-2 px-3 py-2 text-sm transition"
          [class.border-accent]="tab() === 'categories'" [class.text-ink]="tab() === 'categories'"
          [class.border-transparent]="tab() !== 'categories'" [class.text-ink-muted]="tab() !== 'categories'">
          {{ t('categories.tabCategories') }}
        </button>
        <button type="button" (click)="tab.set('rules')"
          class="border-b-2 px-3 py-2 text-sm transition"
          [class.border-accent]="tab() === 'rules'" [class.text-ink]="tab() === 'rules'"
          [class.border-transparent]="tab() !== 'rules'" [class.text-ink-muted]="tab() !== 'rules'">
          {{ t('categories.tabRules') }}
        </button>
      </div>

      @if (tab() === 'categories') {
        <!-- New category -->
        <form (ngSubmit)="createCategory()" class="rounded-card border border-line bg-surface p-5">
          <h2 class="mb-4 text-sm font-medium text-ink">{{ t('categories.new') }}</h2>
          <div class="grid gap-3 sm:grid-cols-[1fr_140px_1fr] sm:items-end">
            <label class="block">
              <span class="mb-1 block text-xs text-ink-muted">{{ t('categories.name') }}</span>
              <input [(ngModel)]="catName" name="n" class="w-full rounded-[8px] border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
            </label>
            <label class="block">
              <span class="mb-1 block text-xs text-ink-muted">{{ t('categories.kind') }}</span>
              <select [(ngModel)]="catKind" name="k" class="w-full rounded-[8px] border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent">
                <option value="EXPENSE">{{ t('categories.expense') }}</option>
                <option value="INCOME">{{ t('categories.income') }}</option>
              </select>
            </label>
            <label class="block">
              <span class="mb-1 block text-xs text-ink-muted">{{ t('categories.parent') }}</span>
              <select [(ngModel)]="catParentId" name="p" class="w-full rounded-[8px] border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent">
                <option value="">{{ t('categories.none') }}</option>
                @for (c of sameKindParents(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
              </select>
            </label>
          </div>
          <button type="submit" [disabled]="!catName() || saving()" class="mt-4 rounded-[8px] bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition active:scale-[0.98] disabled:opacity-50">{{ t('common.create') }}</button>
        </form>

        <!-- Category list -->
        <section class="rounded-card border border-line bg-surface">
          <ul class="divide-y divide-line">
            @for (c of categories(); track c.id) {
              <li class="flex items-center gap-3 px-5 py-3">
                <span class="size-2 shrink-0 rounded-full" [class.bg-pos]="c.kind === 'INCOME'" [class.bg-neg]="c.kind === 'EXPENSE'"></span>
                <span class="min-w-0 flex-1 truncate text-sm text-ink">
                  {{ c.name }}
                  @if (c.parent) { <span class="text-ink-muted">· {{ c.parent.name }}</span> }
                </span>
                @if (isSystem(c)) {
                  <span class="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-muted">{{ t('categories.system') }}</span>
                } @else {
                  <button type="button" (click)="removeCategory(c)" [attr.aria-label]="t('common.delete')" class="grid size-8 place-items-center rounded-[8px] text-ink-muted transition hover:bg-surface-2 hover:text-neg"><i class="ph ph-trash"></i></button>
                }
              </li>
            }
          </ul>
        </section>
      } @else {
        <!-- Rule tester -->
        <div class="rounded-card border border-line bg-surface p-5">
          <label class="block">
            <span class="mb-1 block text-xs text-ink-muted">{{ t('rules.tester') }}</span>
            <input [(ngModel)]="testText" name="test" [placeholder]="t('rules.testerPlaceholder')" class="w-full rounded-[8px] border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
          </label>
          @if (testText()) {
            @if (testMatch(); as m) {
              <p class="mt-2 text-sm text-pos">{{ t('rules.testerMatch', { category: m.category.name }) }}</p>
            } @else {
              <p class="mt-2 text-sm text-ink-muted">{{ t('rules.testerNoMatch') }}</p>
            }
          }
        </div>

        <!-- New rule -->
        <form (ngSubmit)="createRule()" class="rounded-card border border-line bg-surface p-5">
          <h2 class="mb-4 text-sm font-medium text-ink">{{ t('rules.new') }}</h2>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1 block text-xs text-ink-muted">{{ t('rules.category') }}</span>
              <select [(ngModel)]="ruleCategoryId" name="rc" class="w-full rounded-[8px] border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent">
                <option value="">—</option>
                @for (c of categories(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
              </select>
            </label>
            <label class="block">
              <span class="mb-1 block text-xs text-ink-muted">{{ t('rules.matchType') }}</span>
              <select [(ngModel)]="ruleMatchType" name="rm" class="w-full rounded-[8px] border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent">
                @for (mt of matchTypes; track mt) { <option [value]="mt">{{ t('rules.' + matchKey(mt)) }}</option> }
              </select>
            </label>
            <label class="block sm:col-span-2">
              <span class="mb-1 block text-xs text-ink-muted">{{ t('rules.pattern') }}</span>
              <input [(ngModel)]="rulePattern" name="rp" class="w-full rounded-[8px] border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
            </label>
          </div>
          <button type="submit" [disabled]="!ruleCategoryId() || !rulePattern() || saving()" class="mt-4 rounded-[8px] bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition active:scale-[0.98] disabled:opacity-50">{{ t('common.create') }}</button>
        </form>

        <!-- Rule list -->
        <section class="rounded-card border border-line bg-surface">
          @if (rules().length === 0) {
            <p class="px-5 py-8 text-center text-sm text-ink-muted">{{ t('rules.empty') }}</p>
          } @else {
            <ul class="divide-y divide-line">
              @for (r of rules(); track r.id) {
                <li class="flex items-center gap-3 px-5 py-3">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm text-ink">
                      <span class="font-mono text-xs text-ink-muted">{{ t('rules.' + matchKey(r.matchType)) }}</span>
                      “{{ r.pattern }}” → {{ r.category.name }}
                    </p>
                  </div>
                  <button type="button" (click)="removeRule(r)" [attr.aria-label]="t('common.delete')" class="grid size-8 place-items-center rounded-[8px] text-ink-muted transition hover:bg-surface-2 hover:text-neg"><i class="ph ph-trash"></i></button>
                </li>
              }
            </ul>
          }
        </section>
      }
    </div>
  `,
})
export class CategoriesPage {
  private readonly catApi = inject(CategoriesApi);
  private readonly rulesApi = inject(RulesApi);
  private readonly transloco = inject(TranslocoService);

  protected readonly matchTypes = MATCH_TYPES;
  protected readonly tab = signal<'categories' | 'rules'>('categories');

  protected readonly categories = signal<Category[]>([]);
  protected readonly rules = signal<Rule[]>([]);
  protected readonly saving = signal(false);

  protected readonly catName = signal('');
  protected readonly catKind = signal<CategoryKind>('EXPENSE');
  protected readonly catParentId = signal('');

  protected readonly ruleCategoryId = signal('');
  protected readonly ruleMatchType = signal<RuleMatchType>('CONTAINS');
  protected readonly rulePattern = signal('');

  protected readonly testText = signal('');

  /** Parents must share the child's kind (backend enforces this too). */
  protected readonly sameKindParents = computed(() =>
    this.categories().filter((c) => c.kind === this.catKind()),
  );

  /** Client-side mirror of the backend CategorizationService for live preview. */
  protected readonly testMatch = computed<Rule | null>(() => {
    const text = this.testText().toLowerCase();
    if (!text) {
      return null;
    }
    const sorted = [...this.rules()].sort((a, b) => b.priority - a.priority);
    return sorted.find((r) => this.matches(text, r)) ?? null;
  });

  constructor() {
    this.refresh();
  }

  protected isSystem(c: Category): boolean {
    return c.user === null || c.user === undefined;
  }

  protected matchKey(mt: RuleMatchType): string {
    return mt === 'STARTS_WITH' ? 'startsWith' : mt.toLowerCase();
  }

  protected createCategory(): void {
    if (!this.catName() || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.catApi
      .create({
        name: this.catName(),
        kind: this.catKind(),
        ...(this.catParentId() ? { parentId: this.catParentId() } : {}),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.catName.set('');
          this.catParentId.set('');
          this.refresh();
        },
        error: () => this.saving.set(false),
      });
  }

  protected removeCategory(c: Category): void {
    if (!confirm(this.transloco.translate('categories.deleteConfirm'))) {
      return;
    }
    this.catApi.remove(c.id).subscribe(() => this.refresh());
  }

  protected createRule(): void {
    if (!this.ruleCategoryId() || !this.rulePattern() || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.rulesApi
      .create({
        categoryId: this.ruleCategoryId(),
        matchType: this.ruleMatchType(),
        pattern: this.rulePattern(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.rulePattern.set('');
          this.refresh();
        },
        error: () => this.saving.set(false),
      });
  }

  protected removeRule(r: Rule): void {
    if (!confirm(this.transloco.translate('rules.deleteConfirm'))) {
      return;
    }
    this.rulesApi.remove(r.id).subscribe(() => this.refresh());
  }

  private matches(haystack: string, rule: Rule): boolean {
    const needle = rule.pattern.toLowerCase();
    switch (rule.matchType) {
      case 'CONTAINS':
        return haystack.includes(needle);
      case 'STARTS_WITH':
        return haystack.startsWith(needle);
      case 'REGEX':
        try {
          return new RegExp(rule.pattern, 'i').test(haystack);
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  private refresh(): void {
    this.catApi.list().subscribe((c) => this.categories.set(c));
    this.rulesApi.list().subscribe((r) => this.rules.set(r));
  }
}
