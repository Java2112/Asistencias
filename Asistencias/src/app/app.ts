import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Contenedor de toda la aplicación. Solo aloja el router-outlet: cada módulo
 * (login, admin, docentes, estudiantes) vive en su propia ruta. No debe
 * agregarse contenido de ninguna pantalla aquí.
 */
@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('Asistencias');
}
