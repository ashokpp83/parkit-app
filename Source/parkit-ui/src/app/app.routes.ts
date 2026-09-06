import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { driverGuard } from './core/driver.guard';
import { ownerGuard } from './core/owner.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'search' },
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent) },
  { path: 'search', canActivate: [authGuard, driverGuard], loadComponent: () => import('./features/search/search.component').then((m) => m.SearchComponent) },
  { path: 'bookings', canActivate: [authGuard, driverGuard], loadComponent: () => import('./features/bookings/bookings.component').then((m) => m.BookingsComponent) },
  { path: 'vehicles', canActivate: [authGuard, driverGuard], loadComponent: () => import('./features/vehicles/vehicles.component').then((m) => m.VehiclesComponent) },
  { path: 'owner', canActivate: [authGuard, ownerGuard], loadComponent: () => import('./features/owner/owner-dashboard.component').then((m) => m.OwnerDashboardComponent) },
  { path: 'owner/facilities', canActivate: [authGuard, ownerGuard], loadComponent: () => import('./features/owner/owner-facilities.component').then((m) => m.OwnerFacilitiesComponent) },
  { path: 'owner/bookings', canActivate: [authGuard, ownerGuard], loadComponent: () => import('./features/owner/owner-bookings.component').then((m) => m.OwnerBookingsComponent) },
  { path: '**', redirectTo: 'search' },
];
