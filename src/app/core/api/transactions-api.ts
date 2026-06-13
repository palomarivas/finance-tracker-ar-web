import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Paginated, Transaction } from '../models';

export interface TransactionFilters {
  month?: string;
  accountId?: string;
  categoryId?: string;
  uncategorized?: boolean;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class TransactionsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/transactions`;

  list(filters: TransactionFilters): Observable<Paginated<Transaction>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<Paginated<Transaction>>(this.base, { params });
  }

  updateCategory(id: string, categoryId: string | null): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.base}/${id}`, { categoryId });
  }
}
