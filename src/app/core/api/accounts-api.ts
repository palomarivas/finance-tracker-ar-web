import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Account, AccountType, Currency, RateType } from '../models';

export interface AccountInput {
  name: string;
  type: AccountType;
  currency: Currency;
  institution?: string;
  valuationRateType?: RateType;
}

@Injectable({ providedIn: 'root' })
export class AccountsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/accounts`;

  list(): Observable<Account[]> {
    return this.http.get<Account[]>(this.base);
  }

  create(input: AccountInput): Observable<Account> {
    return this.http.post<Account>(this.base, input);
  }

  update(id: string, input: Partial<AccountInput>): Observable<Account> {
    return this.http.patch<Account>(`${this.base}/${id}`, input);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
