import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'warehouses',
    pathMatch: 'full'
  },
  {
    path: 'warehouses',
    children: [
      {
        path: '',
        loadComponent: () => import('./warehouses/warehouse-list/warehouse-list.component').then(m => m.WarehouseListComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('./warehouses/warehouse-create/warehouse-create.component').then(m => m.WarehouseCreateComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./warehouses/warehouse-detail/warehouse-detail.component').then(m => m.WarehouseDetailComponent)
      }
    ]
  },
  {
    path: 'transfers',
    children: [
      {
        path: '',
        loadComponent: () => import('./transfers/transfer-list/transfer-list.component').then(m => m.TransferListComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('./transfers/transfer-create/transfer-create.component').then(m => m.TransferCreateComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./transfers/transfer-detail/transfer-detail.component').then(m => m.TransferDetailComponent)
      }
    ]
  }
];
