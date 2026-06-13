import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, CategoryKind } from '../models';

export interface CreateCategoryInput {
  name: string;
  kind: CategoryKind;
  parentId?: string;
}

@Injectable({ providedIn: 'root' })
export class CategoriesApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/categories`;

  /** User's categories plus shared system defaults. */
  list(): Observable<Category[]> {
    return this.http.get<Category[]>(this.base);
  }

  create(input: CreateCategoryInput): Observable<Category> {
    return this.http.post<Category>(this.base, input);
  }

  update(id: string, input: { name?: string; parentId?: string | null }): Observable<Category> {
    return this.http.patch<Category>(`${this.base}/${id}`, input);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
