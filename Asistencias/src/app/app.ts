import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
@Component({ selector: 'app-root', imports: [FormsModule], styleUrl: './app.css', templateUrl: './app.html' })
export class App {
  protected readonly showPassword = signal(false);
  protected readonly submitted = signal(false);
  protected readonly message = signal('');
  protected credentials = { email: '', password: '', remember: false };
  protected togglePassword(): void { this.showPassword.update(value => !value); }
  protected submit(): void {
    this.submitted.set(true);
    this.message.set(this.credentials.email && this.credentials.password.length >= 6 ? 'Acceso recibido. Conecta aquí tu servicio de autenticación.' : 'Revisa los campos marcados para continuar.');
  }
  protected forgotPassword(event: Event): void { event.preventDefault(); this.message.set('Te ayudaremos a recuperar el acceso desde soporte.'); }
}
