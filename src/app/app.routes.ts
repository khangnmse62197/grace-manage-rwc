import {Routes} from '@angular/router';
import {LoginComponent} from './login/login.component';
import {HomeComponent} from './home/home.component';
import {EmployeeManagementComponent} from './employee-management/employee-management.component';
import {EmployeeDetailComponent} from './employee-detail/employee-detail.component';
import {InStockComponent} from './in-stock/in-stock.component';
import {StatisticComponent} from './statistic/statistic.component';
import {NotificationComponent} from './notification/notification.component';
import {CheckInOutComponent} from './check-in-out/check-in-out.component';
import {authGuard} from './auth.guard';
import {adminGuard} from './admin.guard';

export const routes: Routes = [
  {path: '', redirectTo: '/login', pathMatch: 'full'},
  {path: 'login', component: LoginComponent},
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [authGuard],
    children: [
      {path: '', redirectTo: 'check-in-out', pathMatch: 'full'},
      // Normal user route - accessible by all authenticated users
      {path: 'check-in-out', component: CheckInOutComponent},
      // Admin only routes
      {path: 'employee-management', component: EmployeeManagementComponent, canActivate: [adminGuard]},
      {path: 'employee-detail/:id', component: EmployeeDetailComponent, canActivate: [adminGuard]},
      {path: 'in-stock', component: InStockComponent, canActivate: [adminGuard]},
      {path: 'statistic', component: StatisticComponent, canActivate: [adminGuard]},
      {path: 'notification', component: NotificationComponent, canActivate: [adminGuard]}
    ]
  },
  {path: '**', redirectTo: '/login'}
];
