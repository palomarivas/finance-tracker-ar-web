import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Budget } from '../models';

export interface CreateBudgetInput {
  categoryId: string;
  amountCents: number;
  /** YYYY-MM */
  month: string;
}

@Injectable({ providedIn: 'root' })
export class BudgetsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/budgets`;

  list(month?: string): Observable<Budget[]> {
    const params = month ? new HttpParams().set('month', month) : undefined;
    return this.http.get<Budget[]>(this.base, { params });
  }

  create(input: CreateBudgetInput): Observable<Budget> {
    return this.http.post<Budget>(this.base, input);
  }

  update(id: string, amountCents: number): Observable<Budget> {
    return this.http.patch<Budget>(`${this.base}/${id}`, { amountCents });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
