import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { publicGuard } from './guards/public.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/customers',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login.component').then(m => m.LoginComponent),
    canActivate: [publicGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register.component').then(m => m.RegisterComponent),
    canActivate: [publicGuard]
  },
  {
    path: 'customers',
    loadComponent: () => import('./components/customers/customer-list.component').then(m => m.CustomerListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'customers/new',
    loadComponent: () => import('./components/customers/customer-form.component').then(m => m.CustomerFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'customers/edit/:id',
    loadComponent: () => import('./components/customers/customer-form.component').then(m => m.CustomerFormComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    loadComponent: () => import('./components/layout/not-found.component').then(m => m.NotFoundComponent)
  }
];
