import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type ClaveRol = 'administrador' | 'profesor' | 'estudiante';

/** Datos que devuelve POST /api/auth/login */
export interface Sesion {
  id_usuario: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol_clave: ClaveRol;
  rol: string;
}

const CLAVE_SESION = 'asistencias-sesion';

/** Interfaz a la que entra cada rol al iniciar sesión. */
export const RUTA_POR_ROL: Record<ClaveRol, string> = {
  administrador: '/admin',
  profesor: '/docentes',
  estudiante: '/estudiantes',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private readonly _sesion = signal<Sesion | null>(this.leerSesionGuardada());

  readonly sesion = this._sesion.asReadonly();
  readonly autenticado = computed(() => this._sesion() !== null);
  readonly rol = computed(() => this._sesion()?.rol_clave ?? null);

  login(correo: string, contrasena: string): Observable<Sesion> {
    return this.http
      .post<Sesion>(`${this.baseUrl}/auth/login`, { correo, contrasena })
      .pipe(tap((sesion) => this.guardarSesion(sesion)));
  }

  logout(): void {
    this._sesion.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(CLAVE_SESION);
    }
  }

  /** Ruta de inicio del usuario que tenga la sesión abierta. */
  rutaDeInicio(): string {
    const rol = this._sesion()?.rol_clave;
    return rol ? RUTA_POR_ROL[rol] : '/login';
  }

  private guardarSesion(sesion: Sesion): void {
    this._sesion.set(sesion);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    }
  }

  // En el renderizado del servidor no existe localStorage, así que la sesión
  // arranca vacía y se recupera al hidratar en el navegador.
  private leerSesionGuardada(): Sesion | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem(CLAVE_SESION) ?? 'null');
    } catch {
      return null;
    }
  }
}
