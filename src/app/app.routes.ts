import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login').then((m) => m.Login),
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register').then((m) => m.Register),
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/placeholder').then((m) => m.Placeholder),
      },
      ...['transactions', 'import', 'accounts', 'budgets', 'categories'].map(
        (path) => ({
          path,
          loadComponent: () =>
            import('./features/placeholder').then((m) => m.Placeholder),
        }),
      ),
    ],
  },
  { path: '**', redirectTo: '' },
];
