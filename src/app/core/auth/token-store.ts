import { computed, Injectable, signal } from '@angular/core';
import { AuthResult, SessionUser } from '../models';

const TOKEN_KEY = 'ft.token';
const USER_KEY = 'ft.user';

@Injectable({ providedIn: 'root' })
export class TokenStore {
  private readonly tokenSignal = signal<string | null>(
    localStorage.getItem(TOKEN_KEY),
  );
  private readonly userSignal = signal<SessionUser | null>(readStoredUser());

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(
    () => this.tokenSignal() !== null && !isExpired(this.tokenSignal()!),
  );

  store(result: AuthResult): void {
    localStorage.setItem(TOKEN_KEY, result.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    this.tokenSignal.set(result.accessToken);
    this.userSignal.set(result.user);
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }
}

function readStoredUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

/** Decodes the JWT payload's exp claim; treats malformed tokens as expired. */
function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
    return payload.exp !== undefined && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
