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
    this.message.set(this.credentials.email && this.credentials.password.length >= 6 ? 'Access received. Connect your authentication service here.' : 'Check the highlighted fields to continue.');
  }
  protected forgotPassword(event: Event): void { event.preventDefault(); this.message.set('We will help you recover your access through support.'); }
}
