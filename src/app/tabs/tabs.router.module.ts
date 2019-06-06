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
        path: 'controls',
        children: [
          {
            path: '',
            loadChildren: '../controls/controls.module#ControlsPageModule'
          }
        ]
      },
      {
        path: 'presets',
        children: [
          {
            path: '',
            loadChildren: '../presets/presets.module#PresetsPageModule'
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
