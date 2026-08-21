import { Routes } from '@angular/router';

import { AdminComponent } from './admin/admin';
import { Dashboard } from './admin/dashboard/dashboard';
import { Calendario } from './admin/calendario/calendario';
import { Usuarios } from './admin/usuarios/usuarios';
import { MateriasComponent } from './admin/materias/materias';

export const routes: Routes = [

  {
    path: 'admin',
    component: AdminComponent,
    children: [

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      {
        path: 'dashboard',
        component: Dashboard
      },

      {
        path: 'calendario',
        component: Calendario
      },

      {
        path: 'usuarios',
        component: Usuarios
      },

      {
        path: 'materias',
        component: MateriasComponent
      },

    ]
  },

  {
    path: '',
    redirectTo: 'admin',
    pathMatch: 'full'
  }

];