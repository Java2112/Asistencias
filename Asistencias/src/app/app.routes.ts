import { Routes } from '@angular/router';

import { AdminComponent } from './admin/admin';
import { Dashboard } from './admin/dashboard/dashboard';
import { Calendario } from './admin/calendario/calendario';
import { Usuarios } from './admin/usuarios/usuarios';
import { MateriasComponent } from './admin/materias/materias';
import { Estudiantes } from './estudiantes/estudiantes';
import { VistaPrincipalComponent } from './docentes/vista-principal/vista-principal.component';

/**
 * Mapa de rutas unificado.
 *
 * Cada módulo vive bajo su propio prefijo para que ninguno compita por la
 * ruta raíz. El comodín '**' va siempre de último: colocado antes que las
 * demás rutas captura cualquier URL y deja los otros módulos inalcanzables.
 */
export const routes: Routes = [
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

  // TODO: al integrar la rama login, la raíz y el comodín pasan a 'login'.
  { path: '', redirectTo: 'admin', pathMatch: 'full' },
  { path: '**', redirectTo: 'admin' },
];
