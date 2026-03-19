import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'donors',
    loadChildren: () => import('./donors/donors.module').then(m => m.DonorsPageModule)
  },
  {
    path: 'add-donor',
    loadChildren: () => import('./add-donor/add-donor.module').then(m => m.AddDonorPageModule)
  },
  {
    path: 'staff',
    loadChildren: () => import('./staff/staff.module').then(m => m.StaffPageModule)
  },
  {
    path: 'add-payment/:donorId',
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
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
