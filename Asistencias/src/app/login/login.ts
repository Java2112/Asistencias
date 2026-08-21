import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface CuentaSugerida {
  nombre: string;
  correo: string;
  contrasena: string;
  rol: string;
}

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly showPassword = signal(false);
  protected readonly submitted = signal(false);
  protected readonly enviando = signal(false);
  protected readonly message = signal('');

  // Atajo para las demostraciones. Solo rellena el formulario: las
  // credenciales se validan siempre contra la base de datos.
  protected readonly usuariosDemo: CuentaSugerida[] = [
    { nombre: 'Ana Administradora', correo: 'admin@asistencias.edu', contrasena: 'Admin123*', rol: 'Administrador' },
    { nombre: 'Pedro Profesor', correo: 'profesor@asistencias.edu', contrasena: 'Profe123*', rol: 'Profesor' },
    { nombre: 'Sofía Estudiante', correo: 'estudiante@asistencias.edu', contrasena: 'Estudiante123*', rol: 'Estudiante' },
  ];

  protected credentials = { email: '', password: '', remember: true };

  constructor() {
    // Si ya hay una sesión abierta, no tiene sentido mostrar el formulario.
    if (this.auth.autenticado()) {
      void this.router.navigateByUrl(this.auth.rutaDeInicio());
    }
  }

  protected togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  protected recuperarContrasena(event: Event): void {
    event.preventDefault();
    this.message.set('Comunícate con el administrador para restablecer tu contraseña.');
  }

  protected usarUsuario(cuenta: CuentaSugerida): void {
    this.credentials.email = cuenta.correo;
    this.credentials.password = cuenta.contrasena;
    this.message.set(`Credenciales de ${cuenta.rol.toLowerCase()} cargadas.`);
  }

  protected submit(): void {
    this.submitted.set(true);

    const correo = this.credentials.email.trim();
    if (!correo || !this.credentials.password) return;

    this.enviando.set(true);
    this.message.set('');

    this.auth.login(correo, this.credentials.password).subscribe({
      next: () => {
        this.enviando.set(false);
        void this.router.navigateByUrl(this.auth.rutaDeInicio());
      },
      error: (error) => {
        this.enviando.set(false);
        this.message.set(
          error.status === 0
            ? 'No hay conexión con el servidor. Verifica que la API esté corriendo en el puerto 3000.'
            : (error.error?.mensaje ?? 'No fue posible iniciar sesión.'),
        );
      },
    });
  }
}
