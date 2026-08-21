import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export type Rol = 'Administrador' | 'Profesor' | 'Estudiante';

export interface UsuarioDemo {
  nombre: string;
  correo: string;
  contrasena: string;
  rol: Rol;
}

/** Clave bajo la que se guarda la sesión en el navegador. */
export const CLAVE_SESION = 'asistencias-sesion-demo';

/** A qué interfaz entra cada rol después de iniciar sesión. */
const RUTA_POR_ROL: Record<Rol, string> = {
  Administrador: '/admin',
  Profesor: '/docentes',
  Estudiante: '/estudiantes',
};

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly router = inject(Router);

  protected readonly showPassword = signal(false);
  protected readonly submitted = signal(false);
  protected readonly message = signal('');

  // TODO (Fase B): reemplazar por autenticación contra la API en
  // environment.apiUrl, validando sobre usuarios.contrasena_hash con pgcrypto.
  protected readonly usuariosDemo: UsuarioDemo[] = [
    { nombre: 'Ana Administradora', correo: 'admin@asistencias.edu', contrasena: 'Admin123*', rol: 'Administrador' },
    { nombre: 'Pedro Profesor', correo: 'profesor@asistencias.edu', contrasena: 'Profe123*', rol: 'Profesor' },
    { nombre: 'Sofía Estudiante', correo: 'estudiante@asistencias.edu', contrasena: 'Estudiante123*', rol: 'Estudiante' },
  ];

  protected credentials = { email: '', password: '', remember: true };

  constructor() {
    // Si ya había una sesión guardada, entra directo a su interfaz.
    const sesion = this.cargarSesion();
    if (sesion) {
      void this.router.navigateByUrl(RUTA_POR_ROL[sesion.rol]);
    }
  }

  protected togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  protected recuperarContrasena(event: Event): void {
    event.preventDefault();
    this.message.set('Para esta demostración, usa una de las cuentas de prueba indicadas.');
  }

  protected usarUsuario(usuario: UsuarioDemo): void {
    this.credentials.email = usuario.correo;
    this.credentials.password = usuario.contrasena;
    this.message.set(`Credenciales de ${usuario.rol.toLowerCase()} cargadas.`);
  }

  protected submit(): void {
    this.submitted.set(true);

    const usuario = this.usuariosDemo.find(
      (item) =>
        item.correo === this.credentials.email.trim().toLowerCase() &&
        item.contrasena === this.credentials.password,
    );

    if (!usuario) {
      this.message.set('Correo o contraseña incorrectos. Usa una de las cuentas de prueba.');
      return;
    }

    if (this.credentials.remember && typeof localStorage !== 'undefined') {
      localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));
    }

    this.message.set('');
    void this.router.navigateByUrl(RUTA_POR_ROL[usuario.rol]);
  }

  private cargarSesion(): UsuarioDemo | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem(CLAVE_SESION) ?? 'null');
    } catch {
      return null;
    }
  }
}
