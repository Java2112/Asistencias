import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type Rol = 'Administrador' | 'Profesor' | 'Estudiante';
interface UsuarioDemo { nombre: string; correo: string; contrasena: string; rol: Rol; }

@Component({ selector: 'app-root', imports: [FormsModule], styleUrl: './app.css', templateUrl: './app.html' })
export class App {
  protected readonly showPassword = signal(false);
  protected readonly submitted = signal(false);
  protected readonly message = signal('');
  protected readonly sesion = signal<UsuarioDemo | null>(this.cargarSesion());
  protected readonly rolActivo = signal<Rol>(this.sesion()?.rol ?? 'Estudiante');
  protected readonly usuariosDemo: UsuarioDemo[] = [
    { nombre: 'Ana Administradora', correo: 'admin@asistencias.edu', contrasena: 'Admin123*', rol: 'Administrador' },
    { nombre: 'Pedro Profesor', correo: 'profesor@asistencias.edu', contrasena: 'Profe123*', rol: 'Profesor' },
    { nombre: 'Sofía Estudiante', correo: 'estudiante@asistencias.edu', contrasena: 'Estudiante123*', rol: 'Estudiante' },
  ];
  protected credentials = { email: '', password: '', remember: true };

  protected togglePassword(): void { this.showPassword.update(value => !value); }
  protected recuperarContrasena(event: Event): void { event.preventDefault(); this.message.set('Para esta demostración, usa una de las cuentas de prueba indicadas.'); }
  protected usarUsuario(usuario: UsuarioDemo): void { this.credentials.email = usuario.correo; this.credentials.password = usuario.contrasena; this.message.set(`Credenciales de ${usuario.rol.toLowerCase()} cargadas.`); }
  protected submit(): void {
    this.submitted.set(true);
    const usuario = this.usuariosDemo.find(item => item.correo === this.credentials.email.trim().toLowerCase() && item.contrasena === this.credentials.password);
    if (!usuario) { this.message.set('Correo o contraseña incorrectos. Usa una de las cuentas de prueba.'); return; }
    this.sesion.set(usuario); this.rolActivo.set(usuario.rol);
    if (this.credentials.remember && typeof localStorage !== 'undefined') localStorage.setItem('asistencias-sesion-demo', JSON.stringify(usuario));
    this.message.set('');
  }
  protected cambiarRol(rol: Rol): void {
    this.rolActivo.set(rol);
    const usuario = this.sesion();
    if (usuario && typeof localStorage !== 'undefined') localStorage.setItem('asistencias-sesion-demo', JSON.stringify({ ...usuario, rol }));
  }
  protected cerrarSesion(): void { if (typeof localStorage !== 'undefined') localStorage.removeItem('asistencias-sesion-demo'); this.sesion.set(null); this.submitted.set(false); this.credentials = { email: '', password: '', remember: true }; }
  private cargarSesion(): UsuarioDemo | null { if (typeof localStorage === 'undefined') return null; try { return JSON.parse(localStorage.getItem('asistencias-sesion-demo') ?? 'null'); } catch { return null; } }
}
