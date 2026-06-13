import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Account } from '../models';

@Injectable({ providedIn: 'root' })
export class AccountsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/accounts`;

  list(): Observable<Account[]> {
    return this.http.get<Account[]>(this.base);
  }
}
