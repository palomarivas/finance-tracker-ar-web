import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Currency } from './models';

/**
 * Integer cents → localized currency string.
 * `{{ tx.amountCents | money: tx.currency }}` → "-$ 13.200,00" (es-AR).
 * Impure on purpose: re-evaluates when the active language flips.
 */
@Pipe({ name: 'money', pure: false })
export class MoneyPipe implements PipeTransform {
  private readonly transloco = inject(TranslocoService);

  transform(cents: number | null | undefined, currency: Currency = 'ARS'): string {
    if (cents === null || cents === undefined) {
      return '';
    }
    const locale = this.transloco.getActiveLang() === 'en' ? 'en-US' : 'es-AR';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: currency === 'USD' ? 'code' : 'symbol',
    }).format(cents / 100);
  }
}
