import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResult, Currency, SessionUser } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/auth`;

  login(email: string, password: string): Observable<AuthResult> {
    return this.http.post<AuthResult>(`${this.base}/login`, { email, password });
  }

  register(
    email: string,
    password: string,
    baseCurrency?: Currency,
  ): Observable<AuthResult> {
    return this.http.post<AuthResult>(`${this.base}/register`, {
      email,
      password,
      ...(baseCurrency ? { baseCurrency } : {}),
    });
  }

  me(): Observable<SessionUser & { createdAt: string }> {
    return this.http.get<SessionUser & { createdAt: string }>(`${this.base}/me`);
  }
}
