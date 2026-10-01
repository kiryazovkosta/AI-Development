import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'users/new',
    loadComponent: () =>
      import('./components/register/register').then((m) => m.RegisterComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'collection',
    loadComponent: () =>
      import('./components/collection-page/collection-page').then((m) => m.CollectionPageComponent),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'collection',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'collection',
  },
];
