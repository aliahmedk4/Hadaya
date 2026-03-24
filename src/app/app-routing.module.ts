import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
  },
  {
    path: 'donors',
    loadChildren: () => import('./donors/donors.module').then(m => m.DonorsPageModule)
  },
  {
    path: 'add-donor',
    canActivate: [AuthGuard],
    loadChildren: () => import('./add-donor/add-donor.module').then(m => m.AddDonorPageModule)
  },
  {
    path: 'staff',
    loadChildren: () => import('./staff/staff.module').then(m => m.StaffPageModule)
  },
  {
    path: 'add-payment/:donorId',
    canActivate: [AuthGuard],
    loadChildren: () => import('./add-payment/add-payment.module').then(m => m.AddPaymentPageModule)
  },
  {
    path: 'charity',
    loadChildren: () => import('./charity/charity.module').then(m => m.CharityPageModule)
  },
  {
    path: 'reports',
    loadChildren: () => import('./reports/reports.module').then(m => m.ReportsPageModule)
  },
  {
    path: 'hadith',
    loadChildren: () => import('./hadith/hadith.module').then(m => m.HadithPageModule)
  },
  {
    path: 'audit',
    canActivate: [AuthGuard],
    loadChildren: () => import('./audit/audit.module').then(m => m.AuditPageModule)
  },
  {
    path: 'add-staff-payment',
    canActivate: [AuthGuard],
    loadChildren: () => import('./add-staff-payment/add-staff-payment.module').then(m => m.AddStaffPaymentPageModule)
  },
  {
    path: 'expenses',
    canActivate: [AuthGuard],
    loadChildren: () => import('./expenses/expenses.module').then(m => m.ExpensesPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
