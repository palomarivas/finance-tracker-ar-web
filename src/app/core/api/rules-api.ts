import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Rule, RuleMatchType } from '../models';

export interface CreateRuleInput {
  categoryId: string;
  matchType: RuleMatchType;
  pattern: string;
  priority?: number;
}

@Injectable({ providedIn: 'root' })
export class RulesApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/rules`;

  list(): Observable<Rule[]> {
    return this.http.get<Rule[]>(this.base);
  }

  create(input: CreateRuleInput): Observable<Rule> {
    return this.http.post<Rule>(this.base, input);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
