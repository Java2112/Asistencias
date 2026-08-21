import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, ClaveRol } from '../services/auth.service';

/**
 * Deja pasar solo a quien tenga la sesión abierta y, si se indican roles, solo
 * a esos roles. Quien no cumpla vuelve al login o a su propia interfaz.
 *
 * En el renderizado del servidor no hay sesión porque localStorage no existe,
 * así que se permite el paso y la comprobación real ocurre al hidratar en el
 * navegador. De lo contrario el prerenderizado redirigiría todas las rutas.
 */
export function sesionGuard(...rolesPermitidos: ClaveRol[]): CanActivateFn {
  return () => {
    if (typeof localStorage === 'undefined') return true;

    const auth = inject(AuthService);
    const router = inject(Router);
    const sesion = auth.sesion();

    if (!sesion) {
      return router.createUrlTree(['/login']);
    }

    if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(sesion.rol_clave)) {
      return router.createUrlTree([auth.rutaDeInicio()]);
    }

    return true;
  };
}
