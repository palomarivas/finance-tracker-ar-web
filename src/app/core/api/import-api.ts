import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreditCardStatement,
  Currency,
  ImportBatch,
  ImportSummary,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ImportApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/import`;

  upload(accountId: string, file: File): Observable<ImportSummary> {
    const form = new FormData();
    form.append('accountId', accountId);
    form.append('file', file);
    return this.http.post<ImportSummary>(`${this.base}/upload`, form);
  }

  batches(): Observable<ImportBatch[]> {
    return this.http.get<ImportBatch[]>(`${this.base}/batches`);
  }

  deleteBatch(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/batches/${id}`);
  }

  statements(): Observable<CreditCardStatement[]> {
    return this.http.get<CreditCardStatement[]>(`${this.base}/statements`);
  }

  settle(id: string, paymentCurrency: Currency): Observable<CreditCardStatement> {
    return this.http.patch<CreditCardStatement>(
      `${this.base}/statements/${id}/settle`,
      { paymentCurrency },
    );
  }
}
