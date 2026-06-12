import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

/** Temporary stand-in for screens that land in later milestones. */
@Component({
  selector: 'ft-placeholder',
  imports: [TranslocoDirective],
  template: `
    <div
      *transloco="let t"
      class="grid min-h-[60dvh] place-items-center px-4 text-center"
    >
      <div>
        <i class="ph ph-hammer mb-3 block text-4xl text-ink-muted" aria-hidden="true"></i>
        <h2 class="text-lg font-medium text-ink">{{ t('common.comingSoon') }}</h2>
        <p class="mt-1 text-sm text-ink-muted">{{ t('common.comingSoonBody') }}</p>
      </div>
    </div>
  `,
})
export class Placeholder {}
