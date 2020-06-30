import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'connect',
        children: [
          {
            path: '',
            loadChildren: '../connect/connect.module#ConnectPageModule'
          }
        ]
      },
      {
        path: 'prescription',
        children: [
          {
            path: '',
            loadChildren: '../prescription/prescription.module#PrescriptionPageModule'
          }
        ]
      },
      {
        path: '',
        redirectTo: '/tabs/connect',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/connect',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
