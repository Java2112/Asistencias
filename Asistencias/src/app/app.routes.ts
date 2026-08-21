import { Routes } from '@angular/router';

import { Login } from './login/login';
import { AdminComponent } from './admin/admin';
import { Dashboard } from './admin/dashboard/dashboard';
import { Calendario } from './admin/calendario/calendario';
import { Usuarios } from './admin/usuarios/usuarios';
import { MateriasComponent } from './admin/materias/materias';
import { VistaPrincipalComponent } from './docentes/vista-principal/vista-principal.component';
import { Estudiantes } from './estudiantes/estudiantes';

/**
 * Mapa de rutas unificado.
 *
 * Cada módulo vive bajo su propio prefijo para que ninguno compita por la
 * ruta raíz. El comodín '**' va siempre de último: colocado antes que las
 * demás rutas captura cualquier URL y deja los otros módulos inalcanzables.
 *
 * El login decide a cuál de las tres interfaces entra cada usuario según su
 * rol (ver RUTA_POR_ROL en login/login.ts).
 */
export const routes: Routes = [
  { path: 'login', component: Login },

  {
    path: 'admin',
    component: AdminComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'calendario', component: Calendario },
      { path: 'usuarios', component: Usuarios },
      { path: 'materias', component: MateriasComponent },
    ],
  },

  { path: 'docentes', component: VistaPrincipalComponent },

  { path: 'estudiantes', component: Estudiantes },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
